import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, sep } from 'node:path'
import { sep as posixSep } from 'node:path/posix'
import process from 'node:process'

import fg from 'fast-glob'
import grayMatter from 'gray-matter'

import type {
  GraphViewEdgeType,
  GravityMatrixChunk,
  GravityMatrixEdge,
  GravityMatrixManifest,
  GravityMatrixNode,
} from '../packages/vitepress-plugin-graph-view/src/vitepress'

interface NoteEntry extends GravityMatrixNode {
  absolutePath: string
  rawContent: string
  headings: string[]
  tags: string[]
  directories: string[]
  tokens: string[]
  titleTokens: Set<string>
  vector: Map<string, number>
  aiEmbedding?: number[]
}

interface EdgeAccumulator {
  source: string
  target: string
  relationTypes: Set<string>
  scoreBreakdown: Record<string, number>
  rawScore: number
}

const rootDir = process.cwd()
const contentDir = join(rootDir, 'zh-CN')
const outputDir = join(rootDir, 'public', 'graph-data', 'gravity-matrix')
const chunkDir = join(outputDir, 'chunks')
const bridgeDir = join(outputDir, 'bridges')
const chunkSizeTarget = 40
const bridgeEdgeSizeTarget = 300
const topRelatedEdgesPerNode = 18
const minSimilarityScore = 0.18
const aiEmbeddingEnabled = /^(1|true|yes)$/i.test(process.env.GRAVITY_MATRIX_AI || '')
const aiEmbeddingStrict = /^(1|true|yes)$/i.test(process.env.GRAVITY_MATRIX_AI_STRICT || '')
const aiEmbeddingApiKey = process.env.GRAVITY_MATRIX_AI_API_KEY || process.env.OPENAI_API_KEY
const aiEmbeddingBaseUrl = (process.env.GRAVITY_MATRIX_AI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
const aiEmbeddingModel = process.env.GRAVITY_MATRIX_AI_MODEL || 'text-embedding-3-small'
const aiEmbeddingBatchSize = Math.max(1, Number.parseInt(process.env.GRAVITY_MATRIX_AI_BATCH_SIZE || '24', 10) || 24)

const markdownLinkRE = /(?<!!)\[[^\]\n]+\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g
const htmlLinkRE = /<a\s+[^>]*href=(['"])(.*?)\1/gi
const wikilinkRE = /(?<!!)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g
const headingRE = /^#{1,3}\s+(.+)$/gm
const latinWordRE = /[a-z0-9][a-z0-9-]{1,}/gi
const hanSequenceRE = /\p{Script=Han}+/gu

const stopWords = new Set([
  'and', 'the', 'for', 'with', 'from', 'this', 'that', 'into', 'http', 'https',
  '一个', '一种', '这个', '那个', '以及', '如果', '因为', '所以', '可以', '不是', '进行', '通过', '使用', '我们', '你们',
])

function normalizePath(path: string): string {
  return path.split(sep).join(posixSep).replaceAll('\\', posixSep)
}

function stripHashAndQuery(href: string): string {
  return href.split('#')[0]?.split('?')[0] ?? href
}

function filePathToUrl(fileRelativePath: string): string {
  let url = normalizePath(fileRelativePath)

  if (url.endsWith('.md')) {
    if (url.endsWith('index.md'))
      url = url.replace(/index\.md$/, 'index.html')
    else
      url = url.replace(/\.md$/, '.html')
  }

  return `/${url}`.replaceAll('//', '/')
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value))
    return value.flatMap(item => normalizeList(item))

  if (typeof value === 'string') {
    return value
      .split(/[,，、]/)
      .map(item => item.trim())
      .filter(Boolean)
  }

  return []
}

function extractTitle(file: string, frontmatter: Record<string, any>, content: string): string {
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim())
    return frontmatter.title.trim()

  const heading = /^#\s+(.+)$/m.exec(content)
  if (heading?.[1])
    return heading[1].trim()

  return basename(file).replace(/\.md$/, '')
}

function extractHeadings(content: string): string[] {
  return [...content.matchAll(headingRE)].map(match => match[1]?.trim()).filter(Boolean) as string[]
}

function cleanMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
}

function tokenize(text: string): string[] {
  const tokens: string[] = []
  const normalized = cleanMarkdown(text).toLowerCase()

  for (const match of normalized.matchAll(latinWordRE)) {
    const token = match[0]
    if (!stopWords.has(token))
      tokens.push(token)
  }

  for (const match of normalized.matchAll(hanSequenceRE)) {
    const sequence = match[0]
    if (stopWords.has(sequence))
      continue
    if (sequence.length <= 4) {
      tokens.push(sequence)
      continue
    }
    for (let index = 0; index < sequence.length - 1; index += 1)
      tokens.push(sequence.slice(index, index + 2))
  }

  return tokens.filter(token => token.length > 1 && !stopWords.has(token))
}

function collectLinks(content: string): Array<{ href: string, type: GraphViewEdgeType }> {
  const links: Array<{ href: string, type: GraphViewEdgeType }> = []

  for (const match of content.matchAll(markdownLinkRE)) {
    if (match[1])
      links.push({ href: match[1], type: 'markdown' })
  }

  for (const match of content.matchAll(htmlLinkRE)) {
    if (match[2])
      links.push({ href: match[2], type: 'html' })
  }

  for (const match of content.matchAll(wikilinkRE)) {
    if (match[1])
      links.push({ href: match[1], type: 'wikilink' })
  }

  return links
}

function isSkippableHref(href: string): boolean {
  return !href
    || href.startsWith('#')
    || href.startsWith('mailto:')
    || href.startsWith('tel:')
    || href.startsWith('javascript:')
    || /^https?:\/\//.test(href)
}

function resolveLinkTarget(href: string, source: NoteEntry, indexes: {
  byUrl: Map<string, NoteEntry>
  byFilePath: Map<string, NoteEntry>
  byStem: Map<string, NoteEntry[]>
}): NoteEntry | undefined {
  if (isSkippableHref(href))
    return

  const cleanHref = stripHashAndQuery(href).trim()
  if (!cleanHref)
    return

  if (cleanHref.startsWith('/')) {
    const normalizedUrl = cleanHref.endsWith('.md') ? cleanHref.replace(/\.md$/, '.html') : cleanHref
    return indexes.byUrl.get(normalizedUrl)
  }

  if (extname(cleanHref) && extname(cleanHref) !== '.md' && extname(cleanHref) !== '.html')
    return

  const sourceDir = dirname(source.filePath)
  const relativeTarget = normalizePath(join(sourceDir, cleanHref))
  const candidatePaths = [
    relativeTarget,
    relativeTarget.endsWith('.md') ? relativeTarget : `${relativeTarget}.md`,
    relativeTarget.endsWith('.html') ? relativeTarget.replace(/\.html$/, '.md') : relativeTarget,
  ]

  for (const candidatePath of candidatePaths) {
    const target = indexes.byFilePath.get(normalizePath(candidatePath))
    if (target)
      return target
  }

  const wikilinkStem = cleanHref.replace(/\.md$/, '')
  const matchedByStem = indexes.byStem.get(wikilinkStem) || indexes.byStem.get(basename(wikilinkStem))
  if (matchedByStem?.length === 1)
    return matchedByStem[0]
}

function buildVector(tokens: string[], documentFrequency: Map<string, number>, documentCount: number): Map<string, number> {
  const termFrequency = new Map<string, number>()
  for (const token of tokens)
    termFrequency.set(token, (termFrequency.get(token) || 0) + 1)

  const weightedTerms = [...termFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 140)
    .map(([token, count]) => {
      const idf = Math.log((documentCount + 1) / ((documentFrequency.get(token) || 0) + 1)) + 1
      return [token, count * idf] as const
    })

  const norm = Math.sqrt(weightedTerms.reduce((total, [, weight]) => total + weight * weight, 0)) || 1
  return new Map(weightedTerms.map(([token, weight]) => [token, weight / norm]))
}

function cosineSimilarity(left: Map<string, number>, right: Map<string, number>): number {
  const [smaller, larger] = left.size < right.size ? [left, right] : [right, left]
  let score = 0
  for (const [token, weight] of smaller)
    score += weight * (larger.get(token) || 0)

  return score
}

function cosineArraySimilarity(left?: number[], right?: number[]): number {
  if (!left?.length || !right?.length || left.length !== right.length)
    return 0

  let dot = 0
  let leftNorm = 0
  let rightNorm = 0
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftNorm += left[index] * left[index]
    rightNorm += right[index] * right[index]
  }

  const norm = Math.sqrt(leftNorm) * Math.sqrt(rightNorm)
  return norm ? Math.max(0, dot / norm) : 0
}

function intersectionScore(left: Iterable<string>, right: Iterable<string>): number {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  if (!leftSet.size || !rightSet.size)
    return 0

  let shared = 0
  for (const item of leftSet) {
    if (rightSet.has(item))
      shared += 1
  }

  return shared / Math.max(leftSet.size, rightSet.size)
}

function directoryScore(left: string[], right: string[]): number {
  const maxLength = Math.max(left.length, right.length)
  if (!maxLength)
    return 0

  let common = 0
  while (left[common] && left[common] === right[common])
    common += 1

  return common / maxLength
}

function pairKey(source: string, target: string): string {
  return source < target ? `${source}->${target}` : `${target}->${source}`
}

function addEdge(edges: Map<string, EdgeAccumulator>, source: string, target: string, relationType: string, score: number): void {
  if (source === target || score <= 0)
    return

  const [edgeSource, edgeTarget] = source < target ? [source, target] : [target, source]
  const key = pairKey(source, target)
  const edge = edges.get(key) || {
    source: edgeSource,
    target: edgeTarget,
    relationTypes: new Set<string>(),
    scoreBreakdown: {},
    rawScore: 0,
  }

  edge.relationTypes.add(relationType)
  edge.scoreBreakdown[relationType] = Math.max(edge.scoreBreakdown[relationType] || 0, Number(score.toFixed(4)))
  edge.rawScore = Math.max(edge.rawScore, 0) + score
  edges.set(key, edge)
}

function finalizeEdges(edgeMap: Map<string, EdgeAccumulator>, nodeIds: string[]): GravityMatrixEdge[] {
  const nodeIdSet = new Set(nodeIds)
  const allEdges = [...edgeMap.values()].map((edge) => {
    const relationTypes = [...edge.relationTypes].sort()
    const type = relationTypes.includes('markdown')
      ? 'markdown'
      : relationTypes.includes('wikilink')
        ? 'wikilink'
        : relationTypes.includes('html') ? 'html' : 'related'

    return {
      source: edge.source,
      target: edge.target,
      type,
      weight: Number(Math.min(1, edge.rawScore).toFixed(4)),
      relationTypes,
      scoreBreakdown: edge.scoreBreakdown,
    } satisfies GravityMatrixEdge
  })

  const incidentEdges = new Map<string, GravityMatrixEdge[]>()
  for (const nodeId of nodeIds)
    incidentEdges.set(nodeId, [])

  for (const edge of allEdges) {
    if (!nodeIdSet.has(edge.source) || !nodeIdSet.has(edge.target))
      continue
    incidentEdges.get(edge.source)?.push(edge)
    incidentEdges.get(edge.target)?.push(edge)
  }

  const selected = new Set<string>()
  for (const edge of allEdges) {
    if (edge.relationTypes.some(type => type === 'markdown' || type === 'wikilink' || type === 'html'))
      selected.add(pairKey(edge.source, edge.target))
  }

  for (const edges of incidentEdges.values()) {
    for (const edge of edges.sort((a, b) => b.weight - a.weight).slice(0, topRelatedEdgesPerNode))
      selected.add(pairKey(edge.source, edge.target))
  }

  return allEdges
    .filter(edge => selected.has(pairKey(edge.source, edge.target)))
    .sort((a, b) => b.weight - a.weight || a.source.localeCompare(b.source) || a.target.localeCompare(b.target))
}

async function readNotes(): Promise<NoteEntry[]> {
  const files = await fg(join(contentDir, '笔记/**/*.md').replaceAll('\\', '/'), {
    absolute: true,
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/assets/**', '**/data/**'],
  })

  return await Promise.all(files.sort().map(async (file) => {
    const markdown = await readFile(file, 'utf-8')
    const { data, content } = grayMatter(markdown)
    const filePath = normalizePath(relative(contentDir, file))
    const pathParts = filePath.split(posixSep)
    const directories = pathParts.slice(0, -1)
    const category = pathParts[0] === '笔记' && pathParts[1] && !pathParts[1].endsWith('.md') ? pathParts[1] : pathParts[0]
    const headings = extractHeadings(content)
    const tags = [
      ...normalizeList(data.tags),
      ...normalizeList(data.tag),
      ...normalizeList(data.category),
      ...normalizeList(data.categories),
      category,
    ].filter(Boolean)
    const title = extractTitle(file, data, content)
    const tokens = tokenize(`${title}\n${headings.join('\n')}\n${tags.join(' ')}\n${content}`)

    return {
      id: filePathToUrl(filePath),
      title,
      url: filePathToUrl(filePath),
      filePath,
      category,
      absolutePath: file,
      rawContent: content,
      headings,
      tags: [...new Set(tags)],
      directories,
      tokens,
      titleTokens: new Set(tokenize(`${title}\n${headings.slice(0, 4).join('\n')}`)),
      vector: new Map<string, number>(),
    }
  }))
}

function buildIndexes(notes: NoteEntry[]) {
  const byUrl = new Map<string, NoteEntry>()
  const byFilePath = new Map<string, NoteEntry>()
  const byStem = new Map<string, NoteEntry[]>()

  for (const note of notes) {
    byUrl.set(note.url, note)
    byFilePath.set(note.filePath, note)

    const stem = note.filePath.replace(/\.md$/, '')
    const basenameStem = basename(stem)
    byStem.set(stem, [...(byStem.get(stem) || []), note])
    byStem.set(basenameStem, [...(byStem.get(basenameStem) || []), note])
  }

  return { byUrl, byFilePath, byStem }
}

function computeDocumentVectors(notes: NoteEntry[]): void {
  const documentFrequency = new Map<string, number>()
  for (const note of notes) {
    for (const token of new Set(note.tokens))
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1)
  }

  for (const note of notes)
    note.vector = buildVector(note.tokens, documentFrequency, notes.length)
}

function buildEmbeddingInput(note: NoteEntry): string {
  const contentPreview = cleanMarkdown(note.rawContent).replace(/\s+/g, ' ').slice(0, 6000)
  return [
    `title: ${note.title}`,
    `category: ${note.category || ''}`,
    `tags: ${note.tags.join(', ')}`,
    `headings: ${note.headings.slice(0, 10).join(' / ')}`,
    `content: ${contentPreview}`,
  ].join('\n')
}

async function fetchAiEmbeddings(inputs: string[]): Promise<number[][]> {
  if (!aiEmbeddingApiKey)
    throw new Error('Missing AI embedding API key')

  const response = await fetch(`${aiEmbeddingBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${aiEmbeddingApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: aiEmbeddingModel,
      input: inputs,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`AI embedding request failed: ${response.status} ${response.statusText}${detail ? ` - ${detail.slice(0, 240)}` : ''}`)
  }

  const result = await response.json() as { data?: Array<{ index: number, embedding: number[] }> }
  const embeddings = [...(result.data || [])]
    .sort((left, right) => left.index - right.index)
    .map(item => item.embedding)

  if (embeddings.length !== inputs.length)
    throw new Error(`AI embedding response count mismatch: expected ${inputs.length}, got ${embeddings.length}`)

  return embeddings
}

async function computeAiEmbeddings(notes: NoteEntry[]): Promise<boolean> {
  if (!aiEmbeddingEnabled)
    return false

  if (!aiEmbeddingApiKey) {
    const message = 'GRAVITY_MATRIX_AI is enabled, but no GRAVITY_MATRIX_AI_API_KEY or OPENAI_API_KEY was provided. Falling back to local TF-IDF similarity.'
    if (aiEmbeddingStrict)
      throw new Error(message)

    console.warn(message)
    return false
  }

  try {
    for (let index = 0; index < notes.length; index += aiEmbeddingBatchSize) {
      const batch = notes.slice(index, index + aiEmbeddingBatchSize)
      const embeddings = await fetchAiEmbeddings(batch.map(buildEmbeddingInput))
      for (const [batchIndex, embedding] of embeddings.entries())
        batch[batchIndex].aiEmbedding = embedding
      console.log(`AI embeddings: ${Math.min(index + batch.length, notes.length)}/${notes.length}`)
    }
    return true
  }
  catch (error) {
    if (aiEmbeddingStrict)
      throw error

    console.warn(error instanceof Error ? error.message : String(error))
    console.warn('Falling back to local TF-IDF similarity.')
    return false
  }
}

function computeEdges(notes: NoteEntry[], useAiEmbeddings: boolean): GravityMatrixEdge[] {
  const indexes = buildIndexes(notes)
  const edgeMap = new Map<string, EdgeAccumulator>()

  for (const note of notes) {
    for (const link of collectLinks(note.rawContent)) {
      const target = resolveLinkTarget(link.href, note, indexes)
      if (target)
        addEdge(edgeMap, note.id, target.id, link.type, 1)
    }
  }

  for (let leftIndex = 0; leftIndex < notes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < notes.length; rightIndex += 1) {
      const left = notes[leftIndex]
      const right = notes[rightIndex]
      const aiScore = useAiEmbeddings ? cosineArraySimilarity(left.aiEmbedding, right.aiEmbedding) * 0.62 : 0
      const contentScore = cosineSimilarity(left.vector, right.vector) * (useAiEmbeddings ? 0.22 : 0.5)
      const tagScore = intersectionScore(left.tags, right.tags) * 0.24
      const dirScore = directoryScore(left.directories, right.directories) * 0.18
      const titleScore = intersectionScore(left.titleTokens, right.titleTokens) * 0.16
      const total = aiScore + contentScore + tagScore + dirScore + titleScore

      if (total < minSimilarityScore)
        continue

      if (aiScore > 0)
        addEdge(edgeMap, left.id, right.id, 'ai-embedding', aiScore)
      if (contentScore > 0)
        addEdge(edgeMap, left.id, right.id, 'content-similarity', contentScore)
      if (tagScore > 0)
        addEdge(edgeMap, left.id, right.id, 'tag-overlap', tagScore)
      if (dirScore > 0)
        addEdge(edgeMap, left.id, right.id, 'directory-neighbor', dirScore)
      if (titleScore > 0)
        addEdge(edgeMap, left.id, right.id, 'title-overlap', titleScore)
    }
  }

  return finalizeEdges(edgeMap, notes.map(note => note.id))
}

function assignChunks(nodes: GravityMatrixNode[]): GravityMatrixNode[][] {
  const sortedNodes = [...nodes].sort((a, b) => {
    return (a.category || '').localeCompare(b.category || '') || a.filePath.localeCompare(b.filePath)
  })
  const chunks: GravityMatrixNode[][] = []

  for (const node of sortedNodes) {
    const current = chunks.at(-1)
    const currentCategory = current?.[0]?.category
    if (!current || current.length >= chunkSizeTarget || (currentCategory && node.category !== currentCategory && current.length > chunkSizeTarget * 0.55))
      chunks.push([node])
    else
      current.push(node)
  }

  return chunks
}

async function writeGravityMatrix(notes: NoteEntry[], edges: GravityMatrixEdge[]): Promise<void> {
  const degree = new Map<string, number>()
  for (const note of notes)
    degree.set(note.id, 0)
  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) || 0) + 1)
    degree.set(edge.target, (degree.get(edge.target) || 0) + 1)
  }

  const nodes: GravityMatrixNode[] = notes.map(({ absolutePath: _absolutePath, rawContent: _rawContent, headings: _headings, tags: _tags, directories: _directories, tokens: _tokens, titleTokens: _titleTokens, vector: _vector, aiEmbedding: _aiEmbedding, ...note }) => ({
    ...note,
    degree: degree.get(note.id) || 0,
  }))

  const chunks = assignChunks(nodes)
  const nodeChunkId = new Map<string, string>()
  const generatedAt = Date.now()

  await rm(outputDir, { recursive: true, force: true })
  await mkdir(chunkDir, { recursive: true })
  await mkdir(bridgeDir, { recursive: true })

  for (const [index, chunkNodes] of chunks.entries()) {
    const chunkId = `chunk-${String(index).padStart(3, '0')}`
    for (const node of chunkNodes) {
      node.chunkId = chunkId
      nodeChunkId.set(node.id, chunkId)
    }
  }

  const bridgeEdges: GravityMatrixEdge[] = []
  const chunkInfos: GravityMatrixManifest['chunks'] = []

  for (const [index, chunkNodes] of chunks.entries()) {
    const chunkId = `chunk-${String(index).padStart(3, '0')}`
    const nodeIds = new Set(chunkNodes.map(node => node.id))
    const chunkEdges = edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    const chunk: GravityMatrixChunk = {
      version: 1,
      generatedAt,
      id: chunkId,
      nodes: chunkNodes,
      edges: chunkEdges,
    }

    const chunkPath = `chunks/${chunkId}.json`
    await writeFile(join(outputDir, chunkPath), `${JSON.stringify(chunk, null, 2)}\n`)
    chunkInfos.push({
      id: chunkId,
      path: chunkPath,
      nodeCount: chunkNodes.length,
      edgeCount: chunkEdges.length,
      categories: [...new Set(chunkNodes.map(node => node.category).filter(Boolean) as string[])],
    })
  }

  for (const edge of edges) {
    if (nodeChunkId.get(edge.source) !== nodeChunkId.get(edge.target))
      bridgeEdges.push(edge)
  }

  const bridgePaths: string[] = []
  for (let index = 0; index < bridgeEdges.length; index += bridgeEdgeSizeTarget) {
    const bridgeId = `bridge-${String(bridgePaths.length).padStart(3, '0')}`
    const bridgePath = `bridges/${bridgeId}.json`
    bridgePaths.push(bridgePath)
    await writeFile(join(outputDir, bridgePath), `${JSON.stringify({
      version: 1,
      generatedAt,
      id: bridgeId,
      nodes: [],
      edges: bridgeEdges.slice(index, index + bridgeEdgeSizeTarget),
    }, null, 2)}\n`)
  }

  const manifest: GravityMatrixManifest = {
    version: 1,
    generatedAt,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    chunkSizeTarget,
    chunks: chunkInfos,
    bridgePaths,
    nodeIndex: nodes.map(node => ({
      id: node.id,
      title: node.title,
      url: node.url,
      filePath: node.filePath,
      category: node.category,
      chunkId: node.chunkId,
      degree: node.degree,
    })),
  }

  await writeFile(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
}

const notes = await readNotes()
computeDocumentVectors(notes)
const useAiEmbeddings = await computeAiEmbeddings(notes)
const edges = computeEdges(notes, useAiEmbeddings)
await writeGravityMatrix(notes, edges)

console.log(`Generated gravity matrix: ${notes.length} nodes, ${edges.length} edges -> ${normalizePath(relative(rootDir, outputDir))}${useAiEmbeddings ? ` (AI embeddings: ${aiEmbeddingModel})` : ' (local similarity)'}`)

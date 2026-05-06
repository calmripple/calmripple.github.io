import { readFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, sep } from 'node:path'
import { sep as posixSep } from 'node:path/posix'
import { cwd } from 'node:process'

import { defu } from 'defu'
import grayMatter from 'gray-matter'
import { glob } from 'tinyglobby'

export interface GraphViewNode {
  id: string
  title: string
  url: string
  filePath: string
  category?: string
  external?: boolean
}

export interface GraphViewEdge {
  source: string
  target: string
  type: 'markdown' | 'wikilink' | 'html' | 'external'
}

export interface GraphViewData {
  nodes: GraphViewNode[]
  edges: GraphViewEdge[]
  generatedAt: number
}

export interface GraphViewLoaderOptions {
  dir?: string
  ignores?: string[]
  rewrites?: Array<{ from: RegExp, to: string }>
  includeExternal?: boolean
  category?: {
    byLevel?: number
    fallbackWithFrontmatter?: boolean
  }
}

interface PageEntry extends GraphViewNode {
  absolutePath: string
  rawContent: string
}

const markdownLinkRE = /(?<!!)\[[^\]\n]+\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g
const htmlLinkRE = /<a\s+[^>]*href=(['"])(.*?)\1/gi
const wikilinkRE = /(?<!!)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g

function normalizePath(path: string): string {
  return path.split(sep).join(posixSep).replaceAll('\\', posixSep)
}

function stripHashAndQuery(href: string): string {
  return href.split('#')[0]?.split('?')[0] ?? href
}

function isSkippableHref(href: string): boolean {
  return !href
    || href.startsWith('#')
    || href.startsWith('mailto:')
    || href.startsWith('tel:')
    || href.startsWith('javascript:')
}

function toggledFromFrontmatter(data: Record<string, any>, key: string, groupKey: string = 'nolebase'): boolean {
  if (groupKey in data && key in data[groupKey] && !data[groupKey][key])
    return false
  if (key in data && !data[key])
    return false

  return true
}

function extractTitle(file: string, frontmatter: Record<string, any>, content: string): string {
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim())
    return frontmatter.title.trim()

  const heading = /^#\s+(.+)$/m.exec(content)
  if (heading?.[1])
    return heading[1].trim()

  return basename(file).replace(/\.md$/, '')
}

function filePathToUrl(fileRelativePath: string, rewrites: Array<{ from: RegExp, to: string }>): string {
  let url = normalizePath(fileRelativePath)

  if (url.endsWith('.md')) {
    if (url.endsWith('index.md'))
      url = url.replace(/index\.md$/, 'index.html')
    else
      url = url.replace(/\.md$/, '.html')
  }

  for (const rewrite of rewrites)
    url = url.replace(rewrite.from, rewrite.to)

  return `/${url}`.replaceAll('//', '/')
}

function extractCategory(fileRelativePath: string, frontmatter: Record<string, any>, options?: GraphViewLoaderOptions['category']): string | undefined {
  if (typeof options?.byLevel !== 'undefined') {
    const level = Number.parseInt(String(options.byLevel))
    const parts = normalizePath(fileRelativePath).split(posixSep)
    if (!Number.isNaN(level) && parts[level])
      return parts[level]
  }

  const fallbackWithFrontmatter = typeof options?.fallbackWithFrontmatter === 'undefined'
    ? true
    : options.fallbackWithFrontmatter

  if (fallbackWithFrontmatter && typeof frontmatter.category === 'string')
    return frontmatter.category
}

function collectLinks(content: string): Array<{ href: string, type: GraphViewEdge['type'] }> {
  const links: Array<{ href: string, type: GraphViewEdge['type'] }> = []

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

function uniqueEdges(edges: GraphViewEdge[]): GraphViewEdge[] {
  const seen = new Set<string>()
  return edges.filter((edge) => {
    const key = `${edge.source}->${edge.target}:${edge.type}`
    if (seen.has(key))
      return false

    seen.add(key)
    return true
  })
}

function createExternalNode(href: string): GraphViewNode {
  let title = href
  try {
    title = new URL(href).host
  }
  catch {}

  return {
    id: href,
    title,
    url: href,
    filePath: href,
    external: true,
  }
}

export function resolveGraphLinkTarget(
  href: string,
  source: PageEntry,
  indexes: {
    byUrl: Map<string, PageEntry>
    byFilePath: Map<string, PageEntry>
    byStem: Map<string, PageEntry[]>
  },
  includeExternal: boolean,
): GraphViewNode | undefined {
  if (isSkippableHref(href))
    return

  const cleanHref = stripHashAndQuery(href).trim()
  if (!cleanHref)
    return

  if (/^https?:\/\//.test(cleanHref))
    return includeExternal ? createExternalNode(cleanHref) : undefined

  if (cleanHref.startsWith('/')) {
    const normalizedUrl = cleanHref.endsWith('.md')
      ? cleanHref.replace(/\.md$/, '.html')
      : cleanHref
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

export function createGraphViewLoader(options?: GraphViewLoaderOptions) {
  const opts = defu(options, {
    dir: cwd(),
    ignores: ['**/node_modules/**', '**/dist/**'],
    rewrites: [],
    includeExternal: false,
  })

  return {
    async load(): Promise<GraphViewData> {
      const rootDir = opts.dir || cwd()
      const files = await glob(join(rootDir, '**/*.md').replaceAll('\\', '/'), {
        absolute: true,
        cwd: cwd(),
        ignore: opts.ignores,
      })

      const pages: PageEntry[] = []

      for (const file of files) {
        const markdownFileContent = await readFile(file, 'utf-8')
        const { data, content } = grayMatter(markdownFileContent)

        if (!toggledFromFrontmatter(data, 'graphView', 'nolebase'))
          continue

        const fileRelativePath = normalizePath(relative(rootDir, file))
        const url = filePathToUrl(fileRelativePath, opts.rewrites)

        pages.push({
          id: url,
          title: extractTitle(file, data, content),
          url,
          filePath: fileRelativePath,
          category: extractCategory(fileRelativePath, data, opts.category),
          absolutePath: file,
          rawContent: content,
        })
      }

      const byUrl = new Map<string, PageEntry>()
      const byFilePath = new Map<string, PageEntry>()
      const byStem = new Map<string, PageEntry[]>()

      for (const page of pages) {
        byUrl.set(page.url, page)
        byFilePath.set(page.filePath, page)

        const stem = page.filePath.replace(/\.md$/, '')
        const basenameStem = basename(stem)
        byStem.set(stem, [...(byStem.get(stem) || []), page])
        byStem.set(basenameStem, [...(byStem.get(basenameStem) || []), page])
      }

      const externalNodes = new Map<string, GraphViewNode>()
      const edges: GraphViewEdge[] = []
      const indexes = { byUrl, byFilePath, byStem }

      for (const page of pages) {
        for (const link of collectLinks(page.rawContent)) {
          const target = resolveGraphLinkTarget(link.href, page, indexes, opts.includeExternal)
          if (!target || target.id === page.id)
            continue

          if (target.external)
            externalNodes.set(target.id, target)

          edges.push({
            source: page.id,
            target: target.id,
            type: target.external ? 'external' : link.type,
          })
        }
      }

      return {
        nodes: [
          ...pages.map(({ absolutePath: _absolutePath, rawContent: _rawContent, ...page }) => page),
          ...externalNodes.values(),
        ],
        edges: uniqueEdges(edges),
        generatedAt: Date.now(),
      }
    },
  }
}

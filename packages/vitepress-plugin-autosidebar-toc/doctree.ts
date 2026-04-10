import { resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  DirNode,
  MarkdownMeta,
  TocSidebarDirectoryEntry,
  TocSidebarDoctreePayload,
  TocSidebarFileEntry,
  TocSidebarRawTree,
  TocSidebarRawTreeNode,
} from './types'
import { toVitePressDirectoryRoute, toVitePressPageRoute } from './routing'
import { computeDirectoryDisplayTitle, computeFileDisplayTitle, readMarkdownMeta } from './markdown'
import { getFrontmatterDate } from './frontmatter'

const execFileAsync = promisify(execFile)

// 获取文件的 git 最后提交时间。
async function getGitLastModified(filePath: string): Promise<Date | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['log', '-1', '--format=%aI', '--', filePath], {
      cwd: resolve(filePath, '..'),
    })
    const trimmed = stdout.trim()
    if (!trimmed) return undefined
    const d = new Date(trimmed)
    return Number.isNaN(d.getTime()) ? undefined : d
  }
  catch {
    return undefined
  }
}

// 从所有候选时间中取最新的一个。
function latestDate(...dates: (Date | undefined)[]): Date | undefined {
  let latest: Date | undefined
  for (const d of dates) {
    if (d && (!latest || d.getTime() > latest.getTime())) {
      latest = d
    }
  }
  return latest
}

// 构建 doctree 中的文件条目。
export async function createDoctreeFileEntry(
  baseDir: string,
  dirKey: string,
  fileName: string,
  cache: Map<string, MarkdownMeta>,
): Promise<TocSidebarFileEntry> {
  const relativePath = dirKey === '/' ? fileName : `${dirKey}/${fileName}`
  const absolutePath = resolve(baseDir, relativePath)
  const meta = await readMarkdownMeta(absolutePath, cache)

  const fmDate = getFrontmatterDate(meta.frontmatter, 'date')
  const hasFrontmatterDate = !!(meta.updatedAt || meta.createdAt || fmDate)
  const gitDate = hasFrontmatterDate ? undefined : await getGitLastModified(absolutePath)

  const bestDate = latestDate(
    meta.updatedAt,
    meta.createdAt,
    fmDate,
    gitDate,
  )

  return {
    name: fileName,
    path: relativePath,
    link: toVitePressPageRoute(relativePath),
    displayText: await computeFileDisplayTitle(absolutePath, fileName.replace(/\.md$/i, ''), cache),
    frontmatter: meta.frontmatter,
    h1: meta.h1 ?? null,
    updatedAt: bestDate ? bestDate.toISOString() : null,
  }
}

// 构建 doctree 中的目录条目。
export async function createDoctreeDirectoryEntry(
  baseDir: string,
  dirKey: string,
  dirName: string,
  sourceTree: Map<string, DirNode>,
  cache: Map<string, MarkdownMeta>,
): Promise<TocSidebarDirectoryEntry> {
  const childKey = dirKey === '/' ? dirName : `${dirKey}/${dirName}`
  const childNode = sourceTree.get(childKey)
  const hasIndex = childNode?.files.has('index.md') === true

  const item: TocSidebarDirectoryEntry = {
    name: dirName,
    path: childKey,
    link: null,
    displayText: await computeDirectoryDisplayTitle(baseDir, childKey, dirName, hasIndex, cache),
    indexFile: null,
  }

  if (hasIndex) {
    item.link = toVitePressDirectoryRoute(`${childKey}/index.md`)
    item.indexFile = await createDoctreeFileEntry(baseDir, childKey, 'index.md', cache)
  }

  return item
}

// 序列化单个目录节点，用于按需加载。
export async function serializeSingleDirectoryNode(
  dirKey: string,
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<TocSidebarRawTreeNode | null> {
  const lookupKey = dirKey === '/' ? '' : dirKey
  const node = sourceTree.get(lookupKey)
  if (!node) {
    return null
  }

  const directoryItems = await Promise.all(
    [...node.directories].map(dirName =>
      createDoctreeDirectoryEntry(baseDir, dirKey, dirName, sourceTree, cache),
    ),
  )
  const fileItems = await Promise.all(
    [...node.files]
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => createDoctreeFileEntry(baseDir, dirKey, fileName, cache)),
  )

  return { path: dirKey, directoryItems, fileItems }
}

// 将目录树序列化为 doctree 可传输结构。
export async function serializeDoctreeTree(
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<TocSidebarRawTree> {
  const payload: TocSidebarRawTree = {}

  for (const [dirPath, node] of sourceTree.entries()) {
    const key = dirPath || '/'
    const directoryItems = await Promise.all(
      [...node.directories].map(dirName => createDoctreeDirectoryEntry(baseDir, key, dirName, sourceTree, cache)),
    )
    const fileItems = await Promise.all(
      [...node.files]
        .filter(fileName => fileName.endsWith('.md'))
        .map(fileName => createDoctreeFileEntry(baseDir, key, fileName, cache)),
    )

    payload[key] = {
      path: key,
      directoryItems,
      fileItems,
    }
  }

  return payload
}

// 构建 doctree 顶层 payload。
export async function createDoctreePayload(
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<TocSidebarDoctreePayload> {
  return {
    tree: await serializeDoctreeTree(sourceTree, baseDir, cache),
  }
}

// 将 doctree payload 序列化为 JSON 文本。
export async function stringifyDoctreePayload(
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<string> {
  return `${JSON.stringify(await createDoctreePayload(sourceTree, baseDir, cache), null, 2)}\n`
}

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, extname, join, relative, resolve, sep } from 'node:path'
import fg from 'fast-glob'
import matter from 'gray-matter'
import { isRecord, sanitizeTextCandidate, toNormalizedAbsolutePath, toPosixPath } from '@knewbeing/utils'
import type { DefaultTheme } from 'vitepress'
import type { ConfigEnv, Plugin } from 'vite'
import type {
  DirNode,
  Frontmatter,
  MarkdownMeta,
  TocSidebarNavOptions,
  ResolvedTocSidebarOptions,
  TocSidebarBuildOptions,
  TocSidebarDirectoryEntry,
  TocSidebarDoctreePayload,
  TocSidebarFileEntry,
  TocSidebarRawTree,
  ViteUserConfigLike,
} from './types'
import { createAutoTocComponentResolver } from './client/resolvers'

export type {
  AutoTocResolverOptions,
  DirNode,
  Frontmatter,
  MarkdownMeta,
  ResolvedTocSidebarOptions,
  ThemeConfigLike,
  TocSidebarBuildOptions,
  TocSidebarDirectoryEntry,
  TocSidebarDoctreePayload,
  TocSidebarFileEntry,
  TocSidebarNavOptions,
  TocSidebarPlugin,
  TocSidebarRawTree,
  TocSidebarRawTreeNode,
  TocSidebarResolverOptions,
  ViteUserConfigLike,
} from './types'

export {
  createAutoTocComponentResolver,
}

const SIMPLE_INCLUDE_GLOB = '**/*.md'
const SIMPLE_EXCLUDE_DIR_GLOB_RE = /^\*\*\/([^/*{}[\]?]+)\/\*\*$/

// 生成 markdown 元数据缓存键。
function toMarkdownMetaCacheKey(filePath: string): string {
  return toNormalizedAbsolutePath(filePath)
}

// 将任意 frontmatter 输入安全转换为对象。
function toFrontmatter(data: unknown): Frontmatter {
  return isRecord(data) ? (data as Frontmatter) : {}
}

// 按键提取 frontmatter 字符串字段。
function getFrontmatterString(frontmatter: Frontmatter, key: string): string | undefined {
  const value = frontmatter[key]
  return typeof value === 'string' ? value : undefined
}

// 按键提取并解析 frontmatter 数值字段。
function getFrontmatterNumber(frontmatter: Frontmatter, key: string): number | undefined {
  const value = frontmatter[key]
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

// 按键提取并解析 frontmatter 日期字段。
function getFrontmatterDate(frontmatter: Frontmatter, key: string): Date | undefined {
  const value = frontmatter[key]
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

// 按键提取并规范化 frontmatter 标签字段。
function getFrontmatterTags(frontmatter: Frontmatter, key: string): string[] {
  const value = frontmatter[key]
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim()
        }

        if (typeof item === 'number' && Number.isFinite(item)) {
          return String(item)
        }

        return undefined
      })
      .filter((item): item is string => Boolean(item))
  }

  const singleTag = getFrontmatterString(frontmatter, key)?.trim()
  return singleTag ? [singleTag] : []
}

// 将 markdown 相对路径转换为 VitePress 路由路径。
function toVitePressRoutePath(relativeMdPath: string): string {
  let link = toPosixPath(relativeMdPath)
  if (link.endsWith('.md')) {
    link = link.slice(0, -3)
  }
  if (link.endsWith('/index')) {
    link = link.slice(0, -6)
  }
  if (!link.startsWith('/')) {
    link = `/${link}`
  }
  return link || '/'
}

// 将路径转换为目录路由（以 / 结尾）。
function toVitePressDirectoryRoute(relativeMdPath: string): string {
  const link = toVitePressRoutePath(relativeMdPath)
  if (link === '/') {
    return '/'
  }
  return link.endsWith('/') ? link : `${link}/`
}

// 根据是否 index 文件生成页面或目录路由。
function toVitePressPageRoute(relativeMdPath: string): string {
  const normalized = toPosixPath(relativeMdPath)
  const isIndexFile = normalized === 'index.md' || normalized.endsWith('/index.md')
  return isIndexFile ? toVitePressDirectoryRoute(relativeMdPath) : toVitePressRoutePath(relativeMdPath)
}


// 展示文本统一出口，便于后续定制。
function finalizeDisplayText(raw: string): string {
  return raw
}

// 按优先级计算最终展示标题。
function computeDisplayText(options: {
  sidebarTitle?: string
  title?: string
  h1?: string
  fileName?: string
  directoryName?: string
  fallback?: string
}): string {
  const fileStem = options.fileName
    ? basename(options.fileName, extname(options.fileName))
    : undefined

  const computed = sanitizeTextCandidate(options.sidebarTitle)
    ?? sanitizeTextCandidate(options.title)
    ?? sanitizeTextCandidate(options.h1)
    ?? sanitizeTextCandidate(fileStem)
    ?? sanitizeTextCandidate(options.directoryName)
    ?? sanitizeTextCandidate(options.fallback)
    ?? 'Untitled'

  return finalizeDisplayText(computed)
}

// 提取 markdown 内容中的一级标题。
function extractPrimaryHeading(markdownBody: string): string | undefined {
  const matched = markdownBody.match(/^#\s+(.+)$/m)
  return matched?.[1]?.trim()
}

// 将 markdown 原始数据解析为带有常用 Nolebase 字段的元数据对象。
function parseMarkdownMeta(data: unknown, markdownBody: string): MarkdownMeta {
  const frontmatter = toFrontmatter(data)

  return {
    frontmatter,
    h1: extractPrimaryHeading(markdownBody),
    title: getFrontmatterString(frontmatter, 'title'),
    sidebarTitle: getFrontmatterString(frontmatter, 'sidebarTitle'),
    tags: getFrontmatterTags(frontmatter, 'tags'),
    progress: getFrontmatterNumber(frontmatter, 'progress'),
    createdAt: getFrontmatterDate(frontmatter, 'createdAt'),
    updatedAt: getFrontmatterDate(frontmatter, 'updatedAt'),
    wordsCount: getFrontmatterNumber(frontmatter, 'wordsCount'),
    readingTime: getFrontmatterNumber(frontmatter, 'readingTime'),
  }
}

// 读取并缓存 markdown 元数据。
function readMarkdownMeta(filePath: string, cache: Map<string, MarkdownMeta>): MarkdownMeta {
  const resolvedPath = resolve(filePath)
  const cacheKey = toMarkdownMetaCacheKey(resolvedPath)
  const cached = cache.get(cacheKey)
  if (cached) {
    return cached
  }

  let result: MarkdownMeta = parseMarkdownMeta({}, '')

  try {
    const content = readFileSync(resolvedPath, 'utf-8')
    const { data, content: body } = matter(content)
    result = parseMarkdownMeta(data, body)
  }
  catch {
    // Keep safe fallback values if one markdown file cannot be parsed.
  }

  cache.set(cacheKey, result)
  return result
}

// 失效指定文件的元数据缓存。
function invalidateMarkdownMetaCache(filePath: string, cache: Map<string, MarkdownMeta>): void {
  cache.delete(toMarkdownMetaCacheKey(filePath))
}

// 计算文件在 sidebar/nav 中的展示标题。
function computeFileDisplayTitle(filePath: string, fallback: string, cache: Map<string, MarkdownMeta>): string {
  const meta = readMarkdownMeta(filePath, cache)
  return computeDisplayText({
    sidebarTitle: meta.sidebarTitle,
    title: meta.title,
    h1: meta.h1,
    fallback,
  })
}

// 计算目录展示标题，优先使用目录 index 元数据。
function computeDirectoryDisplayTitle(
  baseDir: string,
  directoryPath: string,
  fallback: string,
  hasIndex: boolean,
  cache: Map<string, MarkdownMeta>,
): string {
  if (!hasIndex) {
    return computeDisplayText({
      directoryName: fallback,
      fallback,
    })
  }

  const indexAbsPath = join(baseDir, directoryPath, 'index.md')
  const indexMeta = readMarkdownMeta(indexAbsPath, cache)
  return computeDisplayText({
    sidebarTitle: indexMeta.sidebarTitle,
    title: indexMeta.title,
    h1: indexMeta.h1,
    directoryName: fallback,
    fallback,
  })
}

// 使用 glob 规则扫描 markdown 文件。
function scanMarkdownFilesByGlob(baseDir: string, options: ResolvedTocSidebarOptions): string[] {
  const files = fg.sync(options.includeGlobs, {
    cwd: baseDir,
    ignore: options.excludeGlobs,
    onlyFiles: true,
    dot: options.includeDotFiles,
    followSymbolicLinks: false,
  })

  return files
    .map(file => toPosixPath(file))
    .filter(file => extname(file) === '.md')
}

// 解析简单排除规则中的目录名。
function parseExcludedDirectoryNameFromSimpleGlob(pattern: string): string | null {
  const normalized = toPosixPath(pattern.trim())
  const match = normalized.match(SIMPLE_EXCLUDE_DIR_GLOB_RE)
  return match?.[1] ?? null
}

// 判断是否可使用快速目录扫描路径。
function canUseSimpleDirectoryScanner(options: ResolvedTocSidebarOptions): boolean {
  if (options.includeGlobs.length !== 1 || options.includeGlobs[0] !== SIMPLE_INCLUDE_GLOB) {
    return false
  }

  for (const pattern of options.excludeGlobs) {
    if (!parseExcludedDirectoryNameFromSimpleGlob(pattern)) {
      return false
    }
  }

  return true
}

// 按目录遍历扫描 markdown 文件（性能优先）。
function scanMarkdownFilesWithDirectoryWalker(baseDir: string, options: ResolvedTocSidebarOptions): string[] {
  if (!canUseSimpleDirectoryScanner(options)) {
    return scanMarkdownFilesByGlob(baseDir, options)
  }

  const excludedDirectoryNames = new Set<string>()
  for (const pattern of options.excludeGlobs) {
    const directoryName = parseExcludedDirectoryNameFromSimpleGlob(pattern)
    if (directoryName) {
      excludedDirectoryNames.add(directoryName)
    }
  }

  const files: string[] = []

  function walkDirectory(absDir: string): void {
    let entries: Array<import('node:fs').Dirent<string>> = []
    try {
      entries = readdirSync(absDir, { withFileTypes: true, encoding: 'utf8' })
    }
    catch {
      return
    }

    for (const entry of entries) {
      const name = entry.name
      if (!options.includeDotFiles && name.startsWith('.')) {
        continue
      }

      if (entry.isDirectory()) {
        if (excludedDirectoryNames.has(name)) {
          continue
        }
        walkDirectory(join(absDir, name))
        continue
      }

      if (!entry.isFile() || extname(name) !== '.md') {
        continue
      }

      const relativePath = toPosixPath(relative(baseDir, join(absDir, name)))
      if (relativePath) {
        files.push(relativePath)
      }
    }
  }

  walkDirectory(baseDir)
  return files.sort((left, right) => left.localeCompare(right))
}

// 创建空目录树节点。
function createEmptyDirNode(): DirNode {
  return {
    directories: new Set<string>(),
    files: new Set<string>(),
  }
}

// 由 markdown 文件列表构建目录树结构。
function buildDirectoryTreeFromFiles(markdownFiles: string[]): Map<string, DirNode> {
  const tree = new Map<string, DirNode>()
  tree.set('', createEmptyDirNode())

  for (const file of markdownFiles) {
    const parts = file.split('/').filter(Boolean)
    if (parts.length === 0) {
      continue
    }

    let parentDir = ''
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i]

      const parentNode = tree.get(parentDir) ?? createEmptyDirNode()
      parentNode.directories.add(dirName)
      tree.set(parentDir, parentNode)

      const currentDir = parentDir ? `${parentDir}/${dirName}` : dirName
      if (!tree.has(currentDir)) {
        tree.set(currentDir, createEmptyDirNode())
      }
      parentDir = currentDir
    }

    const fileName = parts[parts.length - 1]
    const node = tree.get(parentDir) ?? createEmptyDirNode()
    node.files.add(fileName)
    tree.set(parentDir, node)
  }

  return tree
}

// 递归构建指定目录的 sidebar 条目。
function buildSidebarItemsFromDirectory(
  baseDir: string,
  currentDir: string,
  depth: number,
  options: ResolvedTocSidebarOptions,
  cache: Map<string, MarkdownMeta>,
  tree: Map<string, DirNode>,
): DefaultTheme.SidebarItem[] {
  const node = tree.get(currentDir)
  if (!node) {
    return []
  }

  const directoryNames = [...node.directories]
  const fileNames = [...node.files]

  const files: DefaultTheme.SidebarItem[] = []
  const dirs: DefaultTheme.SidebarItem[] = []

  for (const dirName of directoryNames) {
    const childDir = currentDir ? `${currentDir}/${dirName}` : dirName
    const childNode = tree.get(childDir)
    if (!childNode) {
      continue
    }

    const children = buildSidebarItemsFromDirectory(baseDir, childDir, depth + 1, options, cache, tree)

    const indexRel = childDir ? `${childDir}/index.md` : 'index.md'
    const hasIndex = childNode.files.has('index.md')
    const link = hasIndex ? toVitePressDirectoryRoute(indexRel) : undefined
    const items = [...children]
    const text = computeDirectoryDisplayTitle(baseDir, childDir, dirName, hasIndex, cache)

    if (items.length > 0 || link) {
      const directoryItem: DefaultTheme.SidebarItem = {
        text,
        ...(link ? { link } : {}),
        ...(items.length > 0 ? { items } : {}),
        collapsed: options.collapsed,
      }
      dirs.push(directoryItem)
    }
  }

  if (options.showMarkdownLinks) {
    for (const fileName of fileNames) {
      if (extname(fileName) !== '.md') {
        continue
      }

      const isIndex = fileName === 'index.md'
      if (isIndex) {
        continue
      }

      const relativeFile = currentDir ? `${currentDir}/${fileName}` : fileName
      const absoluteFile = join(baseDir, relativeFile)

      const link = toVitePressPageRoute(relativeFile)
      const fallbackTitle = finalizeDisplayText(basename(fileName, '.md'))
      const title = finalizeDisplayText(computeFileDisplayTitle(absoluteFile, fallbackTitle, cache))

      files.push({
        text: title,
        link,
      })
    }
  }

  return [...dirs, ...files]
}

// 规范化 sidebar root 配置路径。
function normalizeSidebarRootPath(path: string): string {
  const normalized = toPosixPath(path)
  let start = 0
  let end = normalized.length

  while (start < end && normalized[start] === '/') {
    start++
  }
  while (end > start && normalized[end - 1] === '/') {
    end--
  }

  return normalized.slice(start, end)
}

const DEFAULT_OPTIONS: ResolvedTocSidebarOptions = {
  includeGlobs: ['**/*.md'],
  excludeGlobs: ['**/node_modules/**', '**/.git/**', '**/.vitepress/**'],
  showMarkdownLinks: true,
  includeDotFiles: false,
  collapsed: true,
  debug: false,
  nav: {
    enabled: false,
    level: 1,
    mode: 'replace',
  },
}

// 规范化自动 nav 配置并填充默认值。
function normalizeAutoNavOptions(nav?: TocSidebarNavOptions): Required<TocSidebarNavOptions> {
  const level = typeof nav?.level === 'number' && Number.isFinite(nav.level)
    ? Math.max(1, Math.floor(nav.level))
    : 1

  return {
    enabled: nav?.enabled === true,
    level,
    mode: nav?.mode === 'append' ? 'append' : 'replace',
  }
}

// 字符串去重并排序。
function toSortedUniqueStrings(values: Iterable<string>) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

// 为目录解析可用的导航链接（优先 index）。
function resolveDirectoryNavLink(
  directoryPath: string,
  tree: Map<string, DirNode>,
): string | undefined {
  const node = tree.get(directoryPath)
  if (!node) {
    return undefined
  }

  if (node.files.has('index.md')) {
    return toVitePressDirectoryRoute(`${directoryPath}/index.md`)
  }

  const directMarkdownFiles = [...node.files]
    .filter(fileName => fileName.endsWith('.md') && fileName !== 'index.md')
    .sort((left, right) => left.localeCompare(right))

  if (directMarkdownFiles.length > 0) {
    return toVitePressPageRoute(`${directoryPath}/${directMarkdownFiles[0]}`)
  }

  const children = [...node.directories].sort((left, right) => left.localeCompare(right))
  for (const childName of children) {
    const childPath = `${directoryPath}/${childName}`
    const nestedLink = resolveDirectoryNavLink(childPath, tree)
    if (nestedLink) {
      return nestedLink
    }
  }

  return undefined
}

// 根据文件路径与层级规则收集 nav 目录候选。
function collectCandidateNavDirectories(
  scannedFiles: string[],
  roots: string[],
  navLevel: number,
): string[] {
  const candidates = new Set<string>()

  for (const filePath of scannedFiles) {
    const segments = filePath.split('/').filter(Boolean)
    if (segments.length < 2) {
      continue
    }

    const directorySegments = segments.slice(0, -1)
    if (directorySegments.length === 0) {
      continue
    }

    if (roots.length > 0) {
      for (const root of roots) {
        const rootSegments = root.split('/').filter(Boolean)
        const startsWithRoot = rootSegments.every(
          (segment, index) => directorySegments[index] === segment,
        )

        if (!startsWithRoot) {
          continue
        }

        const absoluteLevel = rootSegments.length + navLevel - 1
        if (directorySegments.length < absoluteLevel) {
          continue
        }

        const candidate = directorySegments.slice(0, absoluteLevel).join('/')
        if (candidate) {
          candidates.add(candidate)
        }
      }
      continue
    }

    if (directorySegments.length >= navLevel) {
      const candidate = directorySegments.slice(0, navLevel).join('/')
      if (candidate) {
        candidates.add(candidate)
      }
    }
  }

  return toSortedUniqueStrings(candidates)
}

// 构建单个目录对应的 nav 项。
function buildNavItemForDirectory(
  directoryPath: string,
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): DefaultTheme.NavItemWithLink | undefined {
  if (!sourceTree.has(directoryPath)) {
    return undefined
  }

  const link = resolveDirectoryNavLink(directoryPath, sourceTree)
  if (!link) {
    return undefined
  }

  const directoryName = directoryPath.split('/').filter(Boolean).at(-1) ?? directoryPath
  const hasIndex = sourceTree.get(directoryPath)?.files.has('index.md') === true
  const text = computeDirectoryDisplayTitle(baseDir, directoryPath, directoryName, hasIndex, cache)
  return { text, link }
}

// 全量重建自动 nav 状态。
function rebuildAutoNavState(
  sourceMarkdownFiles: string[],
  sourceTree: Map<string, DirNode>,
  roots: string[],
  navLevel: number,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): { nav: DefaultTheme.NavItemWithLink[]; directories: string[] } {
  const navDirectoryPaths = collectCandidateNavDirectories(sourceMarkdownFiles, roots, navLevel)
  const nav: DefaultTheme.NavItemWithLink[] = []

  for (const directoryPath of navDirectoryPaths) {
    const navItem = buildNavItemForDirectory(directoryPath, sourceTree, baseDir, cache)
    if (navItem) {
      nav.push(navItem)
    }
  }

  return {
    nav,
    directories: navDirectoryPaths.filter(directoryPath => sourceTree.has(directoryPath)),
  }
}

// 类型守卫：判断 nav 项是否带 link。
function isNavItemWithLink(item: DefaultTheme.NavItem): item is DefaultTheme.NavItemWithLink {
  return 'link' in item && typeof item.link === 'string'
}

// 按 replace/append 策略合并 nav，append 时按 link 去重。
function mergeNavItemsByMode(
  existingNav: DefaultTheme.NavItem[] | undefined,
  generatedNav: DefaultTheme.NavItemWithLink[],
  mode: Required<TocSidebarNavOptions>['mode'],
) : DefaultTheme.NavItem[] {
  if (mode === 'replace' || !existingNav || existingNav.length === 0) {
    return generatedNav
  }

  const merged: DefaultTheme.NavItem[] = [...existingNav]
  const existingLinks = new Set(
    existingNav
      .filter(isNavItemWithLink)
      .map(item => item.link),
  )

  for (const navItem of generatedNav) {
    if (existingLinks.has(navItem.link)) {
      continue
    }
    merged.push(navItem)
    existingLinks.add(navItem.link)
  }

  return merged
}

// 虚拟模块 ID。
const VIRTUAL_MODULE_ID = 'virtual:@knewbeing/toc-sidebar-doctree'
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

// 调试文件名。
const DOCTREE_DEBUG_FILE_NAME = 'toc-sidebar-doctree.debug.json'
const RECOMPUTE_DEBOUNCE_MS = 30

interface ContentSourceSnapshot {
  markdownFiles: string[]
  directoryTree: Map<string, DirNode>
}

// 构建本次计算所需的完整数据快照（文件列表+目录树）。
function buildContentSourceSnapshot(
  baseDir: string,
  options: ResolvedTocSidebarOptions,
): ContentSourceSnapshot {
  const markdownFiles = scanMarkdownFilesWithDirectoryWalker(baseDir, options)
  const directoryTree = buildDirectoryTreeFromFiles(markdownFiles)

  return {
    markdownFiles,
    directoryTree,
  }
}

// 构建 doctree 中的文件条目。
function createDoctreeFileEntry(
  baseDir: string,
  dirKey: string,
  fileName: string,
  cache: Map<string, MarkdownMeta>,
): TocSidebarFileEntry {
  const relativePath = dirKey === '/' ? fileName : `${dirKey}/${fileName}`
  const absolutePath = resolve(baseDir, relativePath)
  const meta = readMarkdownMeta(absolutePath, cache)

  return {
    name: fileName,
    path: relativePath,
    link: toVitePressPageRoute(relativePath),
    displayText: computeFileDisplayTitle(absolutePath, fileName.replace(/\.md$/i, ''), cache),
    frontmatter: meta.frontmatter,
    h1: meta.h1 ?? null,
  }
}

// 构建 doctree 中的目录条目。
function createDoctreeDirectoryEntry(
  baseDir: string,
  dirKey: string,
  dirName: string,
  sourceTree: Map<string, DirNode>,
  cache: Map<string, MarkdownMeta>,
): TocSidebarDirectoryEntry {
  const childKey = dirKey === '/' ? dirName : `${dirKey}/${dirName}`
  const childNode = sourceTree.get(childKey)
  const hasIndex = childNode?.files.has('index.md') === true

  const item: TocSidebarDirectoryEntry = {
    name: dirName,
    path: childKey,
    link: null,
    displayText: computeDirectoryDisplayTitle(baseDir, childKey, dirName, hasIndex, cache),
    indexFile: null,
  }

  if (hasIndex) {
    item.link = toVitePressDirectoryRoute(`${childKey}/index.md`)
    item.indexFile = createDoctreeFileEntry(baseDir, childKey, 'index.md', cache)
  }

  return item
}

// 将目录树序列化为 doctree 可传输结构。
function serializeDoctreeTree(
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): TocSidebarRawTree {
  const payload: TocSidebarRawTree = {}

  for (const [dirPath, node] of sourceTree.entries()) {
    const key = dirPath || '/'
    const directoryItems = [...node.directories]
      .map(dirName => createDoctreeDirectoryEntry(baseDir, key, dirName, sourceTree, cache))
    const fileItems = [...node.files]
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => createDoctreeFileEntry(baseDir, key, fileName, cache))

    payload[key] = {
      path: key,
      directoryItems,
      fileItems,
    }
  }

  return payload
}

// 构建 doctree 顶层 payload。
function createDoctreePayload(
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): TocSidebarDoctreePayload {
  return {
    tree: serializeDoctreeTree(sourceTree, baseDir, cache),
  }
}

// 将 doctree payload 序列化为 JSON 文本。
function stringifyDoctreePayload(
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): string {
  return `${JSON.stringify(createDoctreePayload(sourceTree, baseDir, cache), null, 2)}\n`
}

// 判断路径是否位于文档根目录内。
function isPathInsideBaseDir(filePath: string, normalizedBaseDir: string): boolean {
  const normalizedFile = toNormalizedAbsolutePath(filePath)
  return normalizedFile === normalizedBaseDir || normalizedFile.startsWith(`${normalizedBaseDir}/`)
}

// 插件主入口：驱动扫描、重算、注入与资源输出。
/**
 * 创建用于 VitePress 的自动侧边栏与导航生成插件。
 *
 * 该插件会扫描 Markdown 文档目录，构建目录树、sidebar、可选 nav，
 * 并在开发阶段支持增量更新与调试 doctree 输出。
 *
 * @param userOptions 用户传入的插件配置。
 * @returns 标准 Vite 插件实例。
 */
export function createTocSidebarVitePlugin(
  userOptions: TocSidebarBuildOptions,
): Plugin {
  const normalizedNav = normalizeAutoNavOptions(userOptions.nav)
  const options: TocSidebarBuildOptions & ResolvedTocSidebarOptions = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    showMarkdownLinks: userOptions.showMarkdownLinks ?? DEFAULT_OPTIONS.showMarkdownLinks,
    nav: normalizedNav,
  }

  const baseDir = resolve(options.dir)
  const normalizedBaseDir = toNormalizedAbsolutePath(baseDir)
  const cache = new Map<string, MarkdownMeta>()
  let isBuildCommand = false
  let sourceMarkdownFiles: string[] = []
  let sourceTree = new Map<string, DirNode>()
  let nav: DefaultTheme.NavItemWithLink[] = []
  let sidebar: DefaultTheme.SidebarMulti = {}
  const debugDoctreePath = resolve(process.cwd(), DOCTREE_DEBUG_FILE_NAME)
  const changedMarkdownAbsolutePaths = new Set<string>()
  let shouldResetMetaCache = false
  let pendingRecomputeTimer: ReturnType<typeof setTimeout> | undefined

  function writeDebugDoctreeSnapshot(content: string): void {
    if (isBuildCommand || !options.debug) {
      return
    }

    try {
      writeFileSync(debugDoctreePath, content, 'utf-8')
    }
    catch (error) {
      console.warn('[vitepress-plugin-autosidebar-toc] Failed to write debug doctree file:', error)
    }
  }

  function recomputeSidebarState(): void {
    // 1) 基于当前配置重建数据快照（文件列表 + 目录树）。
    const snapshot = buildContentSourceSnapshot(baseDir, options)
    sourceMarkdownFiles = snapshot.markdownFiles
    sourceTree = snapshot.directoryTree

    // 2) 计算 sidebar 根：优先使用用户 roots，否则使用一级目录。
    const roots = options.roots && options.roots.length > 0
      ? options.roots.map(normalizeSidebarRootPath)
      : [...(sourceTree.get('')?.directories ?? [])]

    // 3) 根据开关生成 nav（关闭时返回空结果）。
    const generatedNav = options.nav.enabled
      ? rebuildAutoNavState(sourceMarkdownFiles, sourceTree, roots, options.nav.level, baseDir, cache)
      : { nav: [], directories: [] }

    nav = generatedNav.nav

    const sidebarRoots = options.nav.enabled && generatedNav.directories.length > 0
      ? generatedNav.directories
      : roots

    // 4) 基于最终根集合生成 sidebar。
    const nextSidebar: DefaultTheme.SidebarMulti = {}
    for (const root of sidebarRoots) {
      if (!root || !sourceTree.has(root)) {
        continue
      }

      const rootPath = `/${root}/`
      nextSidebar[rootPath] = buildSidebarItemsFromDirectory(baseDir, root, 0, options, cache, sourceTree)
    }

    // 5) 刷新内存状态与调试快照。
    sidebar = nextSidebar
    writeDebugDoctreeSnapshot(stringifyDoctreePayload(sourceTree, baseDir, cache))
  }

  function queueSidebarRecompute(): void {
    // 防抖：在同一事件窗口内最多触发一次重算。
    if (pendingRecomputeTimer) {
      return
    }

    pendingRecomputeTimer = setTimeout(() => {
      pendingRecomputeTimer = undefined

      // 目录结构变更会触发全量失效；普通文件变更只失效对应条目。
      if (shouldResetMetaCache) {
        cache.clear()
      }
      else {
        for (const changedFilePath of changedMarkdownAbsolutePaths) {
          invalidateMarkdownMetaCache(changedFilePath, cache)
        }
      }

      changedMarkdownAbsolutePaths.clear()
      shouldResetMetaCache = false
      recomputeSidebarState()
    }, RECOMPUTE_DEBOUNCE_MS)
  }

  return {
    name: 'vitepress-plugin-autosidebar-toc:inject',
    enforce: 'post',
    resolveId(id) {
      // 虚拟模块 ID 解析。
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },
    load(id) {
      // 虚拟模块内容加载：返回导出 doctree 数据的 JavaScript。
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) {
        return null
      }

      const payload = createDoctreePayload(sourceTree, baseDir, cache)
      return `export default ${JSON.stringify(payload)}`
    },
    configureServer(server) {
      // markdown 文件 add/unlink/change 都进入统一重算队列。
      const refreshForMarkdownFileChange = (filePath: string) => {
        if (!isPathInsideBaseDir(filePath, normalizedBaseDir)) {
          return
        }

        const normalizedFile = toNormalizedAbsolutePath(filePath)
        if (!normalizedFile.endsWith('.md')) {
          return
        }

        changedMarkdownAbsolutePaths.add(normalizedFile)

        queueSidebarRecompute()
      }

      const refreshForDirectoryChange = (directoryPath: string) => {
        if (!isPathInsideBaseDir(directoryPath, normalizedBaseDir)) {
          return
        }

        shouldResetMetaCache = true
        queueSidebarRecompute()
      }

      server.watcher.on('add', refreshForMarkdownFileChange)
      server.watcher.on('unlink', refreshForMarkdownFileChange)
      server.watcher.on('change', refreshForMarkdownFileChange)
      server.watcher.on('addDir', refreshForDirectoryChange)
      server.watcher.on('unlinkDir', refreshForDirectoryChange)

      // dev 阶段虚拟模块会自动通过 load() hook 重新生成内容，
      // 当 moduleGraph invalidate 时会触发重新加载。
      // 这里仅需保留基础的文件监听逻辑。
    },
    config(config, env: ConfigEnv) {
      // config 阶段预先计算一次，确保 themeConfig 注入拿到最新数据。
      isBuildCommand = env.command === 'build'
      recomputeSidebarState()

      const normalizedConfig: ViteUserConfigLike = config
      const site = normalizedConfig.vitepress?.site

      if (!site) {
        return config
      }

      const shouldInjectSidebar = !isBuildCommand || Object.keys(sidebar).length > 0

      // 注入主站点 themeConfig。
      if (shouldInjectSidebar) {
        site.themeConfig = {
          ...(site.themeConfig ?? {}),
          sidebar,
          ...(options.nav.enabled && nav.length > 0
            ? {
              nav: mergeNavItemsByMode(site.themeConfig?.nav, nav, options.nav.mode),
            }
            : {}),
        }
      }

      // 注入 locales 的 themeConfig，保持多语言配置一致。
      if (site.locales && shouldInjectSidebar) {
        for (const localeKey of Object.keys(site.locales)) {
          const locale = site.locales[localeKey]
          locale.themeConfig = {
            ...(locale.themeConfig ?? {}),
            sidebar,
            ...(options.nav.enabled && nav.length > 0
              ? {
                nav: mergeNavItemsByMode(locale.themeConfig?.nav, nav, options.nav.mode),
              }
              : {}),
          }
        }
      }

      return config
    },
  }
}


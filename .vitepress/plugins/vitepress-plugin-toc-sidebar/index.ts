import { readFileSync } from 'node:fs'
import { basename, extname, join, relative, resolve, sep } from 'node:path'
import fg from 'fast-glob'
import matter from 'gray-matter'
import type { DefaultTheme } from 'vitepress'
import type { Plugin } from 'vite'
import Components from 'unplugin-vue-components/vite'

export interface TocSidebarBuildOptions {
  dir: string
  roots?: string[]
  includeGlobs?: string[]
  excludeGlobs?: string[]
  showMarkdownLinks?: boolean
  hideDirsWithoutMarkdown?: boolean
  includeRootIndex?: boolean
  includeFolderIndex?: boolean
  includeDotFiles?: boolean
  collapsed?: boolean
  folderLinkFromIndexFile?: boolean
  frontmatterTitleField?: string
  excludeFilesByFrontmatterFieldName?: string
  formatSortPrefix?: boolean
  sortByName?: boolean
  toc?: {
    enabled?: boolean
    minDepth?: number
    maxDepth?: number
    collapsed?: boolean
    includeOnIndexPages?: boolean
  }
}

interface MarkdownMeta {
  frontmatter: Record<string, any>
  h1?: string
  headings: Heading[]
}

interface Heading {
  depth: number
  text: string
}

interface TocNode {
  text: string
  link: string
  items?: TocNode[]
}

interface DirNode {
  directories: Set<string>
  files: Set<string>
}

interface AutoTocLinkItem {
  text: string
  link: string
}

export interface TocSidebarLifecycleHooks {
  onOptionsResolved?: (options: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>) => void
  onFilesScanned?: (files: string[]) => void
  onFilesFiltered?: (files: string[]) => void
  onTreeBuilt?: (tree: Map<string, DirNode>) => void
  onSidebarBuilt?: (sidebar: DefaultTheme.SidebarMulti) => void
}

export interface TocSidebarPlugin {
  name: 'vitepress-plugin-toc-sidebar'
  options: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>
  buildSidebar: () => DefaultTheme.SidebarMulti
}

interface ViteUserConfigLike {
  vitepress?: {
    site?: {
      themeConfig?: Record<string, any>
      locales?: Record<string, { themeConfig?: Record<string, any> }>
    }
  }
}

const DEFAULT_OPTIONS: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>> = {
  includeGlobs: ['**/*.md'],
  excludeGlobs: ['**/node_modules/**', '**/.git/**', '**/.vitepress/**'],
  showMarkdownLinks: true,
  hideDirsWithoutMarkdown: false,
  includeRootIndex: false,
  includeFolderIndex: false,
  includeDotFiles: false,
  collapsed: true,
  folderLinkFromIndexFile: true,
  frontmatterTitleField: 'sidebarTitle',
  excludeFilesByFrontmatterFieldName: 'sidebarHide',
  formatSortPrefix: true,
  sortByName: true,
  toc: {
    enabled: true,
    minDepth: 2,
    maxDepth: 3,
    collapsed: true,
    includeOnIndexPages: false,
  },
}

function normalizePath(p: string): string {
  return p.split(sep).join('/')
}

function removeSortPrefix(name: string): string {
  return name.replace(/^\d+\s*[._\-\s、]*/, '').trim()
}

function toVpLink(relativeMdPath: string): string {
  let link = normalizePath(relativeMdPath)
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

function toVpDirectoryLink(relativeMdPath: string): string {
  const link = toVpLink(relativeMdPath)
  if (link === '/') {
    return '/'
  }
  return link.endsWith('/') ? link : `${link}/`
}

function slugify(raw: string, counter: Map<string, number>): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[\[\]()`*~]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/[!"#$%&'+,./:;<=>?@\\^_{|}]/g, '')
  const base = cleaned || 'section'
  const count = counter.get(base) ?? 0
  counter.set(base, count + 1)
  return count === 0 ? base : `${base}-${count}`
}

function extractH1(markdownBody: string): string | undefined {
  const matched = markdownBody.match(/^#\s+(.+)$/m)
  return matched?.[1]?.trim()
}

function stripCodeFences(markdownBody: string): string {
  return markdownBody.replace(/```[\s\S]*?```/g, '')
}

function extractHeadings(markdownBody: string): Heading[] {
  const plain = stripCodeFences(markdownBody)
  const headings: Heading[] = []
  const regex = /^(#{1,6})\s+(.+)$/gm

  let match = regex.exec(plain)
  while (match) {
    headings.push({
      depth: match[1].length,
      text: match[2].trim(),
    })
    match = regex.exec(plain)
  }

  return headings
}

function readMarkdownMeta(filePath: string, cache: Map<string, MarkdownMeta>): MarkdownMeta {
  const cached = cache.get(filePath)
  if (cached) {
    return cached
  }

  let result: MarkdownMeta = {
    frontmatter: {},
    h1: undefined,
    headings: [],
  }

  try {
    const content = readFileSync(filePath, 'utf-8')
    const { data, content: body } = matter(content)
    result = {
      frontmatter: (data ?? {}) as Record<string, any>,
      h1: extractH1(body),
      headings: extractHeadings(body),
    }
  }
  catch {
    // Keep safe fallback values if one markdown file cannot be parsed.
  }

  cache.set(filePath, result)
  return result
}

function sortEntries(entries: string[], byName: boolean): string[] {
  if (!byName) {
    return entries
  }

  return [...entries].sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' }))
}

function buildTocItems(pageLink: string, headings: Heading[], options: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>): TocNode[] {
  if (!options.toc.enabled) {
    return []
  }

  const minDepth = options.toc.minDepth ?? 2
  const maxDepth = options.toc.maxDepth ?? 3
  const usable = headings.filter(h => h.depth >= minDepth && h.depth <= maxDepth)
  if (usable.length === 0) {
    return []
  }

  const slugCounter = new Map<string, number>()
  const root: TocNode[] = []
  const stack: Array<{ depth: number, node: TocNode }> = []

  for (const heading of usable) {
    const anchor = slugify(heading.text, slugCounter)
    const item: TocNode = {
      text: heading.text,
      link: `${pageLink}#${anchor}`,
    }

    while (stack.length > 0 && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(item)
    }
    else {
      const parent = stack[stack.length - 1].node
      if (!parent.items) {
        parent.items = []
      }
      parent.items.push(item)
    }

    stack.push({ depth: heading.depth, node: item })
  }

  return root
}

function buildDirectoryTocItems(
  baseDir: string,
  indexAbsPath: string,
  options: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>,
  cache: Map<string, MarkdownMeta>,
): DefaultTheme.SidebarItem[] {
  if (!options.toc.enabled) {
    return []
  }

  const indexLink = toVpDirectoryLink(relative(baseDir, indexAbsPath))
  const meta = readMarkdownMeta(indexAbsPath, cache)
  const tocItems = buildTocItems(indexLink, meta.headings, options)
  if (tocItems.length === 0) {
    return []
  }

  return [{
    text: 'TOC',
    collapsed: options.toc.collapsed,
    items: tocItems as DefaultTheme.SidebarItem[],
  }]
}

function formatDisplayText(raw: string, options: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>): string {
  return options.formatSortPrefix ? removeSortPrefix(raw) : raw
}

function fileTitle(filePath: string, fallback: string, options: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>, cache: Map<string, MarkdownMeta>): string {
  const meta = readMarkdownMeta(filePath, cache)
  const fromField = meta.frontmatter[options.frontmatterTitleField]
  if (typeof fromField === 'string' && fromField.trim()) {
    return fromField.trim()
  }
  if (typeof meta.frontmatter.title === 'string' && meta.frontmatter.title.trim()) {
    return meta.frontmatter.title.trim()
  }
  if (meta.h1) {
    return meta.h1
  }
  return fallback
}

function isExcludedByFrontmatter(filePath: string, options: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>, cache: Map<string, MarkdownMeta>): boolean {
  if (!options.excludeFilesByFrontmatterFieldName) {
    return false
  }
  const meta = readMarkdownMeta(filePath, cache)
  return Boolean(meta.frontmatter[options.excludeFilesByFrontmatterFieldName])
}

function scanMarkdownFiles(baseDir: string, options: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>): string[] {
  const files = fg.sync(options.includeGlobs, {
    cwd: baseDir,
    ignore: options.excludeGlobs,
    onlyFiles: true,
    dot: options.includeDotFiles,
    followSymbolicLinks: false,
  })

  return files
    .map(file => normalizePath(file))
    .filter(file => extname(file) === '.md')
}

function filterVisibleMarkdownFiles(
  baseDir: string,
  markdownFiles: string[],
  options: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>,
  cache: Map<string, MarkdownMeta>,
): string[] {
  return markdownFiles.filter((relativeFile) => {
    const absolute = join(baseDir, relativeFile)
    return !isExcludedByFrontmatter(absolute, options, cache)
  })
}

function createDirNode(): DirNode {
  return {
    directories: new Set<string>(),
    files: new Set<string>(),
  }
}

function buildFileTree(markdownFiles: string[]): Map<string, DirNode> {
  const tree = new Map<string, DirNode>()
  tree.set('', createDirNode())

  for (const file of markdownFiles) {
    const parts = file.split('/').filter(Boolean)
    if (parts.length === 0) {
      continue
    }

    let parentDir = ''
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i]

      const parentNode = tree.get(parentDir) ?? createDirNode()
      parentNode.directories.add(dirName)
      tree.set(parentDir, parentNode)

      const currentDir = parentDir ? `${parentDir}/${dirName}` : dirName
      if (!tree.has(currentDir)) {
        tree.set(currentDir, createDirNode())
      }
      parentDir = currentDir
    }

    const fileName = parts[parts.length - 1]
    const node = tree.get(parentDir) ?? createDirNode()
    node.files.add(fileName)
    tree.set(parentDir, node)
  }

  return tree
}

function buildDirectoryItems(
  baseDir: string,
  currentDir: string,
  depth: number,
  options: Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>,
  cache: Map<string, MarkdownMeta>,
  tree: Map<string, DirNode>,
): DefaultTheme.SidebarItem[] {
  const node = tree.get(currentDir)
  if (!node) {
    return []
  }

  const directoryNames = sortEntries([...node.directories], options.sortByName)
  const fileNames = sortEntries([...node.files], options.sortByName)

  const files: DefaultTheme.SidebarItem[] = []
  const dirs: DefaultTheme.SidebarItem[] = []

  for (const dirName of directoryNames) {
    if (!options.includeDotFiles && dirName.startsWith('.')) {
      continue
    }

    const childDir = currentDir ? `${currentDir}/${dirName}` : dirName
    const childNode = tree.get(childDir)
    if (!childNode) {
      continue
    }

    const hasAnyMarkdown = childNode.files.size > 0 || childNode.directories.size > 0
    if (options.hideDirsWithoutMarkdown && !hasAnyMarkdown) {
      continue
    }

    const children = buildDirectoryItems(baseDir, childDir, depth + 1, options, cache, tree)
    const hiddenMarkdownLinks: AutoTocLinkItem[] = []

    for (const fileName of sortEntries([...childNode.files], options.sortByName)) {
      if (!options.includeDotFiles && fileName.startsWith('.')) {
        continue
      }

      if (extname(fileName) !== '.md') {
        continue
      }

      const isIndex = fileName === 'index.md'
      if (isIndex && depth === 0 && !options.includeRootIndex) {
        continue
      }
      if (isIndex && depth > 0 && !options.includeFolderIndex) {
        continue
      }

      const relativeFile = childDir ? `${childDir}/${fileName}` : fileName
      const absoluteFile = join(baseDir, relativeFile)
      const link = toVpLink(relativeFile)
      const fallbackTitle = formatDisplayText(basename(fileName, '.md'), options)
      const title = formatDisplayText(fileTitle(absoluteFile, fallbackTitle, options, cache), options)

      hiddenMarkdownLinks.push({ text: title, link })
    }

    const indexRel = childDir ? `${childDir}/index.md` : 'index.md'
    const hasIndex = childNode.files.has('index.md')
    const link = hasIndex && options.folderLinkFromIndexFile ? toVpDirectoryLink(indexRel) : undefined
    const directoryTocItems = hasIndex
      ? buildDirectoryTocItems(baseDir, join(baseDir, indexRel), options, cache)
      : []
    const visibleFileItems = options.showMarkdownLinks
      ? hiddenMarkdownLinks.map(file => ({ text: file.text, link: file.link }))
      : []
    const items = [...directoryTocItems, ...visibleFileItems, ...children]
    const autoTocDirPath = `/${childDir}`

    if (items.length > 0 || link || hiddenMarkdownLinks.length > 0) {
      const directoryItem = {
        text: formatDisplayText(dirName, options),
        ...(link ? { link } : {}),
        ...(items.length > 0 ? { items } : {}),
        __autoTocLinks: hiddenMarkdownLinks,
        __autoTocDirPath: autoTocDirPath,
        collapsed: options.collapsed,
      } as DefaultTheme.SidebarItem & { __autoTocLinks?: AutoTocLinkItem[], __autoTocDirPath?: string }
      dirs.push(directoryItem)
    }
  }

  for (const fileName of fileNames) {
    if (!options.includeDotFiles && fileName.startsWith('.')) {
      continue
    }

    if (extname(fileName) !== '.md') {
      continue
    }

    const isIndex = fileName === 'index.md'
    if (isIndex && depth === 0 && !options.includeRootIndex) {
      continue
    }
    if (isIndex && depth > 0 && !options.includeFolderIndex) {
      continue
    }

    if (!options.showMarkdownLinks) {
      continue
    }

    const relativeFile = currentDir ? `${currentDir}/${fileName}` : fileName
    const absoluteFile = join(baseDir, relativeFile)
    const link = toVpLink(relativeFile)
    const fallbackTitle = formatDisplayText(basename(fileName, '.md'), options)
    const title = formatDisplayText(fileTitle(absoluteFile, fallbackTitle, options, cache), options)

    files.push({
      text: title,
      link,
    })
  }

  return [...dirs, ...files]
}

function normalizeRootPath(path: string): string {
  return normalizePath(path).replace(/^\/+/, '').replace(/\/+$/, '')
}

export function generateTocSidebar(userOptions: TocSidebarBuildOptions): DefaultTheme.SidebarMulti {
  return createTocSidebarPlugin(userOptions).buildSidebar()
}

export function createTocSidebarPlugin(
  userOptions: TocSidebarBuildOptions,
  hooks: TocSidebarLifecycleHooks = {},
): TocSidebarPlugin {
  const options = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    toc: {
      ...DEFAULT_OPTIONS.toc,
      ...(userOptions.toc ?? {}),
    },
  }

  hooks.onOptionsResolved?.(options)

  const buildSidebar = (): DefaultTheme.SidebarMulti => {
    const baseDir = resolve(options.dir)
    const cache = new Map<string, MarkdownMeta>()

    // 1) glob filtering produces the source-of-truth markdown file set.
    const scannedFiles = scanMarkdownFiles(baseDir, options)
    hooks.onFilesScanned?.(scannedFiles)
    const visibleFiles = filterVisibleMarkdownFiles(baseDir, scannedFiles, options, cache)
    hooks.onFilesFiltered?.(visibleFiles)

    // 2) build virtual directory tree from filtered files.
    const tree = buildFileTree(visibleFiles)
    hooks.onTreeBuilt?.(tree)

    const roots = userOptions.roots && userOptions.roots.length > 0
      ? userOptions.roots.map(normalizeRootPath)
      : sortEntries([...(tree.get('')?.directories ?? [])], options.sortByName)

    const sidebar: DefaultTheme.SidebarMulti = {}
    for (const root of roots) {
      if (!root || !tree.has(root)) {
        continue
      }

      const rootPath = `/${root}/`
      sidebar[rootPath] = buildDirectoryItems(baseDir, root, 0, options, cache, tree)
    }

    hooks.onSidebarBuilt?.(sidebar)
    return sidebar
  }

  return {
    name: 'vitepress-plugin-toc-sidebar',
    options,
    buildSidebar,
  }
}

export function createTocSidebarVitePlugin(options: TocSidebarBuildOptions): Plugin {
  const runtime = createTocSidebarPlugin(options)
  const pluginComponentsDir = resolve(process.cwd(), '.vitepress/plugins/vitepress-plugin-toc-sidebar')

  return {
    name: 'vitepress-plugin-toc-sidebar:inject',
    config(config) {
      const sidebar = runtime.buildSidebar()
      const site = (config as ViteUserConfigLike)?.vitepress?.site

      if (!site) {
        return config
      }

      site.themeConfig = {
        ...(site.themeConfig ?? {}),
        sidebar,
      }

      if (site.locales) {
        for (const localeKey of Object.keys(site.locales)) {
          const locale = site.locales[localeKey]
          locale.themeConfig = {
            ...(locale.themeConfig ?? {}),
            sidebar,
          }
        }
      }

      return {
        ...config,
        plugins: [
          Components({
            include: [/\.vue$/, /\.md$/],
            dirs: [pluginComponentsDir],
            dts: false,
          }),
        ],
      }
    },
  }
}

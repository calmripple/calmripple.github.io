import { readFileSync } from 'node:fs'
import { basename, extname, join, relative, sep } from 'node:path'
import fg from 'fast-glob'
import matter from 'gray-matter'
import type { DefaultTheme } from 'vitepress'
import type {
  AutoTocLinkItem,
  DirNode,
  Heading,
  MarkdownMeta,
  ResolvedTocSidebarOptions,
  SidebarItemWithAutoToc,
  TocNode,
} from './types'

export function normalizePath(p: string): string {
  return p.split(sep).join('/')
}

function removeSortPrefix(name: string): string {
  return name.replace(/^\d+\s*[._\-\s、]*/, '').trim()
}

export function toVpLink(relativeMdPath: string): string {
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

export function toVpDirectoryLink(relativeMdPath: string): string {
  const link = toVpLink(relativeMdPath)
  if (link === '/') {
    return '/'
  }
  return link.endsWith('/') ? link : `${link}/`
}

export function toVpPageLink(relativeMdPath: string): string {
  const normalized = normalizePath(relativeMdPath)
  const isIndexFile = normalized === 'index.md' || normalized.endsWith('/index.md')
  return isIndexFile ? toVpDirectoryLink(relativeMdPath) : toVpLink(relativeMdPath)
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

export function readMarkdownMeta(filePath: string, cache: Map<string, MarkdownMeta>): MarkdownMeta {
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

export function sortEntries(entries: string[], byName: boolean): string[] {
  if (!byName) {
    return entries
  }

  return [...entries].sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' }))
}

function buildTocItems(pageLink: string, headings: Heading[], options: ResolvedTocSidebarOptions): TocNode[] {
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

export function buildDirectoryTocItems(
  baseDir: string,
  indexAbsPath: string,
  options: ResolvedTocSidebarOptions,
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

export function formatDisplayText(raw: string, options: ResolvedTocSidebarOptions): string {
  return options.formatSortPrefix ? removeSortPrefix(raw) : raw
}

export function fileTitle(filePath: string, fallback: string, options: ResolvedTocSidebarOptions, cache: Map<string, MarkdownMeta>): string {
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

export function scanMarkdownFiles(baseDir: string, options: ResolvedTocSidebarOptions): string[] {
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

function createDirNode(): DirNode {
  return {
    directories: new Set<string>(),
    files: new Set<string>(),
  }
}

export function buildFileTree(markdownFiles: string[]): Map<string, DirNode> {
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

function collectAutoTocLinksForDirectory(
  baseDir: string,
  dirPath: string,
  options: ResolvedTocSidebarOptions,
  cache: Map<string, MarkdownMeta>,
  tree: Map<string, DirNode>,
): AutoTocLinkItem[] {
  const node = tree.get(dirPath)
  if (!node) {
    return []
  }

  const results: AutoTocLinkItem[] = []
  const fileNames = sortEntries([...node.files], options.sortByName)

  for (const fileName of fileNames) {
    if (extname(fileName) !== '.md') {
      continue
    }

    const relativeFile = dirPath ? `${dirPath}/${fileName}` : fileName
    const absoluteFile = join(baseDir, relativeFile)

    const link = toVpPageLink(relativeFile)
    const fallbackTitle = formatDisplayText(basename(fileName, '.md'), options)
    const title = formatDisplayText(fileTitle(absoluteFile, fallbackTitle, options, cache), options)
    results.push({ text: title, link })
  }

  const directoryNames = sortEntries([...node.directories], options.sortByName)
  for (const dirName of directoryNames) {
    const childDir = dirPath ? `${dirPath}/${dirName}` : dirName
    results.push(...collectAutoTocLinksForDirectory(baseDir, childDir, options, cache, tree))
  }

  return results
}

function collectRawMarkdownLinksForDirectory(
  baseDir: string,
  dirPath: string,
  options: ResolvedTocSidebarOptions,
  cache: Map<string, MarkdownMeta>,
  rawTree: Map<string, DirNode>,
): AutoTocLinkItem[] {
  const node = rawTree.get(dirPath)
  if (!node) {
    return []
  }

  const results: AutoTocLinkItem[] = []
  const fileNames = sortEntries([...node.files], options.sortByName)
  for (const fileName of fileNames) {
    const relativeFile = dirPath ? `${dirPath}/${fileName}` : fileName
    const absoluteFile = join(baseDir, relativeFile)
    const link = toVpPageLink(relativeFile)
    const fallbackTitle = formatDisplayText(basename(fileName, '.md'), options)
    const title = formatDisplayText(fileTitle(absoluteFile, fallbackTitle, options, cache), options)
    results.push({ text: title, link })
  }

  const directoryNames = sortEntries([...node.directories], options.sortByName)
  for (const dirName of directoryNames) {
    const childDir = dirPath ? `${dirPath}/${dirName}` : dirName
    results.push(...collectRawMarkdownLinksForDirectory(baseDir, childDir, options, cache, rawTree))
  }

  return results
}

export function buildDirectoryItems(
  baseDir: string,
  currentDir: string,
  depth: number,
  options: ResolvedTocSidebarOptions,
  cache: Map<string, MarkdownMeta>,
  tree: Map<string, DirNode>,
  rawTree: Map<string, DirNode>,
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
    const childDir = currentDir ? `${currentDir}/${dirName}` : dirName
    const childNode = tree.get(childDir)
    if (!childNode) {
      continue
    }

    const children = buildDirectoryItems(baseDir, childDir, depth + 1, options, cache, tree, rawTree)
    const hiddenMarkdownLinks = collectAutoTocLinksForDirectory(baseDir, childDir, options, cache, tree)
    const rawMarkdownLinks = collectRawMarkdownLinksForDirectory(baseDir, childDir, options, cache, rawTree)

    const indexRel = childDir ? `${childDir}/index.md` : 'index.md'
    const hasIndex = childNode.files.has('index.md')
    const link = hasIndex ? toVpDirectoryLink(indexRel) : undefined
    const directoryTocItems = hasIndex
      ? buildDirectoryTocItems(baseDir, join(baseDir, indexRel), options, cache)
      : []
    const items = [...directoryTocItems, ...children]
    const autoTocDirPath = `/${childDir}`

    if (items.length > 0 || link || hiddenMarkdownLinks.length > 0 || rawMarkdownLinks.length > 0) {
      const directoryItem: SidebarItemWithAutoToc = {
        text: formatDisplayText(dirName, options),
        ...(link ? { link } : {}),
        ...(items.length > 0 ? { items } : {}),
        __autoTocLinks: hiddenMarkdownLinks,
        __autoTocRawLinks: rawMarkdownLinks,
        __autoTocDirPath: autoTocDirPath,
        collapsed: options.collapsed,
      }
      dirs.push(directoryItem)
    }
  }

  for (const fileName of fileNames) {
    if (extname(fileName) !== '.md') {
      continue
    }

    const isIndex = fileName === 'index.md'
    if (isIndex) {
      const includeIndex = depth === 0
        ? options.sidebarFilter.includeRootIndex
        : options.sidebarFilter.includeFolderIndex
      if (!includeIndex) {
        continue
      }
    }

    const relativeFile = currentDir ? `${currentDir}/${fileName}` : fileName
    const absoluteFile = join(baseDir, relativeFile)

    const link = toVpPageLink(relativeFile)
    const fallbackTitle = formatDisplayText(basename(fileName, '.md'), options)
    const title = formatDisplayText(fileTitle(absoluteFile, fallbackTitle, options, cache), options)

    files.push({
      text: title,
      link,
    })
  }

  return [...dirs, ...files]
}

export function normalizeRootPath(path: string): string {
  return normalizePath(path).replace(/^\/+/, '').replace(/\/+$/, '')
}

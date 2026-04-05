import { readdirSync, readFileSync } from 'node:fs'
import { basename, extname, join, relative, sep } from 'node:path'
import fg from 'fast-glob'
import matter from 'gray-matter'
import type { DefaultTheme } from 'vitepress'
import type {
  DirNode,
  Heading,
  MarkdownMeta,
  ResolvedTocSidebarOptions,
  TocNode,
} from './types'

const SIMPLE_INCLUDE_GLOB = '**/*.md'
const SIMPLE_EXCLUDE_DIR_GLOB_RE = /^\*\*\/([^/*{}[\]?]+)\/\*\*$/

export function normalizePath(p: string): string {
  return p.split(sep).join('/')
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

function buildTocItems(pageLink: string, headings: Heading[]): TocNode[] {
  const usable = headings
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
  cache: Map<string, MarkdownMeta>,
): DefaultTheme.SidebarItem[] {
  const indexLink = toVpDirectoryLink(relative(baseDir, indexAbsPath))
  const meta = readMarkdownMeta(indexAbsPath, cache)
  const tocItems = buildTocItems(indexLink, meta.headings)
  if (tocItems.length === 0) {
    return []
  }

  return [{
    text: 'TOC',
    collapsed: true,
    items: tocItems as DefaultTheme.SidebarItem[],
  }]
}

export function formatDisplayText(raw: string): string {
  return raw
}

export function fileTitle(filePath: string, fallback: string, cache: Map<string, MarkdownMeta>): string {
  const meta = readMarkdownMeta(filePath, cache)
  const fromField = meta.frontmatter.sidebarTitle
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

function parseExcludedDirectoryNameFromGlob(pattern: string): string | null {
  const normalized = normalizePath(pattern.trim())
  const match = normalized.match(SIMPLE_EXCLUDE_DIR_GLOB_RE)
  return match?.[1] ?? null
}

function canUseDirectoryScanner(options: ResolvedTocSidebarOptions): boolean {
  if (options.includeGlobs.length !== 1 || options.includeGlobs[0] !== SIMPLE_INCLUDE_GLOB) {
    return false
  }

  for (const pattern of options.excludeGlobs) {
    if (!parseExcludedDirectoryNameFromGlob(pattern)) {
      return false
    }
  }

  return true
}

export function scanMarkdownFilesByDirectory(baseDir: string, options: ResolvedTocSidebarOptions): string[] {
  if (!canUseDirectoryScanner(options)) {
    return scanMarkdownFiles(baseDir, options)
  }

  const excludedDirectoryNames = new Set<string>()
  for (const pattern of options.excludeGlobs) {
    const directoryName = parseExcludedDirectoryNameFromGlob(pattern)
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

      const relativePath = normalizePath(relative(baseDir, join(absDir, name)))
      if (relativePath) {
        files.push(relativePath)
      }
    }
  }

  walkDirectory(baseDir)
  return files.sort((left, right) => left.localeCompare(right))
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

export function buildDirectoryItems(
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

    const children = buildDirectoryItems(baseDir, childDir, depth + 1, options, cache, tree)

    const indexRel = childDir ? `${childDir}/index.md` : 'index.md'
    const hasIndex = childNode.files.has('index.md')
    const link = hasIndex ? toVpDirectoryLink(indexRel) : undefined
    const items = [...children]

    if (items.length > 0 || link) {
      const directoryItem = {
        text: formatDisplayText(dirName),
        ...(link ? { link } : {}),
        ...(items.length > 0 ? { items } : {}),
        collapsed: options.collapsed,
      } as DefaultTheme.SidebarItem
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

      const link = toVpPageLink(relativeFile)
      const fallbackTitle = formatDisplayText(basename(fileName, '.md'))
      const title = formatDisplayText(fileTitle(absoluteFile, fallbackTitle, cache))

      files.push({
        text: title,
        link,
      })
    }
  }

  return [...dirs, ...files]
}

export function normalizeRootPath(path: string): string {
  return normalizePath(path).replace(/^\/+/, '').replace(/\/+$/, '')
}

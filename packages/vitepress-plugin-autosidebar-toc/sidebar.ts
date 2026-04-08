import { basename, extname, join } from 'node:path'
import { toPosixPath } from '@knewbeing/utils'
import type { DefaultTheme } from 'vitepress'
import type { DirNode, MarkdownMeta, ResolvedTocSidebarOptions, TocSidebarNavOptions } from './types'
import { toVitePressDirectoryRoute, toVitePressPageRoute } from './routing'
import { computeDirectoryDisplayTitle, computeFileDisplayTitle, finalizeDisplayText } from './markdown'

// 递归构建指定目录的 sidebar 条目。
export async function buildSidebarItemsFromDirectory(
  baseDir: string,
  currentDir: string,
  depth: number,
  options: ResolvedTocSidebarOptions,
  cache: Map<string, MarkdownMeta>,
  tree: Map<string, DirNode>,
): Promise<DefaultTheme.SidebarItem[]> {
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

    const children = await buildSidebarItemsFromDirectory(baseDir, childDir, depth + 1, options, cache, tree)

    const indexRel = childDir ? `${childDir}/index.md` : 'index.md'
    const hasIndex = childNode.files.has('index.md')
    const link = hasIndex ? toVitePressDirectoryRoute(indexRel) : undefined
    const items = [...children]
    const text = await computeDirectoryDisplayTitle(baseDir, childDir, dirName, hasIndex, cache)

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
      const title = finalizeDisplayText(await computeFileDisplayTitle(absoluteFile, fallbackTitle, cache))

      files.push({
        text: title,
        link,
      })
    }
  }

  return [...dirs, ...files]
}

// 规范化 sidebar root 配置路径。
export function normalizeSidebarRootPath(path: string): string {
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

export const DEFAULT_OPTIONS: ResolvedTocSidebarOptions = {
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
export function normalizeAutoNavOptions(nav?: TocSidebarNavOptions): Required<TocSidebarNavOptions> {
  const level = typeof nav?.level === 'number' && Number.isFinite(nav.level)
    ? Math.max(1, Math.floor(nav.level))
    : 1

  return {
    enabled: nav?.enabled === true,
    level,
    mode: nav?.mode === 'append' ? 'append' : 'replace',
  }
}

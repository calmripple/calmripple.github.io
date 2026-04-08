import type { DefaultTheme } from 'vitepress'
import type { DirNode, MarkdownMeta, TocSidebarNavOptions } from './types'
import { toVitePressDirectoryRoute, toVitePressPageRoute } from './routing'
import { computeDirectoryDisplayTitle } from './markdown'

// 字符串去重并排序。
function toSortedUniqueStrings(values: Iterable<string>) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

// 为目录解析可用的导航链接（优先 index）。
export function resolveDirectoryNavLink(
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
export function collectCandidateNavDirectories(
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
export async function buildNavItemForDirectory(
  directoryPath: string,
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<DefaultTheme.NavItemWithLink | undefined> {
  if (!sourceTree.has(directoryPath)) {
    return undefined
  }

  const link = resolveDirectoryNavLink(directoryPath, sourceTree)
  if (!link) {
    return undefined
  }

  const directoryName = directoryPath.split('/').filter(Boolean).at(-1) ?? directoryPath
  const hasIndex = sourceTree.get(directoryPath)?.files.has('index.md') === true
  const text = await computeDirectoryDisplayTitle(baseDir, directoryPath, directoryName, hasIndex, cache)
  return { text, link }
}

// 全量重建自动 nav 状态。
export async function rebuildAutoNavState(
  sourceMarkdownFiles: string[],
  sourceTree: Map<string, DirNode>,
  roots: string[],
  navLevel: number,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<{ nav: DefaultTheme.NavItemWithLink[]; directories: string[] }> {
  const navDirectoryPaths = collectCandidateNavDirectories(sourceMarkdownFiles, roots, navLevel)
  const nav: DefaultTheme.NavItemWithLink[] = []

  for (const directoryPath of navDirectoryPaths) {
    const navItem = await buildNavItemForDirectory(directoryPath, sourceTree, baseDir, cache)
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
export function mergeNavItemsByMode(
  existingNav: DefaultTheme.NavItem[] | undefined,
  generatedNav: DefaultTheme.NavItemWithLink[],
  mode: Required<TocSidebarNavOptions>['mode'],
): DefaultTheme.NavItem[] {
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

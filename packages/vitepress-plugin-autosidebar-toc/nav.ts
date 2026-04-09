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
): Promise<{ nav: DefaultTheme.NavItem[]; directories: string[] }> {
  const navDirectoryPaths = collectCandidateNavDirectories(sourceMarkdownFiles, roots, navLevel)
  const nav: DefaultTheme.NavItem[] = []

  // 把所有 level 2 的目录作为一级菜单，其 level 3 的子目录作为下拉项
  for (const directoryPath of navDirectoryPaths) {
    const navItem = await buildNavItemForDirectory(directoryPath, sourceTree, baseDir, cache)
    if (!navItem) {
      continue
    }

    // 收集该目录的所有子目录作为下拉菜单项
    const node = sourceTree.get(directoryPath)
    if (node && node.directories.size > 0) {
      const items: DefaultTheme.NavItemWithLink[] = []
      const childDirs = [...node.directories].sort()

      for (const childDirName of childDirs) {
        const childPath = `${directoryPath}/${childDirName}`
        const childNode = sourceTree.get(childPath)
        if (!childNode) {
          continue
        }

        const childLink = resolveDirectoryNavLink(childPath, sourceTree)
        if (childLink) {
          const childText = await computeDirectoryDisplayTitle(baseDir, childPath, childDirName, childNode.files.has('index.md'), cache)
          items.push({
            text: childText,
            link: childLink,
          })
        }
      }

      if (items.length > 0) {
        // 下拉菜单不需要 link，只需要 text 和 items
        nav.push({
          text: navItem.text,
          items,
        })
      } else {
        // 如果没有子目录，保持为普通链接
        nav.push(navItem)
      }
    } else {
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

function getNavItemKey(item: DefaultTheme.NavItem) {
  if (isNavItemWithLink(item)) {
    return `link:${item.link}`
  }

  if ('text' in item && typeof item.text === 'string') {
    return `text:${item.text}`
  }

  if ('component' in item && typeof item.component === 'string') {
    return `component:${item.component}`
  }

  return 'unknown'
}

function hasDropdownItems(item: DefaultTheme.NavItem): item is DefaultTheme.NavItemWithChildren {
  return 'items' in item && Array.isArray(item.items) && item.items.length > 0
}

// 按 replace/append 策略合并 nav，append 时按 link 去重。
export function mergeNavItemsByMode(
  existingNav: DefaultTheme.NavItem[] | undefined,
  generatedNav: DefaultTheme.NavItem[],
  mode: Required<TocSidebarNavOptions>['mode'],
): DefaultTheme.NavItem[] {
  if (mode === 'replace' || !existingNav || existingNav.length === 0) {
    return generatedNav
  }

  const merged: DefaultTheme.NavItem[] = [...existingNav]
  const existingKeys = new Set(existingNav.map(getNavItemKey))

  for (const navItem of generatedNav) {
    const key = getNavItemKey(navItem)
    if (existingKeys.has(key)) {
      // append 模式下，如果已有同链接的普通项，而新项是带 items 的下拉项，
      // 则用新项替换，以启用顶部下拉导航。
      if (hasDropdownItems(navItem)) {
        const index = merged.findIndex(item => getNavItemKey(item) === key)
        if (index >= 0) {
          merged[index] = navItem
        }
      }
      continue
    }
    merged.push(navItem)
    existingKeys.add(key)
  }

  return merged
}

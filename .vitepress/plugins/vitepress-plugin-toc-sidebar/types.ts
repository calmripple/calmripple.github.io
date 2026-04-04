import type { DefaultTheme } from 'vitepress'

export interface TocSidebarBuildOptions {
  dir: string
  roots?: string[]
  includeGlobs?: string[]
  excludeGlobs?: string[]
  sidebarFilter?: {
    showMarkdownLinks?: boolean
    hideDirsWithoutMarkdown?: boolean
    includeRootIndex?: boolean
    includeFolderIndex?: boolean
    excludeFilesByFrontmatterFieldName?: string
  }
  autoTocFilter?: {
    includeRootIndex?: boolean
    includeFolderIndex?: boolean
    excludeFilesByFrontmatterFieldName?: string
  }
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

export interface MarkdownMeta {
  frontmatter: Record<string, any>
  h1?: string
  headings: Heading[]
}

export interface Heading {
  depth: number
  text: string
}

export interface TocNode {
  text: string
  link: string
  items?: TocNode[]
}

export interface DirNode {
  directories: Set<string>
  files: Set<string>
}

export interface AutoTocLinkItem {
  text: string
  link: string
}

export type ResolvedTocSidebarOptions = Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots'>>

export interface TocSidebarLifecycleHooks {
  onOptionsResolved?: (options: ResolvedTocSidebarOptions) => void
  onFilesScanned?: (files: string[]) => void
  onFilesFiltered?: (files: string[]) => void
  onTreeBuilt?: (tree: Map<string, DirNode>) => void
  onSidebarBuilt?: (sidebar: DefaultTheme.SidebarMulti) => void
}

export interface TocSidebarPlugin {
  name: 'vitepress-plugin-toc-sidebar'
  options: ResolvedTocSidebarOptions
  buildSidebar: () => DefaultTheme.SidebarMulti
}

export interface ViteUserConfigLike {
  vitepress?: {
    site?: {
      themeConfig?: Record<string, any>
      locales?: Record<string, { themeConfig?: Record<string, any> }>
    }
  }
}

export type SidebarItemWithAutoToc = DefaultTheme.SidebarItem & {
  __autoTocLinks?: AutoTocLinkItem[]
  __autoTocRawLinks?: AutoTocLinkItem[]
  __autoTocDirPath?: string
}

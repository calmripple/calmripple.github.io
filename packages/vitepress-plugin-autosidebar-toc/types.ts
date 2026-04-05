import type { DefaultTheme } from 'vitepress'

export interface TocSidebarNavOptions {
  /** 是否启用自动 nav 生成 */
  enabled?: boolean
  /**
   * 第几层目录作为 nav（1-based）。
   * 当设置了 roots 时，层级以每个 root 为起点；否则以文档根目录为起点。
   */
  level?: number
  /** nav 写入方式：replace 覆盖，append 追加并按 link 去重 */
  mode?: 'replace' | 'append'
}

export interface TocSidebarBuildOptions {
  dir: string
  roots?: string[]
  includeGlobs?: string[]
  excludeGlobs?: string[]
  showMarkdownLinks?: boolean
  includeDotFiles?: boolean
  collapsed?: boolean
  nav?: TocSidebarNavOptions
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

export interface BuildAllTreeNodeResult {
  tree: Map<string, DirNode>
  rawTree: Map<string, DirNode>
}

export interface TocSidebarRawTreeNode {
  directories: string[]
  files: string[]
}

export type TocSidebarRawTree = Record<string, TocSidebarRawTreeNode>

export interface TocSidebarDoctreePayload {
  tree: TocSidebarRawTree
}

export type ResolvedTocSidebarOptions = Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots' | 'nav'>> & {
  nav: Required<TocSidebarNavOptions>
}

export interface TocSidebarLifecycleHooks {
  onOptionsResolved?: (options: ResolvedTocSidebarOptions) => void
  onFilesScanned?: (files: string[]) => void
  onFilesFiltered?: (files: string[]) => void
  onTreeBuilt?: (tree: Map<string, DirNode>) => void
  onSidebarBuilt?: (sidebar: DefaultTheme.SidebarMulti) => void
}

export interface TocSidebarPlugin {
  name: 'vitepress-plugin-autosidebar-toc'
  options: ResolvedTocSidebarOptions
  buildSidebar: () => DefaultTheme.SidebarMulti
}

export interface TocSidebarResolverOptions {
  componentName?: string
  from?: string
}

export interface ViteUserConfigLike {
  root?: string
  publicDir?: string
  vitepress?: {
    site?: {
      themeConfig?: Record<string, any>
      locales?: Record<string, { themeConfig?: Record<string, any> }>
    }
  }
}


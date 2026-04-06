import type { DefaultTheme } from 'vitepress'

export type Frontmatter = Record<string, any>

export interface ThemeConfigLike {
  sidebar?: DefaultTheme.SidebarMulti
  nav?: DefaultTheme.NavItem[]
  [key: string]: unknown
}

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
  /**
   * 开启后会在 dev 阶段将当前 doctree JSON 写入到 process.cwd() 目录，
   * 便于排查目录树与侧边栏生成结果。
   */
  debug?: boolean
  nav?: TocSidebarNavOptions
}

export interface MarkdownMeta {
  frontmatter: Frontmatter
  h1?: string
}

export interface DirNode {
  directories: Set<string>
  files: Set<string>
}

export interface TocSidebarRawTreeNode {
  path: string
  directoryItems: TocSidebarDirectoryEntry[]
  fileItems: TocSidebarFileEntry[]
}

export type TocSidebarRawTree = Record<string, TocSidebarRawTreeNode>

export interface TocSidebarFileEntry {
  name: string
  path: string
  link: string
  displayText: string
  frontmatter: Frontmatter
  h1: string | null
}

export interface TocSidebarDirectoryEntry {
  name: string
  path: string
  link: string | null
  displayText: string
  indexFile: TocSidebarFileEntry | null
}

export interface TocSidebarDoctreePayload {
  tree: TocSidebarRawTree
}

export type ResolvedTocSidebarOptions = Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots' | 'nav'>> & {
  nav: Required<TocSidebarNavOptions>
}

export interface TocSidebarPlugin {
  name: 'vitepress-plugin-autosidebar-toc'
  options: ResolvedTocSidebarOptions
  buildSidebar: () => DefaultTheme.SidebarMulti
}

export interface AutoTocResolverOptions {
  componentName?: string
  from?: string
}

export type TocSidebarResolverOptions = AutoTocResolverOptions

export interface ViteUserConfigLike {
  root?: string
  publicDir?: string | false
  define?: Record<string, string>
  vitepress?: {
    site?: {
      themeConfig?: ThemeConfigLike
      locales?: Record<string, { themeConfig?: ThemeConfigLike }>
    }
  }
}


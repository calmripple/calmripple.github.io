import type { DefaultTheme } from 'vitepress'

export interface TocSidebarBuildOptions {
  dir: string
  roots?: string[]
  includeGlobs?: string[]
  excludeGlobs?: string[]
  showMarkdownLinks?: boolean
  includeDotFiles?: boolean
  collapsed?: boolean
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

export interface TocSidebarPageGitInfo {
  lastUpdated?: number
}

export interface TocSidebarPageMeta {
  relativePath: string
  filePath: string
  title: string
  frontmatter: Record<string, any>
  git: TocSidebarPageGitInfo
}

export type TocSidebarPagesMeta = Record<string, TocSidebarPageMeta>

export interface TocSidebarDoctreePayload {
  tree: TocSidebarRawTree
  pages?: TocSidebarPagesMeta
}

export interface VitePressTransformedPageData {
  relativePath: string
  filePath: string
  title: string
  frontmatter: Record<string, any>
  lastUpdated?: number
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


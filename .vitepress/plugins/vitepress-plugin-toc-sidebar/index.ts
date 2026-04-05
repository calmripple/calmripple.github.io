import { resolve } from 'node:path'
import type { DefaultTheme } from 'vitepress'
import type { Plugin } from 'vite'
import Components from 'unplugin-vue-components/vite'
import {
  buildDirectoryItems,
  buildFileTree,
  normalizeRootPath,
  scanMarkdownFiles,
  sortEntries,
} from './helpers'
import type {
  DirNode,
  MarkdownMeta,
  ResolvedTocSidebarOptions,
  TocSidebarBuildOptions,
  TocSidebarLifecycleHooks,
  TocSidebarPlugin,
  ViteUserConfigLike,
} from './types'

export type {
  TocSidebarBuildOptions,
  TocSidebarLifecycleHooks,
  TocSidebarPlugin,
} from './types'

const DEFAULT_OPTIONS: ResolvedTocSidebarOptions = {
  includeGlobs: ['**/*.md'],
  excludeGlobs: ['**/node_modules/**', '**/.git/**', '**/.vitepress/**'],
  sidebarFilter: {
    showMarkdownLinks: true,
    hideDirsWithoutMarkdown: false,
    includeRootIndex: false,
    includeFolderIndex: false,
    excludeFilesByFrontmatterFieldName: 'sidebarHide',
  },
  autoTocFilter: {
    includeRootIndex: true,
    includeFolderIndex: true,
    excludeFilesByFrontmatterFieldName: 'sidebarHide',
  },
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
    collapsed: true,
  },
}

interface BuildAllTreeNodeResult {
  tree: Map<string, DirNode>
  rawTree: Map<string, DirNode>
}

function buildAllTreeNode(
  baseDir: string,
  options: ResolvedTocSidebarOptions,
  hooks: TocSidebarLifecycleHooks,
): BuildAllTreeNodeResult {
  const scannedFiles = scanMarkdownFiles(baseDir, options)
  hooks.onFilesScanned?.(scannedFiles)

  const visibleFiles = scannedFiles
  hooks.onFilesFiltered?.(visibleFiles)

  const tree = buildFileTree(visibleFiles)
  const rawTree = buildFileTree(scannedFiles)
  hooks.onTreeBuilt?.(tree)

  return {
    tree,
    rawTree,
  }
}

function buildAllToc(
  baseDir: string,
  userOptions: TocSidebarBuildOptions,
  options: ResolvedTocSidebarOptions,
  cache: Map<string, MarkdownMeta>,
  tree: Map<string, DirNode>,
  rawTree: Map<string, DirNode>,
): DefaultTheme.SidebarMulti {
  const roots = userOptions.roots && userOptions.roots.length > 0
    ? userOptions.roots.map(normalizeRootPath)
    : sortEntries([...(tree.get('')?.directories ?? [])], options.sortByName)

  const sidebar: DefaultTheme.SidebarMulti = {}
  for (const root of roots) {
    if (!root || !tree.has(root)) {
      continue
    }

    const rootPath = `/${root}/`
    sidebar[rootPath] = buildDirectoryItems(baseDir, root, 0, options, cache, tree, rawTree)
  }

  return sidebar
}

function buildsidebar(
  baseDir: string,
  userOptions: TocSidebarBuildOptions,
  options: ResolvedTocSidebarOptions,
  hooks: TocSidebarLifecycleHooks,
): DefaultTheme.SidebarMulti {
  const cache = new Map<string, MarkdownMeta>()
  const { tree, rawTree } = buildAllTreeNode(baseDir, options, hooks)
  const sidebar = buildAllToc(baseDir, userOptions, options, cache, tree, rawTree)
  hooks.onSidebarBuilt?.(sidebar)
  return sidebar
}


function createTocSidebarPlugin(
  userOptions: TocSidebarBuildOptions,
  hooks: TocSidebarLifecycleHooks = {},
): TocSidebarPlugin {
  const resolvedSidebarFilter = {
    ...DEFAULT_OPTIONS.sidebarFilter,
    ...(userOptions.sidebarFilter ?? {}),
    showMarkdownLinks: userOptions.sidebarFilter?.showMarkdownLinks ?? userOptions.showMarkdownLinks ?? DEFAULT_OPTIONS.sidebarFilter.showMarkdownLinks,
    hideDirsWithoutMarkdown: userOptions.sidebarFilter?.hideDirsWithoutMarkdown ?? userOptions.hideDirsWithoutMarkdown ?? DEFAULT_OPTIONS.sidebarFilter.hideDirsWithoutMarkdown,
    includeRootIndex: userOptions.sidebarFilter?.includeRootIndex ?? userOptions.includeRootIndex ?? DEFAULT_OPTIONS.sidebarFilter.includeRootIndex,
    includeFolderIndex: userOptions.sidebarFilter?.includeFolderIndex ?? userOptions.includeFolderIndex ?? DEFAULT_OPTIONS.sidebarFilter.includeFolderIndex,
    excludeFilesByFrontmatterFieldName:
      userOptions.sidebarFilter?.excludeFilesByFrontmatterFieldName
      ?? userOptions.excludeFilesByFrontmatterFieldName
      ?? DEFAULT_OPTIONS.sidebarFilter.excludeFilesByFrontmatterFieldName,
  }

  const resolvedAutoTocFilter = {
    ...DEFAULT_OPTIONS.autoTocFilter,
    ...(userOptions.autoTocFilter ?? {}),
    includeRootIndex: userOptions.autoTocFilter?.includeRootIndex ?? DEFAULT_OPTIONS.autoTocFilter.includeRootIndex,
    includeFolderIndex: userOptions.autoTocFilter?.includeFolderIndex ?? DEFAULT_OPTIONS.autoTocFilter.includeFolderIndex,
    excludeFilesByFrontmatterFieldName:
      userOptions.autoTocFilter?.excludeFilesByFrontmatterFieldName
      ?? userOptions.excludeFilesByFrontmatterFieldName
      ?? DEFAULT_OPTIONS.autoTocFilter.excludeFilesByFrontmatterFieldName,
  }

  const options = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    sidebarFilter: resolvedSidebarFilter,
    autoTocFilter: resolvedAutoTocFilter,
    toc: {
      ...DEFAULT_OPTIONS.toc,
      ...(userOptions.toc ?? {}),
    },
  }

  hooks.onOptionsResolved?.(options)

  const buildSidebar = (): DefaultTheme.SidebarMulti => buildsidebar(resolve(options.dir), userOptions, options, hooks)

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

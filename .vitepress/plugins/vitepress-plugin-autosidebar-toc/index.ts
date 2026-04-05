import { resolve } from 'node:path'
import type { DefaultTheme } from 'vitepress'
import type { Plugin } from 'vite'
import {
  buildDirectoryItems,
  buildFileTree,
  normalizeRootPath,
  scanMarkdownFiles,
} from './helpers'
import type {
  BuildAllTreeNodeResult,
  DirNode,
  MarkdownMeta,
  ResolvedTocSidebarOptions,
  TocSidebarBuildOptions,
  TocSidebarLifecycleHooks,
  TocSidebarRawTree,
  ViteUserConfigLike,
} from './types'
import { TocSidebarResolver } from './client/resolvers'

export type {
  TocSidebarBuildOptions,
  TocSidebarLifecycleHooks,
} from './types'

export {
  TocSidebarResolver,
}

const DEFAULT_OPTIONS: ResolvedTocSidebarOptions = {
  includeGlobs: ['**/*.md'],
  excludeGlobs: ['**/node_modules/**', '**/.git/**', '**/.vitepress/**'],
  showMarkdownLinks: true,
  includeDotFiles: false,
  collapsed: true,
}

function createDoctreeAssetName(): string {
  const runToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return `doctree.${runToken}.json`
}

const DOCTREE_ASSET_NAME = createDoctreeAssetName()
const DOCTREE_ROUTE_PATH = `/${DOCTREE_ASSET_NAME}`
const DOCTREE_DEFINE_KEY = '__TOC_SIDEBAR_DOCTREE_PATH__'

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

function serializeRawTree(rawTree: Map<string, DirNode>): TocSidebarRawTree {
  const payload: TocSidebarRawTree = {}

  for (const [dirPath, node] of rawTree.entries()) {
    const key = dirPath || '/'
    payload[key] = {
      directories: [...node.directories],
      files: [...node.files],
    }
  }

  return payload
}

export function createTocSidebarVitePlugin(
  userOptions: TocSidebarBuildOptions,
  hooks: TocSidebarLifecycleHooks = {},
): Plugin {
  const options: TocSidebarBuildOptions & ResolvedTocSidebarOptions = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    showMarkdownLinks: userOptions.showMarkdownLinks ?? DEFAULT_OPTIONS.showMarkdownLinks,
  }

  hooks.onOptionsResolved?.(options)

  const baseDir = resolve(options.dir)
  const cache = new Map<string, MarkdownMeta>()
  const { tree, rawTree } = buildAllTreeNode(baseDir, options, hooks)
  const rawTreePayload = serializeRawTree(rawTree)
  const rawTreeJson = `${JSON.stringify(rawTreePayload, null, 2)}\n`
  const roots = options.roots && options.roots.length > 0
    ? options.roots.map(normalizeRootPath)
    : [...(tree.get('')?.directories ?? [])]

  const sidebar: DefaultTheme.SidebarMulti = {}
  for (const root of roots) {
    if (!root || !tree.has(root)) {
      continue
    }

    const rootPath = `/${root}/`
    sidebar[rootPath] = buildDirectoryItems(baseDir, root, 0, options, cache, tree)
  }

  hooks.onSidebarBuilt?.(sidebar)

  return {
    name: 'vitepress-plugin-autosidebar-toc:inject',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split('?')[0] ?? ''
        if (requestPath !== DOCTREE_ROUTE_PATH) {
          next()
          return
        }

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(rawTreeJson)
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: DOCTREE_ASSET_NAME,
        source: rawTreeJson,
      })
    },
    config(config) {
      const normalizedConfig = config as ViteUserConfigLike & { define?: Record<string, string> }
      normalizedConfig.define = {
        ...(normalizedConfig.define ?? {}),
        [DOCTREE_DEFINE_KEY]: JSON.stringify(DOCTREE_ROUTE_PATH),
      }

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

      return config
    },
  }
}

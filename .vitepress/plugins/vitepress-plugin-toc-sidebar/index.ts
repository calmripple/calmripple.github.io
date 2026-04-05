import { mkdirSync, writeFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import type { DefaultTheme } from 'vitepress'
import type { Plugin } from 'vite'
import {
  buildDirectoryItems,
  buildFileTree,
  normalizeRootPath,
  scanMarkdownFiles,
} from './helpers'
import type {
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

interface BuildAllTreeNodeResult {
  tree: Map<string, DirNode>
  rawTree: Map<string, DirNode>
}

function resolvePublicDir(config: ViteUserConfigLike): string {
  const rootDir = config.root ? resolve(config.root) : process.cwd()
  const configuredPublicDir = config.publicDir

  if (!configuredPublicDir) {
    return resolve(rootDir, 'public')
  }

  if (isAbsolute(configuredPublicDir)) {
    return configuredPublicDir
  }

  return resolve(rootDir, configuredPublicDir)
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

function writeRawTreeToPublic(rawTreePayload: TocSidebarRawTree, publicDir: string): void {
  mkdirSync(publicDir, { recursive: true })
  writeFileSync(
    resolve(publicDir, 'doctree.json'),
    `${JSON.stringify(rawTreePayload, null, 2)}\n`,
    'utf-8',
  )
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
    name: 'vitepress-plugin-toc-sidebar:inject',
    config(config) {
      const normalizedConfig = config as ViteUserConfigLike
      const publicDir = resolvePublicDir(normalizedConfig)
      writeRawTreeToPublic(rawTreePayload, publicDir)

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

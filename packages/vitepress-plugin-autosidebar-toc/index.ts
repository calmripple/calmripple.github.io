import { resolve } from 'node:path'
import type { DefaultTheme } from 'vitepress'
import type { ConfigEnv, Plugin } from 'vite'
import {
  buildDirectoryItems,
  buildFileTree,
  extractVitePressTransformedPageData,
  normalizeRootPath,
  scanMarkdownFiles,
  scanMarkdownFilesByDirectory,
} from './helpers.ts'
import type {
  BuildAllTreeNodeResult,
  DirNode,
  MarkdownMeta,
  ResolvedTocSidebarOptions,
  TocSidebarBuildOptions,
  TocSidebarDoctreePayload,
  TocSidebarLifecycleHooks,
  TocSidebarPageMeta,
  TocSidebarPagesMeta,
  TocSidebarRawTree,
  ViteUserConfigLike,
} from './types'
import { TocSidebarResolver } from './client/resolvers.ts'

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
  scannedFiles: string[],
  hooks: TocSidebarLifecycleHooks,
): BuildAllTreeNodeResult {
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

function normalizeRelativeMarkdownPath(relativePath: string): string {
  return relativePath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

function serializeDoctreePayload(
  rawTree: Map<string, DirNode>,
  pages?: TocSidebarPagesMeta,
): TocSidebarDoctreePayload {
  const payload: TocSidebarDoctreePayload = {
    tree: serializeRawTree(rawTree),
  }

  if (pages && Object.keys(pages).length > 0) {
    payload.pages = pages
  }

  return payload
}

function serializeDoctreeJson(
  rawTree: Map<string, DirNode>,
  pages?: TocSidebarPagesMeta,
): string {
  return `${JSON.stringify(serializeDoctreePayload(rawTree, pages), null, 2)}\n`
}

function collectBuildPagesMeta(
  scannedFiles: string[],
  transformedPageMeta: Map<string, TocSidebarPageMeta>,
): TocSidebarPagesMeta | undefined {
  const pages: TocSidebarPagesMeta = {}

  for (const relativePath of scannedFiles) {
    const item = transformedPageMeta.get(relativePath)
    if (!item) {
      continue
    }
    pages[relativePath] = item
  }

  return Object.keys(pages).length > 0 ? pages : undefined
}

function sortScannedFiles(files: string[]): string[] {
  return [...new Set(files)].sort((left, right) => left.localeCompare(right))
}

function isInsideBaseDir(filePath: string, baseDir: string): boolean {
  const normalizedFile = resolve(filePath).replace(/\\/g, '/').toLowerCase()
  const normalizedBase = resolve(baseDir).replace(/\\/g, '/').toLowerCase()
  return normalizedFile === normalizedBase || normalizedFile.startsWith(`${normalizedBase}/`)
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
  const transformedPageMeta = new Map<string, TocSidebarPageMeta>()
  let isBuildCommand = false
  let scannedFiles: string[] = []
  let scannedFilesSet = new Set<string>()
  let tree = new Map<string, DirNode>()
  let rawTree = new Map<string, DirNode>()
  let sidebar: DefaultTheme.SidebarMulti = {}
  let devDoctreeJson = serializeDoctreeJson(rawTree)

  function rebuildState(useDirectoryScanner: boolean): void {
    scannedFiles = useDirectoryScanner
      ? scanMarkdownFilesByDirectory(baseDir, options)
      : scanMarkdownFiles(baseDir, options)

    hooks.onFilesScanned?.(scannedFiles)

    scannedFilesSet = new Set(scannedFiles)
    cache.clear()
    transformedPageMeta.clear()

    const built = buildAllTreeNode(scannedFiles, hooks)
    tree = built.tree
    rawTree = built.rawTree

    const roots = options.roots && options.roots.length > 0
      ? options.roots.map(normalizeRootPath)
      : [...(tree.get('')?.directories ?? [])]

    const nextSidebar: DefaultTheme.SidebarMulti = {}
    for (const root of roots) {
      if (!root || !tree.has(root)) {
        continue
      }

      const rootPath = `/${root}/`
      nextSidebar[rootPath] = buildDirectoryItems(baseDir, root, 0, options, cache, tree)
    }

    sidebar = nextSidebar
    hooks.onSidebarBuilt?.(sidebar)
    devDoctreeJson = serializeDoctreeJson(rawTree)
  }

  return {
    name: 'vitepress-plugin-autosidebar-toc:inject',
    enforce: 'post',
    buildStart() {
      if (!isBuildCommand) {
        return
      }
      transformedPageMeta.clear()
    },
    transform(code, id) {
      if (!isBuildCommand) {
        return null
      }

      const cleanId = id.split('?')[0]
      if (!cleanId.endsWith('.md')) {
        return null
      }

      const pageData = extractVitePressTransformedPageData(code)
      if (!pageData) {
        return null
      }

      const relativePath = normalizeRelativeMarkdownPath(pageData.relativePath || '')
      if (!relativePath) {
        return null
      }

      if (!scannedFilesSet.has(relativePath)) {
        scannedFilesSet.add(relativePath)
        scannedFiles = sortScannedFiles([...scannedFiles, relativePath])
      }

      transformedPageMeta.set(relativePath, {
        relativePath,
        filePath: normalizeRelativeMarkdownPath(pageData.filePath || relativePath),
        title: pageData.title,
        frontmatter: pageData.frontmatter,
        git: {
          ...(typeof pageData.lastUpdated === 'number' ? { lastUpdated: pageData.lastUpdated } : {}),
        },
      })

      return null
    },
    configureServer(server) {
      const refreshFromMarkdownFile = (filePath: string) => {
        if (!isInsideBaseDir(filePath, baseDir)) {
          return
        }

        const normalizedFile = filePath.replace(/\\/g, '/').toLowerCase()
        if (!normalizedFile.endsWith('.md')) {
          return
        }

        rebuildState(true)
      }

      const refreshFromDirectory = (directoryPath: string) => {
        if (!isInsideBaseDir(directoryPath, baseDir)) {
          return
        }
        rebuildState(true)
      }

      server.watcher.on('add', refreshFromMarkdownFile)
      server.watcher.on('unlink', refreshFromMarkdownFile)
      server.watcher.on('change', refreshFromMarkdownFile)
      server.watcher.on('addDir', refreshFromDirectory)
      server.watcher.on('unlinkDir', refreshFromDirectory)

      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split('?')[0] ?? ''
        if (requestPath !== DOCTREE_ROUTE_PATH) {
          next()
          return
        }

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(devDoctreeJson)
      })
    },
    generateBundle() {
      if (isBuildCommand && scannedFiles.length > 0) {
        const built = buildAllTreeNode(scannedFiles, hooks)
        tree = built.tree
        rawTree = built.rawTree
      }

      const pages = isBuildCommand
        ? collectBuildPagesMeta(scannedFiles, transformedPageMeta)
        : undefined

      this.emitFile({
        type: 'asset',
        fileName: DOCTREE_ASSET_NAME,
        source: serializeDoctreeJson(rawTree, pages),
      })
    },
    config(config, env: ConfigEnv) {
      isBuildCommand = env.command === 'build'
      rebuildState(true)

      const normalizedConfig = config as ViteUserConfigLike & { define?: Record<string, string> }
      normalizedConfig.define = {
        ...(normalizedConfig.define ?? {}),
        [DOCTREE_DEFINE_KEY]: JSON.stringify(DOCTREE_ROUTE_PATH),
      }

      const site = (config as ViteUserConfigLike)?.vitepress?.site

      if (!site) {
        return config
      }

      const shouldInjectSidebar = !isBuildCommand || Object.keys(sidebar).length > 0

      if (shouldInjectSidebar) {
        site.themeConfig = {
          ...(site.themeConfig ?? {}),
          sidebar,
        }
      }

      if (site.locales && shouldInjectSidebar) {
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

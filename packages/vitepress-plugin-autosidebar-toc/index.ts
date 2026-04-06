import { resolve } from 'node:path'
import type { DefaultTheme } from 'vitepress'
import type { ConfigEnv, Plugin } from 'vite'
import {
  buildDirectoryItems,
  buildFileTree,
  normalizeRootPath,
  scanMarkdownFiles,
  scanMarkdownFilesByDirectory,
  toVpDirectoryLink,
  toVpPageLink,
} from './helpers.ts'
import type {
  BuildAllTreeNodeResult,
  DirNode,
  MarkdownMeta,
  TocSidebarNavOptions,
  ResolvedTocSidebarOptions,
  TocSidebarBuildOptions,
  TocSidebarDoctreePayload,
  TocSidebarLifecycleHooks,
  TocSidebarRawTree,
  ViteUserConfigLike,
} from './types'
import { createAutoTocComponentResolver } from './client/resolvers.ts'

export type {
  AutoTocResolverOptions,
  TocSidebarBuildOptions,
  TocSidebarLifecycleHooks,
} from './types'

export {
  createAutoTocComponentResolver,
}

const DEFAULT_OPTIONS: ResolvedTocSidebarOptions = {
  includeGlobs: ['**/*.md'],
  excludeGlobs: ['**/node_modules/**', '**/.git/**', '**/.vitepress/**'],
  showMarkdownLinks: true,
  includeDotFiles: false,
  collapsed: true,
  nav: {
    enabled: false,
    level: 1,
    mode: 'replace',
  },
}

function normalizeNavOptions(nav?: TocSidebarNavOptions): Required<TocSidebarNavOptions> {
  const level = typeof nav?.level === 'number' && Number.isFinite(nav.level)
    ? Math.max(1, Math.floor(nav.level))
    : 1

  return {
    enabled: nav?.enabled === true,
    level,
    mode: nav?.mode === 'append' ? 'append' : 'replace',
  }
}

function sortUniqueStrings(values: Iterable<string>) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function resolveNavDirectoryLink(
  directoryPath: string,
  tree: Map<string, DirNode>,
): string | undefined {
  const node = tree.get(directoryPath)
  if (!node) {
    return undefined
  }

  if (node.files.has('index.md')) {
    return toVpDirectoryLink(`${directoryPath}/index.md`)
  }

  const directMarkdownFiles = [...node.files]
    .filter(fileName => fileName.endsWith('.md') && fileName !== 'index.md')
    .sort((left, right) => left.localeCompare(right))

  if (directMarkdownFiles.length > 0) {
    return toVpPageLink(`${directoryPath}/${directMarkdownFiles[0]}`)
  }

  const children = [...node.directories].sort((left, right) => left.localeCompare(right))
  for (const childName of children) {
    const childPath = `${directoryPath}/${childName}`
    const nestedLink = resolveNavDirectoryLink(childPath, tree)
    if (nestedLink) {
      return nestedLink
    }
  }

  return undefined
}

function collectNavDirectoryPaths(
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

  return sortUniqueStrings(candidates)
}

function buildGeneratedNav(
  scannedFiles: string[],
  tree: Map<string, DirNode>,
  roots: string[],
  navLevel: number,
): { nav: DefaultTheme.NavItemWithLink[]; directories: string[] } {
  const directoryPaths = collectNavDirectoryPaths(scannedFiles, roots, navLevel)
  const nav: DefaultTheme.NavItemWithLink[] = []

  for (const directoryPath of directoryPaths) {
    if (!tree.has(directoryPath)) {
      continue
    }

    const link = resolveNavDirectoryLink(directoryPath, tree)
    if (!link) {
      continue
    }

    const text = directoryPath.split('/').filter(Boolean).at(-1) ?? directoryPath
    nav.push({
      text,
      link,
    })
  }

  return {
    nav,
    directories: directoryPaths.filter(directoryPath => tree.has(directoryPath)),
  }
}

function mergeNavByMode(
  existingNav: unknown,
  generatedNav: DefaultTheme.NavItemWithLink[],
  mode: Required<TocSidebarNavOptions>['mode'],
) {
  if (mode === 'replace' || !Array.isArray(existingNav)) {
    return generatedNav
  }

  const merged = [...existingNav]
  const existingLinks = new Set(
    existingNav
      .filter(item => item && typeof item === 'object' && typeof (item as { link?: unknown }).link === 'string')
      .map(item => (item as { link: string }).link),
  )

  for (const navItem of generatedNav) {
    if (typeof navItem.link !== 'string') {
      continue
    }

    if (existingLinks.has(navItem.link)) {
      continue
    }
    merged.push(navItem)
    existingLinks.add(navItem.link)
  }

  return merged
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

function serializeDoctreePayload(
  rawTree: Map<string, DirNode>,
): TocSidebarDoctreePayload {
  return {
    tree: serializeRawTree(rawTree),
  }
}

function serializeDoctreeJson(
  rawTree: Map<string, DirNode>,
): string {
  return `${JSON.stringify(serializeDoctreePayload(rawTree), null, 2)}\n`
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
  const normalizedNav = normalizeNavOptions(userOptions.nav)
  const options: TocSidebarBuildOptions & ResolvedTocSidebarOptions = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    showMarkdownLinks: userOptions.showMarkdownLinks ?? DEFAULT_OPTIONS.showMarkdownLinks,
    nav: normalizedNav,
  }

  hooks.onOptionsResolved?.(options)

  const baseDir = resolve(options.dir)
  const cache = new Map<string, MarkdownMeta>()
  let isBuildCommand = false
  let scannedFiles: string[] = []
  let tree = new Map<string, DirNode>()
  let rawTree = new Map<string, DirNode>()
  let nav: DefaultTheme.NavItemWithLink[] = []
  let sidebar: DefaultTheme.SidebarMulti = {}
  let devDoctreeJson = serializeDoctreeJson(rawTree)

  function rebuildState(useDirectoryScanner: boolean): void {
    scannedFiles = useDirectoryScanner
      ? scanMarkdownFilesByDirectory(baseDir, options)
      : scanMarkdownFiles(baseDir, options)

    hooks.onFilesScanned?.(scannedFiles)

    cache.clear()

    const built = buildAllTreeNode(scannedFiles, hooks)
    tree = built.tree
    rawTree = built.rawTree

    const roots = options.roots && options.roots.length > 0
      ? options.roots.map(normalizeRootPath)
      : [...(tree.get('')?.directories ?? [])]

    const generatedNav = options.nav.enabled
      ? buildGeneratedNav(scannedFiles, tree, roots, options.nav.level)
      : { nav: [], directories: [] }

    nav = generatedNav.nav

    const sidebarRoots = options.nav.enabled && generatedNav.directories.length > 0
      ? generatedNav.directories
      : roots

    const nextSidebar: DefaultTheme.SidebarMulti = {}
    for (const root of sidebarRoots) {
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

      this.emitFile({
        type: 'asset',
        fileName: DOCTREE_ASSET_NAME,
        source: serializeDoctreeJson(rawTree),
      })
    },
    configResolved(config) {

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
          ...(options.nav.enabled && nav.length > 0
            ? {
              nav: mergeNavByMode(site.themeConfig?.nav, nav, options.nav.mode),
            }
            : {}),
        }
      }

      if (site.locales && shouldInjectSidebar) {
        for (const localeKey of Object.keys(site.locales)) {
          const locale = site.locales[localeKey]
          locale.themeConfig = {
            ...(locale.themeConfig ?? {}),
            sidebar,
            ...(options.nav.enabled && nav.length > 0
              ? {
                nav: mergeNavByMode(locale.themeConfig?.nav, nav, options.nav.mode),
              }
              : {}),
          }
        }
      }

      return config
    },
  }
}

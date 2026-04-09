import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { toNormalizedAbsolutePath } from '@knewbeing/utils'
import type { DefaultTheme } from 'vitepress'
import type { ConfigEnv, Plugin } from 'vite'
import type {
  DirNode,
  MarkdownMeta,
  ResolvedTocSidebarOptions,
  TocSidebarBuildOptions,
  ViteUserConfigLike,
} from './types'
import { createAutoTocComponentResolver } from './client/resolvers'
import { invalidateMarkdownMetaCache } from './markdown'
import { scanMarkdownFilesWithDirectoryWalker, buildDirectoryTreeFromFiles } from './scanner'
import { buildSidebarItemsFromDirectory, normalizeSidebarRootPath, normalizeAutoNavOptions, DEFAULT_OPTIONS } from './sidebar'
import { rebuildAutoNavState, mergeNavItemsByMode } from './nav'
import { createDoctreePayload, stringifyDoctreePayload } from './doctree'

// ── Re-exports ──────────────────────────────────────────────────────────

export type {
  AutoTocResolverOptions,
  DirNode,
  Frontmatter,
  MarkdownMeta,
  ResolvedTocSidebarOptions,
  ThemeConfigLike,
  TocSidebarBuildOptions,
  TocSidebarDirectoryEntry,
  TocSidebarDoctreePayload,
  TocSidebarFileEntry,
  TocSidebarNavOptions,
  TocSidebarPlugin,
  TocSidebarRawTree,
  TocSidebarRawTreeNode,
  TocSidebarResolverOptions,
  ViteUserConfigLike,
} from './types'

export {
  createAutoTocComponentResolver,
}

// ── 虚拟模块 ────────────────────────────────────────────────────────────

const VIRTUAL_MODULE_ID = 'virtual:@knewbeing/toc-sidebar-doctree'
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

// ── 常量 ────────────────────────────────────────────────────────────────

const DOCTREE_DEBUG_FILE_NAME = 'toc-sidebar-doctree.debug.json'
const RECOMPUTE_DEBOUNCE_MS = 30

// ── 内部工具 ────────────────────────────────────────────────────────────

interface ContentSourceSnapshot {
  markdownFiles: string[]
  directoryTree: Map<string, DirNode>
}

async function buildContentSourceSnapshot(
  baseDir: string,
  options: ResolvedTocSidebarOptions,
): Promise<ContentSourceSnapshot> {
  const markdownFiles = await scanMarkdownFilesWithDirectoryWalker(baseDir, options)
  const directoryTree = buildDirectoryTreeFromFiles(markdownFiles)
  return { markdownFiles, directoryTree }
}

function isPathInsideBaseDir(filePath: string, normalizedBaseDir: string): boolean {
  const normalizedFile = toNormalizedAbsolutePath(filePath)
  return normalizedFile === normalizedBaseDir || normalizedFile.startsWith(`${normalizedBaseDir}/`)
}

// ── 插件主入口 ──────────────────────────────────────────────────────────

/**
 * 创建用于 VitePress 的自动侧边栏与导航生成插件。
 *
 * 该插件会扫描 Markdown 文档目录，构建目录树、sidebar、可选 nav，
 * 并在开发阶段支持增量更新与调试 doctree 输出。
 *
 * @param userOptions 用户传入的插件配置。
 * @returns 标准 Vite 插件实例。
 */
export function createTocSidebarVitePlugin(
  userOptions: TocSidebarBuildOptions,
): Plugin {
  const normalizedNav = normalizeAutoNavOptions(userOptions.nav)
  const options: TocSidebarBuildOptions & ResolvedTocSidebarOptions = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    showMarkdownLinks: userOptions.showMarkdownLinks ?? DEFAULT_OPTIONS.showMarkdownLinks,
    nav: normalizedNav,
  }

  const baseDir = resolve(options.dir)
  const normalizedBaseDir = toNormalizedAbsolutePath(baseDir)
  const cache = new Map<string, MarkdownMeta>()
  let isBuildCommand = false
  let sourceMarkdownFiles: string[] = []
  let sourceTree = new Map<string, DirNode>()
  let nav: DefaultTheme.NavItem[] = []
  let sidebar: DefaultTheme.SidebarMulti = {}
  const debugDoctreePath = resolve(process.cwd(), DOCTREE_DEBUG_FILE_NAME)
  const changedMarkdownAbsolutePaths = new Set<string>()
  let shouldResetMetaCache = false
  let pendingRecomputeTimer: ReturnType<typeof setTimeout> | undefined

  async function writeDebugDoctreeSnapshot(content: string): Promise<void> {
    if (isBuildCommand || !options.debug) {
      return
    }

    try {
      await writeFile(debugDoctreePath, content, 'utf-8')
    }
    catch (error) {
      console.warn('[vitepress-plugin-autosidebar-toc] Failed to write debug doctree file:', error)
    }
  }

  async function recomputeSidebarState(): Promise<void> {
    const snapshot = await buildContentSourceSnapshot(baseDir, options)
    sourceMarkdownFiles = snapshot.markdownFiles
    sourceTree = snapshot.directoryTree

    const roots = options.roots && options.roots.length > 0
      ? options.roots.map(normalizeSidebarRootPath)
      : [...(sourceTree.get('')?.directories ?? [])]

    const generatedNav = options.nav.enabled
      ? await rebuildAutoNavState(sourceMarkdownFiles, sourceTree, roots, options.nav.level, baseDir, cache)
      : { nav: [], directories: [] }

    nav = generatedNav.nav

    const sidebarRoots = options.nav.enabled && generatedNav.directories.length > 0
      ? generatedNav.directories
      : roots

    const nextSidebar: DefaultTheme.SidebarMulti = {}
    for (const root of sidebarRoots) {
      if (!root || !sourceTree.has(root)) {
        continue
      }

      const rootPath = `/${root}/`
      nextSidebar[rootPath] = await buildSidebarItemsFromDirectory(baseDir, root, 0, options, cache, sourceTree)
    }

    sidebar = nextSidebar
    await writeDebugDoctreeSnapshot(await stringifyDoctreePayload(sourceTree, baseDir, cache))
  }

  function queueSidebarRecompute(): void {
    if (pendingRecomputeTimer) {
      return
    }

    pendingRecomputeTimer = setTimeout(async () => {
      pendingRecomputeTimer = undefined

      if (shouldResetMetaCache) {
        cache.clear()
      }
      else {
        for (const changedFilePath of changedMarkdownAbsolutePaths) {
          invalidateMarkdownMetaCache(changedFilePath, cache)
        }
      }

      changedMarkdownAbsolutePaths.clear()
      shouldResetMetaCache = false
      await recomputeSidebarState()
    }, RECOMPUTE_DEBOUNCE_MS)
  }

  return {
    name: 'vitepress-plugin-autosidebar-toc:inject',
    enforce: 'post',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) {
        return null
      }

      const payload = await createDoctreePayload(sourceTree, baseDir, cache)
      return `export default ${JSON.stringify(payload)}`
    },
    configureServer(server) {
      const refreshForMarkdownFileChange = (filePath: string) => {
        if (!isPathInsideBaseDir(filePath, normalizedBaseDir)) {
          return
        }

        const normalizedFile = toNormalizedAbsolutePath(filePath)
        if (!normalizedFile.endsWith('.md')) {
          return
        }

        changedMarkdownAbsolutePaths.add(normalizedFile)
        queueSidebarRecompute()
      }

      const refreshForDirectoryChange = (directoryPath: string) => {
        if (!isPathInsideBaseDir(directoryPath, normalizedBaseDir)) {
          return
        }

        shouldResetMetaCache = true
        queueSidebarRecompute()
      }

      server.watcher.on('add', refreshForMarkdownFileChange)
      server.watcher.on('unlink', refreshForMarkdownFileChange)
      server.watcher.on('change', refreshForMarkdownFileChange)
      server.watcher.on('addDir', refreshForDirectoryChange)
      server.watcher.on('unlinkDir', refreshForDirectoryChange)
    },
    async config(config, env: ConfigEnv) {
      isBuildCommand = env.command === 'build'
      await recomputeSidebarState()

      const normalizedConfig: ViteUserConfigLike = config
      const site = normalizedConfig.vitepress?.site

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
              nav: mergeNavItemsByMode(site.themeConfig?.nav, nav, options.nav.mode),
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
                nav: mergeNavItemsByMode(locale.themeConfig?.nav, nav, options.nav.mode),
              }
              : {}),
          }
        }
      }

      return config
    },
  }
}

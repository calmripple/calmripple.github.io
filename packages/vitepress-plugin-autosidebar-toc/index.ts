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
import { createAutoTocComponentResolver, createSidebarArticleListComponentResolver } from './client/resolvers'
import { invalidateMarkdownMetaCache } from './markdown'
import { scanMarkdownFilesWithDirectoryWalker, buildDirectoryTreeFromFiles } from './scanner'
import { buildFlatSidebarForAllDirectories, normalizeSidebarRootPath, normalizeAutoNavOptions, DEFAULT_OPTIONS } from './sidebar'
import { buildNavFromBuilder, insertNavItems, orderNavItems } from './nav'
import { createDoctreePayload, stringifyDoctreePayload, serializeSingleDirectoryNode } from './doctree'

// ── Re-exports ──────────────────────────────────────────────────────────

export type {
  AutoNavOption,
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
  createSidebarArticleListComponentResolver,
}

// ── 虚拟模块 ────────────────────────────────────────────────────────────

const VIRTUAL_MODULE_ID = 'virtual:@knewbeing/toc-sidebar-doctree'
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`
const VIRTUAL_DIR_PREFIX = `${VIRTUAL_MODULE_ID}/dir/`
const RESOLVED_DIR_PREFIX = `\0${VIRTUAL_DIR_PREFIX}`

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

    const hasNavBuilder = options.nav.navBuilder.length > 0

    let generatedDirectories: string[] = []
    if (hasNavBuilder) {
      // 使用 navBuilder 构建 nav
      const result = await buildNavFromBuilder(
        options.nav.navBuilder,
        sourceMarkdownFiles,
        sourceTree,
        baseDir,
        cache,
      )
      nav = orderNavItems(result.nav, options.nav.order)
      generatedDirectories = result.directories
    } else {
      nav = []
      generatedDirectories = []
    }

    const sidebarRoots = generatedDirectories.length > 0
      ? generatedDirectories
      : roots

    // 扁平化 sidebar：每个目录只列出当前目录下的文章，不显示子目录名
    const nextSidebar = await buildFlatSidebarForAllDirectories(baseDir, sidebarRoots, cache, sourceTree)

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
      if (id.startsWith(VIRTUAL_DIR_PREFIX)) {
        return `\0${id}`
      }
    },
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const dirKeys = [...sourceTree.keys()].map(k => k || '/')
        const entries = dirKeys.map((key) => {
          const encodedKey = encodeURIComponent(key)
          return `  ${JSON.stringify(key)}: () => import('${VIRTUAL_DIR_PREFIX}${encodedKey}')`
        })
        return [
          `const _loaders = {`,
          entries.join(',\n'),
          `};`,
          `export async function loadDirectoryNode(dirKey) {`,
          `  const loader = _loaders[dirKey];`,
          `  if (!loader) return null;`,
          `  const mod = await loader();`,
          `  return mod.default;`,
          `}`,
        ].join('\n')
      }

      if (id.startsWith(RESOLVED_DIR_PREFIX)) {
        const encodedKey = id.slice(RESOLVED_DIR_PREFIX.length)
        const dirKey = decodeURIComponent(encodedKey)
        const node = await serializeSingleDirectoryNode(dirKey, sourceTree, baseDir, cache)
        return `export default ${JSON.stringify(node)}`
      }

      return null
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
        const injectedNav = nav.length > 0
          ? insertNavItems(site.themeConfig?.nav, nav, options.nav.insertMode)
          : (site.themeConfig?.nav ?? [])

        site.themeConfig = {
          ...(site.themeConfig ?? {}),
          sidebar,
          ...(nav.length > 0 ? { nav: injectedNav } : {}),
        }
      }

      if (site.locales && shouldInjectSidebar) {
        for (const localeKey of Object.keys(site.locales)) {
          const locale = site.locales[localeKey]

          const localeNav = nav.length > 0
            ? insertNavItems(locale.themeConfig?.nav, nav, options.nav.insertMode)
            : (locale.themeConfig?.nav ?? [])

          locale.themeConfig = {
            ...(locale.themeConfig ?? {}),
            sidebar,
            ...(nav.length > 0 ? { nav: localeNav } : {}),
          }
        }
      }

      return config
    },
  }
}

import { Buffer } from 'node:buffer'
import { resolve } from 'node:path'
import process from 'node:process'
import { createAutoTocComponentResolver, createTocSidebarVitePlugin, type TocSidebarBuildOptions } from '@knewbeing/vitepress-plugin-autosidebar-toc'
import { presetMarkdownIt } from '@nolebase/integrations/vitepress/markdown-it'
import { presetVite } from '@nolebase/integrations/vitepress/vite'
import { transformHeadMeta } from '@nolebase/vitepress-plugin-meta'
// import { buildEndGenerateOpenGraphImages } from '@nolebase/vitepress-plugin-og-image/vitepress';
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItMathjax3 from 'markdown-it-mathjax3'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Inspect from 'vite-plugin-inspect'
import type { Plugin as VitePlugin } from 'vite'
import { defineConfig } from 'vitepress'
import { creators, githubRepoLink, mastodonLink, siteDescription, siteName } from '../metadata'
import head from './head'

// 最小补丁：修复上游 PageProperties 插件在 dev 模式下虚拟模块首次加载时为空的问题。
// 根本原因：上游 transform(pre) 已正确地把字数统计写入内存，但虚拟模块在 md 文件 transform
// 之前就被 Vite 缓存为空对象 {}，且缺少 HMR 推送给浏览器。
// 此补丁在每个 md transform 后，先使虚拟模块缓存失效，再通过 server.reloadModule() 向浏览器
// 推送 HMR 更新，让客户端 hot.accept 回调拿到最新字数数据并触发 UI 刷新。
function createPagePropertiesDevPatch(): VitePlugin {
  const VIRTUAL_ID = '\0virtual:nolebase-page-properties'
  let server: import('vite').ViteDevServer | undefined
  return {
    name: 'nolebase:page-properties-dev-patch',
    enforce: 'post',
    apply: 'serve',
    configureServer(s) {
      server = s
    },
    transform: async (_code: string, id: string) => {
      if (!id.endsWith('.md') || !server) return null
      const mod = server.moduleGraph.getModuleById(VIRTUAL_ID)
      if (mod) {
        // reloadModule = invalidateModule + 向浏览器推送 HMR 通知
        // 浏览器收到通知后重新请求虚拟模块，此时 upstream load() 返回已填充的数据
        await server.reloadModule(mod)
      }
      return null
    },
  }
}

// 最小补丁：将 autosidebar-toc 插件注入的 sidebar 条目替换为空占位组，
// 使 VitePress 仍然渲染侧边栏面板（sidebar-nav-after slot 才能挂载），
// 但不显示任何原始导航项。占位组通过 CSS 隐藏。
function createRemoveSidebarPlugin(): VitePlugin {
  return {
    name: 'remove-vitepress-sidebar',
    enforce: 'post',
    config(config) {
      const site = (config as any).vitepress?.site
      if (!site) return

      const replaceWithPlaceholder = (sidebar: Record<string, any> | undefined) => {
        if (!sidebar) return
        for (const key of Object.keys(sidebar)) {
          sidebar[key] = [{ text: '', items: [] }]
        }
      }

      replaceWithPlaceholder(site.themeConfig?.sidebar)
      if (site.locales) {
        for (const localeKey of Object.keys(site.locales)) {
          replaceWithPlaceholder(site.locales[localeKey].themeConfig?.sidebar)
        }
      }
    },
  }
}

const mastodonIcon = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.94 14c-.28 1.41-2.44 2.96-4.97 3.26-1.32.16-2.62.31-4.01.24-2.28-.11-4.08-.57-4.08-.57v.62c.05 1.3.2 2.52 1.61 2.88 1.42.37 3.21.45 4.4.41 2.17-.08 3.35-.54 3.35-.54l.07 1.53s-1.24.66-3.45.78c-1.22.07-2.73.03-4.49-.42-3.82-.98-3.97-4.86-4.08-8.81-.03-1.17-.01-2.27-.01-3.2 0-4.05 2.66-5.23 2.66-5.23C9.3 5.99 10.96 5.5 12 5.49h.02c1.04.01 2.7.5 4.05 1.12 0 0 2.66 1.18 2.66 5.23 0 0 .03 2.99-.79 7.16zm-3.3-7.39c-.66-.72-1.72-1.09-3.22-1.09-1.74 0-3.06.67-3.82 2.01l-.82 1.37-.82-1.37c-.76-1.34-2.08-2.01-3.82-2.01-1.5 0-2.56.37-3.22 1.09-.64.72-.97 1.68-.97 2.9v5.95h2.35v-5.78c0-1.22.52-1.84 1.56-1.84 1.15 0 1.73.74 1.73 2.21v3.17h2.33V12.4c0-1.47.58-2.21 1.73-2.21 1.04 0 1.56.62 1.56 1.84v5.78h2.35V11.86c0-1.22-.33-2.18-.97-2.9z"/></svg>',
}
const headingRegex = /^# .*/m

const workspaceRoot = process.cwd()
const vitepressRoot = resolve(workspaceRoot, '.vitepress')
const docsRoot = resolve(workspaceRoot, 'zh-CN')
const publicRoot = resolve(workspaceRoot, 'public')
const tocFilePath = resolve(docsRoot, 'toc.md')
const indexFilePath = resolve(docsRoot, 'index.md')
const componentsDirPath = resolve(vitepressRoot, 'theme/components')
const componentsDtsPath = resolve(vitepressRoot, 'components.d.ts')
const autoImportsDtsPath = resolve(vitepressRoot, 'auto-imports.d.ts')

const nolebase = presetMarkdownIt({
  bidirectionalLinks: {
    options: {
      dir: docsRoot,
      baseDir: '/',
    },
  },
  unlazyImages: false,
})

const nolebaseVite = presetVite({
  thumbnailHashImages: false,
  gitChangelog: {
    options: {
      gitChangelog: {
        repoURL: () => githubRepoLink,
        mapAuthors: creators,
      },
      markdownSection: {
        excludes: [
          tocFilePath,
          indexFilePath,
        ],
      },
    },
  },
  pageProperties: {
    options: {
      markdownSection: {
        excludes: [
          tocFilePath,
          indexFilePath,
        ],
        exclude: (id: string) => id.endsWith('index.md'),
      },
    },
  },
})
const relativeUrl = process.env.RELATIVE_URL ?? ''

const tocSidebarOptions: TocSidebarBuildOptions = {
  dir: './zh-CN',
  roots: [
    '笔记',
    '编目 Catalog',
  ],
  nav: {
    insertMode: 'replace',
    navBuilder: [
      { text: '主页', link: '/' },
      { navDir: '笔记', level: 2, subMenuIncludeGlobs: ['**/*.md'], subMenuExcludeGlobs: [] },
      { navDir: '编目 Catalog', level: 2, subMenuIncludeGlobs: ['**/*.md'], subMenuExcludeGlobs: [] },
      { text: '关于我', link: '/aboutme.md' },
    ],
  },
  debug: true,
  showMarkdownLinks: true,
  collapsed: true,
}

// 从 CLI 参数 --srcExclude=glob1,glob2,... 中读取要排除的目录。
// 例: vitepress build --srcExclude="笔记/🤖 AI 人工智能/**,笔记/📋 面试题/**"
const srcExcludeArg = process.argv.find(arg => arg.startsWith('--srcExclude='))
const srcExclude = srcExcludeArg
  ? srcExcludeArg.slice('--srcExclude='.length).split(',').filter(Boolean)
  : []

export default defineConfig({
  base: relativeUrl,
  srcDir: docsRoot,
  srcExclude,
  vite: {
    publicDir: publicRoot,
    resolve: {
      alias: {
        '@': vitepressRoot,
        '@metadata': resolve(workspaceRoot, 'metadata'),
      },
    },
    server: {
      proxy: {
        '/assets/page-external-data/js': {
          target: 'https://plausible.io/js',
          changeOrigin: true,
          rewrite: path => path.replace('/assets/page-external-data/js', ''),
        },
        '/api/v1/page-external-data': {
          target: 'https://plausible.io/api',
          changeOrigin: true,
          rewrite: path => path.replace('/api/v1/page-external-data', ''),
        },
      },
    },
    assetsInclude: [
      '**/*.mov',
    ],
    optimizeDeps: {
      exclude: [
        'vitepress',
        '@nolebase/vitepress-plugin-git-changelog',
        '@nolebase/vitepress-plugin-index',
        'virtual:nolebase-git-changelog',
      ],
    },
    build: {
      chunkSizeWarningLimit: 800,
    },
    plugins: [
      createTocSidebarVitePlugin(tocSidebarOptions),
      createRemoveSidebarPlugin(),
      createPagePropertiesDevPatch(),
      Inspect(),
      AutoImport({
        include: [
          /\.[tj]sx?$/,
          /\.vue$/,
          /\.vue\?vue/,
          /\.md$/,
        ],
        imports: [
          'vue',
          '@vueuse/core',
        ],
        dts: autoImportsDtsPath,
        vueTemplate: true,
      }),
      Components({
        include: [/\.vue$/, /\.md$/],
        dirs: [componentsDirPath],
        resolvers: [
          createAutoTocComponentResolver({ componentName: 'AutoToc' })
        ],
        dts: componentsDtsPath,
      }),

      UnoCSS(),
      nolebaseVite,
      ...nolebaseVite.plugins(),
    ],
  },
  vue: {
    template: {
      transformAssetUrls: {
        video: ['src', 'poster'],
        source: ['src'],
        img: ['src'],
        image: ['xlink:href', 'href'],
        use: ['xlink:href', 'href'],
        NolebaseUnlazyImg: ['src'],
      },
    },
  },
  title: siteName,
  titleTemplate: ':title | 知在',
  description: siteDescription,
  ignoreDeadLinks: true,
  head,
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                },
              },
            },
          },
        },

        // Add title ang tags field in frontmatter to search
        // You can exclude a page from search by adding search: false to the page's frontmatter.
        _render(src, env, md) {
          // without `md.render(src, env)`, the some information will be missing from the env.
          let html = md.render(src, env)
          let tagsPart = ''
          let headingPart = ''
          let contentPart = ''
          let fullContent = ''
          const sortContent = () => [headingPart, tagsPart, contentPart] as const
          let { frontmatter, content } = env

          if (!frontmatter)
            return html

          if (frontmatter.search === false)
            return ''

          contentPart = content ||= src

          const headingMatch = content.match(headingRegex)
          const hasHeading = !!(headingMatch && headingMatch[0] && headingMatch.index !== undefined)

          if (hasHeading) {
            const headingEnd = headingMatch.index! + headingMatch[0].length
            headingPart = content.slice(0, headingEnd)
            contentPart = content.slice(headingEnd)
          }
          else if (frontmatter.title) {
            headingPart = `# ${frontmatter.title}`
          }

          const tags = frontmatter.tags
          if (tags && Array.isArray(tags) && tags.length)
            tagsPart = `Tags: #${tags.join(', #')}`

          fullContent = sortContent().filter(Boolean).join('\n\n')

          html = md.render(fullContent, env)

          return html
        },
      },
    },
  },
  locales: {
    root: {
      lang: 'zh-CN',
      label: '中文',
      dir: '/',
      link: '/',
      themeConfig: {
        socialLinks: [
          { icon: 'github', link: githubRepoLink },
          { icon: mastodonIcon, link: mastodonLink },
        ],
        darkModeSwitchLabel: '切换主题',
        outline: { label: '页面大纲', level: 'deep' },
        editLink: {
          pattern: `${githubRepoLink}/tree/main/:path`,
          text: '编辑本页面',
        },
        footer: {
          message: '用 <span style="color: #e25555;">&#9829;</span> 撰写',
          copyright:
            '<a class="footer-cc-link" target="_blank" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> © 2022-PRESENT 知在 的创作者们',
        },
      },
    },
  },
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'one-dark-pro',
    },
    math: true,
    preConfig: async (md) => {
      await nolebase.install(md)
    },
    config: (md) => {
      md.use(MarkdownItFootnote)
      md.use(MarkdownItMathjax3)

      const defaultFenceRenderer = md.renderer.rules.fence
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const language = token.info.trim().toLowerCase()

        if (language === 'mermaid') {
          // Encode as base64 UTF-8 to safely pass the diagram source through
          // SSR/hydration without HTML-encoding or Vue template compilation issues.
          const encoded = Buffer.from(token.content.trim(), 'utf8').toString('base64')
          return `<Mermaid code="${encoded}" />`
        }

        if (defaultFenceRenderer)
          return defaultFenceRenderer(tokens, idx, options, env, self)

        return self.renderToken(tokens, idx, options)
      }

      md.core.ruler.after('block', 'normalize-dataview-fence', (state) => {
        for (const token of state.tokens) {
          if (token.type !== 'fence')
            continue

          if (token.info.trim().toLowerCase() === 'dataview')
            token.info = 'txt'
        }
      })
    },
  },
  async transformHead(context) {
    let head = [...context.head]

    const returnedHead = await transformHeadMeta()(head, context)
    if (typeof returnedHead !== 'undefined')
      head = returnedHead

    return head
  },
  // async buildEnd(siteConfig) {
  //   await buildEndGenerateOpenGraphImages({
  //     baseUrl: targetDomain,
  //     category: {
  //       byLevel: 2,
  //     },
  //   })(siteConfig)
  // },
})

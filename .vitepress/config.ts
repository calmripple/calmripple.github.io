import { Buffer } from 'node:buffer'
import { resolve } from 'node:path'
import process from 'node:process'
import { createTocSidebarComponentResolver, createTocSidebarVitePlugin, type TocSidebarBuildOptions } from '@knewbeing/vitepress-plugin-autosidebar-toc'
import { createPagePropertiesPlugin } from '@knewbeing/vitepress-plugin-page-properties'
import { createRemoveSidebarPlugin } from '@knewbeing/vitepress-plugin-remove-sidebar'
import { presetMarkdownIt } from '@nolebase/integrations/vitepress/markdown-it'
import { presetVite } from '@nolebase/integrations/vitepress/vite'
import { transformHeadMeta } from '@nolebase/vitepress-plugin-meta'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItMathjax3 from 'markdown-it-mathjax3'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Inspect from 'vite-plugin-inspect'
import { defineConfig } from 'vitepress'
import { creators, githubRepoLink, mastodonLink, siteDescription, siteName } from '../metadata'
import head from './head'

// import { buildEndGenerateOpenGraphImages } from '@nolebase/vitepress-plugin-og-image/vitepress';

const mastodonIcon = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.193 7.88c0-5.207-3.411-6.733-3.411-6.733C18.062.36 15.108.025 12.041 0h-.074c-3.067.026-6.02.36-7.74 1.147 0 0-3.411 1.526-3.411 6.733 0 1.191-.023 2.618.014 4.108.122 5.025.919 9.98 5.573 11.196 2.146.561 3.987.679 5.475.597 2.7-.147 4.219-.949 4.219-.949l-.092-2.047s-1.93.608-4.102.537c-2.151-.074-4.423-.234-4.771-2.892a5.567 5.567 0 0 1-.048-.745s2.11.515 4.784.638c1.636.075 3.17-.096 4.735-.285 3.005-.36 5.626-2.216 5.955-3.914.518-2.676.475-6.53.475-6.53zm-3.966 6.739h-2.474V8.615c0-1.266-.533-1.91-1.6-1.91-1.179 0-1.77.773-1.77 2.298v3.288h-2.46V9.003c0-1.525-.59-2.298-1.77-2.298-1.066 0-1.6.644-1.6 1.91v6.004H5.08V8.431c0-1.266.325-2.273.974-3.021.669-.748 1.543-1.132 2.621-1.132 1.247 0 2.19.479 2.817 1.436l.608 1.01.608-1.01c.627-.957 1.57-1.436 2.817-1.436 1.078 0 1.952.384 2.62 1.132.65.748.975 1.755.975 3.021v6.188z"/></svg>',
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
      { text: '🏠 主页', link: '/' },
      { text: '📑 目录', link: '/toc' },
      { navDir: '笔记', level: 2, subMenuIncludeGlobs: ['**/*.md'], subMenuExcludeGlobs: [] },
      { navDir: '编目 Catalog', level: 2, subMenuIncludeGlobs: ['**/*.md'], subMenuExcludeGlobs: [] },
      { text: '👤 关于我', link: '/aboutme.md' },
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
      proxy: {},
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
      ...createPagePropertiesPlugin(),
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
          createTocSidebarComponentResolver(),
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
          pattern: `${githubRepoLink}/blob/main/zh-CN/:path`,
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

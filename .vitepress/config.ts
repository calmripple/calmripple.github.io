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
import { defineConfig } from 'vitepress'
import { creators, githubRepoLink, mastodonLink, siteDescription, siteName } from '../metadata'
import head from './head'

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
    enabled: true,
    level: 2,
    mode: 'append',
  },
  debug: true,
  showMarkdownLinks: false,
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
        nav: [
          { text: '主页', link: '/' },

        ],
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

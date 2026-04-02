import type { DefaultTheme } from 'vitepress'
import { resolve } from 'node:path'
import process from 'node:process'
import { presetMarkdownIt } from '@nolebase/integrations/vitepress/markdown-it'
import { presetVite } from '@nolebase/integrations/vitepress/vite'
import { transformHeadMeta } from '@nolebase/vitepress-plugin-meta'
import { calculateSidebar } from '@nolebase/vitepress-plugin-sidebar'
// import { buildEndGenerateOpenGraphImages } from '@nolebase/vitepress-plugin-og-image/vitepress';
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItMathjax3 from 'markdown-it-mathjax3'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Inspect from 'vite-plugin-inspect'
import { defineConfig } from 'vitepress'
import { creators, discordLink, githubRepoLink, siteDescription, siteName } from '../metadata'
import head from './head'

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
  unlazyImages: false,
})
const sidebarTargets = [
  { folderName: 'zh-CN/笔记', separate: true },
  { folderName: 'zh-CN/编目 Catalog', separate: true },
]

const zhCNPathRegex = /^\/zh-CN(?=\/|$)/
function rewriteSidebarPath(path: string) {
  return path.replace(zhCNPathRegex, '') || '/'
}

function rewriteSidebarItems(items: DefaultTheme.SidebarItem[]): DefaultTheme.SidebarItem[] {
  return items.map(item => ({
    ...item,
    link: item.link ? rewriteSidebarPath(item.link) : item.link,
    items: item.items ? rewriteSidebarItems(item.items) : item.items,
  }))
}

function buildSidebar(): DefaultTheme.Sidebar {
  const rawSidebar = calculateSidebar(sidebarTargets, 'zh-CN')

  if (Array.isArray(rawSidebar))
    return rewriteSidebarItems(rawSidebar)

  return Object.fromEntries(
    Object.entries(rawSidebar).map(([key, section]) => {
      const normalizedSection = Array.isArray(section)
        ? rewriteSidebarItems(section)
        : {
            ...section,
            items: rewriteSidebarItems(section.items),
          }

      return [rewriteSidebarPath(key), normalizedSection]
    }),
  ) as DefaultTheme.SidebarMulti
}

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

export default defineConfig({
  base: relativeUrl,
  srcDir: docsRoot,
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
    plugins: [
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
          { text: '笔记', link: '/笔记/' },
          { text: '编目 Catalog', link: '/编目 Catalog/' },
          { text: '最近更新', link: '/toc' },
        ],
        socialLinks: [
          { icon: 'github', link: githubRepoLink },
          { icon: 'discord', link: discordLink },
        ],
        darkModeSwitchLabel: '切换主题',
        outline: { label: '页面大纲', level: 'deep' },
        editLink: {
          pattern: `${githubRepoLink}/tree/main/:path`,
          text: '编辑本页面',
        },
        sidebar: buildSidebar(),
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

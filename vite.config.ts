import { join } from 'node:path'
import { presetVite } from '@nolebase/integrations/vitepress/vite'

import UnoCSS from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'

import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import { creators, githubRepoLink } from './metadata'

export default defineConfig(async () => {
  const nolebase = presetVite({
    gitChangelog: {
      options: {
        gitChangelog: {
          repoURL: () => githubRepoLink,
          mapAuthors: creators,
        },
        markdownSection: {
          excludes: [
            join('zh-CN', 'toc.md'),
            join('zh-CN', 'index.md'),
          ],
        },
      },
    },
    pageProperties: {
      options: {
        markdownSection: {
          excludes: [
            join('zh-CN', 'toc.md'),
            join('zh-CN', 'index.md'),
          ],
        },
      },
    },
  })

  return {
    assetsInclude: [
      '**/*.mov',
    ],
    server: {
      proxy: {
        '/assets/page-external-data/js': {
          target: 'https://plausible.io/js',
          changeOrigin: true,
          rewrite: (path: string) => path.replace('/assets/page-external-data/js', ''),
        },
        '/api/v1/page-external-data': {
          target: 'https://plausible.io/api',
          changeOrigin: true,
          rewrite: (path: string) => path.replace('/api/v1/page-external-data', ''),
        },
      },
    },
    optimizeDeps: {
      // vitepress is aliased with replacement `join(DIST_CLIENT_PATH, '/index')`
      // This needs to be excluded from optimization
      exclude: [
        'vitepress',
      ],
    },
    plugins: [
      Inspect(),
      Components({
        include: [/\.vue$/, /\.md$/],
        dirs: '.vitepress/theme/components',
        dts: '.vitepress/components.d.ts',
      }),
      UnoCSS(),
      nolebase,
      ...nolebase.plugins(),
    ],
  }
})

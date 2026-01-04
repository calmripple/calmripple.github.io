import { join } from 'node:path'
import { presetVite } from '@nolebase/integrations/vitepress/vite'
import i18nPlugin from '@voerkai18n/plugins/vite'

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
    optimizeDeps: {
      // vitepress is aliased with replacement `join(DIST_CLIENT_PATH, '/index')`
      // This needs to be excluded from optimization
      exclude: [
        'vitepress',
      ],
    },
    plugins: [
      Inspect(),
      i18nPlugin(),
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

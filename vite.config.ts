import { join } from 'node:path'
import { presetVite } from '@nolebase/integrations/vitepress/vite'
import i18nPlugin from '@voerkai18n/plugins/vite'

import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
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
      AutoImport({
        // 导入 Vue 的组合式 API (如 ref, computed)
        imports: [
          // 导入 VoerkaI18n
          {
            '@voerkai18n/core': ['useI18n', 't', 'tc', 'd', 'n'], // 示例导入，请根据实际库导出调整
          },
        ],
        dirs: [
          './languages/index',
        ],
        dtsMode: 'overwrite',
        // 配合 ESLint 使用，生成 .eslintrc-auto-import.json 规则
        // enabled: true, // 首次运行生成规则后可设为 false
        // eslintrc: {
        //   enabled: true,
        //   filepath: './.eslintrc-auto-import.json',
        // },
        dts: './auto-imports.d.ts', // 生成类型声明文件
      }),
      Inspect(),
      Components({
        include: [/\.vue$/, /\.md$/],
        dirs: '.vitepress/theme/components',
        dts: '.vitepress/components.d.ts',
      }),
      UnoCSS(),
      nolebase,
      ...nolebase.plugins(),
      i18nPlugin(),
    ],
  }
})

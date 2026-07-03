import Yaml from '@rollup/plugin-yaml'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { builder: 'mkdist', input: './src/client', outDir: './dist/client', pattern: ['**/*.vue'], loaders: ['vue'] },
    { builder: 'mkdist', input: './src/client', outDir: './dist/client', pattern: ['**/*.ts', '!**/*.test.ts'], format: 'cjs', loaders: ['js'] },
    { builder: 'mkdist', input: './src/client', outDir: './dist/client', pattern: ['**/*.ts', '!**/*.test.ts'], format: 'esm', loaders: ['js'] },
    { builder: 'mkdist', input: './src/client', outDir: './dist/client', pattern: ['**/*.css'], loaders: ['postcss'] },
    { builder: 'rollup', input: './src/locales/index', outDir: './dist/locales' },
    { builder: 'rollup', input: './src/vitepress/index', outDir: './dist/vitepress' },
  ],
  clean: true,
  sourcemap: true,
  declaration: true,
  externals: ['vue', 'vitepress', 'gray-matter', 'defu', 'tinyglobby'],
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
  hooks: {
    'rollup:options': (_, options) => {
      if (Array.isArray(options.plugins))
        options.plugins.push(Yaml() as any)
    },
  },
})

import { resolve } from 'node:path'
import process from 'node:process'

import { createGraphViewLoader } from '@knewbeing/vitepress-plugin-graph-view/vitepress'

export default createGraphViewLoader({
  dir: resolve(process.cwd(), 'zh-CN'),
  ignores: [
    '**/node_modules/**',
    '**/assets/**',
    '**/data/**',
  ],
  category: {
    byLevel: 0,
  },
})

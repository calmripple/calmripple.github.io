/**
 * test-build.ts – 仅构建少量具有代表性的笔记页面，以加速 CI/测试编译速度。
 *
 * 运行方式: pnpm test
 *
 * 通过 --srcExclude=glob1,glob2 CLI 参数告知 .vitepress/config.ts
 * 跳过哪些目录，只保留少数有代表性的内容参与编译。
 */

import { spawnSync } from 'node:child_process'
import process from 'node:process'

// 使用一条 extglob 规则排除“笔记”下除两个样本目录外的其它目录。
// 当前仅保留：📐 图形学、💾 软件。
const testSrcExclude = [
  '笔记/!(📐 图形学|💾 软件)/**',
]

const srcExcludeArg = `--srcExclude=${testSrcExclude.join(',')}`
const result = spawnSync(`pnpm exec vitepress build "${srcExcludeArg}"`, {
  stdio: 'inherit',
  shell: true,
})

process.exit(result.status ?? 1)

/**
 * title-template.ts – 为所有笔记 frontmatter 补全 titleTemplate。
 * 运行方式: pnpm tsx scripts/title-template.ts
 *
 * 规则：
 * - 每篇文章写入 titleTemplate: ':title | 知在'
 * - 已经设置了正确值的跳过不写（避免无意义写入）
 * - 跳过 index.md、idea.md 等目录/清单文件
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import fg from 'fast-glob'
import matter from 'gray-matter'

const NOTES_ROOT = path.resolve(process.cwd(), 'zh-CN/笔记')
const TITLE_TEMPLATE = ':title | 知在'

const SKIP_FILES = new Set(['index.md', 'idea.md'])

async function main() {
  const files = await fg('**/*.md', { cwd: NOTES_ROOT, absolute: true })

  let updated = 0
  let skipped = 0

  for (const file of files) {
    const basename = path.basename(file)
    if (SKIP_FILES.has(basename)) {
      skipped++
      continue
    }

    const raw = fs.readFileSync(file, 'utf-8')
    const { data, content } = matter(raw)

    if (data.titleTemplate === TITLE_TEMPLATE) {
      continue
    }

    data.titleTemplate = TITLE_TEMPLATE

    const output = matter.stringify(content, data)
    if (output !== raw) {
      fs.writeFileSync(file, output, 'utf-8')
      updated++
      console.log(`✓ ${path.relative(NOTES_ROOT, file).replace(/\\/g, '/')}`)
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Total: ${files.length}`)
}

main().catch(console.error)

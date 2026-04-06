/**
 * retag.ts – 根据目录路径 + 文件名批量更新笔记的 frontmatter tags / categories。
 * 运行方式: pnpm tsx scripts/retag.ts
 *
 * 策略：
 * 1. 根据文件所在目录（emoji 顶级目录 + 子目录）确定主分类和基础 tag
 * 2. 根据文件名关键词追加技术 tag
 * 3. 保留已有的 AI Generated、isTimeLine、created、date、author 等字段不变
 * 4. 跳过 index.md（目录文件）和 idea.md 等纯清单文件
 */

import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import matter from 'gray-matter'

const NOTES_ROOT = path.resolve(process.cwd(), 'zh-CN/笔记')

// ─── 目录 → 标签映射 ───────────────────────────────────────────────────────
interface TagResult {
  tags: string[]
  categories: string[]
}

function getTagsForPath(relPath: string): TagResult {
  // Normalise to forward slashes
  const rel = relPath.replace(/\\/g, '/')
  const parts = rel.split('/')
  const top = parts[0] ?? ''
  const sub = parts[1] ?? ''
  const filename = (parts.at(-1) ?? '').toLowerCase().replace(/\.md$/, '')

  const tags = new Set<string>()
  const cats = new Set<string>()

  // ── 顶级目录 ──────────────────────────────────────────────────────────────
  if (top.includes('云原生')) {
    cats.add('云原生与运维')
    tags.add('云原生').add('运维')
    if (sub.includes('DevOps')) { cats.add('DevOps'); tags.add('DevOps').add('CI/CD').add('部署') }
    if (sub.includes('WSL')) { cats.add('WSL'); tags.add('WSL').add('Linux') }
    if (sub.includes('理论')) { tags.add('Serverless').add('云原生理论') }
  }

  if (top.includes('大前端')) {
    cats.add('大前端')
    tags.add('前端')
    if (sub === 'CSS') { cats.add('CSS'); tags.add('CSS').add('样式布局') }
    if (sub === 'ES6') { cats.add('ES6'); tags.add('JavaScript').add('ES6') }
    if (sub === 'HTML') { cats.add('HTML'); tags.add('HTML').add('语义化') }
    if (sub === 'JavaScript') { cats.add('JavaScript'); tags.add('JavaScript') }
    if (sub === 'Node.js') { cats.add('Node.js'); tags.add('Node.js').add('JavaScript') }
    if (sub === 'Vue') { cats.add('Vue'); tags.add('Vue').add('JavaScript') }
    if (sub === 'Vue 资源') { cats.add('Vue'); tags.add('Vue').add('资源') }
    if (sub === 'Bun') { cats.add('Bun'); tags.add('Bun').add('JavaScript').add('运行时') }
    if (sub === '浏览器') { cats.add('浏览器'); tags.add('浏览器').add('渲染原理') }
    if (sub === '性能优化') { cats.add('性能优化'); tags.add('性能优化').add('前端工程') }
    if (sub === '正则表达式') { cats.add('正则表达式'); tags.add('正则表达式') }
    if (sub === '调试与进阶') { cats.add('调试与进阶'); tags.add('调试').add('进阶') }
    if (sub === '项目模板') { cats.add('项目模板'); tags.add('项目模板').add('工程化') }
    if (sub === '技术文章') { cats.add('技术文章'); tags.add('技术笔记') }
    if (sub === '博客文章') { cats.add('博客文章'); tags.add('博客').add('前端') }
  }

  if (top.includes('项目')) {
    cats.add('项目')
    tags.add('项目实践')
    if (rel.includes('开源工具')) { cats.add('开源工具'); tags.add('开源').add('工具') }
    if (rel.includes('time-tools') || rel.includes('time-lover')) { tags.add('前端').add('开源项目') }
    if (rel.includes('PrecisionHeadshot')) { tags.add('AI').add('计算机视觉').add('机器学习') }
    if (rel.includes('SentimentCore')) { tags.add('AI').add('NLP').add('情感分析') }
    if (rel.includes('Nolebase')) { tags.add('VitePress').add('知识库') }
  }

  if (top.includes('编程开发')) {
    cats.add('编程开发')
    tags.add('编程')
    if (sub === '.NET') { cats.add('.NET'); tags.add('.NET').add('C#') }
    if (sub.includes('Git')) { cats.add('Git'); tags.add('Git').add('GitHub').add('版本控制') }
    if (sub === '源码分析') { cats.add('源码分析'); tags.add('源码分析') }
    if (sub === '算法实践') { cats.add('算法'); tags.add('算法').add('数据结构').add('编程实践') }
  }

  if (top.includes('软件')) {
    cats.add('软件工具')
    tags.add('软件').add('工具')
    if (rel.includes('ffmpeg')) { tags.add('ffmpeg').add('音视频').add('命令行') }
    if (rel.includes('NeoVim')) { tags.add('NeoVim').add('编辑器').add('Vim') }
    if (rel.includes('笔记软件')) { tags.add('笔记软件').add('Obsidian').add('知识管理') }
    if (rel.includes('VS Code') || rel.includes('VSCode')) { tags.add('VS Code').add('编辑器') }
    if (rel.includes('Figma')) { tags.add('Figma').add('设计').add('UI') }
  }

  if (top.includes('面试题')) {
    cats.add('面试题')
    tags.add('面试题')
    if (sub === 'Vue') { cats.add('Vue'); tags.add('Vue').add('前端') }
    if (sub === '代码题') { cats.add('代码题'); tags.add('算法').add('代码题') }
    if (sub === '小程序') { cats.add('小程序'); tags.add('小程序').add('微信').add('前端') }
    if (sub === '性能优化') { cats.add('性能优化'); tags.add('性能优化').add('前端') }
    if (sub === '操作系统') { cats.add('操作系统'); tags.add('操作系统').add('计算机基础') }
    if (sub === '计算机网络') { cats.add('计算机网络'); tags.add('计算机网络').add('计算机基础') }
    if (sub === '面经') { cats.add('面经'); tags.add('面经').add('实战') }
    if (sub === '其他') { cats.add('其他'); tags.add('工程化').add('前端基础') }
  }

  if (top.includes('图形学')) {
    cats.add('图形学')
    tags.add('图形学').add('数学').add('计算机图形学')
    if (filename.includes('向量'))
      tags.add('向量')
    if (filename.includes('矩阵'))
      tags.add('矩阵')
    if (filename.includes('三角'))
      tags.add('三角函数')
    if (filename.includes('四元数'))
      tags.add('四元数')
    if (filename.includes('点乘') || filename.includes('叉乘'))
      tags.add('向量运算')
    if (filename.includes('齐次'))
      tags.add('齐次坐标')
  }

  if (top.includes('计算机基础')) {
    cats.add('计算机基础')
    tags.add('计算机基础')
    if (sub === '操作系统') { cats.add('操作系统'); tags.add('操作系统').add('进程').add('线程') }
    if (sub === '算法') { cats.add('算法'); tags.add('算法').add('数据结构') }
    if (sub === '计算机网络') { cats.add('计算机网络'); tags.add('计算机网络').add('HTTP').add('TCP/IP') }
    if (sub === '设计模式') { cats.add('设计模式'); tags.add('设计模式').add('OOP').add('架构') }
  }

  if (top.includes('AI')) {
    cats.add('AI 人工智能')
    tags.add('AI').add('人工智能')
    if (rel.includes('Stable Diffusion')) { cats.add('Stable Diffusion'); tags.add('Stable Diffusion').add('AIGC').add('图像生成').add('文生图') }
    if (rel.includes('从零开始的机器学习')) { cats.add('机器学习'); tags.add('机器学习').add('PyTorch').add('深度学习').add('教程') }
    if (rel.includes('提示工程') || rel.includes('Prompt')) { cats.add('提示工程'); tags.add('提示工程').add('LLM').add('Prompt Engineering') }
    if (rel.includes('/机器学习/')) { cats.add('机器学习'); tags.add('机器学习') }
    if (rel.includes('LLM')) { cats.add('LLM'); tags.add('LLM').add('大语言模型') }
    if (rel.includes('Coze')) { cats.add('Coze'); tags.add('Coze').add('AI 工具') }
    if (rel.includes('Dify')) { cats.add('Dify'); tags.add('Dify').add('AI 工具') }
    if (rel.includes('豆包') || rel.includes('MarsCode')) { cats.add('MarsCode'); tags.add('豆包 MarsCode').add('AI 代码辅助') }
    if (rel.includes('隐写术')) { cats.add('隐写术'); tags.add('隐写术').add('信息安全') }
    if (rel.includes('Neuro')) { cats.add('Neuro'); tags.add('Neuro').add('VTuber').add('虚拟主播') }
    if (rel.includes('领域/音频')) { tags.add('语音合成').add('TTS').add('音频处理') }
    if (rel.includes('领域/提示词')) { tags.add('提示词').add('Prompt').add('LLM') }
    if (filename.includes('pytorch') || rel.includes('PyTorch'))
      tags.add('PyTorch')
    if (filename.includes('anaconda') || filename.includes('mamba'))
      tags.add('Anaconda').add('Python')
    if (rel.includes('Voyager') || filename.includes('minecraft'))
      tags.add('强化学习').add('游戏 AI')
    if (filename.includes('megatron') || filename.includes('gpt-2'))
      tags.add('大模型训练').add('LLM')
    if (filename.includes('xagent'))
      tags.add('AI Agent').add('自主 Agent')
    if (rel.includes('领域'))
      cats.add('AI 领域应用')
  }

  // ── 文件名关键词追加 ────────────────────────────────────────────────────
  if (filename.includes('docker'))
    tags.add('Docker')
  if (filename.includes('k8s') || filename.includes('kubernetes'))
    tags.add('Kubernetes')
  if (filename.includes('1panel'))
    tags.add('1Panel').add('运维面板')
  if (filename.includes('serverless'))
    tags.add('Serverless')
  if (filename.includes('vite') && !top.includes('面试题'))
    tags.add('Vite').add('构建工具')
  if (filename.includes('webpack'))
    tags.add('Webpack').add('构建工具')
  if (filename.includes('eslint'))
    tags.add('ESLint').add('代码规范')
  if (filename.includes('githubaction') || filename.includes('github-action'))
    tags.add('GitHub Actions').add('CI/CD')
  if (filename.includes('typescript') || filename === 'ts-decorators')
    tags.add('TypeScript')
  if (filename.includes('gpt') || filename.includes('chatgpt'))
    tags.add('GPT').add('LLM')
  if (filename.includes('ssh'))
    tags.add('SSH').add('Linux')
  if (filename.includes('nginx'))
    tags.add('Nginx')
  if (filename.includes('pnpm') || filename.includes('npm-issue'))
    tags.add('包管理器').add('Node.js')
  if (filename.includes('cors'))
    tags.add('CORS').add('浏览器安全')
  if (filename.startsWith('http') || filename === 'http')
    tags.add('HTTP')
  if (filename.startsWith('tcp'))
    tags.add('TCP/IP')
  if (filename.includes('promise'))
    tags.add('Promise').add('异步编程')
  if (filename.includes('closure') || filename.includes('闭包'))
    tags.add('闭包')
  if (filename.includes('prototype'))
    tags.add('原型链')
  if (filename.includes('eventloop'))
    tags.add('事件循环')
  if (filename.startsWith('async'))
    tags.add('异步编程')
  if (filename.includes('throttl') || filename.includes('debounce'))
    tags.add('节流防抖').add('性能优化')
  if (filename === 'flex' || filename.includes('flex'))
    tags.add('Flexbox').add('CSS')
  if (filename === 'bfc' || filename === 'ifc')
    tags.add('格式化上下文').add('CSS')
  if (filename.includes('cors'))
    tags.add('跨域')
  if (filename.includes('safe') || filename.includes('xss') || filename.includes('csrf'))
    tags.add('Web 安全')
  if (filename.includes('cache') || filename === 'cache')
    tags.add('缓存').add('HTTP')
  if (filename.includes('mongo'))
    tags.add('MongoDB').add('数据库')
  if (filename.includes('redis'))
    tags.add('Redis').add('数据库')
  if (filename.includes('sort'))
    tags.add('排序算法')
  if (filename.includes('binary') || filename.includes('tree') || filename.includes('link'))
    tags.add('数据结构')
  if (filename.includes('figma'))
    tags.add('Figma').add('设计')
  if (filename.includes('ffmpeg'))
    tags.add('ffmpeg').add('音视频')
  if (filename.includes('mermaid'))
    tags.add('Mermaid').add('图表')
  if (filename.includes('pnpm-issue'))
    tags.add('pnpm').add('CI/CD')
  if (filename.includes('deploy-preview'))
    tags.add('GitHub Pages').add('部署').add('预览')
  if (filename.includes('open-source') || filename.includes('开源协议') || filename.includes('license'))
    tags.add('开源协议').add('License')
  if (filename.includes('zsh') || filename.includes('oh-my-zsh'))
    tags.add('Zsh').add('终端美化').add('Linux')
  if (filename.includes('nvm'))
    tags.add('Node.js').add('版本管理')
  if (filename.includes('regex') || filename.includes('正则') || filename.includes('regexp'))
    tags.add('正则表达式')

  return { tags: [...tags], categories: [...cats] }
}

// ─── 主流程 ────────────────────────────────────────────────────────────────
async function main() {
  const files = await fg('**/*.md', {
    cwd: NOTES_ROOT,
    absolute: true,
  })

  let updated = 0
  let skipped = 0

  for (const file of files) {
    const relPath = path.relative(NOTES_ROOT, file).replace(/\\/g, '/')

    // 跳过目录索引、草稿和明显清单文件
    const basename = path.basename(file)
    if (
      basename === 'index.md'
      || basename === 'idea.md'
      || relPath.includes('关于我')
    ) {
      skipped++
      continue
    }

    try {
      const raw = fs.readFileSync(file, 'utf-8')
      // gray-matter v4 requires the content to have consistent newlines
      const { data, content } = matter(raw)

      const { tags: newTags, categories: newCats } = getTagsForPath(relPath)

      // Preserve AI Generated tag if already present
      const existingTags: string[] = Array.isArray(data.tags) ? data.tags : []
      const preserveExtra = existingTags.filter(t => t === 'AI Generated')
      const finalTags = [...new Set([...newTags, ...preserveExtra])]

      data.tags = finalTags
      data.categories = newCats

      // Re-serialise – gray-matter stringify wraps content correctly
      const output = matter.stringify(content, data)

      // Only write if something actually changed
      if (output !== raw) {
        fs.writeFileSync(file, output, 'utf-8')
        updated++
        console.log(`✓ ${relPath}`)
      }
    }
    catch (err) {
      console.error(`✗ Error: ${relPath}`, err)
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Total: ${files.length}`)
}

main().catch(console.error)

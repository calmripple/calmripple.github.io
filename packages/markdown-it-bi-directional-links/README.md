# @knewbeing/markdown-it-bi-directional-links

[![npm version](https://img.shields.io/npm/v/@knewbeing/markdown-it-bi-directional-links.svg)](https://www.npmjs.com/package/@knewbeing/markdown-it-bi-directional-links)
[![license](https://img.shields.io/npm/l/@knewbeing/markdown-it-bi-directional-links.svg)](./LICENSE)

> 将 Obsidian 风格的 `[[wikilink]]` 语法转换为标准 HTML 链接的 markdown-it 插件。

支持 Markdown 文件、图片、音频、视频的双向链接解析，自动在文件系统中查找匹配文件并生成正确的相对或绝对路径链接。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/markdown-it-bi-directional-links](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/markdown-it-bi-directional-links](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 🔗 **Wikilink 语法** — 支持 `[[文件名]]` 和 `[[文件名|显示文本]]` 两种格式
- 📁 **自动文件查找** — 在指定目录下通过 glob 递归匹配目标文件
- 🖼 **多媒体支持** — 自动识别图片（PNG/JPG/GIF/SVG/WebP 等）、音频（MP3/WAV/OGG 等）、视频（MP4/WebM/MOV 等）并生成对应 HTML 标签
- ⚡ **冲突处理** — 同名文件冲突时自动退化为全路径匹配
- 🛣 **相对/绝对路径** — 支持 `isRelativePath` 选项切换路径模式，兼容 VitePress 和 VuePress
- 🐛 **调试模式** — 可选开启详细日志，方便排查链接解析问题
- ⚠️ **无效链接渲染** — `stillRenderNoMatched` 选项支持仍渲染未匹配的链接（带 CSS 标记）

---

## 安装 / Installation

```bash
npm install @knewbeing/markdown-it-bi-directional-links
# or
pnpm add @knewbeing/markdown-it-bi-directional-links

```

---

## 快速开始 / Quick Start

### 在 VitePress 中使用

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { BiDirectionalLinks } from '@knewbeing/markdown-it-bi-directional-links'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  markdown: {
    config: (md) => {
      md.use(BiDirectionalLinks({
        dir: resolve(__dirname, '../'),
      }))
    },
  },
})

```

### 在 markdown-it 中直接使用

```ts
import MarkdownIt from 'markdown-it'
import { BiDirectionalLinks } from '@knewbeing/markdown-it-bi-directional-links'

const md = new MarkdownIt()
md.use(BiDirectionalLinks({ dir: '/path/to/docs' }))

const result = md.render('[[my-page]]')
// <p><a href="/my-page">my-page</a></p>

```

---

## 语法示例 / Syntax

```markdown
<!-- 链接到 Markdown 文件 -->
[[page-name]]
[[page-name|自定义文字]]

<!-- 链接到图片 -->
[[image.png]]
[[image.png|图片描述]]

<!-- 嵌入图片（以 ! 开头） -->
![[image.png]]

<!-- 链接到音频 -->
[[audio.mp3]]

<!-- 链接到视频 -->
[[video.mp4]]

<!-- 带锚点的链接 -->
[[page-name#section]]

<!-- 带查询参数的链接 -->
[[page-name?tab=2]]

```

---

## 配置项 / Options

### `BiDirectionalLinksOptions`

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dir` | `string` | `cwd()` | 搜索文件的根目录（绝对路径） |
| `baseDir` | `string` | `'/'` | 生成链接的 base 前缀 |
| `includesPatterns` | `string[]` | `['**/*.md', '**/*.png', ...]` | 参与匹配的 glob 规则 |
| `excludesPatterns` | `string[]` | `['_*', 'dist', 'node_modules']` | 排除的 glob 规则 |
| `debug` | `boolean` | `false` | 开启调试日志 |
| `noNoMatchedFileWarning` | `boolean` | `false` | 禁用"未找到文件"警告 |
| `stillRenderNoMatched` | `boolean` | `false` | 未匹配时仍渲染链接（href 为空，带 `.nolebase-route-link-invalid` class） |
| `isRelativePath` | `boolean` | `false` | 强制使用相对路径（而非绝对路径） |

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/markdown-it-bi-directional-links)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

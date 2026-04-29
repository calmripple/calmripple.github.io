# @knewbeing/vitepress-plugin-meta

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-meta.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-meta)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-meta.svg)](./LICENSE)

> 为 VitePress 自动生成页面 Meta 标签（title、description、Open Graph）的插件。

在 VitePress 的 `transformHead` 钩子中，通过解析页面 HTML 内容提取标题和摘要，自动注入 `<meta>` 标签，无需在每个 Markdown 文件的 frontmatter 中手动填写。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/vitepress-plugin-meta](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/vitepress-plugin-meta](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 🏷 **自动 Meta 注入** — 在 VitePress `transformHead` 钩子自动提取页面内容并注入 meta 标签
- 📝 **智能描述提取** — 使用 unified/rehype 解析 HTML，提取正文首段作为页面描述
- 🖼 **Open Graph 支持** — 自动生成 `og:title`、`og:description` 等 OG 标签
- 🔧 **Frontmatter 优先** — 优先使用 frontmatter 中的 `title` / `description`，缺失时自动提取
- ⚙️ **configureHead 函数** — 可单独调用的 `transformHeadMeta()` 函数，方便集成到现有配置中

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-meta
# or
pnpm add @knewbeing/vitepress-plugin-meta

```

---

## 快速开始 / Quick Start

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { transformHeadMeta } from '@knewbeing/vitepress-plugin-meta/vitepress'

export default defineConfig({
  async transformHead(context) {
    return await transformHeadMeta()(context)
  },
})

```

### 与其他 transformHead 合并使用

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { transformHeadMeta } from '@knewbeing/vitepress-plugin-meta/vitepress'

const metaTransformer = transformHeadMeta()

export default defineConfig({
  async transformHead(context) {
    const metaTags = (await metaTransformer(context)) ?? []
    return [
      // 你自己的 head 标签
      ['meta', { name: 'author', content: '知在' }],
      // 插件生成的 meta 标签
      ...metaTags,
    ]
  },
})

```

---

## 生成的 Meta 标签示例 / Generated Meta Tags

```html
<meta name="description" content="这是从文章正文首段自动提取的描述..." />
<meta property="og:title" content="文章标题" />
<meta property="og:description" content="这是从文章正文首段自动提取的描述..." />

```

---

## 技术依赖 / Dependencies

本包使用以下库解析 HTML 内容：

- `unified` + `rehype-parse` — HTML 解析
- `hast-util-select` — CSS 选择器查询 HAST 节点
- `hast-util-to-text` — 提取文本内容
- `unist-util-remove` / `unist-util-remove-position` — 清理 AST

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-meta)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

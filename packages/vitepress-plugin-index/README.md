# @knewbeing/vitepress-plugin-index

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-index.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-index)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-index.svg)](./LICENSE)

> 为 VitePress 提供文档索引功能的插件：自动构建文章标签云、文章列表并支持多语言 UI。

扫描 Markdown 文件的 frontmatter 元数据，生成可供客户端组件消费的文档索引数据，支持标签筛选、分类浏览等功能。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/vitepress-plugin-index](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/vitepress-plugin-index](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 📚 **文档索引** — 扫描所有 Markdown 文件，提取 frontmatter 元数据构建索引
- 🏷 **标签系统** — 统计每个标签下的文章数量，支持标签云展示
- 🔍 **标签过滤** — 通过 `useIndexTagsStore` 实现响应式标签筛选
- 🌐 **多语言 UI** — 内置 i18n 支持，包含简体中文、繁体中文、英语等
- 🛠 **VitePress 集成** — 提供 `vitepress` 入口，包含 Vite 插件和配置助手
- 🎨 **客户端组件** — 提供开箱即用的索引展示 Vue 组件和样式

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-index
# or
pnpm add @knewbeing/vitepress-plugin-index

```

---

## 快速开始 / Quick Start

### 1. 注册 VitePress 插件

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { NolebaseIndexPlugin } from '@knewbeing/vitepress-plugin-index/vitepress'

export default defineConfig({
  vite: {
    plugins: [
      NolebaseIndexPlugin(),
    ],
  },
})

```

### 2. 注册客户端组件

```ts
// .vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { NolebaseIndexPlugin } from '@knewbeing/vitepress-plugin-index/client'
import '@knewbeing/vitepress-plugin-index/client/style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(NolebaseIndexPlugin)
  },
} satisfies Theme

```

---

## 模块入口 / Module Exports

| 入口 | 说明 |
|------|------|
| `./client` | Vue 组件和 composables（客户端使用） |
| `./client/style.css` | 组件样式 |
| `./locales` | 多语言文本定义 |
| `./vitepress` | VitePress Vite 插件（构建时使用） |

---

## 标签 Store / Tags Store

```ts
import { useIndexTagsStore } from '@knewbeing/vitepress-plugin-index/client/useIndexTagsStore'

const tagsStore = useIndexTagsStore()

// 获取所有标签及计数
console.log(tagsStore.tags) // [{ name: 'Vue', count: 12 }, ...]

// 切换选中标签
tagsStore.toggleTag('Vue')

// 获取当前选中标签
console.log(tagsStore.selectedTag)

```

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-index)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

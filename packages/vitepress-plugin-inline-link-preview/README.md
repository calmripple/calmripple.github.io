# @knewbeing/vitepress-plugin-inline-link-preview

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-inline-link-preview.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-inline-link-preview)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-inline-link-preview.svg)](./LICENSE)

> 鼠标悬停链接时弹出内容预览的 VitePress 插件。

通过 markdown-it 插件将普通链接替换为支持预览弹框的自定义组件，悬停时异步加载目标页面内容并以浮层形式展示，提升文档内导航体验。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/vitepress-plugin-inline-link-preview](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/vitepress-plugin-inline-link-preview](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 🔍 **链接预览弹框** — 鼠标悬停内部链接时，浮出展示目标页面的摘要内容
- ⚡ **按需加载** — 悬停时才触发内容获取，不影响页面初始加载性能
- 🌐 **多语言 UI** — 内置 i18n 支持，加载态、错误态文案可本地化
- 🔧 **markdown-it 插件** — 在 Markdown 解析阶段将链接替换为预览组件，透明集成
- 🎨 **CSS 变量主题** — 弹框样式通过 CSS 变量驱动，便于定制
- 📱 **移动端降级** — 触摸设备上自动禁用悬停预览，保持正常链接行为

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-inline-link-preview
# or
pnpm add @knewbeing/vitepress-plugin-inline-link-preview

```

---

## 快速开始 / Quick Start

### 1. 配置 markdown-it 插件

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { InlineLinkPreviewElementTransform } from '@knewbeing/vitepress-plugin-inline-link-preview/markdown-it'

export default defineConfig({
  markdown: {
    config: (md) => {
      md.use(InlineLinkPreviewElementTransform)
    },
  },
})

```

### 2. 注册客户端组件

```ts
// .vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { NolebaseInlineLinkPreviewPlugin } from '@knewbeing/vitepress-plugin-inline-link-preview/client'
import '@knewbeing/vitepress-plugin-inline-link-preview/client/style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(NolebaseInlineLinkPreviewPlugin)
  },
} satisfies Theme

```

---

## 模块入口 / Module Exports

| 入口 | 说明 |
|------|------|
| `./client` | Vue 插件和组件（客户端使用） |
| `./client/style.css` | 弹框样式 |
| `./locales` | 多语言文本 |
| `./markdown-it` | markdown-it 插件（构建时使用） |

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-inline-link-preview)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

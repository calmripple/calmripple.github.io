# @knewbeing/vitepress-plugin-highlight-targeted-heading

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-highlight-targeted-heading.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-highlight-targeted-heading)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-highlight-targeted-heading.svg)](./LICENSE)

> 高亮当前 URL 锚点（hash）对应标题的 VitePress 插件。

监听路由变化，当 URL 中包含 `#anchor` 时，自动为对应标题元素添加高亮样式，帮助读者快速定位到跳转目标。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/vitepress-plugin-highlight-targeted-heading](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/vitepress-plugin-highlight-targeted-heading](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 🎯 **锚点高亮** — 页面加载或路由跳转时，高亮 URL hash 对应的标题
- ✨ **平滑过渡** — 高亮样式通过 CSS 过渡效果渐显渐隐
- 🌙 **深色模式适配** — 自动适配 VitePress 亮色/暗色主题
- 📱 **响应式兼容** — 移动端和桌面端均正常工作
- ⚡ **轻量实现** — 仅使用 Vue 组合式 API + CSS，无额外依赖

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-highlight-targeted-heading
# or
pnpm add @knewbeing/vitepress-plugin-highlight-targeted-heading

```

---

## 快速开始 / Quick Start

```ts
// .vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { NolebaseHighlightTargetedHeading } from '@knewbeing/vitepress-plugin-highlight-targeted-heading/client'
import '@knewbeing/vitepress-plugin-highlight-targeted-heading/client/style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // 将高亮组件注入到布局中
      'layout-top': () => h(NolebaseHighlightTargetedHeading),
    })
  },
} satisfies Theme

```

---

## 工作原理 / How It Works

1. 组件挂载后，监听 VitePress 路由的 `hash` 变化
2. 当 hash 变化时，查找页面中 `id` 与 hash 匹配的标题元素
3. 为该元素添加 `.VPNolebaseHighlightTargetedHeading--active` CSS 类
4. CSS 通过背景色渐变动画实现高亮效果，一段时间后自动淡出

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-highlight-targeted-heading)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

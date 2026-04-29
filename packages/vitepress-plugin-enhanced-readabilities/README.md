# @knewbeing/vitepress-plugin-enhanced-readabilities

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-enhanced-readabilities.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-enhanced-readabilities)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-enhanced-readabilities.svg)](./LICENSE)

> 为 VitePress 提供增强阅读体验的插件：字体大小调节、页面宽度调节、聚光灯模式等。

在 VitePress 导航栏注入阅读辅助工具面板，读者可以根据个人偏好调整字体大小、内容区宽度和聚焦高亮模式，设置通过 `localStorage` 持久化。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/vitepress-plugin-enhanced-readabilities](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/vitepress-plugin-enhanced-readabilities](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 🔤 **字体大小调节** — 动态调整正文字体大小，范围可配置
- 📐 **页面宽度调节** — 在固定宽度与全宽之间自由切换
- 🔦 **聚光灯模式** — 高亮鼠标悬停的段落，其余内容淡化，专注当前阅读区域
- 💾 **持久化设置** — 用户偏好通过 `localStorage` 跨会话保留
- 🌐 **多语言支持** — 内置简体中文、繁体中文、英语等多语言 UI
- 🎨 **CSS 变量主题** — 样式通过 CSS 变量驱动，便于自定义

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-enhanced-readabilities
# or
pnpm add @knewbeing/vitepress-plugin-enhanced-readabilities

```

---

## 快速开始 / Quick Start

```ts
// .vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { InjectionKey, NolebaseEnhancedReadabilitiesMenu, NolebaseEnhancedReadabilitiesScreenMenu } from '@knewbeing/vitepress-plugin-enhanced-readabilities/client'
import '@knewbeing/vitepress-plugin-enhanced-readabilities/client/style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // 在导航栏右侧插入菜单按钮
      'nav-bar-content-after': () => h(NolebaseEnhancedReadabilitiesMenu),
      // 在移动端屏幕菜单中插入
      'nav-screen-content-after': () => h(NolebaseEnhancedReadabilitiesScreenMenu),
    })
  },
  enhanceApp({ app }) {
    app.provide(InjectionKey, {
      // 可选：自定义配置
    })
  },
} satisfies Theme

```

---

## 配置项 / Options

通过 `app.provide(InjectionKey, options)` 传入：

| 参数 | 类型 | 说明 |
|------|------|------|
| `layoutSwitch` | `object` | 页面宽度切换相关配置 |
| `spotlight` | `object` | 聚光灯模式相关配置 |

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-enhanced-readabilities)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

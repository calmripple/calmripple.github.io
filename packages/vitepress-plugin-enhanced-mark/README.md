# @knewbeing/vitepress-plugin-enhanced-mark

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-enhanced-mark.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-enhanced-mark)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-enhanced-mark.svg)](./LICENSE)

> 为 VitePress `<mark>` 高亮标签提供增强样式的 CSS 包。

通过导入样式文件，为 Markdown 中的 `==高亮文本==` 或 `<mark>` 标签渲染更美观、可定制的高亮效果，支持亮色/暗色主题自适应。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/vitepress-plugin-enhanced-mark](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/vitepress-plugin-enhanced-mark](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 🖌 **增强高亮样式** — 为 `<mark>` 元素提供比浏览器默认更优雅的高亮外观
- 🌙 **深色模式支持** — 自动适配 VitePress 的亮色/暗色主题切换
- 🎨 **CSS 变量驱动** — 使用 CSS 自定义属性，便于在主题中覆盖颜色
- 📦 **纯 CSS 方案** — 无 JavaScript，无运行时开销，直接导入即用

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-enhanced-mark
# or
pnpm add @knewbeing/vitepress-plugin-enhanced-mark

```

---

## 使用 / Usage

在 VitePress 主题入口文件中导入样式：

```ts
// .vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import '@knewbeing/vitepress-plugin-enhanced-mark/client/style.css'

export default {
  extends: DefaultTheme,
} satisfies Theme

```

完成后，Markdown 中的 `==高亮文本==`（需配合 markdown-it-mark 插件）或 `<mark>标签</mark>` 将自动应用增强样式。

---

## Markdown 示例 / Markdown Example

```markdown
这是一段包含 ==高亮文本== 的内容。

<mark>这也是高亮文本</mark>

```

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-enhanced-mark)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

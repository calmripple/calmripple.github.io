# @knewbeing/markdown-it-unlazy-img

[![npm version](https://img.shields.io/npm/v/@knewbeing/markdown-it-unlazy-img.svg)](https://www.npmjs.com/package/@knewbeing/markdown-it-unlazy-img)
[![license](https://img.shields.io/npm/l/@knewbeing/markdown-it-unlazy-img.svg)](./LICENSE)

> 将 Markdown 图片渲染为支持 ThumbHash 低清占位的懒加载组件的 markdown-it 插件。

基于 [unlazy](https://unlazy.byjohann.dev/) 的懒加载方案，配合 ThumbHash 算法为图片生成约 30 bytes 的模糊占位，实现渐进式图片加载体验。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/markdown-it-unlazy-img](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/markdown-it-unlazy-img](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 🖼 **ThumbHash 占位** — 读取预生成的 ThumbHash map 文件，为每张图片附加 `thumbhash` 和 `placeholderSrc` 属性
- 📐 **尺寸保留** — 自动填充图片的原始宽高（`width`/`height`），防止布局抖动
- 📦 **自定义组件标签** — 默认输出 `<UnLazyImage>`，可通过 `imgElementTag` 自定义
- 🔗 **外链跳过** — 自动跳过外部 URL 和不支持的图片格式（仅处理 `.png`/`.jpg`/`.jpeg`）
- 🗺 **灵活的 map 来源** — 支持直接传入 map 对象、指定文件路径或 glob 扫描三种方式

---

## 安装 / Installation

```bash
npm install @knewbeing/markdown-it-unlazy-img
# or
pnpm add @knewbeing/markdown-it-unlazy-img

```

---

## 前置条件 / Prerequisites

使用本插件前，需先通过 ThumbHash 工具生成图片的 map 文件（`thumbhashes/map.json`）。  
该文件通常由 `@nolebase/vitepress-plugin-thumbnail-hash` 在构建时自动生成。

---

## 快速开始 / Quick Start

### 在 VitePress 中使用

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { UnlazyImages } from '@knewbeing/markdown-it-unlazy-img'

export default defineConfig({
  markdown: {
    config: (md) => {
      md.use(UnlazyImages()())
    },
  },
})

```

### 指定 thumbhash map 路径

```ts
md.use(UnlazyImages()(), {
  thumbhash: {
    mapFilePath: './.vitepress/cache/thumbhashes/map.json',
  },
})

```

### 使用自定义图片组件标签

```ts
md.use(UnlazyImages()(), {
  imgElementTag: 'MyLazyImage',
  thumbhash: {
    mapGlobPatterns: ['**/thumbhashes/map.json'],
  },
})

```

---

## 配置项 / Options

### `UnlazyImagesOptions`

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `imgElementTag` | `string` | `'UnLazyImage'` | 输出的自定义图片组件标签名 |
| `thumbhash` | `ThumbnailImageThumbhashOptions` | glob 自动查找 | ThumbHash 数据来源配置 |
| `logFormatNotSupportedWarning` | `boolean` | `false` | 是否对不支持的格式输出警告 |

### `ThumbnailImageThumbhashOptions`（三选一）

```ts
// 方式一：通过 glob 自动查找 map 文件
{ mapGlobPatterns: ['**/thumbhashes/map.json'] }

// 方式二：直接指定 map 文件路径
{ mapFilePath: './.vitepress/cache/thumbhashes/map.json' }

// 方式三：直接传入 map 对象
{ map: { 'images/cover.jpg': { dataBase64: '...', dataUrl: '...', ... } } }

```

---

## 输出示例 / Output Example

```html
<!-- 输入 Markdown -->
![封面图](./images/cover.jpg)

<!-- 生成 HTML -->
<UnLazyImage
  src="./images/cover.jpg"
  alt="封面图"
  thumbhash="3vcRJoJ4iIiHd3..."
  placeholderSrc="data:image/png;base64,..."
  autoSizes="true"
  width="1200"
  height="630"
/>

```

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/markdown-it-unlazy-img)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)
- [unlazy 文档](https://unlazy.byjohann.dev/)

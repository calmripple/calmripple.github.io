# @knewbeing/vitepress-plugin-nolebase

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-nolebase.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-nolebase)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-nolebase.svg)](./LICENSE)

> nolebase 插件套件的一站式封装包：将所有 @knewbeing nolebase 系列插件聚合为单一入口，开箱即用。

Vendored nolebase integrations for VitePress — a local, fork-free copy of the nolebase plugin suite, rewritten to resolve all cross-package imports locally.

## 版权声明 / Copyright

本包代码派生自 [@nolebase/integrations](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/integrations](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

See [NOTICE.md](./NOTICE.md) for full attribution details.

## Included Packages

| Local module | Original package |
|---|---|
| `vitepress/client` | `@nolebase/integrations/vitepress/client` |
| `vitepress/vite` | `@nolebase/integrations/vitepress/vite` |
| `vitepress/markdown-it` | `@nolebase/integrations/vitepress/markdown-it` |
| `meta/vitepress` | `@nolebase/vitepress-plugin-meta` |
| `enhanced-readabilities/*` | `@nolebase/vitepress-plugin-enhanced-readabilities` |
| `highlight-targeted-heading/*` | `@nolebase/vitepress-plugin-highlight-targeted-heading` |
| `git-changelog/*` | `@nolebase/vitepress-plugin-git-changelog` |
| `graph-view/*` | `@nolebase/vitepress-plugin-graph-view` |
| `inline-link-preview/*` | `@nolebase/vitepress-plugin-inline-link-preview` |
| `index-plugin/*` | `@nolebase/vitepress-plugin-index` |
| `enhanced-mark/*` | `@nolebase/vitepress-plugin-enhanced-mark` |
| `ui` | `@nolebase/ui` |

## 功能特性 / Features

- 📦 **一站式封装** — 单包涵盖 enhanced-readabilities、git-changelog、graph-view、inline-link-preview、highlight-targeted-heading、index、enhanced-mark 等全部插件
- 🔧 **本地化跨包引用** — 将所有 @nolebase 包内部 import 改写为本地路径，消除外部依赖冲突
- 🚀 **三行接入** — `presetVite` / `presetClient` / `presetMarkdownIt` 三个预设函数，极简配置
- 🌐 **多语言支持** — 继承所有子插件的 i18n 能力

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-nolebase
# or
pnpm add @knewbeing/vitepress-plugin-nolebase

```

---

## 使用 / Usage

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { presetVite } from '@knewbeing/vitepress-plugin-nolebase/vitepress/vite'
import { transformHeadMeta } from '@knewbeing/vitepress-plugin-nolebase/vitepress/vite'

export default defineConfig({
  vite: {
    plugins: [
      ...presetVite(),
    ],
  },
  async transformHead(ctx) {
    return await transformHeadMeta()(ctx)
  },
})

```

```ts
// .vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { presetClient } from '@knewbeing/vitepress-plugin-nolebase/vitepress/client'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    presetClient(app)
  },
} satisfies Theme

```

```ts
// .vitepress/config.ts（markdown 配置）
import { presetMarkdownIt } from '@knewbeing/vitepress-plugin-nolebase/vitepress/markdown-it'

export default defineConfig({
  markdown: {
    config: (md) => {
      presetMarkdownIt(md)
    },
  },
})

```

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-nolebase)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

# @knewbeing/vitepress-plugin-git-changelog

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-git-changelog.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-git-changelog)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-git-changelog.svg)](./LICENSE)

> 为 VitePress 页面展示 Git 提交历史（贡献者、最后更新时间、变更记录）的插件。

通过 Vite 插件在构建时读取 Git log，将每个 Markdown 文件的提交历史注入为虚拟模块，客户端组件消费后展示贡献者头像列表和文件变更时间线。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/vitepress-plugin-git-changelog](https://github.com/nolebase/integrations)（MIT 许可证）。
原始版权归 [nolebase](https://github.com/nolebase) 所有。
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/vitepress-plugin-git-changelog](https://github.com/nolebase/integrations) (MIT License).
Original copyright belongs to [nolebase](https://github.com/nolebase).
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 📜 **Git 提交历史** — 读取 ``git log`` 为每个 Markdown 文件构建变更时间线
- 👥 **贡献者展示** — 自动聚合文件贡献者，展示头像（GitHub/Gravatar）和用户名
- 🕐 **最后更新时间** — 基于 Git 提交时间计算并展示页面最后修改时间
- 🌐 **多语言 UI** — 内置 i18n，支持简体中文、繁体中文、英语等
- ⚡ **增量构建** — dev 模式下增量更新，文件变更时仅重新处理相关文件
- 🎨 **可定制外观** — 支持自定义贡献者信息映射（昵称、头像、主页链接）

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-git-changelog
# or
pnpm add @knewbeing/vitepress-plugin-git-changelog
```

---

## 快速开始 / Quick Start

### 1. 配置 Vite 插件

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { GitChangelog, GitChangelogMarkdownSection } from '@knewbeing/vitepress-plugin-git-changelog/vite'

export default defineConfig({
  vite: {
    plugins: [
      GitChangelog({
        repoURL: () => 'https://github.com/your-org/your-repo',
      }),
      GitChangelogMarkdownSection(),
    ],
  },
})
```

### 2. 注册客户端组件

```ts
// .vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { NolebaseGitChangelogPlugin } from '@knewbeing/vitepress-plugin-git-changelog/client'
import '@knewbeing/vitepress-plugin-git-changelog/client/style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(NolebaseGitChangelogPlugin)
  },
} satisfies Theme
```

---

## 模块入口 / Module Exports

| 入口 | 说明 |
|------|------|
| ``./client`` | Vue 插件和组件（客户端使用） |
| ``./client/style.css`` | 组件样式 |
| ``./locales`` | 多语言文本 |
| ``./vite`` | Vite 构建插件（构建时使用） |

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-git-changelog)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

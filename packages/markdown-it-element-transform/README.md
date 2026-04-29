# @knewbeing/markdown-it-element-transform

[![npm version](https://img.shields.io/npm/v/@knewbeing/markdown-it-element-transform.svg)](https://www.npmjs.com/package/@knewbeing/markdown-it-element-transform)
[![license](https://img.shields.io/npm/l/@knewbeing/markdown-it-element-transform.svg)](./LICENSE)

> 在 markdown-it Token 级别对 AST 进行自定义转换的插件。

通过注入 core ruler 钩子，遍历所有 Token（包括子 Token），执行自定义 `transform` 函数，实现对 Markdown 渲染结果的精细化控制。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/markdown-it-element-transform](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/markdown-it-element-transform](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 🔧 **Token 级别转换** — 在 markdown-it core ruler 阶段遍历所有 Token（含子 Token）
- 🧩 **灵活的 transform 函数** — 接收 `(token, state, env)` 三个参数，可修改 token 的任意属性
- 🪄 **递归子 Token** — 自动遍历 `token.children`，无需手动递归
- 📦 **零额外依赖** — 仅依赖 `markdown-it` peerDependency

---

## 安装 / Installation

```bash
npm install @knewbeing/markdown-it-element-transform
# or
pnpm add @knewbeing/markdown-it-element-transform

```

---

## 快速开始 / Quick Start

```ts
import MarkdownIt from 'markdown-it'
import { ElementTransform } from '@knewbeing/markdown-it-element-transform'

const md = new MarkdownIt()

md.use(ElementTransform, {
  transform(token, state, env) {
    // 为所有外链添加 target="_blank"
    if (token.type === 'link_open') {
      const href = token.attrGet('href') ?? ''
      if (href.startsWith('http')) {
        token.attrSet('target', '_blank')
        token.attrSet('rel', 'noopener noreferrer')
      }
    }
  },
})

```

### 在 VitePress 中使用

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { ElementTransform } from '@knewbeing/markdown-it-element-transform'

export default defineConfig({
  markdown: {
    config: (md) => {
      md.use(ElementTransform, {
        transform(token) {
          // 为图片添加懒加载属性
          if (token.type === 'image') {
            token.attrSet('loading', 'lazy')
          }
        },
      })
    },
  },
})

```

---

## API

### `ElementTransform`

类型：`PluginWithOptions<Options>`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `options.transform` | `(token, state, env) => void` | ✅ | Token 转换函数 |

**transform 函数参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `token` | `Token` | 当前 markdown-it Token |
| `state` | `StateCore` | markdown-it 解析状态 |
| `env` | `any` | 环境对象（VitePress 中含 `path`、`relativePath` 等） |

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/markdown-it-element-transform)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

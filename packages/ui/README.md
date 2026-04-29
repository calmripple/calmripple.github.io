# @knewbeing/ui

[![npm version](https://img.shields.io/npm/v/@knewbeing/ui.svg)](https://www.npmjs.com/package/@knewbeing/ui)
[![license](https://img.shields.io/npm/l/@knewbeing/ui.svg)](./LICENSE)

> 供 @knewbeing VitePress 插件套件内部使用的 Vue 3 基础 UI 组件库。

包含按钮、标签、滑块、单选组、高亮输入、过渡动画等基础组件，以及 i18n 国际化 composable，为插件的 UI 层提供统一的视觉和交互基础。

---

## 版权声明 / Copyright

本包代码派生自 [@nolebase/ui](https://github.com/nolebase/integrations)（MIT 许可证）。  
原始版权归 [nolebase](https://github.com/nolebase) 所有。  
由 [knewbeing](https://www.dmsrs.org)（知在，zz@dmsrs.org）改进并重新发布，修改部分仍遵循 MIT 许可证。

This package is derived from [@nolebase/ui](https://github.com/nolebase/integrations) (MIT License).  
Original copyright belongs to [nolebase](https://github.com/nolebase).  
Improved and republished by [knewbeing](https://www.dmsrs.org) (zz@dmsrs.org). Modifications remain under MIT License.

---

## 功能特性 / Features

- 🎨 **NuButton** — 通用按钮组件，支持多种尺寸与变体
- 🏷 **NuTag** — 标签/徽章组件，用于展示分类或状态信息
- 🎚 **NuInputSlider** — 滑块输入组件，适用于数值范围选择
- 📻 **NuInputHorizontalRadioGroup** — 水平布局的单选组组件
- ✨ **NuInputHighlight** — 带高亮效果的输入框组件
- 🔄 **NuVerticalTransition** — 垂直方向的 Vue 过渡动画组件
- 🌐 **createI18n** — 轻量级 i18n composable，支持多语言文本配置

---

## 安装 / Installation

```bash
npm install @knewbeing/ui
# or
pnpm add @knewbeing/ui

```

> ⚠️ 本包为 `@knewbeing/*` 插件套件的内部依赖，通常无需单独安装。

---

## 使用 / Usage

### 注册组件

```ts
import {
  NuButton,
  NuInputHighlight,
  NuInputHorizontalRadioGroup,
  NuInputSlider,
  NuTag,
  NuVerticalTransition,
} from '@knewbeing/ui'

// 在 Vue 应用中全局注册
app.component('NuButton', NuButton)
app.component('NuTag', NuTag)

```

### 使用 createI18n

```ts
import { createI18n } from '@knewbeing/ui'

const i18n = createI18n({
  'zh-CN': {
    greeting: '你好',
    farewell: '再见',
  },
  'en': {
    greeting: 'Hello',
    farewell: 'Goodbye',
  },
})

// 在组件中使用
const { t } = i18n
console.log(t('greeting')) // '你好' 或 'Hello'，取决于当前语言

```

---

## 导出列表 / Exports

| 名称 | 类型 | 说明 |
|------|------|------|
| `NuButton` | Vue Component | 通用按钮 |
| `NuTag` | Vue Component | 标签/徽章 |
| `NuInputSlider` | Vue Component | 滑块输入 |
| `NuInputHorizontalRadioGroup` | Vue Component | 水平单选组 |
| `NuInputHighlight` | Vue Component | 高亮输入框 |
| `NuVerticalTransition` | Vue Component | 垂直过渡动画 |
| `createI18n` | Composable | i18n 工厂函数 |

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/ui)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [原始项目](https://github.com/nolebase/integrations)

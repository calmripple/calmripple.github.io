---
applyTo: "**"
---

<!--
📋 【中文注释】
  工具名称: 通用编码规范
  功能分类: 编码规范
  功能说明: 用于规范代码风格，强调清晰命名、单一职责、错误处理和代码复用。
  使用方式: 自动应用于所有代码编辑和审查，无需手动调用。
  关键标签: 编码规范、清晰、复用、错误处理
-->
# General Coding Instructions

Follow these principles when writing or reviewing code:

- **Clean Code**: Use meaningful names; keep functions small and focused (single responsibility).
- **DRY / SOLID**: Avoid duplication; prefer composition over deep inheritance.
- **Error Handling**: Always handle errors and edge cases explicitly; never swallow exceptions silently.
- **Type Safety**: Use type hints / annotations wherever the language supports them.
- **Comments**: Explain *why*, not *what*; let clear code explain itself.
- **Testing**: Write or update tests for every change; cover edge cases and error paths.
- **Security**: Validate all inputs; never log secrets; follow least-privilege for permissions.
- **Performance**: Profile before optimising; prefer readability over premature optimisation.

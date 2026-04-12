---
name: document
description: Generate API documentation and usage examples for selected code
---

<!--
📝 【中文注释】
  工具名称: 文档生成器
  功能分类: 文档生成
  功能说明: 帮助生成 API 文档和代码使用示例，提升代码可读性和维护性。
  使用方式: 在 VS Code 选中代码后右键选择“Copilot: Generate Documentation”；GitHub PR 评论中可调用。
  关键标签: 文档生成、API、注释、代码说明
-->
Generate clear, professional documentation for the following code:

1. **Overview** — purpose and responsibility of the module/class/function.
2. **Parameters** — name, type, and description for every input.
3. **Returns** — type and meaning of the return value.
4. **Raises / Throws** — exceptions that may occur and when.
5. **Examples** — 1–2 realistic usage examples with expected output.
6. **Notes** — thread-safety, deprecations, or important caveats.

Use the documentation style appropriate for this language (JSDoc, docstring, XML docs, etc.).

${selection}

---
name: refactor
description: Suggest targeted refactoring improvements for selected code
---

<!--
♻️ 【中文注释】
  工具名称: 代码重构助手
  功能分类: 代码重构
  功能说明: 分析代码并提出重构建议，优化结构，消除代码异味，提升可维护性。
  使用方式: 在 VS Code 选中代码后右键选择“Copilot: Refactor”；GitHub PR 评论中可调用。
  关键标签: 代码重构、优化、SOLID、DRY
-->
Analyse the following code and propose refactoring improvements:

1. Identify code smells, anti-patterns, or violations of SOLID/DRY principles.
2. Suggest specific improvements with before/after examples.
3. Prioritise changes by impact (High / Medium / Low).
4. Ensure the refactored version preserves the original behaviour.
5. Note any tests that need updating.

${selection}

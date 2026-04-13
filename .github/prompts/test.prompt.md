---
name: test
description: Generate comprehensive tests for selected code
---

<!--
🧪 【中文注释】
  工具名称: 测试生成器
  功能分类: 测试辅助
  功能说明: 自动生成全面的单元测试和集成测试，覆盖正常、边界和异常场景。
  使用方式: 在 VS Code 选中代码后右键选择“Copilot: Generate Tests”；GitHub PR 评论中可调用。
  关键标签: 测试生成、单元测试、集成测试
-->
Generate thorough tests for the following code using the project's existing test framework:

1. **Happy path** — standard inputs that should succeed.
2. **Edge cases** — boundary values, empty inputs, maximum sizes.
3. **Error paths** — invalid inputs, exceptions, and failure modes.
4. **Mocking** — stub external dependencies (I/O, APIs, databases) where appropriate.
5. Use clear test names that describe the scenario being tested.

${selection}

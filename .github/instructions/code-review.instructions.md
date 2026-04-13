---
applyTo: "**"
---

<!--
🔍 【中文注释】
  工具名称: 代码审查规范
  功能分类: 代码审查
  功能说明: 用于代码审查，关注正确性、安全、错误处理和性能等方面。
  使用方式: 自动应用于 Copilot 代码审查流程，无需手动调用。
  关键标签: 代码审查、安全、性能、错误处理
-->
# Code Review Instructions

When reviewing code, focus on:

1. **Correctness** — logic errors, off-by-one, race conditions, incorrect assumptions.
2. **Security** — injection, broken auth, insecure deserialization, exposed secrets.
3. **Error Handling** — uncaught exceptions, silent failures, missing input validation.
4. **Performance** — unnecessary I/O, N+1 queries, blocking calls in async contexts.
5. **API Design** — backwards compatibility, consistent naming, clear contracts.
6. **Test Coverage** — are new code paths covered? Are edge cases tested?
7. **Readability** — would a new team member understand this in 60 seconds?

Be constructive: suggest *how* to improve, not just *what* is wrong.

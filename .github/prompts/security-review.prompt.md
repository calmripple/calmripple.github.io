---
name: security-review
description: Perform a focused security review of selected code
---

<!--
🔒 【中文注释】
  工具名称: 安全审查助手
  功能分类: 安全审计
  功能说明: 对选中代码进行安全审查，检测注入风险、权限缺失、敏感信息等安全问题。
  使用方式: 在 VS Code 选中代码后右键选择“Copilot: Security Review”；GitHub PR 评论中可调用。
  关键标签: 安全审计、漏洞检测、权限检查
-->
Perform a security review of the following code:

1. **Injection risks** — SQL, command, LDAP, XSS, template injection.
2. **Authentication & authorisation** — missing checks, privilege escalation paths.
3. **Secrets & sensitive data** — hardcoded credentials, insecure storage, logged PII.
4. **Dependency risks** — known-vulnerable libraries or unsafe API usage.
5. **Cryptography** — weak algorithms, insecure randomness, improper key management.
6. **Input validation** — missing sanitisation, unchecked trust boundaries.

For each finding: rate severity (Critical / High / Medium / Low), explain the risk, and show the fix.

${selection}

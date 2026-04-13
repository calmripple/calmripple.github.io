---
name: playwright-generate-test
description: 'Generate a Playwright test based on a scenario using Playwright MCP'
---

<!--
🧪 【中文注释】
  工具名称: 自动生成测试
  功能分类: 测试辅助
  功能说明: 帮助根据场景生成 Playwright 自动化测试脚本，提升测试效率。
  使用方式: 在 VS Code 中通过 Copilot Chat 输入测试场景自动调用。
  关键标签: Playwright、测试生成、自动化、脚本
-->

# Test Generation with Playwright MCP

Your goal is to generate a Playwright test based on the provided scenario after completing all prescribed steps.

## Specific Instructions

- You are given a scenario, and you need to generate a playwright test for it. If the user does not provide a scenario, you will ask them to provide one.
- DO NOT generate test code prematurely or based solely on the scenario without completing all prescribed steps.
- DO run steps one by one using the tools provided by the Playwright MCP.
- Only after all steps are completed, emit a Playwright TypeScript test that uses `@playwright/test` based on message history
- Save generated test file in the tests directory
- Execute the test file and iterate until the test passes

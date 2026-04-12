---
name: my-pull-requests
description: 'List my pull requests in the current repository'
---

<!--
📌 【中文注释】
  工具名称: 我的PR列表
  功能分类: 任务规划
  功能说明: 帮助列出当前仓库中分配给我的 Pull Request，并提示待审核事项。
  使用方式: 在 Copilot Chat 或 VS Code 中输入“列出我的 PR”自动调用。
  关键标签: Pull Request、任务管理、代码审核、规划
-->

Search the current repo (using #githubRepo for the repo info) and list any pull requests you find (using #list_pull_requests) that are assigned to me.

Describe the purpose and details of each pull request.

If a PR is waiting for someone to review, highlight that in the response.

If there were any check failures on the PR, describe them and suggest possible fixes.

If there was no review done by Copilot, offer to request one using #request_copilot_review.

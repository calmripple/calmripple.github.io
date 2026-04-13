---
name: my-pull-requests
description: 'List my pull requests in the current repository'
---

<!--
📌 【中文注释】
  工具名称: 我的拉取请求
  功能分类: 任务规划
  功能说明: 用于列出当前仓库中分配给我的所有拉取请求，并突出待审核项。
  使用方式: 在 GitHub Copilot Chat 或命令面板中调用 my-pull-requests 工具，自动获取相关 PR。
  关键标签: GitHub、拉取请求、任务规划、审核
-->

Search the current repo (using #githubRepo for the repo info) and list any pull requests you find (using #list_pull_requests) that are assigned to me.

Describe the purpose and details of each pull request.

If a PR is waiting for someone to review, highlight that in the response.

If there were any check failures on the PR, describe them and suggest possible fixes.

If there was no review done by Copilot, offer to request one using #request_copilot_review.

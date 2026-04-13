---
name: what-context-needed
description: 'Ask Copilot what files it needs to see before answering a question'
---

<!--
📌 【中文注释】
  工具名称: 上下文需求分析
  功能分类: 任务规划
  功能说明: 用于分析回答问题前所需的文件上下文，帮助规划代码审查或开发任务。通过 Copilot 提示，列出相关文件及原因。
  使用方式: 在 Copilot Chat 中输入问题，触发技能自动分析所需文件。
  关键标签: 任务规划、上下文分析、Copilot
-->

# What Context Do You Need?

Before answering my question, tell me what files you need to see.

## My Question

{{question}}

## Instructions

1. Based on my question, list the files you would need to examine
2. Explain why each file is relevant
3. Note any files you've already seen in this conversation
4. Identify what you're uncertain about

## Output Format

```markdown
## Files I Need

### Must See (required for accurate answer)
- `path/to/file.ts` — [why needed]

### Should See (helpful for complete answer)
- `path/to/file.ts` — [why helpful]

### Already Have
- `path/to/file.ts` — [from earlier in conversation]

### Uncertainties
- [What I'm not sure about without seeing the code]
```

After I provide these files, I'll ask my question again.

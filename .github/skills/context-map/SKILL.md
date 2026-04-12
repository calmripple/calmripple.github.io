---
name: context-map
description: 'Generate a map of all files relevant to a task before making changes'
---

<!--
📌 【中文注释】
  工具名称: 上下文地图
  功能分类: 任务规划
  功能说明: 帮助分析代码库并生成任务相关文件的上下文地图，便于变更前全面了解依赖关系。
  使用方式: 在 VS Code 中通过 Copilot Chat 输入“生成任务上下文地图”或描述具体任务，自动触发分析。
  关键标签: 任务拆解、依赖分析、代码导航
-->

# Context Map

Before implementing any changes, analyze the codebase and create a context map.

## Task

{{task_description}}

## Instructions

1. Search the codebase for files related to this task
2. Identify direct dependencies (imports/exports)
3. Find related tests
4. Look for similar patterns in existing code

## Output Format

```markdown
## Context Map

### Files to Modify
| File | Purpose | Changes Needed |
|------|---------|----------------|
| path/to/file | description | what changes |

### Dependencies (may need updates)
| File | Relationship |
|------|--------------|
| path/to/dep | imports X from modified file |

### Test Files
| Test | Coverage |
|------|----------|
| path/to/test | tests affected functionality |

### Reference Patterns
| File | Pattern |
|------|---------|
| path/to/similar | example to follow |

### Risk Assessment
- [ ] Breaking changes to public API
- [ ] Database migrations needed
- [ ] Configuration changes required
```

Do not proceed with implementation until this map is reviewed.

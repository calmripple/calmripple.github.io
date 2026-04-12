---
name: context-map
description: 'Generate a map of all files relevant to a task before making changes'
---

<!--
📌 【中文注释】
  工具名称: 上下文映射
  功能分类: 任务规划
  功能说明: 帮助分析代码库并生成与任务相关的文件和依赖关系映射，便于变更前全局把控。
  使用方式: 在 Copilot Chat 中输入“分析上下文”或“生成依赖映射”时自动触发。
  关键标签: 代码分析、依赖关系、任务规划、全局视图
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

---
name: refactor-plan
description: 'Plan a multi-file refactor with proper sequencing and rollback steps'
---

<!--
♻️ 【中文注释】
  工具名称: 重构计划制定
  功能分类: 代码重构
  功能说明: 帮助制定多文件重构计划，合理安排顺序并支持回滚步骤。
  使用方式: 在 Copilot Chat 中输入“制定重构计划”或“多文件重构”自动调用。
  关键标签: 重构、计划、多文件、回滚
-->

# Refactor Plan

Create a detailed plan for this refactoring task.

## Refactor Goal

{{refactor_description}}

## Instructions

1. Search the codebase to understand current state
2. Identify all affected files and their dependencies
3. Plan changes in a safe sequence (types first, then implementations, then tests)
4. Include verification steps between changes
5. Consider rollback if something fails

## Output Format

```markdown
## Refactor Plan: [title]

### Current State
[Brief description of how things work now]

### Target State
[Brief description of how things will work after]

### Affected Files
| File | Change Type | Dependencies |
|------|-------------|--------------|
| path | modify/create/delete | blocks X, blocked by Y |

### Execution Plan

#### Phase 1: Types and Interfaces
- [ ] Step 1.1: [action] in `file.ts`
- [ ] Verify: [how to check it worked]

#### Phase 2: Implementation
- [ ] Step 2.1: [action] in `file.ts`
- [ ] Verify: [how to check]

#### Phase 3: Tests
- [ ] Step 3.1: Update tests in `file.test.ts`
- [ ] Verify: Run `npm test`

#### Phase 4: Cleanup
- [ ] Remove deprecated code
- [ ] Update documentation

### Rollback Plan
If something fails:
1. [Step to undo]
2. [Step to undo]

### Risks
- [Potential issue and mitigation]
```

Shall I proceed with Phase 1?

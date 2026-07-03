# Rego 代码高亮降级提示修复计划

## 问题

本地运行 VitePress 时出现提示：

```text
The language 'rego' is not loaded, falling back to 'txt' for syntax highlighting.
```

该提示来自 Markdown 代码围栏语言标识。当前项目里只有一处使用 `rego` 代码围栏：

```text
zh-CN/笔记/🤖 AI 与智能/AI 工具与平台/harness-maintenance.md
```

VitePress 当前高亮器没有加载 `rego` 语言，因此渲染时会降级为文本并打印提示。

## 修复策略

采用最小改动：将该代码块语言从 `rego` 改为 `text`。

原因：

- 该片段是 OPA/Rego 策略示例，内容不需要执行。
- 改为 `text` 后仍完整保留示例内容。
- 避免为了单个示例引入额外高亮语言注册或依赖。
- `text` 是稳定支持的代码围栏语言，不会触发高亮器降级提示。

## 已执行修改

- 已将 `harness-maintenance.md` 中的 Rego 语言代码围栏改为 `text` 代码围栏。
- 已保留代码块内部 Rego 示例内容不变。

## 验证方式

执行以下检查：

```bash
rg '^[[:space:]]*(```|~~~)[[:space:]]*rego\b' --glob '*.md' .
```

期望结果：没有匹配项。

重新启动 VitePress 后，应不再出现：

```text
The language 'rego' is not loaded, falling back to 'txt' for syntax highlighting.
```

## 后续可选方案

如果后续出现大量 Rego/OPA 文档，并且需要语法高亮，可以再评估是否在 VitePress/Shiki 配置中注册 Rego 语言。当前不建议为单个代码块增加配置复杂度。

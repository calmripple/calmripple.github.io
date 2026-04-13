# 🤖 GitHub Copilot 配置中心

此目录包含整个项目的 GitHub Copilot 配置、自定义指令、工作流和技能定义。

## 📂 目录结构

```
.github/
├── agents/                          # 预定义工作模式 (5 + 外部)
│   ├── 1-Architecture/             # API/系统设计
│   ├── 2-DevOps/                   # 部署与基础设施
│   ├── 3-Quality/                  # 代码质量审查
│   ├── 4-Testing/                  # 自动化测试
│   └── external/                   # 从 GitHub 趋势库自动集成
├── instructions/                   # 全局开发指南 (9 + 外部)
│   ├── 1-Documentation/            # 文档规范
│   ├── 2-Code-Quality/             # 代码质量与安全
│   ├── 3-Standards/                # 语言与风格标准
│   └── external/                   # 从 GitHub 趋势库自动集成
├── skills/                         # 技能模块 (30+ + 外部)
│   ├── 1-Development-Tools/        # Git、CLI、环境
│   ├── 2-Code-Quality/             # 重构、安全、验证
│   ├── 3-Testing-Debug/            # 测试与调试
│   ├── 4-Documentation/            # 文档与内容
│   ├── 5-Productivity/             # 策略与规划
│   ├── 6-File-Management/          # 文件处理
│   └── external/                   # 从 GitHub 趋势库自动集成
├── workflows/                      # GitHub Actions (6)
│   ├── daily-trending-integration.yml  # 🆕 每日趋势库集成
│   ├── auto-create-pr-on-push.yml
│   ├── cleanup-workflow-runs.yml
│   ├── create-release-from-tag.yml
│   ├── deploy-pages-via-github-actions.yml
│   └── welcome-new-contributors.yml
└── README.md                       # 此文件
```

## 🎯 快速入门

### 选择 Agent（工作模式）

根据你的任务选择合适的工作模式：

- **API Architect** - 设计和实现 REST API
- **Context Architect** - 规划多文件重构
- **DevOps Expert** - 自动化与部署
- **gem-reviewer** - 代码安全审计
- **Playwright Tester** - 编写 E2E 测试

### 参考 Instructions（指南）

在整个工作流程中自动遵循：

- **Markdown 规范** - 文档标准
- **代码质量** - review、安全、性能
- **语言标准** - Node.js/JavaScript、中文回复

### 使用 Skills（技能）

为特定任务调用技能：

```
开发工具  → git-commit, gh-cli, lsp-setup
代码质量  → refactor, security-review, doublecheck
测试调试  → code-runner, playwright-*, webapp-testing
文档编写  → documentation-writer, markdown-to-html
效率工具  → autoresearch, prompt-builder, context-map
文件处理  → docx, xlsx, pdf, pptx
```

## 🌐 自动集成 GitHub 趋势库

### 📅 Daily Trending Integration Workflow

新增的**每日自动集成**工作流会：

1. **🔍 发现趋势** - 每天搜索 GitHub 趋势库中星数最高的前 10 个项目
2. **📥 检测配置** - 自动识别包含 Copilot 配置的项目
3. **✅ 评估兼容性** - 检查配置与当前项目的技术栈是否匹配
4. **📦 安装配置** - 将兼容配置复制到 `external/` 目录
5. **🤖 AI 分析** - 使用 AI 进行智能分类和组织
6. **📚 生成文档** - 自动生成 README 和使用说明

### 执行时间表

```
⏰ 每天 8:00 UTC (16:00 CST)
📊 结果通过 GitHub Actions 日志查看
📝 生成报告: .github/integration-report-YYYYMMDD.md
```

### 工作流特点

- ✅ **自动化** - 无需手动操作
- ✅ **智能化** - 使用关键词和模式匹配
- ✅ **可控化** - 所有变更都在 Git 历史中
- ✅ **可扩展** - 支持与 OpenAI/Claude 集成
- ✅ **透明化** - 每次运行都生成详细报告

### 触发工作流

#### 自动执行
每天 UTC 8:00 自动运行

#### 手动执行
在 GitHub Actions 页面中：
1. 选择 `Daily Trending Copilot Integration` workflow
2. 点击 `Run workflow`
3. 选择分支并确认

#### GitHub CLI
```bash
gh workflow run daily-trending-integration.yml
```

## 🔄 工作流程

```
①选择 Agent         →  ②遵循 Instructions   →  ③调用 Skills
   ↓                          ↓                      ↓
设置工作模式        应用全局标准         执行具体任务
   ↓                          ↓                      ↓
④使用 Workflows     →  ⑤基于 external      →  ⑥持续优化
   ↓                        ↓                      ↓
自动化 CI/CD    自动集成最佳实践      改进配置质量
```

## 📊 统计

| 类别 | 本地 | 集成 | 总计 |
|------|------|------|------|
| Agents | 5 | ↑ | 5+ |
| Instructions | 9 | ↑ | 9+ |
| Skills | 30+ | ↑ | 30+ |
| Workflows | 6 | - | 6 |

## 🛠️ 相关脚本

### 自动组织脚本

位置: `scripts/auto-organize-copilot-configs.js` (Node.js)

手动运行：
```bash
node scripts/auto-organize-copilot-configs.js
```

### AI 分析脚本

位置: `scripts/auto-organize-copilot-configs.py` (Python)

手动运行：
```bash
python scripts/auto-organize-copilot-configs.py
```

## 📋 整体架构

```
┌─ GitHub Actions Workflow ─────────────────┐
│  daily-trending-integration.yml            │
├────────────────────────────────────────────┤
│  1. 🔍 Discover Trending Repos             │
│     └─ GitHub API 搜索                    │
│  2. 📥 Fetch Configurations               │
│     └─ 下载 agents/instructions/skills     │
│  3. ✅ Compatibility Check                │
│     └─ 关键词匹配和规则引擎              │
│  4. 📦 Install & Organize                 │
│     └─ 复制到 external/ 并分类            │
│  5. 🤖 AI Analysis & Organization         │
│     └─ 使用 Node.js/Python 脚本           │
│  6. 📚 Generate Documentation             │
│     └─ 自动生成 README 和报告             │
│  7. 🔄 Commit & Push                      │
│     └─ 提交变更到 main 或创建 PR          │
└────────────────────────────────────────────┘
```

## 📌 最佳实践

1. **定期审查** - 每周检查新集成的配置
2. **质量控制** - 只在本地测试通过后才提交
3. **文档优先** - 为所有配置添加说明
4. **版本管理** - 使用 Git 的历史跟踪所有变更
5. **社区贡献** - 优质配置可回馈给原项目

## 🔗 相关文档

- [整理规划](./ORGANIZATION_PLAN.md) - 详细的结构说明
- [GitLens 配置](../GITLENS_CONFIG.md) - Branch 和 Git 管理
- [GitHub Copilot 文档](https://github.com/github/copilot-docs)

## 🚀 启用自动集成

### 前置条件

1. GitHub 核心权限（通常已有）
2. （可选）OpenAI API 密钥用于增强 AI 分析
3. （可选）Copilot Chat 订阅

### 第一次运行

1. 工作流会自动在首次创建后运行
2. 查看 Actions 标签页查看执行结果
3. 检查生成的报告：`.github/integration-report-*.md`
4. 审查新集成的配置

## 💡 未来规划

- [ ] 支持自定义过滤条件
- [ ] 与 VS Code 扩展市场集成
- [ ] 支持配置评分和投票
- [ ] 集成更多 AI 模型（Claude、Gemini 等）
- [ ] 生成趋势分析报告
- [ ] 支持配置推荐系统

## 🤝 贡献

如果你的项目有优质的 Copilot 配置，可以：

1. 在 `.github/` 中组织好配置
2. 添加详细的 README
3. 标记 `copilot-*` 标签
4. 项目会在下次工作流运行时被自动发现

## 📝 许可证

此目录中的所有配置均遵循相关的开源许可。具体详见各个文件。

---

**最后更新**: 2026-04-12
**维护者**: 知在 (knewbeing)
**自动化程度**: 🟢 高度自动化

> 💡 **提示**: 工作流会自动保持这个目录的最新状态。无需手动干预。

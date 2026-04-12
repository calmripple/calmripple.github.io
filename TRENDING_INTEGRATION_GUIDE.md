# 🤖 Daily Trending Copilot Integration - 完整指南

## 概述

本指南介绍如何使用新的**每日趋势库自动集成** workflow，它能够：

1. 📅 每天自动发现 GitHub 趋势库中的优质 Copilot 配置
2. ✅ 智能评估与当前项目的兼容性
3. 📦 自动安装和整理新配置
4. 🤖 使用 AI 进行分类和组织
5. 📚 自动生成使用文档

## 工作流文件

**位置**: `.github/workflows/daily-trending-integration.yml`

**执行频率**: 每天 08:00 UTC (16:00 CST)

## 工作原理

### 阶段 1: 发现趋势库

```
GitHub API 搜索
    ↓
查询条件:
  - stars: > 1000 (过去 7 天)
  - 包含 .github/agents OR .github/instructions OR .github/skills
  - 语言: JavaScript/TypeScript
    ↓
返回: 前 10 个趋势库
```

### 阶段 2: 检测和下载配置

```
遍历每个趋势库
    ↓
检查是否有以下目录:
  - .github/agents/
  - .github/instructions/
  - .github/skills/
    ↓
下载匹配的文件到临时目录
```

### 阶段 3: 兼容性评估

使用规则引擎进行多维度评估:
- ✓ 格式验证 (YAML/Markdown/JSON)
- ✓ 关键词匹配 (与项目技术栈对比)
- ✓ 安全性检查 (防止恶意代码)
- ✓ 文档完整性检查

### 阶段 4: 自动组织

```
兼容的配置
    ↓
移动到本地目录: .github/*/external/
    ↓
按照关键词自动分类
    ↓
执行 JavaScript 脚本进行初步组织
```

### 阶段 5: AI 分析和增强

```
Python 分析脚本
    ↓
- 深度内容分析
- 生成配置摘要
- 格式验证
- 智能分类
    ↓
（可选）集成 OpenAI/Claude 进行高级分析
```

### 阶段 6: 文档生成

自动生成:
- 每个分类的 README
- 集成统计报告
- 使用指南
- 兼容性说明

### 阶段 7: 提交和推送

```
检查是否有变更
    ↓
是 → 提交到 Git
    ↓
手动触发时创建 PR
自动触发时直接推送到 main
```

## 辅助脚本

### 1. Node.js 组织脚本

**文件**: `scripts/auto-organize-copilot-configs.js`

```bash
node scripts/auto-organize-copilot-configs.js
```

功能:
- 扫描外部配置目录
- 基于关键词进行分类
- 为每个分类生成 README
- 生成集成报告

输出:
```
.github/
├── agents/external/
│   ├── Development-Tools/
│   ├── Code-Quality/
│   └── README.md
└── ...
```

### 2. Python AI 分析脚本

**文件**: `scripts/auto-organize-copilot-configs.py`

```bash
python scripts/auto-organize-copilot-configs.py
```

功能:
- 深度分析配置文件
- 提取关键信息和摘要
- 格式和内容验证
- AI 驱动的智能分类
- 生成详细的分析报告

输出:
```
.github/ai-analysis-YYYYMMDD.md
```

## 配置和定制

### 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| GITHUB_TOKEN | GitHub API 认证 | Actions 自动提供 |
| OPENAI_API_KEY | OpenAI API (可选) | 需手动配置 |

### 设置 OpenAI API 密钥

1. 获取 API 密钥: https://platform.openai.com/api-keys
2. 在 GitHub 仓库设置中添加 Secret: `OPENAI_API_KEY`
3. Workflow 会自动使用增强的 AI 分析

### 自定义搜索条件

编辑 `.github/workflows/daily-trending-integration.yml`:

```yaml
env:
  QUERY: "stars:>1000 created:>$(date -d '7 days ago' +%Y-%m-%d) ..."
  TRENDING_LIMIT: 10  # 改为其他数字
```

### 修改执行时间

编辑 `.github/workflows/daily-trending-integration.yml`:

```yaml
schedule:
  - cron: '0 8 * * *'  # 改为其他时间 (UTC)
```

常见时间表:
- `0 8 * * *` - 每天 08:00 UTC
- `0 2,8,14,20 * * *` - 每 6 小时一次
- `0 0 * * 0` - 每周一 00:00 UTC

## 查看执行结果

### GitHub Web 界面

1. 打开仓库主页
2. 点击 "Actions" 标签
3. 选择 "Daily Trending Copilot Integration"
4. 查看最新的执行结果

### 查看日志

```bash
# 查看最新的工作流运行
gh workflow view daily-trending-integration.yml

# 查看具体的运行日志
gh run view <RUN_ID> --log
```

### 查看生成的报告

集成完成后会生成报告文件:

```
.github/integration-report-YYYYMMDD.md
.github/ai-analysis-YYYYMMDD.md
```

查看:
```bash
cat .github/integration-report-$(date +%Y%m%d).md
```

## 常见问题

### Q: Workflow 没有执行?

A: 检查以下几点:
- GitHub Actions 是否已启用
- Workflow 文件是否在正确的路径 (`.github/workflows/`)
- 分支是否为 main 或指定的分支
- 计划时间是否已过

### Q: 下载速度很慢?

A: 可能是 GitHub API 速率限制。解决方式:
- 设置 `GITHUB_TOKEN` secret
- 减少检查的库的数量
- 增加检查间隔

### Q: 出现安全警告?

A: 所有下载的代码都需要手动审查。建议:
- 在 PR 中进行代码审查
- 运行本地测试
- 使用 security scanning 工具

### Q: 能否只在特定条件下运行?

A: 可以修改 workflow 的触发条件:

```yaml
on:
  schedule:
    - cron: '0 8 * * *'
  workflow_dispatch:
  push:
    paths:
      - '.github/**'
```

## 最佳实践

### 1. 定期审查

- 每周检查 `integration-report-*.md`
- 审查新添加的配置
- 验证分类是否正确

### 2. 质量控制

- 在本地测试新配置
- 检查是否有安全问题
- 确保文档完整

### 3. 保持整洁

- 删除不再使用的配置
- 定期清理 external 目录
- 将高质量配置提升到主分类

### 4. 贡献回馈

- 优化发现的配置
- 提交改进到原项目
- 分享最佳实践

## 故障排除

### 常见错误

#### `Module not found: octokit`

解决:
```bash
npm install octokit
```

#### `YAML parsing error`

检查:
- 文件编码是否为 UTF-8
- YAML 缩进是否正确
- 是否有非法字符

#### `Permission denied`

检查:
- GitHub Token 是否有正确的权限
- 仓库权限设置
- Branch 保护规则

### 调试技巧

1. 添加详细日志:
```bash
set -x  # 在 shell 脚本中启用调试
```

2. 本地测试脚本:
```bash
node scripts/auto-organize-copilot-configs.js --debug
python scripts/auto-organize-copilot-configs.py --verbose
```

3. 查看工作流变量:
```yaml
- name: Debug
  run: |
    echo "GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}"
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
```

## 性能优化

### 减少 API 调用

```yaml
# 缓存 GitHub API 响应
- uses: actions/cache@v3
  with:
    path: /tmp/github-cache
    key: github-repos-${{ github.run_id }}
```

### 并行处理

```yaml
strategy:
  matrix:
    repo: [repo1, repo2, repo3, ...]
```

### 增量更新

只检查上次以来的新库:
```bash
LAST_RUN=$(gh api repos/{owner}/{repo}/actions/runs --limit 1 --jq '.[0].created_at')
```

## 安全考虑

### 代码审查

所有下载的代码都应经过:
- 人工审查
- 自动化安全扫描
- 集成测试

### 敏感信息

确保不要:
- 提交 API 密钥
- 泄露私密信息
- 包含硬编码的凭证

### 文件验证

```bash
# 检查文件完整性
sha256sum -c checksums.txt

# 验证签名
gpg --verify file.gpg

# 进行代码分析
npm audit
pip security-audit
```

## 监控和告警

### GitHub Notifications

启用工作流失败通知:
1. 仓库 Settings → Notifications
2. 启用 "Actions failed"

### 自定义告警

添加 Slack/Email 通知:
```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Copilot Integration failed!'
```

## 相关资源

- GitHub Actions 文档: https://docs.github.com/en/actions
- GitHub API 文档: https://docs.github.com/en/rest
- Copilot 文档: https://github.com/github/copilot-docs
- Node.js 脚本参考: `scripts/auto-organize-copilot-configs.js`
- Python 脚本参考: `scripts/auto-organize-copilot-configs.py`

## 反馈和改进

有建议或发现问题?

1. 为此 Repo 提交 Issue
2. 创建 Pull Request 改进 Workflow
3. 分享你的最佳实践

---

**文档版本**: 1.0
**最后更新**: 2026-04-12
**维护者**: 知在 (knewbeing)

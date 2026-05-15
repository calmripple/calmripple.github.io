# Harness CI/CD 平台介绍

## 什么是 Harness？

Harness 是一个**"AI for Everything After Code"的软件交付自动化平台**，为企业提供智能化的 DevOps 自动化工具链。它覆盖从代码提交到生产部署的全生命周期，集成了持续集成（CI）、持续交付（CD）和多云部署功能。

## 核心功能模块

### 1. 持续集成 (Continuous Integration, CI)

**特点：**
- 高速构建和测试自动化
- 构建速度提升 **8 倍**
- 支持任何源代码、任何编程语言、任何操作系统

**关键特性：**
- **Test Intelligence** - 仅运行受代码变更影响的测试，减少 80% 测试时间
- **Cache Intelligence** - 智能缓存 Gradle、Bazel、Maven、Docker 层和依赖
- **Parallel Execution** - 多步骤并行执行加快构建速度

### 2. 持续交付与 GitOps (CD)

**特点：**
- 完全自动化的多云、多区域、多服务部署
- 支持蓝绿部署、金丝雀部署、滚动部署
- GitOps 工作流支持

**关键特性：**
- **多云支持** - AWS、Azure、Google Cloud、Kubernetes 等
- **部署验证** - 自动化验证部署成功
- **自动回滚** - 异常时自动回滚到上一个稳定版本

### 3. Platform 模块

**特点：**
- 核心基础设施和委托管理
- 用户管理和身份验证
- 项目和组织管理
- 策略引擎和 RBAC（基于角色的访问控制）

## Harness 的主要优势

| 优势 | 说明 |
|------|------|
| **AI 原生** | Architect Mode 帮助设计管道、故障排查和合规性 |
| **性能提升** | Test & Cache Intelligence 显著加快构建速度 |
| **安全合规** | SLSA L3 合规、OPA 策略引擎、审计追踪 |
| **多云中立** | 支持 100+ 云服务和部署目标集成 |
| **DORA 指标** | 开发运维性能指标仪表盘，提升团队效能 |
| **易用性** | 直观的 UI + YAML 配置，降低学习成本 |

## 支持的技术栈

### 编程语言
- Java / Kotlin
- Python
- Go
- Node.js / TypeScript
- C# / .NET
- Ruby、PHP、Swift、Rust、Scala

### 构建工具
- Maven、Gradle、Bazel
- npm / yarn / pnpm
- pip、go mod、Cargo、dotnet CLI

### 版本控制系统
- GitHub / GitHub Enterprise
- GitLab / GitLab Self-Hosted
- Bitbucket Cloud / Server
- Gitea、Azure DevOps

### 部署目标
- **容器** - Docker、Kubernetes、Docker Compose
- **云服务** - AWS (ECS, EKS, Lambda)、Azure (App Service, AKS)、GCP (GKE, Cloud Run)
- **基础设施** - Helm、Terraform、SSH 部署
- **配置管理** - Ansible、Chef、Puppet

## Harness 与其他 CI/CD 工具对比

### vs Jenkins

| 对比维度 | Harness | Jenkins |
|---------|---------|---------|
| 部署模式 | SaaS/On-Premise | 主要 On-Premise |
| 配置方式 | YAML + 直观 UI | Groovy DSL |
| 学习曲线 | 中等 | 陡峭 |
| 开箱即用 | ✅ 是 | ❌ 否 |
| AI 功能 | ✅ 强大 | ❌ 无 |
| 扩展性 | 100+ 原生集成 | 1800+ 插件 |
| 成本 | 订阅制 | 开源免费 |
| 维护 | Harness 维护 | 自己维护 |

**结论：** Harness 开箱即用，Jenkins 需要大量定制化配置。

### vs GitHub Actions

| 对比维度 | Harness | GitHub Actions |
|---------|---------|--------|
| 学习曲线 | 中等 | 低 |
| 平台锁定 | 低（支持多 VCS） | 高（GitHub 独有） |
| CD 能力 | 企业级完整 | 基础 |
| 成本透明度 | 明确收费 | 按使用时间计费 |
| 多云支持 | 优秀 | 需额外配置 |

**结论：** Harness 提供更强大的 CD 能力，GitHub Actions 更适合单一 GitHub 项目。

### vs GitLab CI

| 对比维度 | Harness | GitLab CI |
|---------|---------|----------|
| 集成度 | 松耦合 | 高度集成 |
| 部署速度 | 最快（8 倍加速） | 中等 |
| AI 功能 | 完整 AI 套件 | 有限 |
| 自托管成本 | 较高 | 相对低 |
| 免费版功能 | 基础功能 | 较完整 |

**结论：** Harness 速度更快、AI 功能更强，GitLab 成本更低。

## Harness 的 AI 能力

### 1. Architect Mode（架构师模式）
- 自动生成和优化管道
- AI 驱动的故障诊断
- 实时建议改进方案

### 2. 自我修复的测试
- 自动定位和修复失败的测试
- 减少手动调试时间

### 3. 智能部署
- 自动检测最优部署策略
- 预测部署风险和成功率
- 自动异常检测

## 版本和许可

### Harness 版本

| 版本 | 部署方式 | 适用场景 |
|------|---------|---------|
| **Cloud** | SaaS（Harness 托管） | 快速上手、减少运维 |
| **Self-Managed** | 私有部署 | 数据隐私、合规性要求 |

### 许可模式

- **免费版** - 基础功能，适合个人和小团队
- **团队版** - 专业功能，中小团队
- **企业版** - 完整功能 + 专业支持、合规性

## 何时选择 Harness

### 适合选择 Harness 的场景

✅ 需要快速、可靠的 CI/CD 流程
✅ 多云/多环境部署
✅ 对安全合规有高要求
✅ 需要团队高效协作
✅ 希望减少运维负担
✅ 项目规模中等以上

### 不一定需要 Harness 的场景

❌ 非常小的单人项目
❌ 只使用 GitHub 的开源项目
❌ 对成本极其敏感的初创公司
❌ 已经深度依赖 Jenkins 生态

## Harness 的学习路径

### 初级（1-2 周）
- 理解 CI/CD 基础概念
- 创建第一个 CI 管道
- 学习基本的 YAML 配置

### 中级（2-4 周）
- 创建完整的 CD 管道
- 配置多环境部署
- 设置通知和审批流程

### 高级（4-8 周）
- OPA 策略管理
- 高级部署策略（金丝雀、蓝绿）
- 集成第三方工具
- 性能优化和成本管理

## 总结

Harness 是一个**功能完整、AI 驱动、企业级的 CI/CD 平台**，特别适合：

- 💡 需要快速交付的团队
- 🚀 追求极致性能的组织
- 🔒 对安全合规有要求的企业
- 🌍 进行多云部署的公司

**下一步：** 了解 Harness 的 Windows 安装步骤，开始实践！

---

**相关文档：**
- [Harness Windows 安装指南](./harness-windows-installation.md)
- [Harness 基础使用](./harness-basic-usage.md)
- [Harness 维护和最佳实践](./harness-maintenance.md)
- [Harness 常见问题](./harness-faq.md)

# Harness 基础使用指南

## 核心概念

### 组织结构

```
Harness 账户
├── 组织 (Organization)
│   ├── 项目 1 (Project)
│   │   ├── 管道 (Pipelines)
│   │   ├── 服务 (Services)
│   │   └── 环境 (Environments)
│   └── 项目 2 (Project)
└── 账户级设置
    ├── 委托 (Delegates)
    └── 连接器 (Connectors)
```

### 关键概念说明

| 概念 | 说明 |
|------|------|
| **Pipeline** | 整个 CI/CD 工作流，由多个 Stage 组成 |
| **Stage** | 管道中的阶段，如构建阶段、部署阶段 |
| **Step** | Stage 中的具体执行步骤 |
| **Service** | 代表一个微服务或应用 |
| **Environment** | 部署环境（开发、测试、生产等） |
| **Connector** | 与外部系统的连接配置（Git、Docker、K8s 等） |
| **Delegate** | 执行任务的代理程序 |
| **Artifact** | 构建产物（Docker 镜像、JAR 包等） |

## 使用流程图

```
提交代码 → VCS Hook 触发 → CI 构建 → 测试 → 构建镜像 → 推送仓库
                                              ↓
                                      部署验证通过?
                                    ✅ 是 → CD 部署 → 部署验证
                                    ❌ 否 → 发送通知
```

## 创建您的第一条 CI 管道

### 步骤 1：新建管道

1. 进入项目 → **Pipelines**
2. 点击 **+ New Pipeline**
3. 填写管道信息：
   - **Pipeline Name**: `Demo-CI-Pipeline`
   - **Organization**: 选择您的组织
   - **Project**: 选择项目
4. 点击 **Create**

### 步骤 2：配置源代码仓库

1. 在管道编辑器中，点击 **Configuration**
2. 在 **Codebase** 部分：
   - **Select a repository**: 选择您的 GitHub/GitLab 仓库
   - **Branch**: 设置为 `main`（或您的默认分支）
   - **Build on Push**: 启用自动构建

### 步骤 3：添加构建 Stage

1. 点击 **+ Add Stage** → 选择 **CI**
2. 填写 Stage 信息：
   - **Stage Name**: `Build`
   - **Infrastructure**: 选择 **Cloud**
   - **OS**: 选择 **Linux**

### 步骤 4：添加构建步骤

在 Stage 中，点击 **+ Add Step**，可以添加以下常见步骤：

#### 示例 1：Node.js 项目构建

```yaml
steps:
  - step:
      type: Run
      name: Install Dependencies
      identifier: install_deps
      spec:
        shell: Bash
        command: |-
          npm install

  - step:
      type: RunTests
      name: Run Tests
      identifier: run_tests
      spec:
        command: npm test
        language: JavaScript

  - step:
      type: Run
      name: Build Application
      identifier: build_app
      spec:
        shell: Bash
        command: npm run build

  - step:
      type: BuildAndPushDockerRegistry
      name: Build and Push Docker Image
      identifier: docker_push
      spec:
        connectorRef: docker_hub  # Docker Hub 连接
        repo: your_username/your_app
        tags:
          - latest
          - v1.0.0
```

#### 示例 2：Java Maven 项目构建

```yaml
steps:
  - step:
      type: Run
      name: Build with Maven
      identifier: maven_build
      spec:
        shell: Bash
        command: |-
          mvn clean install

  - step:
      type: BuildAndPushDockerRegistry
      name: Build Docker Image
      identifier: docker_build
      spec:
        connectorRef: docker_hub
        repo: your_username/java_app
        dockerfile: Dockerfile
        tags:
          - latest
```

### 步骤 5：配置触发条件

1. 进入管道 **Triggers** 选项卡
2. 点击 **+ New Trigger**
3. 选择触发类型：
   - **Push** - 代码推送时触发
   - **Pull Request** - PR 提交时触发
   - **Webhook** - 自定义 Webhook 触发

```yaml
# 示例：监听 main 分支的 Push 事件
trigger:
  type: Webhook
  spec:
    event: push
    branch: main
```

### 步骤 6：保存并运行

1. 点击 **Save** 保存管道配置
2. 点击 **Run** 手动执行测试
3. 查看执行结果和日志

## 创建您的第一条 CD 管道

### 步骤 1：定义服务和环境

#### 创建服务

1. 进入项目 → **Services**
2. 点击 **+ New Service**
3. 填写信息：
   - **Service Name**: `my-app`
   - **Deployment Type**: 选择 `Kubernetes` 或 `SSH`
4. 配置服务定义（YAML）

#### 创建环境

1. 进入项目 → **Environments**
2. 点击 **+ New Environment**
3. 填写信息：
   - **Environment Name**: `dev`
   - **Environment Type**: `Non-Production`
4. 添加基础设施定义

### 步骤 2：新建 CD 管道

```yaml
pipeline:
  name: Deploy-to-Dev
  identifier: deploy_dev
  projectIdentifier: default
  stages:
    - stage:
        name: Deploy
        identifier: deploy
        type: Deployment
        spec:
          serviceConfig:
            serviceRef: my_app
          infrastructureDefinitions:
            - identifier: dev_infra
          execution:
            steps:
              - step:
                  type: K8sRollingDeploy
                  name: Deploy to Kubernetes
                  identifier: k8s_deploy
                  spec:
                    skipDryRun: false
            rollbackSteps:
              - step:
                  type: K8sRollingRollback
                  name: Rollback
                  identifier: rollback
          strategy:
            canary:
              canaryInstanceCount: 1
              instanceUnitType: Count
              steps:
                - name: Canary Deployment
                  percentage: 50
                - name: Full Deployment
                  percentage: 100
```

### 步骤 3：配置部署策略

Harness 支持多种部署策略：

#### 蓝绿部署 (Blue-Green)
- 同时运行两个相同的环境
- 快速切换流量
- 快速回滚

```yaml
strategy:
  bluegreen:
    blueGreenField: instance
```

#### 金丝雀部署 (Canary)
- 逐步发布新版本
- 监控关键指标
- 异常时自动回滚

```yaml
strategy:
  canary:
    canaryInstanceCount: 2
    steps:
      - name: Phase 1
        percentage: 20
      - name: Phase 2
        percentage: 100
```

#### 滚动部署 (Rolling)
- 逐个替换实例
- 零停机部署
- 不需要额外资源

```yaml
strategy:
  rolling:
    maxConcurrency: 1
```

## 变量和表达式

### 使用变量

Harness 支持多种变量类型：

```yaml
# 内置变量
- <+pipeline.name>          # 管道名称
- <+stage.name>              # Stage 名称
- <+execution.triggerType>   # 触发类型
- <+artifact.tag>            # 工件标签
- <+env.name>               # 环境名称

# 自定义变量
variables:
  - name: ENV_NAME
    type: String
    default: dev

  - name: DOCKER_TAG
    type: String
    default: <+artifacts.primary.tag>
```

### 使用表达式

```yaml
spec:
  steps:
    - step:
        type: ShellScript
        spec:
          script: |
            echo "Pipeline: <+pipeline.name>"
            echo "Stage: <+stage.name>"
            echo "Environment: <+env.name>"

    - step:
        type: Approval
        spec:
          approvers:
            - <+pipeline.variables.approverEmail>
```

## 通知和审批

### 配置通知

1. 进入 Stage → **Notifications**
2. 点击 **+ Add Notification**
3. 选择通知方式（Email、Slack、Teams 等）
4. 配置触发条件

```yaml
# Slack 通知示例
notifications:
  - type: Slack
    name: Pipeline Status
    spec:
      webhookUrl: <+secrets.getValue("slack_webhook")>
      template: |
        Pipeline: <+pipeline.name>
        Status: <+execution.result>
        Triggered by: <+execution.triggeredBy.name>
```

### 配置审批流程

```yaml
# 部署前审批
approvals:
  - type: Harness
    name: Deploy Approval
    timeout: 1d
    spec:
      approvers: ["user@example.com"]
      approvalMessage: "Approve production deployment?"
```

## 常见使用场景

### 场景 1：自动化测试和代码质量检查

```yaml
stages:
  - stage:
      name: Test and Quality
      type: CI
      spec:
        execution:
          steps:
            # 单元测试
            - step:
                type: RunTests
                name: Unit Tests
                spec:
                  command: npm test

            # 代码覆盖率
            - step:
                type: Run
                name: Coverage Report
                spec:
                  command: npm run coverage

            # 静态分析 (SonarQube)
            - step:
                type: SonarQube
                name: SonarQube Scan
                spec:
                  connectorRef: sonarqube
                  projectName: my-project

            # 安全扫描
            - step:
                type: SecurityStep
                name: Container Scan
                spec:
                  scannerType: Trivy
```

### 场景 2：多环境部署流程

```yaml
stages:
  # 构建
  - stage:
      name: Build
      type: CI

  # 部署到开发环境
  - stage:
      name: Deploy to Dev
      type: Deployment
      spec:
        environment: dev

  # 手动审批
  - stage:
      name: Approval for Prod
      type: Approval

  # 部署到生产环境
  - stage:
      name: Deploy to Prod
      type: Deployment
      spec:
        environment: prod
        strategy: canary
```

### 场景 3：自动化版本发布

```yaml
# 自动生成版本号、打标签、创建发布
steps:
  - step:
      type: Run
      name: Generate Version
      spec:
        command: |
          VERSION=$(date +%Y%m%d.%H%M%S)
          echo "VERSION=$VERSION" >> $HARNESS_ENV_FILE

  - step:
      type: Run
      name: Create Git Tag
      spec:
        command: |
          git tag -a v<+env.VERSION> -m "Release v<+env.VERSION>"
          git push origin v<+env.VERSION>

  - step:
      type: GitHubRelease
      name: Create GitHub Release
      spec:
        connectorRef: github
        repo: owner/repo
        tagName: v<+env.VERSION>
        releaseName: Release v<+env.VERSION>
```

## 性能优化

### 启用 Test Intelligence

```yaml
steps:
  - step:
      type: RunTests
      name: Smart Tests
      spec:
        command: npm test
        enableTestIntelligence: true  # 只运行相关测试
```

### 启用 Cache Intelligence

```yaml
steps:
  - step:
      type: Run
      spec:
        cache:
          key: npm-cache-<+checksum("package-lock.json")>
          paths:
            - /root/.npm
        command: npm install
```

## 故障排查

### 查看管道执行日志

1. 进入管道 → **Execution History**
2. 点击要查看的执行
3. 查看每个 Step 的详细日志

### 常见错误解决

| 错误 | 解决方案 |
|------|---------|
| `Delegate not found` | 检查 Delegate 是否在线 |
| `Docker authentication failed` | 验证 Docker registry 凭证 |
| `Git clone failed` | 检查 SSH key 或 PAT token 有效性 |
| `Build timeout` | 增加超时时间或优化构建速度 |

---

**相关文档：**
- [Harness 维护和最佳实践](./harness-maintenance.md)
- [Harness 常见问题](./harness-faq.md)
- [Harness 官方文档](https://developer.harness.io/docs/)

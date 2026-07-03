# Harness 维护、最佳实践与性能优化

## 维护计划

### 日常维护任务

#### 每日

```
□ 监控系统状态和 Delegate 健康状况
□ 检查构建和部署失败情况
□ 备份关键配置和数据
□ 查看通知和告警
```

PowerShell 脚本示例：

```powershell
# 检查 Harness Delegate 健康状态
$delegateStatus = Invoke-RestMethod -Uri "https://app.harness.io/api/v1/delegates/status" `
  -Headers @{"Authorization" = "Bearer <token>"}

if ($delegateStatus.healthy -eq $false) {
    Send-MailMessage -To "ops@example.com" -Subject "Harness Delegate is unhealthy" -Body $delegateStatus
}
```

#### 每周

```
□ 审查执行日志和审计日志
□ 检查 Delegate 资源使用情况
□ 清理过期的构建工件
□ 验证备份完整性
```

#### 每月

```
□ 检查系统更新和补丁
□ 审查 RBAC 权限配置
□ 验证灾难恢复计划
□ 分析 DORA 指标
□ 成本优化分析
```

#### 每季度

```
□ 完整的安全审计
□ 策略合规性检查
□ 容量规划和资源优化
□ 团队培训和最佳实践分享
```

## 更新和升级流程

### Cloud 版本（自动更新）

Harness Cloud 由 Harness 维护，自动进行更新。您不需要手动操作，但应该：

- 订阅发布通知：[Harness Release Notes](https://developer.harness.io/release-notes/)
- 定期检查新特性和改进
- 关注向后兼容性警告

### Self-Managed 版本升级

```powershell
# 1. 备份数据库
docker exec harness-postgres pg_dump -U harness -d harness > "backup-$(Get-Date -Format yyyyMMdd).sql"

# 2. 备份配置
Copy-Item "C:\harness\docker-compose.yml" -Destination "C:\harness\docker-compose.backup.yml"

# 3. 检查发布说明
# 访问 https://developer.harness.io/release-notes/

# 4. 更新镜像版本
# 编辑 docker-compose.yml，修改版本标签
# 例如：harness/harness-platform:latest → harness/harness-platform:2026.06

# 5. 拉取新镜像
docker-compose pull

# 6. 启动新版本
docker-compose up -d

# 7. 验证升级
docker-compose ps
docker logs harness-platform

# 8. 验证功能
# 在浏览器中测试 UI 功能
```

## 安全最佳实践

### 1. 访问控制 (RBAC)

#### 创建自定义角色

```
1. 进入 Account Settings → RBAC → Roles
2. 点击 "+ New Role"
3. 定义权限：
   - Pipeline: Execute, Create, Edit, Delete
   - Deployment: Execute, Approve
   - Settings: Read Only
```

#### 分配角色

```
原则：最小权限原则 (Principle of Least Privilege)

示例权限矩阵：
┌─────────────┬─────────┬────────┬──────────┐
│ 角色        │ Create  │ Execute│ Approve  │
├─────────────┼─────────┼────────┼──────────┤
│ Developer   │ Own Env │ Dev/QA │ No       │
│ QA Lead     │ No      │ All    │ QA Only  │
│ DevOps      │ All     │ All    │ Prod     │
│ Manager     │ No      │ No     │ Prod     │
└─────────────┴─────────┴────────┴──────────┘
```

### 2. 密钥管理

#### 使用 HashiCorp Vault

```yaml
# 在 Harness 中配置 Vault
connectors:
  - type: HashicorpVault
    name: My Vault
    spec:
      vaultUrl: https://vault.example.com
      authMethod: token
      secretEngine: kv

# 在管道中引用密钥
steps:
  - step:
      type: Run
      spec:
        env:
          - name: DATABASE_PASSWORD
            value: <+secrets.getValue("db_password")>
```

#### 使用 AWS Secrets Manager

```yaml
connectors:
  - type: AwsSecretsManager
    name: AWS Secrets
    spec:
      region: us-east-1
      awsCredentialsRef: <+secrets.getValue("aws_creds")>
```

### 3. 审计和合规性

#### 启用审计日志

```
1. 进入 Account Settings → Audit
2. 确保以下事件被记录：
   - 用户登录/退出
   - 权限变更
   - 管道执行
   - 秘密访问
   - 配置变更
```

#### OPA 策略引擎（企业版）

```text
# 示例：禁止在生产部署中使用 latest 标签
package pipeline

deny[msg] {
    input.environment == "production"
    input.dockerImage == "*:latest"
    msg := "Cannot use 'latest' tag in production"
}

# 示例：要求生产部署需要审批
deny[msg] {
    input.environment == "production"
    input.approvalRequired == false
    msg := "Production deployment must have approval"
}
```

## 性能优化

### 1. Test Intelligence（减少测试时间）

```yaml
# 启用 Test Intelligence
steps:
  - step:
      type: RunTests
      name: Run Affected Tests Only
      spec:
        language: JavaScript
        buildTool: npm
        testCommand: npm test
        enableTestIntelligence: true
        # 结果：仅运行受代码变更影响的测试
        # 典型节省：测试时间减少 60-80%
```

### 2. Cache Intelligence（加快依赖下载）

```yaml
# 启用缓存
steps:
  - step:
      type: Run
      name: Install Dependencies
      spec:
        shell: Bash
        command: npm install
        cache:
          key: npm-cache-v1
          paths:
            - /root/.npm
            - /root/.m2
            - /root/.gradle
```

### 3. 并行执行

```yaml
# 并行运行多个 Step
steps:
  - parallel:
      - step:
          type: RunTests
          name: Unit Tests
      - step:
          type: RunTests
          name: Integration Tests
      - step:
          type: SonarQube
          name: Code Quality
```

### 4. 优化 Docker 镜像

```dockerfile
# ❌ 不良实践 - 镜像 1.5GB
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# ✅ 最佳实践 - 镜像 200MB
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

### 5. 管道优化检查清单

```
□ 是否使用了 Test Intelligence？
□ 是否启用了缓存？
□ 是否有不必要的序列步骤可以并行化？
□ Docker 镜像大小是否优化？
□ 是否删除了不必要的 Step？
□ 是否使用了 Stage 级别的条件跳过不需要的 Stage？
□ 是否配置了合理的超时时间？
```

## 成本优化

### 1. CI 成本优化

| 措施 | 预期节省 | 实施复杂度 |
|------|---------|-----------|
| 启用 Test Intelligence | 60-80% 测试时间 | ⭐ 简单 |
| 启用 Cache Intelligence | 30-50% 构建时间 | ⭐ 简单 |
| 并行执行 | 40-60% 管道时间 | ⭐⭐ 中等 |
| 使用预留容量 | 30-40% 成本 | ⭐⭐⭐ 复杂 |

### 2. CD 成本优化

```
按使用量付费优化：
1. 优化部署频率 - 不必要的部署增加成本
2. 监控部署目标资源 - 及时释放不用的环境
3. 使用成本预算和告警 - 及时发现异常消费
4. 考虑预留实例 - 稳定工作负载使用预留实例
```

### 3. 监控成本

```yaml
# 配置成本告警
alerts:
  - name: Daily Cost Alert
    threshold: $100
    recipients: [devops@example.com]

  - name: Monthly Budget Alert
    threshold: $5000
    recipients: [manager@example.com]
```

## 故障排查指南

### Delegate 连接问题

```powershell
# 1. 检查 Delegate 容器状态
docker ps | grep delegate

# 2. 查看 Delegate 日志
docker logs harness-delegate --tail 100

# 3. 检查网络连接
Test-NetConnection -ComputerName "app.harness.io" -Port 443

# 4. 验证 Delegate token
# 从 Harness UI 重新生成 token

# 5. 重启 Delegate
docker restart harness-delegate
```

### 管道执行缓慢

```powershell
# 分析执行时间
1. 进入管道 → 执行历史
2. 查看每个 Stage 耗时
3. 对比历史数据看是否有异常增长
4. 检查以下因素：
   - Delegate 资源使用
   - 网络延迟
   - 依赖下载速度
   - 测试数量
```

### Docker 构建失败

```bash
# 常见原因和解决方案：

# 1. Docker daemon 无法访问
docker ps  # 如果失败，重启 Docker Desktop

# 2. 网络超时（拉取基础镜像）
docker pull ubuntu:latest  # 测试网络连接

# 3. 磁盘空间不足
docker system df
docker system prune -a  # 清理

# 4. 凭证问题
docker login  # 重新登录 Docker registry
```

## 监控和可观测性

### 配置关键指标监控

```
DORA 指标（DevOps Research and Assessment）：
1. Deployment Frequency - 部署频率（越高越好）
2. Lead Time for Changes - 变更交付周期（越短越好）
3. Change Failure Rate - 变更失败率（越低越好）
4. Mean Time to Recovery - 恢复时间（越短越好）
```

### 配置通知

```yaml
# Email 通知
notifications:
  - type: Email
    name: Build Failed
    spec:
      recipients:
        - dev-team@example.com
      template: |
        Build <+pipeline.name> failed
        Stage: <+stage.name>
        Error: <+execution.errorMessage>

# Slack 通知
notifications:
  - type: Slack
    name: Deployment Status
    spec:
      webhookUrl: <+secrets.getValue("slack_webhook")>
```

### 集成外部监控

```yaml
# 与 Prometheus/Grafana 集成
integrations:
  - type: Prometheus
    name: My Prometheus
    spec:
      url: https://prometheus.example.com

# 自定义指标
metrics:
  - name: build_duration_seconds
    type: gauge
```

## 灾难恢复

### 备份策略

```powershell
# 完整备份脚本
$backupPath = "C:\harness-backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# 1. 数据库备份
docker exec harness-postgres pg_dump -U harness -d harness | gzip > "$backupPath\db_$timestamp.sql.gz"

# 2. 配置文件备份
Compress-Archive -Path "C:\harness\config" -DestinationPath "$backupPath\config_$timestamp.zip"

# 3. 清理 30 天前的备份
Get-ChildItem $backupPath -Filter "*.gz" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item

# 4. 上传到云存储（示例：Azure Blob Storage）
az storage blob upload-batch -d "harness-backups" -s $backupPath
```

### 恢复流程

```powershell
# 1. 停止 Harness
docker-compose down

# 2. 恢复数据库
gzip -d < db_backup.sql.gz | docker exec -i harness-postgres psql -U harness -d harness

# 3. 恢复配置
Expand-Archive -Path config_backup.zip -DestinationPath "C:\harness\config" -Force

# 4. 启动 Harness
docker-compose up -d

# 5. 验证恢复
docker-compose ps
```

## 团队最佳实践

### 1. 代码评审

```
管道配置应该像代码一样进行审查：
1. 使用 GitOps - 将管道配置存储在 Git 中
2. 强制代码审查 - PR 必须至少有一人审查
3. 自动检查 - 使用 OPA 策略自动验证
4. 变更日志 - 维护清晰的变更记录
```

### 2. 文档化

```
关键文档：
1. 架构图 - 展示 CI/CD 流程和系统集成
2. 管道说明 - 每条管道的目的和配置
3. 运维手册 - 故障排查和恢复步骤
4. 权限矩阵 - 谁可以做什么
5. 紧急联系 - 24/7 支持联系方式
```

### 3. 知识共享

```
定期进行：
□ 每周代码审查会议
□ 每月 Harness 最佳实践分享
□ 季度培训和认证
□ 持续的文档更新
```

---

**相关文档：**
- [Harness 介绍](./harness-introduction.md)
- [Harness 基础使用](./harness-basic-usage.md)
- [Harness 常见问题](./harness-faq.md)

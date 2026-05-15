# Harness 常见问题 (FAQ)

## 安装和环境问题

### Q1: Docker Desktop 在 Windows 上无法启动

**症状：**
- Docker Desktop 打开后闪退
- 错误信息：`Hyper-V is not compatible with this version of Windows`
- WSL 2 无法初始化

**解决方案：**

```powershell
# 1. 检查 Hyper-V 是否启用
Get-WindowsOptionalFeature -Online | Where-Object {$_.FeatureName -like "*Hyper*"} | Select-Object State

# 2. 如未启用，运行以下命令
Enable-WindowsOptionalFeature -Online -FeatureName Hyper-V -All

# 3. 重启计算机
Restart-Computer

# 4. 安装 WSL 2 Linux 内核
# 从 https://aka.ms/wsl2kernel 下载并运行

# 5. 设置 WSL 2 为默认版本
wsl --set-default-version 2

# 6. 重启 Docker Desktop
```

**检查列表：**
- Windows 10 Pro/Enterprise 或 Windows 11（不支持 Home 版本基础功能）
- 64 位处理器
- CPU 支持虚拟化
- BIOS 中启用虚拟化

### Q2: Delegate 无法连接到 Harness

**症状：**
- Harness UI 中 Delegate 显示 "Disconnected"
- 日志中显示 "Connection refused"

**排查步骤：**

```powershell
# 1. 检查 Delegate 容器是否运行
docker ps | grep delegate

# 2. 查看 Delegate 日志
docker logs harness-delegate -f

# 3. 检查网络连接
Test-NetConnection -ComputerName "app.harness.io" -Port 443

# 4. 验证防火墙规则
Get-NetFirewallRule -DisplayName "*Docker*" -Enabled $true

# 5. 检查代理配置（如需要）
# 编辑 docker-compose.yml，添加代理环境变量：
# environment:
#   - HTTP_PROXY=http://proxy.example.com:8080
#   - HTTPS_PROXY=http://proxy.example.com:8080

# 6. 验证 Delegate token 有效性
# 在 Harness UI 中重新生成 token

# 7. 重新启动 Delegate
docker restart harness-delegate
```

### Q3: "permission denied" 错误

**症状：**
- 无法启动 Docker
- 无法访问文件或目录

**解决方案：**

```powershell
# 1. 使用管理员身份运行 PowerShell
# 重新启动 PowerShell as Administrator

# 2. 检查文件权限
Get-Acl C:\harness

# 3. 添加当前用户权限（如需要）
$acl = Get-Acl C:\harness
$permission = New-Object System.Security.AccessControl.FileSystemAccessRule(
    [System.Security.Principal.WindowsIdentity]::GetCurrent().User,
    "FullControl",
    "ContainerInherit,ObjectInherit",
    "None",
    "Allow"
)
$acl.AddAccessRule($permission)
Set-Acl -Path C:\harness -AclObject $acl

# 4. 确保 Docker 服务正在运行
Get-Service Docker | Select-Object Status
Start-Service Docker  # 如需要
```

## 管道和执行问题

### Q4: 管道执行很慢

**症状：**
- CI 构建耗时过长
- 构建时间在增加

**常见原因和解决方案：**

```
1. 依赖下载慢
   ✅ 启用 Cache Intelligence
   ✅ 使用企业级 Maven/npm 代理

2. 测试数量太多
   ✅ 启用 Test Intelligence（只运行相关测试）
   ✅ 将测试分散到多个并行 Step
   ✅ 考虑将重型测试移到专门的 Stage

3. Docker 镜像构建慢
   ✅ 优化 Dockerfile（使用 multi-stage build）
   ✅ 使用 Docker BuildKit
   ✅ 缓存 Docker 层

4. Delegate 资源不足
   ✅ 增加 Delegate 内存
   ✅ 增加并发 Delegate 实例
   ✅ 监控 CPU 使用率
```

**诊断命令：**

```yaml
# 在管道中添加性能诊断 Step
- step:
    type: Run
    name: Performance Diagnostics
    spec:
      shell: Bash
      command: |
        echo "=== System Information ==="
        uname -a
        echo "=== Memory Usage ==="
        free -h
        echo "=== Disk Usage ==="
        df -h
        echo "=== CPU Info ==="
        nproc
```

### Q5: Docker 镜像推送失败

**症状：**
- 错误：`unauthorized: authentication required`
- 错误：`denied: requested access to resource is denied`

**解决方案：**

```powershell
# 1. 验证 Docker 凭证
docker login docker.io

# 2. 检查 Harness 中的 Docker Connector 配置
# Harness UI → Connectors → Docker Hub → 验证 Username 和 Token

# 3. 确保 Docker token 有有效的权限
# Docker Hub → 设置 → Security → Personal access tokens

# 4. 检查镜像标签格式
# ❌ 错误: docker.io/myimage
# ✅ 正确: myusername/myimage:latest

# 5. 验证镜像仓库配额
# Docker Hub 免费账户有限制

# 6. 测试 Docker 推送
docker tag my-image:latest myusername/my-image:latest
docker push myusername/my-image:latest
```

### Q6: Git 克隆失败

**症状：**
- 错误：`repository not found`
- 错误：`permission denied (publickey)`

**解决方案：**

```bash
# 1. 验证 Git 连接器配置
# Harness UI → Connectors → GitHub/GitLab

# 2. 检查 SSH key（如使用 SSH）
ssh-keygen -t rsa -b 4096

# 3. 添加 SSH key 到 GitHub
# GitHub → Settings → SSH and GPG keys → New SSH key

# 4. 测试 SSH 连接
ssh -T git@github.com

# 5. 或使用 Personal Access Token（推荐）
# GitHub → Settings → Developer settings → Personal access tokens
# 创建 token 并配置到 Harness

# 6. 验证仓库 URL
# ✅ 正确: https://github.com/owner/repo.git
# ✅ 正确: git@github.com:owner/repo.git
```

## 部署问题

### Q7: Kubernetes 部署失败

**症状：**
- 错误：`unable to connect to the server`
- 错误：`forbidden: User cannot perform ...`

**解决方案：**

```bash
# 1. 验证 Kubernetes 集群连接
kubectl cluster-info

# 2. 检查凭证和权限
kubectl auth can-i create deployment

# 3. 查看详细错误信息
kubectl describe deployment <deployment-name>

# 4. 检查 Pod 状态
kubectl get pods -n harness-namespace

# 5. 查看 Pod 日志
kubectl logs <pod-name> -n harness-namespace

# 6. 验证 RBAC 权限
kubectl get rolebinding -n harness-namespace
kubectl get clusterrolebinding | grep harness

# 7. 重新生成 kubeconfig 凭证
# 在 Harness 中删除并重新添加 K8s connector
```

### Q8: 部署后服务无法访问

**症状：**
- Pod 正常运行，但无法访问服务
- 网络不通

**排查步骤：**

```bash
# 1. 检查 Service 状态
kubectl get svc -n harness-namespace
kubectl describe svc <service-name> -n harness-namespace

# 2. 检查 Endpoints
kubectl get endpoints <service-name> -n harness-namespace

# 3. 测试 Pod 内部网络
kubectl exec -it <pod-name> -- sh
curl http://localhost:8080  # 测试本地端口

# 4. 检查 Ingress（如使用）
kubectl get ingress -n harness-namespace
kubectl describe ingress <ingress-name> -n harness-namespace

# 5. 验证 DNS
kubectl exec -it <pod-name> -- nslookup <service-name>

# 6. 检查网络策略
kubectl get networkpolicy -n harness-namespace
```

## 配置和YAML问题

### Q9: YAML 验证失败

**症状：**
- 错误：`pipeline validation failed`
- 错误：`invalid schema`

**常见问题和解决方案：**

```yaml
# ❌ 错误 1: 缩进不一致
steps:
 - step:  # 缩进少一个空格
    type: Run

# ✅ 正确
steps:
  - step:  # 正确的缩进（2 个空格）
    type: Run

# ❌ 错误 2: 引号问题
command: echo "Hello world  # 缺少引号

# ✅ 正确
command: echo "Hello world"

# ❌ 错误 3: 未定义变量
spec:
  command: echo $UNDEFINED_VAR

# ✅ 正确
spec:
  command: echo <+env.DEFINED_VAR>
  env:
    - name: DEFINED_VAR
      value: "hello"

# ❌ 错误 4: 模式不正确
timeout: "10 minutes"  # 应该用特定格式

# ✅ 正确
timeout: 10m  # 或 10 分钟用秒表示: 600s
```

**验证 YAML 的工具：**

```bash
# 在线验证
# https://www.yamllint.com

# 本地验证（使用 Python）
pip install yamllint
yamllint pipeline.yaml
```

### Q10: 变量引用错误

**症状：**
- 变量显示为空或 `<+...>` 字面量
- 表达式计算出错

**常见问题：**

```yaml
# ❌ 错误 1: 变量作用域
stages:
  - stage:
      variables:
        - name: MY_VAR
          value: "hello"
  - stage:
      spec:
        command: echo <+MY_VAR>  # ❌ 不同 stage，无法访问

# ✅ 正确：在管道级别定义共享变量
pipeline:
  variables:
    - name: MY_VAR
      value: "hello"

# ❌ 错误 2: 类型不匹配
variables:
  - name: PORT
    type: Number
    default: "8080"  # ❌ 应该是数字，不是字符串

# ✅ 正确
variables:
  - name: PORT
    type: Number
    default: 8080

# ❌ 错误 3: 环境变量未导出
steps:
  - step:
      type: Run
      spec:
        env:
          - name: MY_VAR
            value: "hello"
        command: echo $MY_VAR  # ❌ Shell 脚本中需要导出

# ✅ 正确
steps:
  - step:
      type: Run
      spec:
        command: |
          export MY_VAR="hello"
          echo $MY_VAR
```

## 安全和合规问题

### Q11: 如何安全地存储密钥？

**最佳实践：**

```yaml
# ❌ 不要在 YAML 中硬编码密钥
spec:
  password: "my-secret-password"

# ✅ 使用 Harness 密钥管理
spec:
  password: <+secrets.getValue("db_password")>

# ✅ 或使用外部密钥管理系统
connectors:
  - type: HashicorpVault
    spec:
      vaultUrl: https://vault.example.com

# 在管道中
steps:
  - step:
      type: Run
      spec:
        command: |
          export DB_PASSWORD=<+secrets.getValue("db_password")>
          ./deploy.sh
```

### Q12: 如何进行安全审计？

**启用审计日志：**

```
1. 进入 Account Settings → Audit
2. 确保以下事件被记录：
   - User login/logout
   - Pipeline executions
   - Deployment approvals
   - Secret access
   - Configuration changes
   - Permission changes
```

**定期审计检查清单：**

```
□ 查看谁访问了哪些管道
□ 检查是否有异常的部署活动
□ 验证是否有未经授权的 API 调用
□ 检查密钥访问日志
□ 审查用户权限变更
```

## 成本和账户问题

### Q13: 如何减少 Harness 成本？

**成本优化建议：**

```
1. CI 成本（通常是主要成本）
   • 启用 Test Intelligence：减少 60-80% 测试时间
   • 启用 Cache Intelligence：减少 30-50% 构建时间
   • 使用并行执行：减少管道总时间
   • 预期节省：30-50% CI 成本

2. CD 成本
   • 优化部署频率：避免不必要的部署
   • 合理使用预留容量
   • 监控部署目标资源使用
   • 预期节省：20-30% CD 成本

3. 基础设施成本
   • 使用 shared Delegate 而不是每个项目一个
   • 选择合适的 Delegate 大小
   • 定期清理不使用的环境
   • 预期节省：10-20% 基础设施成本
```

### Q14: 如何升级或降级账户？

**账户管理：**

```
1. 访问 https://app.harness.io
2. 点击头像 → Billing
3. 查看当前计划
4. 点击 "Change Plan" 升级/降级
5. 选择新的计划
6. 确认变更
```

**注意事项：**

```
• 升级：立即生效，按比例收费
• 降级：下个计费周期生效
• 取消：需要联系 support@harness.io
• 账户持有人可以更改计划
```

## 获取帮助

### 常用资源

| 资源 | 链接 | 说明 |
|------|------|------|
| **官方文档** | [developer.harness.io/docs](https://developer.harness.io/docs) | 完整的文档和 API 参考 |
| **发布说明** | [developer.harness.io/release-notes](https://developer.harness.io/release-notes) | 新功能和改进 |
| **社区 Slack** | [Harness Community](https://slack.harness.io) | 免费用户支持 |
| **支持门户** | [support.harness.io](https://support.harness.io) | 企业支持（需要登录） |
| **GitHub Issues** | [harness/harness](https://github.com/harness/harness/issues) | 反馈 Bug 和建议 |

### 如何报告问题

**提供以下信息会有助于快速解决：**

```
1. 详细的问题描述
   - 预期行为是什么？
   - 实际发生了什么？

2. 重现步骤
   - 列出具体的操作步骤

3. 环境信息
   - Harness 版本
   - 浏览器/操作系统
   - Delegate 版本

4. 错误日志
   - 完整的错误堆栈跟踪
   - 相关的日志输出

5. 附加文件
   - 管道 YAML 配置
   - 截图
```

### 获取企业支持

```
• Standard Support: 工作时间内回应（8 小时）
• Premium Support: 24/7 关键问题支持（1 小时 SLA）
• Enterprise Support: 专属账户经理 + 技术顾问
```

---

**不能找到您的问题？**
- 查看完整的 [Harness 官方文档](https://developer.harness.io/docs)
- 参加 [Harness 培训课程](https://university.harness.io)
- 获得 [Harness 认证](https://university.harness.io/learn)

**相关文档：**
- [Harness 介绍](./harness-introduction.md)
- [Harness Windows 安装指南](./harness-windows-installation.md)
- [Harness 基础使用](./harness-basic-usage.md)
- [Harness 维护和最佳实践](./harness-maintenance.md)

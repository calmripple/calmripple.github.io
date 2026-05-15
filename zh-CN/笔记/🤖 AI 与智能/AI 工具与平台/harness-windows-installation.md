# Harness Windows 安装和配置指南

> 本指南适用于 Windows Server 2019 及以上版本（包括 Windows 11）

## 前置要求

### 系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|---------|--------|
| **操作系统** | Windows Server 2019 / Windows 11 | Windows Server 2022 / Windows 11 Pro |
| **内存** | 8 GB | 16 GB+ |
| **磁盘空间** | 50 GB | 100 GB+ |
| **CPU** | 2 核 | 4 核+ |
| **网络** | 稳定网络连接 | 对称网络 |

### 软件依赖

```powershell
# 1. Docker Desktop for Windows（必需）
# 2. PowerShell 5.0+（通常预装）
# 3. .NET Framework 4.7.2+（部分功能需要）
# 4. Git for Windows（推荐）
# 5. Visual Studio Code（推荐用于编辑配置文件）
```

## 第一步：准备 Windows 环境

### 1. 启用 Hyper-V 和容器功能

以 **管理员身份** 打开 PowerShell，运行以下命令：

```powershell
# 启用 Hyper-V
Enable-WindowsOptionalFeature -Online -FeatureName Hyper-V -All

# 启用容器功能
Enable-WindowsOptionalFeature -Online -FeatureName Containers -All

# 如果出现提示，选择 "Y" 并重启计算机
# 重启后验证
Get-WindowsOptionalFeature -Online | Select-Object FeatureName, State | Where-Object {$_.FeatureName -like "*Hyper*" -or $_.FeatureName -like "*Container*"}
```

### 2. 检查系统要求

```powershell
# 查看 Windows 版本
[System.Environment]::OSVersion.VersionString

# 查看内存
Get-WmiObject Win32_ComputerSystem | Select-Object Name, TotalPhysicalMemory

# 查看磁盘空间（C 盘）
Get-Volume -DriveLetter C
```

## 第二步：安装 Docker Desktop

### 安装步骤

1. **访问官方网站**
   - 前往 [Docker 官方网站](https://www.docker.com/products/docker-desktop)
   - 下载适合 Windows 的版本

2. **运行安装程序**
   - 双击 `Docker Desktop Installer.exe`
   - 在安装向导中勾选 "Install required Windows components for WSL 2"
   - 选择安装目录（建议使用默认位置 `C:\Program Files\Docker`）

3. **完成安装**
   - 点击 "Install"
   - 输入管理员密码确认
   - 等待安装完成（通常 3-5 分钟）

4. **重启计算机**
   - 安装程序会提示重启
   - 重启后 Docker 会自动启动

### 验证 Docker 安装

```powershell
# 查看 Docker 版本
docker --version

# 查看 Docker 信息
docker info

# 测试 Docker 是否正常运行
docker run hello-world
```

如果看到 "Hello from Docker!" 消息，说明 Docker 安装成功。

## 第三步：安装 Harness（Cloud 版本）

> 推荐大多数用户使用 Harness Cloud，无需自部署

### 创建 Harness 账户

1. **访问 Harness 网站**
   - 打开浏览器访问 [app.harness.io](https://app.harness.io)

2. **注册或登录**
   - 点击 "Sign Up"
   - 选择注册方式（邮箱、Google、GitHub 等）
   - 填写相关信息完成注册

3. **创建第一个项目**
   - 登录后，点击 "New Project"
   - 输入项目名称、组织名称
   - 选择部署目标（暂时可选择 "Skip"）
   - 完成项目创建

### 配置 Harness Delegate（Windows 版本）

Delegate 是 Harness 的执行代理，需要在您的环境中安装。

#### 方式 1：容器方式（推荐）

```powershell
# 1. 创建 Harness 工作目录
New-Item -ItemType Directory -Force -Path "C:\harness"
cd C:\harness

# 2. 在 Harness UI 中获取 Delegate 配置
# 登录 Harness → Account Settings → Delegates → New Delegate

# 3. 选择 Docker 方式，复制提供的 Docker Compose 命令
# 示例（需替换实际的 token 和 manager url）
docker pull harness/delegate:23.07.79100
docker run -e DELEGATE_NAME=my-delegate `
  -e DELEGATE_PROFILE=default `
  -e ACCOUNT_ID=<your_account_id> `
  -e MANAGER_HOST_AND_PORT=app.harness.io:443 `
  -e DELEGATE_TOKEN=<your_token> `
  -e LOG_STREAMING_SERVICE_URL=https://app.harness.io/log-service/ `
  -e WATCHER_STORAGE_URL=https://app.harness.io/watcher/ `
  -e REMOTE_WATCHER_URL_CDN=https://app.harness.io/public/prod/remote-watchers/releases/download/ `
  -e JRE_VERSION=11.0.15 `
  -e HELM_DESIRED_VERSION=v3.8.0 `
  -d --name harness-delegate harness/delegate:23.07.79100

# 4. 验证 Delegate 状态
docker ps
docker logs harness-delegate
```

#### 方式 2：进程方式（适合开发环境）

```powershell
# 1. 下载 Delegate JAR 文件
$delegateUrl = "https://app.harness.io/delegate-builds/harness-delegate.jar"
$output = "C:\harness\delegate.jar"
Invoke-WebRequest -Uri $delegateUrl -OutFile $output -UseBasicParsing

# 2. 设置环境变量
$env:DELEGATE_NAME = "my-delegate"
$env:MANAGER_HOST_AND_PORT = "app.harness.io:443"
$env:ACCOUNT_ID = "<your_account_id>"
$env:DELEGATE_TOKEN = "<your_token>"

# 3. 启动 Delegate
java -jar C:\harness\delegate.jar

# 注意：这个窗口需要保持打开
```

### 验证 Delegate 连接

```
在 Harness UI 中：
1. 登录账户
2. 导航到 Account Settings → Delegates
3. 检查您的 Delegate 状态
4. 应该显示 "Connected" 和 "Healthy"
```

## 第四步：连接版本控制系统

### 连接 GitHub

1. **在 Harness 中创建 GitHub Connector**
   - 打开 Project Settings → Connectors
   - 点击 "+ New Connector"
   - 选择 "GitHub"
   - 填写配置：
     - URL：`https://github.com`（GitHub Cloud）
     - Authentication：选择 "Personal Access Token"
     - Token：粘贴 GitHub PAT（Personal Access Token）

2. **生成 GitHub Personal Access Token**
   ```
   在 GitHub 中：
   1. 点击头像 → Settings
   2. Developer settings → Personal access tokens
   3. Generate new token
   4. 勾选权限：repo, admin:repo_hook, admin:org_hook
   5. 复制 token 到 Harness
   ```

3. **测试连接**
   - 点击 "Test" 验证连接
   - 显示 "Success" 后保存

### 连接 GitLab

```
类似 GitHub，但需要：
1. GitLab 账户的 Personal Access Token（权限：api, read_repository）
2. GitLab 服务器 URL（自托管需要填写完整 URL）
```

## 第五步：创建第一条 CI 管道

### 创建管道

1. **新建管道**
   - 点击 "Pipelines" → "+ New Pipeline"
   - 输入管道名称
   - 选择版本控制连接（GitHub/GitLab）
   - 选择源仓库和分支

2. **配置构建步骤**
   ```yaml
   pipeline:
     name: My-First-CI
     identifier: my_first_ci
     projectIdentifier: default
     orgIdentifier: default
     stages:
       - stage:
           name: Build
           identifier: build
           type: CI
           spec:
             cloneCodebase: true
             infrastructure:
               type: Cloud
               spec:
                 os: Linux
                 arch: Amd64
             execution:
               steps:
                 - step:
                     type: Run
                     name: Build Step
                     identifier: build_step
                     spec:
                       shell: Bash
                       command: |
                         echo "Building application..."
                         ls -la
   ```

3. **触发管道**
   - 点击 "Run" 手动执行
   - 或配置自动触发（代码推送时）

## 第六步：配置网络和防火墙

### 防火墙设置

```powershell
# 允许 Docker 通过防火墙（如使用 Windows 防火墙）
New-NetFirewallRule -DisplayName "Allow Docker" `
  -Direction Inbound `
  -Action Allow `
  -Program "C:\Program Files\Docker\Docker\Docker.exe"

# 允许特定端口
New-NetFirewallRule -DisplayName "Allow Harness Delegate" `
  -Direction Outbound `
  -Action Allow `
  -RemoteAddress "app.harness.io" `
  -RemotePort 443 `
  -Protocol TCP
```

### 代理配置（如需要）

在 Docker 中配置代理（编辑 `%AppData%\Docker\daemon.json`）：

```json
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy.example.com:8080",
      "httpsProxy": "http://proxy.example.com:8080",
      "noProxy": "localhost,127.0.0.1"
    }
  }
}
```

## Windows 特定注意事项

### 1. 路径问题

Windows 使用反斜杠 `\`，而 Harness 配置文件使用正斜杠 `/`。在 YAML 配置中始终使用正斜杠：

```yaml
# ✅ 正确
spec:
  command: dir C:/harness/data

# ❌ 错误
spec:
  command: dir C:\harness\data
```

### 2. PowerShell 执行策略

如果遇到执行权限问题，调整执行策略：

```powershell
# 查看当前策略
Get-ExecutionPolicy

# 设置为允许本地脚本执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. 文件编码

编辑配置文件时使用 UTF-8 编码，推荐使用 VS Code：

```powershell
# 在 PowerShell 中创建 UTF-8 文件
Set-Content -Path "config.yaml" -Value $content -Encoding UTF8
```

### 4. 行结束符

YAML 文件使用 LF（Unix 风格），不使用 CRLF（Windows 风格）。VS Code 中可在底部状态栏设置。

## 常见安装问题

| 问题 | 解决方案 |
|------|---------|
| Docker 启动失败 | 重启 Hyper-V，检查 BIOS 虚拟化设置 |
| 网络连接超时 | 检查防火墙，验证 DNS 设置 |
| 权限不足 | 使用管理员身份运行 PowerShell |
| 磁盘空间不足 | 清理 Docker 镜像：`docker system prune -a` |
| Delegate 连接失败 | 检查 token 有效性，验证网络连接 |

## 下一步

1. ✅ 创建您的第一条 CI 管道
2. 📚 学习 YAML 配置语法
3. 🔗 连接您的实际项目仓库
4. 🚀 配置 CD 管道进行自动部署

---

**相关文档：**
- [Harness 基础使用](./harness-basic-usage.md)
- [Harness 常见问题](./harness-faq.md)
- [Docker 官方文档](https://docs.docker.com/desktop/install/windows-install/)

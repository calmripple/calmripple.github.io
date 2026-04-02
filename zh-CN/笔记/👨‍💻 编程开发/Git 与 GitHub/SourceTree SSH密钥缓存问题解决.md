---
created: 2025-01-26T00:14:35 (UTC +08:00)
author: calmripple

sidebar:
 title: SourceTree SSH密钥缓存问题解决
 step: 1
isTimeLine: true
title: SourceTree SSH密钥缓存问题解决
date: 2025-01-26
tags:
 - github

categories:
 - github
---
# SourceTree SSH密钥缓存问题解决

## 问题描述
通过sourcetree连接github时，出现以下提示：

命令: 

```
git -c diff.mnemonicprefix=false -c core.quotepath=false --no-optional-locks ls-remote git@github.com:VitepressAwesome/nolebase.git
```

> 输出:
> 错误: The host key is not cached for this server:
>   github.com (port 22)
> You have no guarantee that the server is the computer you
> think it is.
> The server's ssh-ed25519 key fingerprint is:
>   ssh-ed25519 255 SHA256:+++++++指纹++++++
> If you trust this host, enter "y" to add the key to Plink's
> cache and carry on connecting.
> If you want to carry on connecting just once, without adding
> the key to the cache, enter "n".
> If you do not trust this host, press Return to abandon the
> connection.
> Store key in cache? (y/n, Return cancels connection, i for more info) fatal: Could not read from remote repository.

## 原因分析

我现在需要解决用户在使用SourceTree时遇到的SSH主机密钥未缓存的问题。用户运行了git命令来ls-remote一个GitHub仓库，但提示主机密钥未缓存，需要确认是否信任该密钥。用户现在不知道该怎么处理，所以需要一步步指导他们解决这个问题。

首先，我应该回忆一下SSH连接的基本原理。当第一次通过SSH连接到某个服务器时，客户端会检查是否已经缓存了该服务器的主机密钥。如果没有，就会提示用户是否信任该密钥。这主要是为了防止中间人攻击。用户在这里遇到了这个问题，因为他们的环境（可能是使用Plink作为SSH客户端）没有缓存GitHub的主机密钥。

接下来，用户使用的是SourceTree，而SourceTree在Windows上可能默认使用PuTTY的Plink作为SSH客户端。PuTTY和OpenSSH处理已知主机的方式不同，PuTTY会有一个单独的known_hosts文件，而OpenSSH用的是用户目录下的.ssh/known_hosts。用户遇到的问题可能是因为Plink的缓存里没有GitHub的主机密钥，所以需要手动确认添加。

用户看到的错误信息里提到了是否将密钥保存到Plink的缓存中，需要输入y或n。如果用户输入y，Plink就会把密钥保存下来，以后连接就不会再提示了。但用户可能是在SourceTree中操作，没有直接的机会输入这个y，导致连接失败。这时候需要手动确认GitHub的主机密钥，并将其添加到Plink的缓存中。

首先，我需要验证GitHub的SSH密钥指纹是否正确。用户看到的指纹是ssh-ed25519 255 SHA256:+++++++指纹++++++。根据GitHub的官方文档，他们的Ed25519指纹确实是这个SHA256值。所以用户应该信任这个密钥。

解决方案可能包括几种方法：

1. 手动使用Plink（PuTTY的组件）连接到GitHub，这样会触发保存主机密钥的提示，用户可以输入y确认。例如运行`plink git@github.com`，然后输入y，之后SourceTree就能正常连接了。

2. 将GitHub的主机密钥手动添加到Plink的known_hosts文件中，即PuTTY的缓存文件。需要找到Plink存储known hosts的位置，通常是注册表中的某个位置，或者使用Pageant来管理。不过手动操作注册表可能比较复杂，所以可能更推荐第一种方法。

3. 或者，将SourceTree的SSH客户端切换为OpenSSH而不是Plink，这样可以使用系统默认的SSH配置，可能避免这个问题。但用户可能需要配置SourceTree使用OpenSSH，并且确保known_hosts中已经有GitHub的密钥。

另外，用户可能遇到这个问题是因为之前没有通过Plink连接过GitHub，所以需要首次确认。或者可能SourceTree在后台运行Plink时没有提供交互式提示，导致无法输入y，从而失败。因此需要手动触发这个确认过程。

总结下来，步骤应该是：

- 确认GitHub的SSH指纹是否匹配官方文档，确保安全性。

- 使用Plink手动连接GitHub，触发保存密钥的提示，输入y确认。

- 之后SourceTree的命令应该就能正常执行了。

或者，如果用户更熟悉OpenSSH，可以切换SourceTree的SSH客户端为OpenSSH，这样利用系统已有的known_hosts文件，可能已经包含了GitHub的密钥。

需要详细说明每一步的操作，尤其是如何运行Plink命令，因为用户可能不熟悉命令行操作。同时提醒用户确保他们信任GitHub的主机密钥，不要随意添加未知的密钥，避免安全风险。

此外，如果用户之前配置过SSH密钥，需要确认他们的SSH私钥是否正确，是否有权限访问该仓库。但根据错误信息来看，主要问题还是主机密钥未缓存，而不是权限问题。但错误信息最后提到“请确保您有正确的访问权限”，所以可能需要检查SSH密钥是否添加到GitHub账户中。但可能这一步问题已经处理，所以主要问题还是主机密钥缓存。

可能的其他考虑：用户是否在代理或防火墙后面，导致无法连接到GitHub的22端口？但错误信息显示已经能连接到服务器，只是主机密钥未缓存，所以网络连接应该是通的，问题出在密钥确认上。

最后，需要以清晰、分步骤的方式指导用户操作，确保他们能理解并安全地解决问题。

## 要解决 SourceTree 中出现的 SSH 主机密钥未缓存的问题，请按照以下步骤操作：

---

### **1. 验证 GitHub 的 SSH 密钥指纹**
首先确认提示中的指纹是否与 GitHub 官方一致：
- **GitHub 官方 Ed25519 指纹**：
  ```
  SHA256:+++++++指纹++++++
  ```
  如果匹配，说明是安全的，可以信任。

---

### **2. 手动缓存密钥（通过 Plink）**
SourceTree 可能使用 Plink（PuTTY 的 SSH 客户端），需手动触发密钥保存：

1. **打开命令提示符**（CMD 或 PowerShell）。
2. **运行以下命令**：
   ```bash
   plink git@github.com
   ```
3. **输入 `y`** 确认保存密钥到 Plink 的缓存。
4. **等待连接被拒绝**（正常现象，目的仅是缓存密钥）。

---

### **3. 检查 SourceTree 的 SSH 配置**
确保 SourceTree 使用正确的 SSH 客户端：
1. 打开 SourceTree，进入 **工具 > 选项 > 一般**。
2. 在 **SSH 客户端** 中选择 **OpenSSH**（推荐）而非 PuTTY/Plink。
   - OpenSSH 使用系统 `known_hosts` 文件（通常已包含 GitHub 密钥）。

---

### **4. 验证 SSH 密钥权限**
确保你的 SSH 私钥已添加到 GitHub 账户：
1. 检查 `~/.ssh/id_ed25519.pub` 或 `~/.ssh/id_rsa.pub` 内容。
2. 登录 GitHub，进入 **Settings > SSH and GPG Keys**，添加公钥。

---

### **5. 重新尝试操作**
完成上述步骤后，重新执行 SourceTree 的拉取/推送操作。

---

### 附：常见问题
- **如果 Plink 未安装**：安装 Git 时选择“使用 OpenSSH”而非 PuTTY。
- **防火墙/网络问题**：确保能访问 `github.com:22` 端口。
- **强制使用 OpenSSH**（推荐）：
  ```bash
  git config --global core.sshCommand "ssh -o IdentitiesOnly=yes -i ~/.ssh/your_private_key"
  ```

---

通过以上步骤，SourceTree 应能正确缓存 GitHub 的主机密钥并正常访问仓库。

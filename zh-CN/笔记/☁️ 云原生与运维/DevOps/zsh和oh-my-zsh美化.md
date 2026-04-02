---
sidebar: true
date: 2025-10-28 20:00:00
title: zsh和oh-my-zsh美化
tag: cloud
---
## 准备
> 安装wsl以及Ubuntu请参考 [wsl中安装docker 1panel k8s](./install_docker_k8s_1panel_in_WSL)

### 查看当前环境的 shell

```bash
echo $SHELL
```

### 查看当前系统有那些 shell

```bash
cat /etc/shells
```

## 安装 zsh

```bash
sudo apt install zsh
```

##  将 zsh 设置为默认的 shell

```bash
chsh -s /bin/zsh
```

## 安装 Oh My Zsh

```bash
git clone https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh
```

```bash
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
```

## 安装 Powerlevel10k

### 克隆仓库

> GitHub

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

> Gitee

```bash
git clone --depth=1 https://gitee.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

### 设置主题

在 `~/.zshrc` 中添加

```bash
ZSH_THEME="powerlevel10k/powerlevel10k"
```

使配置生效。

```shell
source ~/.zshrc
```

#### 设置字体为 MesloLGS NF

> https://github.com/romkatv/powerlevel10k#manual-font-installation

#### 自定义配置

```bash
p10k configure
```

## 安装一些 zsh 常用插件

> 安装插件后要使用 `source .zshrc` 使配置生效

- git

  > 显示 git 的一些功能，默认已经安装

  ```
  plugins=(git)
  ```

- z

  > 跳转目录，直接在 plugins 里面添加 z

  ```
  plugins=(
          git
          z)
  ```

- sudo

  > 偶尔输入某个命令，提示没有权限，需要加sudo，这个时候按两下ESC，就会在命令行头部加上 sudo 默认已经安装

  ```
  plugins=(
          git
          sudo
          z)
  ```

- zsh-autosuggestions

  > 会记录你之前输入过的所有命令，并且自动匹配你可能想要输入命令，然后按 Tab 补全

  https://github.com/zsh-users/zsh-autosuggestions/blob/master/INSTALL.md#oh-my-zsh

  克隆仓库

  ```bash
  git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
  ```

  添加配置

  ```
  plugins=(
          git
          sudo
          z
          zsh-autosuggestions)
  ```

- zsh-syntax-highlighting

  > 直接在输入过程中就会提示你，当前命令是否正确，错误红色，正确绿色

  https://github.com/zsh-users/zsh-syntax-highlighting/blob/master/INSTALL.md#oh-my-zsh

  克隆仓库

  ```bash
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
  ```

  添加配置

  ```
  plugins=(
          git
          sudo
          z
          zsh-autosuggestions
          zsh-syntax-highlighting)
  ```

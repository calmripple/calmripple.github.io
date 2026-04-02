---
sidebar: false
date: 2025-10-27 18:00:00
tag: cloud
---
# wsl中安装docker 1panel k8s

>仅再2025年当前时间点测试有效，后续相关配置可能变化，自行修改

## 设置wsl的系统配置
```bash
# 设置wsl的系统配置
#
notepad $env:UserProfile\.wslconfig
# 如果wsl正在运行，需要重启wsl
wsl --shutdown

```
粘贴如下内容到notepad
```ini
[wsl2]
firewall=false
dhcp=false
ipv6=true
networkingMode=Mirrored
swap=0 # 关闭swap

[experimental]
hostAddressLoopback=true
```
## 安装wsl并升级到最新版

```bash
#Win10或者Win11升级到最新版本即可。 启用Windows 子系统功能，使用管理员权限打开一个 PowerShell 窗口，输入以下命令：
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
#还需要再启用虚拟机平台功能，在 PowerShell 中输入以下命令，重启系统：
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

#或者安装wsl现在可以直接使用wsl命令安装（如果需要）
# wsl --install --no-distribution

#升级wsl 2（如果需要）
# wsl.exe --update --pre-release

#重启后，在 PowerShell 中输入以下命令，将 WSL 默认版本改为 WSL2:
wsl --set-default-version 2
#接下来安装Ubuntu，建议安装24.04版本
wsl --install Ubuntu-24.04

#若要设置与命令一起使用 wsl 的默认 Linux 分发版，请输入：
wsl.exe --set-default Ubuntu-24.04
```
运行进入ubuntu
```bash
# 运行进入ubuntu
wsl -d Ubuntu-24.04

# 更改ubuntu更新源
cp /etc/apt/sources.list /etc/apt/sources.list.bak

echo "deb http://mirrors.aliyun.com/ubuntu/ focal main restricted
deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted
deb http://mirrors.aliyun.com/ubuntu/ focal universe
deb http://mirrors.aliyun.com/ubuntu/ focal-updates universe
deb http://mirrors.aliyun.com/ubuntu/ focal multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-updates multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted
deb http://mirrors.aliyun.com/ubuntu/ focal-security universe
deb http://mirrors.aliyun.com/ubuntu/ focal-security multiverse">/etc/apt/sources.list
# 更新系统
apt update && apt upgrade -y
# 确认systemd是否启用,当前wsl 已经支持systemd，不需要安装
# systemctl status systemd-resolved
```
## 安装zsh和oh-my-zsh美化

[安装zsh和oh-my-zsh美化](./zsh和oh-my-zsh美化.md)

## 安装docker/docker-compose

因为wsl2已经完整使用了linux内核了，此种方式和先前在linux虚拟机安装docker类似，步骤如下：
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
# 若无法下载，可以使用阿里云镜像
#curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

sudo sh get-docker.sh
sudo service docker start

#开机启动
systemctl enable docker
# #禁止开机启动
# systemctl disable docker

# # 检查dockerd进程启动
# service docker status
# ps aux|grep docker
# # 检查拉取镜像等正常
# docker pull busybox
# docker images
```
>Docker 也专门开发了可以使用 WSL2 中的 Docker 守护进程的桌面管理程序, 打开 Docker Desktop WSL2 backend 页面，下载最新的 Docker Desktop for Windows 程序 ，建议下载stable版本。下载地址：https://www.docker.com/products/docker-desktop

```bash
# 安装docker-compose
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
#Apply executable permissions to the binary:
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
#Test the installation.
docker compose version

```
## 卸载 docker

```bash
# 卸载docker
docker container stop $(docker container ls -aq)
docker system prune -a --volumes
# #或者可以使用apt像卸载其他软件包一样来卸载 Docker：
# sudo apt purge docker-ce
# sudo apt autoremove
```
## 修改docker数据存储路径(非必要不设置)
wsl ubuntu 默认安装在 c 盘，希望将 docker 的数据存储路径（默认为 /var/lib/docker ）修改到 d 盘。
添加 /etc/docker/daemon.json 文件，内容如下
```json
{
  "registry-mirrors": ["https://registry.docker-cn.com"],
  "data-root": "/mnt/d/data/docker",
  "log-driver": "json-file",
  "log-opts": { "max-size": "100m" }
}
```
>docker 启动失败。wls ubuntu docker可能不支持将文件存储到 windows 磁盘。
>将 /var/lib/docker 拷贝到 d 盘，报错，应该是 windows 磁盘不支持这些特殊文件(权限问题)。
> ```log
> hekai@thinkpad-l14:~$ sudo mv /var/lib/docker /mnt/d/data/docker
> mv: cannot create special file '/mnt/d/data/docker/volumes/backingFsBlockDev': Operation not supported
> mv: cannot create special file '/mnt/d/data/docker/volumes/docker-centos7-slurm-cluster_mysql/_data/mysql.sock': Operation not supported
> mv: cannot create special file '/mnt/d/data/docker/overlay2/3a272b47e6ae28aa475f3eea705bdb2bdeb83dc97c6feb91cc20e6c49bbc004b-init/work/work/#23d': Operation not supported
> mv: cannot create special file '/mnt/d/data/docker/overlay2/2a012b89cc6a205c6c8a148abae32a5e735695b52a54e2e3e792c2a5e88a00af-init/work/work/#23f': Operation not supported
> ```
接着编辑镜像文件(不存在这个文件的话，会自动创建)：
```bash
cat >> /etc/docker/daemon.json<<EOF
{
    "registry-mirrors": [
        "https://a4zqywx0.mirror.aliyuncs.com",
        "https://docker.1panel.live",
        "https://registry-vpc.cn-qingdao.aliyuncs.com",
        "https://f1361db2.m.daocloud.io",
        "https://docker.mirrors.ustc.edu.cn",
        "https://mirror.ccs.tencentyun.com",
        "https://hub-mirror.c.163.com",
        "https://docker.m.daocloud.io",
        "https://docker.imgdb.de",
        "https://docker-0.unsee.tech",
        "https://docker.hlmirror.com",
        "https://cjie.eu.org",
        "https://f1361db2.m.daocloud.io",
        "https://docker.mirrors.ustc.edu.cn",
        "https://mirror.ccs.tencentyun.com",
        "https://hub-mirror.c.163.com",
        "https://a4zqywx0.mirror.aliyuncs.com",
        "https://docker.m.daocloud.io",
        "https://docker.imgdb.de",
        "https://docker-0.unsee.tech",
        "https://docker.hlmirror.com",
        "https://cjie.eu.org",
        "https://registry.cn-hangzhou.aliyuncs.com",
        "https://reg-mirror.qiniu.com",
        "https://docker.mirrors.ustc.edu.cn",
        "https://hub-mirror.c.163.com"
    ]
}
EOF
#重启Dokcer
service docker restart
```

## 安装1panel

```bash
# 安装1panel
bash -c "$(curl -sSL https://resource.fit2cloud.com/1panel/package/v2/quick_start.sh)"
```

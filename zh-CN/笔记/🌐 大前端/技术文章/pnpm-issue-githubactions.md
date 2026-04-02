---
title: pnpm install 在github actions中运行的问题
date: 2024-06-18
tags:
 - 技术笔记
 - 技术教程
 - github
 - actions
 - pnpm
categories:
 - pnpm
 - 技术笔记
source:
author: jimbo
---
# pnpm install 在github actions中运行的问题

> ## Excerpt
> pnpm install 在 CI 环境中的默认行为与本地不同，尤其是在 GitHub Actions 里经常会额外带上冻结锁文件等约束，需要根据场景显式指定参数。

## Table of contents

- [What does it do?](#what-does-it-do)
- [Setup](#setup)
- [Inputs](#inputs)

## What does it do?

pnpm 在workspace monorepo的环境下，一定要使用 `pnpm install -wr` 来确保工作空间内所有项目的package.json都递归进行了安装，否则仅仅会安装根目录下的package.json

pnpm 在个人开发时 pnpm install 是没有默认参数的，但在 github actions中运行时，由于是CI环境下运行会带上不同平常给的默认行为，比如
`pnpm install -wr` 会与 `pnpm install -wr --frozen-lockfile` 等同，如果希望全新安装，则需要指定参数  `pnpm install -wr  --ignore-scripts --no-frozen-lockfile`.
` --ignore-scripts `参数为忽略安装本地脚本，加快安装速度

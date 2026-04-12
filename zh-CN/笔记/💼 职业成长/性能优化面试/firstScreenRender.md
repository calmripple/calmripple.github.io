---
isTimeLine: true
title: 如何加快首屏渲染?
date: 2020-03-31T00:00:00.000Z
tags:
  - 面试题
  - 性能优化
  - 前端
categories:
  - 面试题
  - 性能优化
---
# 如何加快首屏渲染?

## 降低请求数量
* 合并资源,减少http请求数目
* 资源懒加载
* minify / gzip 压缩

## 加快请求速度
* 预解析DNS
* CDN分发静态资源
* 减少域名数
* 并行http请求

## 使用缓存
* HTTP缓存

## 渲染优化
* 减少首屏加载的内容
* 拆分JS,使用异步(async/defer)加载
* css优化
* 合理的加载顺序
* 服务端渲染

<Citation type="转载" source="粥里有勺糖的博客" url="https://sugarat.top/interview/performance/firstScreenRender.html" />

---
title: 知识图谱
description: 以动态图谱浏览站内文章之间的链接关系。
layout: home
sidebar: false
aside: false
layoutClass: graph-view-home
knewbeing:
  gitChangelog: false
  pageProperties: false
---

<script setup lang="ts">
import { data as graphData } from '../../.vitepress/graph.data'
</script>

这里展示站点文档之间的链接关系。你可以拖动节点、平移画布、滚轮缩放，并通过搜索快速定位页面。

<div class="graph-view-home-wrap">
  <NolebaseGraphView3D
    :data="graphData"
    title="知识图谱"
    :height="'100%'"
    :max-nodes="200"
  />
</div>

<style>
.graph-view-home .VPHome {
  padding: 0;
}

.graph-view-home .VPHomeHero,
.graph-view-home .VPHomeFeatures {
  display: none;
}

.graph-view-home .VPHome .container,
.graph-view-home .VPHome .main {
  max-width: 100% !important;
  width: 100%;
}

.graph-view-home-wrap {
  height: calc(100vh - var(--vp-nav-height));
  min-height: 560px;
  padding: 8px 12px 12px;
}

.graph-view-home-wrap .VPNolebaseGraphView3D {
  margin: 0;
  height: 100%;
  min-height: 100%;
}

@media (max-width: 960px) {
  .graph-view-home-wrap {
    height: calc(100vh - var(--vp-nav-height));
    min-height: 70vh;
    padding: 0;
  }
}
</style>

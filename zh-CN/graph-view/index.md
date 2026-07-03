---
title: 引力矩阵图谱
description: 以矩阵引力图谱浏览站内文章之间的链接关系。
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

<div class="graph-view-home-wrap">
  <NolebaseGraphView3D
    :data="graphData"
    title="引力矩阵图谱"
    description="站点文档被映射到矩阵引力场中，节点规模表示连接强度，连线表示文章之间的引用关系。拖拽旋转星群，点击节点进入对应文章。"
    :height="'100%'"
    :max-nodes="240"
  />
</div>

<style>
.graph-view-home .VPHome {
  padding: 0;
  background:
    radial-gradient(circle at 18% 18%, rgb(97 224 169 / 10%), transparent 28%),
    radial-gradient(circle at 78% 20%, rgb(245 182 66 / 9%), transparent 26%),
    linear-gradient(180deg, rgb(248 251 247) 0%, rgb(235 244 240) 100%);
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

.graph-view-home .vp-doc.container > div > :not(.graph-view-home-wrap) {
  display: none;
}

.graph-view-home-wrap {
  height: calc(100vh - var(--vp-nav-height));
  min-height: 560px;
  padding: 18px 24px 24px;
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
    padding: 10px;
  }
}
</style>

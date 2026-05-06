---
title: 知识图谱
description: 以动态图谱浏览站内文章之间的链接关系。
knewbeing:
  gitChangelog: false
  pageProperties: false
---

<script setup lang="ts">
import { data as graphData } from '../../.vitepress/graph.data'
</script>

这里展示站点文档之间的链接关系。你可以拖动节点、平移画布、滚轮缩放，并通过搜索快速定位页面。

<NolebaseGraphView :data="graphData" title="知识图谱" :height="680" :max-nodes="140" />
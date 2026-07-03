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
import type { GraphViewData } from '@knewbeing/vitepress-plugin-graph-view/vitepress'

import { loadGravityMatrixGraph } from '@knewbeing/vitepress-plugin-graph-view/client'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData } from 'vitepress'

const { site } = useData()
const graphData = ref<GraphViewData>({ nodes: [], edges: [], generatedAt: 0 })
const loading = ref(true)
const loadError = ref('')
const loadedChunks = ref(0)
const totalChunks = ref(0)
const loadedNodes = ref(0)
const loadedEdges = ref(0)

let abortController: AbortController | undefined

const progressLabel = computed(() => {
  if (loadError.value)
    return loadError.value
  if (!totalChunks.value)
    return '正在读取引力矩阵索引...'
  return `正在加载引力矩阵 ${loadedChunks.value}/${totalChunks.value} · ${loadedNodes.value} 节点 · ${loadedEdges.value} 连线`
})

function hideAuxiliaryContent() {
  const wrap = document.querySelector('.graph-view-home-wrap')
  const parent = wrap?.parentElement
  if (!wrap || !parent)
    return

  for (const node of Array.from(parent.childNodes)) {
    if (node === wrap)
      continue

    node.remove()
  }
}

onMounted(async () => {
  abortController = new AbortController()
  await nextTick()
  hideAuxiliaryContent()
  try {
    const result = await loadGravityMatrixGraph({
      base: site.value.base,
      signal: abortController.signal,
      onData(data) {
        graphData.value = data
      },
      onProgress(progress) {
        loadedChunks.value = progress.loadedChunks
        totalChunks.value = progress.totalChunks
        loadedNodes.value = progress.loadedNodes
        loadedEdges.value = progress.loadedEdges
      },
    })
    graphData.value = result.data
  }
  catch (error) {
    if (!abortController.signal.aborted)
      loadError.value = error instanceof Error ? error.message : String(error)
  }
  finally {
    if (!abortController.signal.aborted)
      loading.value = false
    await nextTick()
    hideAuxiliaryContent()
  }
})

onBeforeUnmount(() => {
  abortController?.abort()
})
</script>

<div class="graph-view-home-wrap">
  <NolebaseGraphView3D
    :data="graphData"
    title="引力矩阵图谱"
    description="站点笔记被映射到分片加载的知识引力场中，节点规模表示连接强度，连线粗细表示知识相关性。拖拽旋转星群，点击节点进入对应文章。"
    :height="'100%'"
    :loading="loading"
    :max-nodes="240"
    :progress-label="progressLabel"
  />
  <div v-if="loadError" class="graph-view-error" role="alert">
    {{ loadError }}
  </div>
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

.graph-view-home .vp-doc.container > div {
  font-size: 0;
}

.graph-view-home .graph-view-home-wrap {
  font-size: initial;
}

.graph-view-home-wrap ~ * {
  display: none !important;
}

.graph-view-home .header-anchor,
.graph-view-home .VPDocFooter,
.graph-view-home .VPLastUpdated,
.graph-view-home [class*='NolebaseGit'] {
  display: none !important;
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

.graph-view-error {
  position: absolute;
  right: 32px;
  bottom: 32px;
  left: 32px;
  z-index: 5;
  padding: 12px 14px;
  border: 1px solid rgb(220 38 38 / 28%);
  border-radius: 8px;
  background: rgb(69 10 10 / 82%);
  color: rgb(254 226 226);
  font-size: 13px;
}

@media (max-width: 960px) {
  .graph-view-home-wrap {
    height: calc(100vh - var(--vp-nav-height));
    min-height: 70vh;
    padding: 10px;
  }
}
</style>

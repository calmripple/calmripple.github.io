<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'

import { data as graphData } from '../../graph.data'

const route = useRoute()
const { page } = useData()

function normalizePath(path: string): string {
  return path.split('#')[0]?.split('?')[0] || '/'
}

function candidateUrls(path: string): string[] {
  const normalized = normalizePath(path)
  const candidates = new Set<string>()

  candidates.add(normalized)

  if (normalized.endsWith('/'))
    candidates.add(`${normalized}index.html`)

  if (normalized.endsWith('/index'))
    candidates.add(`${normalized}.html`)

  if (normalized.endsWith('.md'))
    candidates.add(normalized.replace(/\.md$/, '.html'))

  if (!normalized.endsWith('.html') && !normalized.endsWith('/'))
    candidates.add(`${normalized}.html`)

  for (const value of [...candidates]) {
    try {
      candidates.add(decodeURIComponent(value))
    }
    catch {}
  }

  return [...candidates]
}

const isNotePage = computed(() => {
  const relativePath = page.value.relativePath || ''
  if (!relativePath)
    return false

  return relativePath.startsWith('笔记/')
})

const currentNode = computed(() => {
  const candidates = candidateUrls(route.path)
  return graphData.nodes.find(node => candidates.includes(node.url))
})

const subGraph = computed(() => {
  const node = currentNode.value
  if (!node)
    return { nodes: [], edges: [], generatedAt: graphData.generatedAt }

  const relatedIds = new Set<string>([node.id])
  const edges = graphData.edges.filter((edge) => {
    const related = edge.source === node.id || edge.target === node.id
    if (related) {
      relatedIds.add(edge.source)
      relatedIds.add(edge.target)
    }
    return related
  })

  const nodes = graphData.nodes.filter(item => relatedIds.has(item.id))

  return {
    nodes,
    edges,
    generatedAt: graphData.generatedAt,
  }
})

const shouldShow = computed(() => {
  return isNotePage.value && !!currentNode.value && subGraph.value.nodes.length > 1
})
</script>

<template>
  <div v-if="shouldShow" class="page-graph-aside">
    <NolebaseGraphView
      :data="subGraph"
      title="当前页关联图谱"
      :height="300"
      :max-nodes="24"
    />
  </div>
</template>

<style scoped>
.page-graph-aside {
  margin-bottom: 12px;
}

.page-graph-aside :deep(.VPNolebaseGraphView) {
  margin: 0;
}

.page-graph-aside :deep(.VPNolebaseGraphViewToolbar h2) {
  font-size: 14px;
}

.page-graph-aside :deep(.VPNolebaseGraphViewToolbar p) {
  font-size: 12px;
}

.page-graph-aside :deep(.VPNolebaseGraphViewPanel) {
  display: none;
}
</style>

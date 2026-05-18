<script setup lang="ts">
import type { GraphViewData } from "../../vitepress"

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

const props = defineProps<{
  data: GraphViewData
  height?: number | string
  maxNodes?: number
}>()

const containerEl = ref<HTMLDivElement>()

let graphInstance: any

const heightStyle = computed(() => {
  if (typeof props.height === "number")
    return `$${props.height}px`
  return props.height || "100%"
})

const maxNodes = computed(() => props.maxNodes && props.maxNodes > 0 ? props.maxNodes : 200)

const degreeByNodeId = computed(() => {
  const deg = new Map<string, number>()
  for (const n of props.data.nodes) deg.set(n.id, 0)
  for (const e of props.data.edges) {
    deg.set(e.source, (deg.get(e.source) || 0) + 1)
    deg.set(e.target, (deg.get(e.target) || 0) + 1)
  }
  return deg
})

const graphData = computed(() => {
  const nodes = props.data.nodes
    .slice()
    .sort((a, b) => (degreeByNodeId.value.get(b.id) || 0) - (degreeByNodeId.value.get(a.id) || 0))
    .slice(0, maxNodes.value)

  const nodeIds = new Set(nodes.map(n => n.id))

  return {
    nodes: nodes.map(n => ({
      id: n.id,
      name: n.title,
      url: n.url,
      val: Math.min(16, 2 + (degreeByNodeId.value.get(n.id) || 0) * 1.1),
      color: n.external ? "#f59e0b" : "#4f7dbd",
    })),
    links: props.data.edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({ source: e.source, target: e.target })),
  }
})

async function initGraph() {
  if (!containerEl.value)
    return

  const { default: ForceGraph3D } = await import("3d-force-graph")

  graphInstance = (ForceGraph3D as any)()(containerEl.value)
    .backgroundColor("rgba(0,0,0,0)")
    .showNavInfo(false)
    .nodeLabel((node: any) => node.name)
    .nodeColor((node: any) => node.color)
    .nodeOpacity(0.9)
    .nodeResolution(8)
    .linkColor(() => "rgba(110,130,170,0.35)")
    .linkOpacity(0.32)
    .linkWidth(0.8)
    .onNodeClick((node: any) => {
      if (node?.url)
        window.location.href = node.url
    })

  updateSize()
  graphInstance.graphData(graphData.value)
  graphInstance.zoomToFit(400, 18)

  window.addEventListener("resize", updateSize)
}

function updateSize() {
  if (!containerEl.value || !graphInstance)
    return

  graphInstance.width(containerEl.value.clientWidth)
  graphInstance.height(containerEl.value.clientHeight)
}

watch(graphData, () => {
  graphInstance?.graphData(graphData.value)
  graphInstance?.zoomToFit(350, 18)
})

onMounted(initGraph)

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateSize)
  graphInstance?._destructor?.()
  if (containerEl.value)
    containerEl.value.innerHTML = ""
})
</script>

<template>
  <div class="VPNolebaseGraphView3D" :style="{ minHeight: heightStyle }">
    <div ref="containerEl" class="VPGraph3DCanvas" :style="{ height: heightStyle }" />
  </div>
</template>

<style scoped>
.VPNolebaseGraphView3D {
  width: 100%;
  height: 100%;
}

.VPGraph3DCanvas {
  width: 100%;
}
</style>

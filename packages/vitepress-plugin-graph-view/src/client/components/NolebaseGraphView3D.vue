<script setup lang="ts">
import type { GraphViewData } from "../../vitepress"

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

interface MatrixGraphNode {
  id: string
  name: string
  url: string
  val: number
  color: string
  degree: number
  matrixX: number
  matrixY: number
  matrixZ: number
  x?: number
  y?: number
  z?: number
  vx?: number
  vy?: number
  vz?: number
}

type MatrixForce = ((alpha: number) => void) & {
  initialize?: (nodes: MatrixGraphNode[]) => void
}

const props = defineProps<{
  data: GraphViewData
  height?: number | string
  maxNodes?: number
  title?: string
  description?: string
  currentNodeId?: string
}>()

const containerEl = ref<HTMLDivElement>()

let graphInstance: any

const heightStyle = computed(() => {
  if (typeof props.height === "number")
    return `${props.height}px`
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

function buildMatrixCoordinates(count: number) {
  const columns = Math.ceil(Math.sqrt(count * 1.55))
  const rows = Math.ceil(count / Math.max(columns, 1))
  const cellSize = Math.max(34, Math.min(72, 760 / Math.max(columns, rows, 1)))
  const coordinates: { x: number, y: number, z: number }[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      coordinates.push({
        x: (column - (columns - 1) / 2) * cellSize,
        y: (row - (rows - 1) / 2) * cellSize,
        z: ((row + column) % 5 - 2) * 16,
      })
    }
  }

  return coordinates
    .sort((a, b) => {
      return (a.x * a.x + a.y * a.y + Math.abs(a.z) * 24)
        - (b.x * b.x + b.y * b.y + Math.abs(b.z) * 24)
    })
    .slice(0, count)
}

function createMatrixGravityForce(strength = 0.095): MatrixForce {
  let nodes: MatrixGraphNode[] = []

  const force: MatrixForce = (alpha: number) => {
    for (const node of nodes) {
      node.vx = (node.vx || 0) + (node.matrixX - (node.x || 0)) * strength * alpha
      node.vy = (node.vy || 0) + (node.matrixY - (node.y || 0)) * strength * alpha
      node.vz = (node.vz || 0) + (node.matrixZ - (node.z || 0)) * strength * 0.72 * alpha
    }
  }

  force.initialize = (nextNodes: MatrixGraphNode[]) => {
    nodes = nextNodes
  }

  return force
}

const graphData = computed(() => {
  const nodes = props.data.nodes
    .slice()
    .sort((a, b) => (degreeByNodeId.value.get(b.id) || 0) - (degreeByNodeId.value.get(a.id) || 0))
    .slice(0, maxNodes.value)

  const nodeIds = new Set(nodes.map(n => n.id))
  const coordinates = buildMatrixCoordinates(nodes.length)

  return {
    nodes: nodes.map((n, index) => {
      const degree = degreeByNodeId.value.get(n.id) || 0
      const coordinate = coordinates[index] || { x: 0, y: 0, z: 0 }

      return {
        id: n.id,
        name: n.title,
        url: n.url,
        degree,
        val: Math.min(15, 2.4 + degree * 0.92),
        color: props.currentNodeId === n.id ? "#f8d66d" : n.external ? "#f5b642" : degree > 8 ? "#61e0a9" : "#6db7ff",
        matrixX: coordinate.x,
        matrixY: coordinate.y,
        matrixZ: coordinate.z,
        x: coordinate.x,
        y: coordinate.y,
        z: coordinate.z,
      }
    }),
    links: props.data.edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({ source: e.source, target: e.target })),
  }
})

const graphStats = computed(() => {
  return {
    nodes: graphData.value.nodes.length,
    links: graphData.value.links.length,
    totalNodes: props.data.nodes.length,
  }
})

function configureForces() {
  if (!graphInstance)
    return

  graphInstance.d3Force("matrix", createMatrixGravityForce())

  const chargeForce = graphInstance.d3Force("charge")
  chargeForce?.strength?.((node: MatrixGraphNode) => -22 - Math.min(68, node.degree * 4.8))
  chargeForce?.distanceMax?.(210)

  const linkForce = graphInstance.d3Force("link")
  linkForce?.distance?.((link: any) => {
    const sourceDegree = typeof link.source === "object" ? link.source.degree || 0 : 0
    const targetDegree = typeof link.target === "object" ? link.target.degree || 0 : 0
    return 38 + Math.min(96, (sourceDegree + targetDegree) * 2.6)
  })
  linkForce?.strength?.(0.058)
}

async function initGraph() {
  if (!containerEl.value)
    return

  const { default: ForceGraph3D } = await import("3d-force-graph")

  graphInstance = (ForceGraph3D as any)()(containerEl.value)
    .backgroundColor("rgba(0,0,0,0)")
    .showNavInfo(false)
    .nodeLabel((node: any) => node.name)
    .nodeVal((node: any) => node.val)
    .nodeColor((node: any) => node.color)
    .nodeOpacity(0.98)
    .nodeResolution(18)
    .nodeRelSize(3.8)
    .linkColor((link: any) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source
      const targetId = typeof link.target === "object" ? link.target.id : link.target
      return props.currentNodeId && (sourceId === props.currentNodeId || targetId === props.currentNodeId)
        ? "rgba(248, 214, 109, 0.78)"
        : "rgba(122, 190, 181, 0.46)"
    })
    .linkOpacity(0.46)
    .linkWidth((link: any) => {
      const sourceDegree = typeof link.source === "object" ? link.source.degree || 0 : 0
      const targetDegree = typeof link.target === "object" ? link.target.degree || 0 : 0
      return 0.55 + Math.min(1.55, (sourceDegree + targetDegree) * 0.028)
    })
    .linkDirectionalParticles((link: any) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source
      const targetId = typeof link.target === "object" ? link.target.id : link.target
      return props.currentNodeId && (sourceId === props.currentNodeId || targetId === props.currentNodeId) ? 3 : 1
    })
    .linkDirectionalParticleSpeed(0.007)
    .linkDirectionalParticleWidth(1.35)
    .linkDirectionalParticleColor(() => "rgba(248, 214, 109, 0.82)")
    .warmupTicks(110)
    .cooldownTicks(260)
    .d3AlphaDecay(0.016)
    .d3VelocityDecay(0.58)
    .onNodeClick((node: any) => {
      if (node?.url)
        window.location.href = node.url
    })

  configureForces()
  updateSize()
  graphInstance.graphData(graphData.value)
  graphInstance.zoomToFit(500, 36)

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
  graphInstance?.d3ReheatSimulation?.()
  graphInstance?.zoomToFit(450, 36)
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
    <div class="VPGraph3DToolbar">
      <div>
        <p class="VPGraph3DEyebrow">
          Matrix gravity field
        </p>
        <h2 class="VPGraph3DTitle">
          {{ props.title || '引力矩阵图谱' }}
        </h2>
        <p v-if="props.description" class="VPGraph3DDescription">
          {{ props.description }}
        </p>
      </div>
      <div class="VPGraph3DStats" aria-label="图谱统计">
        <span><strong>{{ graphStats.nodes }}</strong> 节点</span>
        <span><strong>{{ graphStats.links }}</strong> 连线</span>
        <span v-if="graphStats.totalNodes > graphStats.nodes"><strong>{{ graphStats.totalNodes - graphStats.nodes }}</strong> 已收束</span>
      </div>
    </div>

    <div ref="containerEl" class="VPGraph3DCanvas" :style="{ height: heightStyle }" />

    <div class="VPGraph3DPanel" aria-label="图例">
      <span><i class="hub" />高连接节点</span>
      <span><i class="page" />站内文章</span>
      <span><i class="external" />外部引用</span>
      <span v-if="props.currentNodeId"><i class="current" />当前页面</span>
    </div>
  </div>
</template>

<style scoped>
.VPNolebaseGraphView3D {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid rgb(190 255 226 / 18%);
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% 42%, rgb(97 224 169 / 17%), transparent 0 24%, transparent 48%),
    radial-gradient(circle at 22% 24%, rgb(109 183 255 / 14%), transparent 0 28%, transparent 42%),
    repeating-linear-gradient(0deg, rgb(97 224 169 / 10%) 0 1px, transparent 1px 44px),
    repeating-linear-gradient(90deg, rgb(97 224 169 / 9%) 0 1px, transparent 1px 44px),
    linear-gradient(135deg, rgb(5 9 10) 0%, rgb(17 20 15) 48%, rgb(7 14 17) 100%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 5%), 0 28px 72px rgb(0 0 0 / 34%);
  color: rgb(235 255 247);
  overflow: hidden;
}

.VPNolebaseGraphView3D::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: "";
  background:
    linear-gradient(rgb(245 182 66 / 10%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(245 182 66 / 8%) 1px, transparent 1px);
  background-size: 176px 176px;
  mask-image: linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%);
  opacity: 0.68;
}

.VPNolebaseGraphView3D::after {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  content: "";
  background:
    linear-gradient(180deg, rgb(0 0 0 / 46%) 0%, transparent 22%, transparent 70%, rgb(0 0 0 / 50%) 100%),
    radial-gradient(circle at 50% 50%, transparent 0 48%, rgb(0 0 0 / 38%) 100%);
}

.VPGraph3DToolbar {
  position: absolute;
  top: 18px;
  right: 18px;
  left: 18px;
  z-index: 4;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  justify-content: space-between;
  pointer-events: none;
}

.VPGraph3DEyebrow {
  margin: 0 0 6px;
  color: rgb(148 244 207 / 78%);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.VPGraph3DTitle {
  margin: 0;
  max-width: 560px;
  color: rgb(247 255 251);
  font-size: clamp(24px, 3vw, 42px);
  line-height: 1.05;
  letter-spacing: 0;
  text-shadow: 0 10px 32px rgb(0 0 0 / 52%);
}

.VPGraph3DDescription {
  margin: 12px 0 0;
  max-width: 580px;
  color: rgb(219 246 236 / 76%);
  font-size: 14px;
  line-height: 1.7;
}

.VPGraph3DStats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  max-width: 360px;
}

.VPGraph3DStats span,
.VPGraph3DPanel span {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 30px;
  padding: 6px 10px;
  border: 1px solid rgb(190 255 226 / 14%);
  border-radius: 999px;
  background: rgb(5 11 12 / 58%);
  color: rgb(225 251 241 / 82%);
  font-size: 12px;
  line-height: 1;
  box-shadow: 0 12px 28px rgb(0 0 0 / 18%);
  backdrop-filter: blur(12px);
}

.VPGraph3DStats strong {
  color: rgb(248 214 109);
  font-size: 14px;
}

.VPGraph3DCanvas {
  position: relative;
  z-index: 1;
  width: 100%;
}

.VPGraph3DPanel {
  position: absolute;
  right: 18px;
  bottom: 18px;
  left: 18px;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  pointer-events: none;
}

.VPGraph3DPanel i {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  box-shadow: 0 0 16px currentcolor;
}

.VPGraph3DPanel .hub {
  color: #61e0a9;
  background: #61e0a9;
}

.VPGraph3DPanel .page {
  color: #6db7ff;
  background: #6db7ff;
}

.VPGraph3DPanel .external {
  color: #f5b642;
  background: #f5b642;
}

.VPGraph3DPanel .current {
  color: #f8d66d;
  background: #f8d66d;
}

@media (max-width: 720px) {
  .VPGraph3DToolbar {
    top: 12px;
    right: 12px;
    left: 12px;
    display: block;
  }

  .VPGraph3DTitle {
    font-size: 24px;
  }

  .VPGraph3DDescription {
    margin-top: 8px;
    font-size: 13px;
  }

  .VPGraph3DStats {
    justify-content: flex-start;
    margin-top: 12px;
  }

  .VPGraph3DPanel {
    right: 12px;
    bottom: 12px;
    left: 12px;
  }
}
</style>

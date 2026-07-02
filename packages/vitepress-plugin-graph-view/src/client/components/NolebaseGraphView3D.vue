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
        color: n.external ? "#f5b642" : degree > 8 ? "#61e0a9" : "#6db7ff",
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

function configureForces() {
  if (!graphInstance)
    return

  graphInstance.d3Force("matrix", createMatrixGravityForce())

  const chargeForce = graphInstance.d3Force("charge")
  chargeForce?.strength?.((node: MatrixGraphNode) => -18 - Math.min(56, node.degree * 4.4))
  chargeForce?.distanceMax?.(170)

  const linkForce = graphInstance.d3Force("link")
  linkForce?.distance?.((link: any) => {
    const sourceDegree = typeof link.source === "object" ? link.source.degree || 0 : 0
    const targetDegree = typeof link.target === "object" ? link.target.degree || 0 : 0
    return 32 + Math.min(86, (sourceDegree + targetDegree) * 2.3)
  })
  linkForce?.strength?.(0.052)
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
    .nodeOpacity(0.94)
    .nodeResolution(12)
    .nodeRelSize(3.3)
    .linkColor(() => "rgba(148, 190, 184, 0.42)")
    .linkOpacity(0.38)
    .linkWidth((link: any) => {
      const sourceDegree = typeof link.source === "object" ? link.source.degree || 0 : 0
      const targetDegree = typeof link.target === "object" ? link.target.degree || 0 : 0
      return 0.45 + Math.min(1.3, (sourceDegree + targetDegree) * 0.025)
    })
    .linkDirectionalParticles(1)
    .linkDirectionalParticleSpeed(0.006)
    .linkDirectionalParticleWidth(1.15)
    .linkDirectionalParticleColor(() => "rgba(245, 182, 66, 0.78)")
    .warmupTicks(80)
    .cooldownTicks(220)
    .d3AlphaDecay(0.018)
    .d3VelocityDecay(0.62)
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
    <div ref="containerEl" class="VPGraph3DCanvas" :style="{ height: heightStyle }" />
  </div>
</template>

<style scoped>
.VPNolebaseGraphView3D {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid rgb(180 255 216 / 14%);
  border-radius: 8px;
  background:
    repeating-linear-gradient(0deg, rgb(97 224 169 / 9%) 0 1px, transparent 1px 44px),
    repeating-linear-gradient(90deg, rgb(97 224 169 / 9%) 0 1px, transparent 1px 44px),
    linear-gradient(135deg, rgb(7 10 9) 0%, rgb(19 20 15) 48%, rgb(10 15 17) 100%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 4%), 0 24px 60px rgb(0 0 0 / 30%);
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

.VPGraph3DCanvas {
  position: relative;
  z-index: 1;
  width: 100%;
}
</style>

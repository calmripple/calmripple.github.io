<script setup lang="ts">
import type { GraphViewData } from "../../vitepress"

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

interface MatrixGraphNode {
  id: string
  name: string
  url: string
  val: number
  color: string
  baseColor: string
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

interface MatrixGraphLink {
  source: string | MatrixGraphNode
  target: string | MatrixGraphNode
  weight?: number
  relationTypes?: string[]
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
  loading?: boolean
  progressLabel?: string
}>()

const containerEl = ref<HTMLDivElement>()
const focusedNodeId = ref<string>()
const draggedNodeId = ref<string>()

let graphInstance: any
let SpriteTextCtor: any
let isDestroyed = false
let resumeRaf: number | undefined

const relationTypeLabels: Record<string, string> = {
  markdown: "显式链接",
  wikilink: "双链引用",
  html: "HTML 链接",
  external: "外部引用",
  related: "相关内容",
  "ai-embedding": "AI 语义",
  "content-similarity": "正文相似",
  "tag-overlap": "标签重叠",
  "directory-neighbor": "目录邻近",
  "title-overlap": "标题相似",
}

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
    const weight = Math.max(0.35, Math.min(1, e.weight || 1))
    deg.set(e.source, (deg.get(e.source) || 0) + weight)
    deg.set(e.target, (deg.get(e.target) || 0) + weight)
  }
  return deg
})

function linkWeight(link: any): number {
  return Math.max(0.25, Math.min(1, Number(link?.weight) || 1))
}

function linkRelationTypes(link: any): string[] {
  return Array.isArray(link?.relationTypes) ? link.relationTypes : []
}

function endpointId(endpoint: string | MatrixGraphNode | undefined): string {
  return typeof endpoint === "object" ? endpoint.id : endpoint || ""
}

function relationLabel(types: string[] = []): string {
  if (!types.length)
    return "知识相关"
  return types.map(type => relationTypeLabels[type] || type).join(" / ")
}

function baseNodeColor(node: { external?: boolean, degree?: number, id?: string }): string {
  return props.currentNodeId === node.id ? "#f8d66d" : node.external ? "#f5b642" : (node.degree || 0) > 8 ? "#61e0a9" : "#6db7ff"
}

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
      const color = baseNodeColor({ ...n, degree })

      return {
        id: n.id,
        name: n.title,
        url: n.url,
        degree,
        val: Math.min(15, 2.4 + degree * 0.92),
        color,
        baseColor: color,
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
      .map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        relationTypes: e.relationTypes,
      } satisfies MatrixGraphLink)),
  }
})

const nodeById = computed(() => new Map(graphData.value.nodes.map(node => [node.id, node])))

const activeNodeId = computed(() => draggedNodeId.value || focusedNodeId.value || props.currentNodeId)

const activeRelatedNodeIds = computed(() => {
  const activeId = activeNodeId.value
  const related = new Set<string>()
  if (!activeId)
    return related

  related.add(activeId)
  for (const link of graphData.value.links) {
    const sourceId = endpointId(link.source)
    const targetId = endpointId(link.target)
    if (sourceId === activeId)
      related.add(targetId)
    if (targetId === activeId)
      related.add(sourceId)
  }

  return related
})

const focusedLinks = computed(() => {
  const activeId = activeNodeId.value
  if (!activeId)
    return []

  return graphData.value.links
    .filter((link) => {
      return endpointId(link.source) === activeId || endpointId(link.target) === activeId
    })
    .sort((a, b) => linkWeight(b) - linkWeight(a))
})

const focusedNodeDetails = computed(() => {
  const activeId = activeNodeId.value
  if (!activeId)
    return

  const node = nodeById.value.get(activeId)
  if (!node)
    return

  return {
    node,
    links: focusedLinks.value.slice(0, 6).map((link) => {
      const sourceId = endpointId(link.source)
      const targetId = endpointId(link.target)
      const relatedId = sourceId === activeId ? targetId : sourceId
      return {
        key: `${sourceId}-${targetId}-${relationLabel(link.relationTypes)}`,
        target: nodeById.value.get(relatedId),
        weight: linkWeight(link),
        relation: relationLabel(link.relationTypes),
      }
    }).filter(item => item.target),
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
    return 44 + Math.min(104, (sourceDegree + targetDegree) * 2.4) - linkWeight(link) * 30
  })
  linkForce?.strength?.((link: any) => 0.036 + linkWeight(link) * 0.054)
}

function isFocusedNode(node: MatrixGraphNode): boolean {
  const activeId = activeNodeId.value
  return !activeId || activeRelatedNodeIds.value.has(node.id)
}

function isPrimaryNode(node: MatrixGraphNode): boolean {
  return !!activeNodeId.value && node.id === activeNodeId.value
}

function isFocusedLink(link: any): boolean {
  const activeId = activeNodeId.value
  if (!activeId)
    return true

  const sourceId = endpointId(link.source)
  const targetId = endpointId(link.target)
  return sourceId === activeId || targetId === activeId
}

function nodeColor(node: MatrixGraphNode): string {
  if (!activeNodeId.value)
    return node.baseColor
  if (isPrimaryNode(node))
    return draggedNodeId.value === node.id ? "#fff1a8" : "#f8d66d"
  if (isFocusedNode(node))
    return node.baseColor
  return "rgba(0,0,0,0)"
}

function linkColor(link: any): string {
  if (activeNodeId.value && !isFocusedLink(link))
    return "rgba(0, 0, 0, 0)"

  const sourceId = endpointId(link.source)
  const targetId = endpointId(link.target)
  if (activeNodeId.value && (sourceId === activeNodeId.value || targetId === activeNodeId.value))
    return draggedNodeId.value ? "rgba(255, 241, 168, 0.92)" : "rgba(248, 214, 109, 0.82)"

  return linkRelationTypes(link).some(type => type.includes("similarity"))
    ? "rgba(109, 183, 255, 0.5)"
    : "rgba(122, 190, 181, 0.46)"
}

function linkWidth(link: any): number {
  if (activeNodeId.value && !isFocusedLink(link))
    return 0

  const sourceDegree = typeof link.source === "object" ? link.source.degree || 0 : 0
  const targetDegree = typeof link.target === "object" ? link.target.degree || 0 : 0
  const focusBoost = activeNodeId.value && isFocusedLink(link) ? 1.4 : 1
  return (0.35 + linkWeight(link) * 1.65 + Math.min(1.1, (sourceDegree + targetDegree) * 0.02)) * focusBoost
}

function linkParticles(link: any): number {
  if (activeNodeId.value && !isFocusedLink(link))
    return 0

  return activeNodeId.value && isFocusedLink(link) ? 3 : linkWeight(link) > 0.72 ? 2 : 1
}

function nodeVisibility(node: MatrixGraphNode): boolean {
  return !activeNodeId.value || isFocusedNode(node)
}

function linkVisibility(link: any): boolean {
  return !activeNodeId.value || isFocusedLink(link)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function nodeLabel(node: MatrixGraphNode): string {
  if (activeNodeId.value && !isFocusedNode(node))
    return ""

  const title = escapeHtml(node.name)
  if (!activeNodeId.value)
    return title

  const relation = isPrimaryNode(node)
    ? "当前节点"
    : focusedLinks.value.find((link) => {
        const sourceId = endpointId(link.source)
        const targetId = endpointId(link.target)
        return sourceId === node.id || targetId === node.id
      })
  const relationText = typeof relation === "string" ? relation : relation ? relationLabel(relation.relationTypes) : "相关节点"
  const weightText = typeof relation === "object" ? ` · ${Math.round(linkWeight(relation) * 100)}%` : ""
  return `<div class="VPGraph3DNodeTooltip${isPrimaryNode(node) ? " primary" : ""}"><strong>${title}</strong><span>${escapeHtml(relationText)}${weightText}</span></div>`
}

function nodeTitleObject(node: MatrixGraphNode) {
  if (!SpriteTextCtor || !activeNodeId.value || !isFocusedNode(node))
    return false

  const sprite = new SpriteTextCtor(node.name)
  sprite.color = isPrimaryNode(node) ? "#fff1a8" : node.baseColor
  sprite.backgroundColor = isPrimaryNode(node) ? "rgba(35, 28, 6, 0.74)" : "rgba(5, 11, 12, 0.68)"
  sprite.borderColor = isPrimaryNode(node) ? "rgba(248, 214, 109, 0.44)" : "rgba(190, 255, 226, 0.18)"
  sprite.borderWidth = 0.8
  sprite.borderRadius = 4
  sprite.padding = 3
  sprite.textHeight = isPrimaryNode(node) ? 6.8 : 5.2
  sprite.center.set(0.5, -0.72)
  sprite.material.depthWrite = false
  sprite.material.depthTest = false
  sprite.renderOrder = isPrimaryNode(node) ? 12 : 10
  return sprite
}

function applyFocusStyles() {
  if (!graphInstance)
    return

  graphInstance
    .nodeColor((node: MatrixGraphNode) => nodeColor(node))
    .nodeVisibility((node: MatrixGraphNode) => nodeVisibility(node))
    .nodeLabel((node: MatrixGraphNode) => nodeLabel(node))
    .nodeThreeObject((node: MatrixGraphNode) => nodeTitleObject(node))
    .nodeThreeObjectExtend(true)
    .linkColor((link: any) => linkColor(link))
    .linkVisibility((link: any) => linkVisibility(link))
    .linkWidth((link: any) => linkWidth(link))
    .linkDirectionalParticles((link: any) => linkParticles(link))
    .linkDirectionalParticleWidth((link: any) => activeNodeId.value && isFocusedLink(link) ? 1.8 : 0.7 + linkWeight(link) * 1.1)
}

function syncGraphDataToInstance(fit = true) {
  if (!graphInstance || isDestroyed)
    return

  if (!graphData.value.nodes.length) {
    graphInstance.pauseAnimation?.()
    return
  }

  graphInstance.graphData(graphData.value)
  configureForces()
  applyFocusStyles()
  graphInstance.d3ReheatSimulation?.()

  // Delay animation resume to next frame so internal force-layout is ready.
  if (resumeRaf)
    cancelAnimationFrame(resumeRaf)
  resumeRaf = requestAnimationFrame(() => {
    if (!graphInstance || isDestroyed)
      return
    try {
      graphInstance.resumeAnimation?.()
    }
    catch {
      // Ignore transient layout init race; next data sync will retry.
    }
  })

  if (fit)
    graphInstance.zoomToFit(450, 36)
}

async function initGraph() {
  if (!containerEl.value || isDestroyed)
    return

  const { default: ForceGraph3D } = await import("3d-force-graph")
  const { default: SpriteText } = await import("three-spritetext")
  SpriteTextCtor = SpriteText

  graphInstance = (ForceGraph3D as any)()(containerEl.value)
    .backgroundColor("rgba(0,0,0,0)")
    .showNavInfo(false)
    .nodeLabel((node: MatrixGraphNode) => nodeLabel(node))
    .nodeVal((node: any) => node.val)
    .nodeColor((node: MatrixGraphNode) => nodeColor(node))
    .nodeVisibility((node: MatrixGraphNode) => nodeVisibility(node))
    .nodeThreeObject((node: MatrixGraphNode) => nodeTitleObject(node))
    .nodeThreeObjectExtend(true)
    .nodeOpacity(0.98)
    .nodeResolution(18)
    .nodeRelSize(3.8)
    .linkColor((link: any) => linkColor(link))
    .linkVisibility((link: any) => linkVisibility(link))
    .linkOpacity(0.46)
    .linkWidth((link: any) => linkWidth(link))
    .linkDirectionalParticles((link: any) => linkParticles(link))
    .linkDirectionalParticleSpeed(0.007)
    .linkDirectionalParticleWidth((link: any) => activeNodeId.value && isFocusedLink(link) ? 1.8 : 0.7 + linkWeight(link) * 1.1)
    .linkDirectionalParticleColor(() => "rgba(248, 214, 109, 0.82)")
    .warmupTicks(110)
    .cooldownTicks(260)
    .d3AlphaDecay(0.016)
    .d3VelocityDecay(0.58)
    .onNodeHover((node: MatrixGraphNode | null) => {
      if (!draggedNodeId.value)
        focusedNodeId.value = node?.id
    })
    .onNodeDrag((node: MatrixGraphNode) => {
      draggedNodeId.value = node.id
      focusedNodeId.value = node.id
      node.matrixX = node.x || node.matrixX
      node.matrixY = node.y || node.matrixY
      node.matrixZ = node.z || node.matrixZ
      graphInstance?.d3ReheatSimulation?.()
    })
    .onNodeDragEnd((node: MatrixGraphNode) => {
      draggedNodeId.value = undefined
      focusedNodeId.value = node.id
      graphInstance?.d3ReheatSimulation?.()
    })
    .onNodeClick((node: any) => {
      if (node?.url)
        window.location.href = node.url
    })

  updateSize()
  graphInstance.pauseAnimation?.()
  syncGraphDataToInstance(true)

  window.addEventListener("resize", updateSize)
}

function updateSize() {
  if (!containerEl.value || !graphInstance || isDestroyed)
    return

  graphInstance.width(containerEl.value.clientWidth)
  graphInstance.height(containerEl.value.clientHeight)
}

watch(graphData, () => {
  syncGraphDataToInstance(true)
})

watch(activeNodeId, () => {
  applyFocusStyles()
})

onMounted(initGraph)

onBeforeUnmount(() => {
  isDestroyed = true
  if (resumeRaf) {
    cancelAnimationFrame(resumeRaf)
    resumeRaf = undefined
  }
  window.removeEventListener("resize", updateSize)
  graphInstance?._destructor?.()
  graphInstance = undefined
})
</script>

<template>
  <div class="VPNolebaseGraphView3D" :class="{ dragging: !!draggedNodeId }" :style="{ minHeight: heightStyle }">
    <div class="VPGraph3DToolbar">
      <div>
        <p class="VPGraph3DEyebrow">
          Matrix gravity field
        </p>
        <h2 class="VPGraph3DTitle">
          {{ props.title || '知识图谱' }}
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

    <div v-if="props.loading" class="VPGraph3DLoading" aria-live="polite">
      {{ props.progressLabel || '正在加载引力矩阵...' }}
    </div>

    <aside v-if="focusedNodeDetails" class="VPGraph3DRelationPanel" aria-live="polite">
      <p class="VPGraph3DRelationKicker">
        {{ draggedNodeId ? '正在拖动节点' : '聚焦关系' }}
      </p>
      <h3>{{ focusedNodeDetails.node.name }}</h3>
      <p class="VPGraph3DRelationMeta">
        {{ focusedLinks.length }} 条直接关联 · 强度 {{ Math.round((focusedLinks[0]?.weight || 0) * 100) }}%
      </p>
      <div v-if="focusedNodeDetails.links.length" class="VPGraph3DRelationList">
        <a
          v-for="item of focusedNodeDetails.links"
          :key="item.key"
          :href="item.target?.url"
          class="VPGraph3DRelationItem"
        >
          <span>{{ item.target?.name }}</span>
          <small>{{ item.relation }} · {{ Math.round(item.weight * 100) }}%</small>
        </a>
      </div>
    </aside>

    <div class="VPGraph3DPanel" aria-label="图例">
      <span><i class="hub" />高连接节点</span>
      <span><i class="page" />站内文章</span>
      <span><i class="external" />外部引用</span>
      <span><i class="semantic" />语义关联</span>
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

.VPNolebaseGraphView3D.dragging {
  cursor: grabbing;
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

.VPGraph3DLoading {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 4;
  max-width: min(420px, calc(100% - 48px));
  padding: 12px 16px;
  border: 1px solid rgb(190 255 226 / 16%);
  border-radius: 999px;
  background: rgb(5 11 12 / 68%);
  color: rgb(235 255 247 / 88%);
  font-size: 13px;
  line-height: 1.4;
  text-align: center;
  transform: translate(-50%, -50%);
  box-shadow: 0 18px 40px rgb(0 0 0 / 24%);
  backdrop-filter: blur(14px);
}

.VPGraph3DRelationPanel {
  position: absolute;
  right: 18px;
  bottom: 64px;
  z-index: 5;
  width: min(360px, calc(100% - 36px));
  padding: 14px;
  border: 1px solid rgb(248 214 109 / 20%);
  border-radius: 10px;
  background: rgb(4 10 10 / 72%);
  color: rgb(235 255 247);
  box-shadow: 0 18px 44px rgb(0 0 0 / 30%);
  backdrop-filter: blur(16px);
}

.VPGraph3DRelationKicker {
  margin: 0 0 6px;
  color: rgb(248 214 109 / 86%);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
}

.VPGraph3DRelationPanel h3 {
  margin: 0;
  color: rgb(255 255 247);
  font-size: 16px;
  line-height: 1.35;
}

.VPGraph3DRelationMeta {
  margin: 6px 0 12px;
  color: rgb(219 246 236 / 70%);
  font-size: 12px;
}

.VPGraph3DRelationList {
  display: grid;
  gap: 7px;
}

.VPGraph3DRelationItem {
  display: grid;
  gap: 3px;
  padding: 8px 10px;
  border: 1px solid rgb(190 255 226 / 10%);
  border-radius: 8px;
  background: rgb(255 255 255 / 5%);
  color: inherit;
  text-decoration: none;
}

.VPGraph3DRelationItem span {
  overflow: hidden;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.VPGraph3DRelationItem small {
  color: rgb(148 244 207 / 76%);
  font-size: 11px;
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

.VPGraph3DPanel .semantic {
  color: #6db7ff;
  background: #6db7ff;
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

  .VPGraph3DRelationPanel {
    right: 12px;
    bottom: 72px;
    width: min(340px, calc(100% - 24px));
  }
}
</style>

<script setup lang="ts">
import type { GraphViewData, GraphViewEdge, GraphViewNode } from '../../vitepress'

import { computed, inject, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import { useI18n } from '../composables/i18n'
import { defaultOptions, InjectionKey } from '../constants'

const props = defineProps<{
  data: GraphViewData
  height?: number | string
  maxNodes?: number
  title?: string
}>()

interface PositionedNode extends GraphViewNode {
  x: number
  y: number
  vx: number
  vy: number
  degree: number
  fixed?: boolean
}

const options = inject(InjectionKey, defaultOptions)
const { t } = useI18n()

const search = ref('')
const hoveredNodeId = ref<string>()
const selectedNodeId = ref<string>()
const svgElement = ref<SVGSVGElement>()
const positionedNodes = ref<PositionedNode[]>([])
const simulationAlpha = ref(0)
const simulationRunning = ref(true)

const graphWidth = 1000
const graphHeight = 620
const graphPadding = 64
const graphCenterX = graphWidth / 2
const graphCenterY = graphHeight / 2

const viewport = reactive({
  x: 0,
  y: 0,
  scale: 1,
})

const interaction = reactive<{
  mode: 'idle' | 'drag-node' | 'pan'
  pointerId: number | null
  nodeId: string | null
  startClientX: number
  startClientY: number
  startViewportX: number
  startViewportY: number
}>({
  mode: 'idle',
  pointerId: null,
  nodeId: null,
  startClientX: 0,
  startClientY: 0,
  startViewportX: 0,
  startViewportY: 0,
})

let animationFrame: number | undefined

const heightStyle = computed(() => {
  const height = props.height || options.height || defaultOptions.height
  return typeof height === 'number' ? `${height}px` : height
})

const showToolbar = computed(() => options.showToolbar ?? defaultOptions.showToolbar)

const maxNodes = computed(() => {
  const value = props.maxNodes ?? options.maxNodes ?? defaultOptions.maxNodes
  return value > 0 ? value : defaultOptions.maxNodes
})

const filteredNodeIds = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword)
    return new Set(props.data.nodes.map(node => node.id))

  return new Set(props.data.nodes
    .filter((node) => {
      return node.title.toLowerCase().includes(keyword)
        || node.filePath.toLowerCase().includes(keyword)
        || node.url.toLowerCase().includes(keyword)
    })
    .map(node => node.id))
})

const degreeByNodeId = computed(() => {
  const degree = new Map<string, number>()
  for (const node of props.data.nodes)
    degree.set(node.id, 0)

  for (const edge of props.data.edges) {
    degree.set(edge.source, (degree.get(edge.source) || 0) + 1)
    degree.set(edge.target, (degree.get(edge.target) || 0) + 1)
  }

  return degree
})

const visibleNodes = computed(() => {
  return props.data.nodes
    .filter(node => filteredNodeIds.value.has(node.id))
    .sort((sourceNode, targetNode) => {
      return (degreeByNodeId.value.get(targetNode.id) || 0) - (degreeByNodeId.value.get(sourceNode.id) || 0)
    })
    .slice(0, maxNodes.value)
})

const visibleNodeIds = computed(() => {
  return new Set(visibleNodes.value.map(node => node.id))
})

const visibleEdges = computed(() => {
  return props.data.edges.filter(edge => visibleNodeIds.value.has(edge.source) && visibleNodeIds.value.has(edge.target))
})

const positionedNodeById = computed(() => {
  return new Map(positionedNodes.value.map(node => [node.id, node]))
})

const graphTransform = computed(() => {
  return `translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`
})

const zoomPercent = computed(() => `${Math.round(viewport.scale * 100)}%`)

function buildInitialNodes() {
  const oldNodes = new Map(positionedNodes.value.map(node => [node.id, node]))

  positionedNodes.value = visibleNodes.value.map((node, index) => {
    const oldNode = oldNodes.get(node.id)
    if (oldNode) {
      return {
        ...node,
        x: oldNode.x,
        y: oldNode.y,
        vx: oldNode.vx,
        vy: oldNode.vy,
        fixed: oldNode.fixed,
        degree: degreeByNodeId.value.get(node.id) || 0,
      }
    }

    const angle = (Math.PI * 2 * index) / Math.max(visibleNodes.value.length, 1)
    const radius = Math.min(graphWidth, graphHeight) * 0.34

    return {
      ...node,
      x: graphCenterX + Math.cos(angle) * radius,
      y: graphCenterY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      degree: degreeByNodeId.value.get(node.id) || 0,
    }
  })

  simulationAlpha.value = 1
  startSimulation()
}

function tickSimulation() {
  if (!simulationRunning.value)
    return

  const nodes = positionedNodes.value
  const nodeById = positionedNodeById.value
  const alpha = simulationAlpha.value
  const repulsionStrength = 820 * alpha
  const linkStrength = 0.018 * alpha
  const centerStrength = 0.004 * alpha

  for (let sourceIndex = 0; sourceIndex < nodes.length; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < nodes.length; targetIndex += 1) {
      const sourceNode = nodes[sourceIndex]
      const targetNode = nodes[targetIndex]
      const deltaX = sourceNode.x - targetNode.x || 0.1
      const deltaY = sourceNode.y - targetNode.y || 0.1
      const distance = Math.max(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 12)
      const force = repulsionStrength / (distance * distance)
      const moveX = (deltaX / distance) * force
      const moveY = (deltaY / distance) * force

      if (!sourceNode.fixed) {
        sourceNode.x += moveX
        sourceNode.y += moveY
      }
      if (!targetNode.fixed) {
        targetNode.x -= moveX
        targetNode.y -= moveY
      }
    }
  }

  for (const edge of visibleEdges.value) {
    const sourceNode = nodeById.get(edge.source)
    const targetNode = nodeById.get(edge.target)
    if (!sourceNode || !targetNode)
      continue

    const deltaX = targetNode.x - sourceNode.x
    const deltaY = targetNode.y - sourceNode.y
    const distance = Math.max(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 1)
    const desiredDistance = 132 + Math.min(80, sourceNode.degree + targetNode.degree)
    const force = (distance - desiredDistance) * linkStrength
    const moveX = (deltaX / distance) * force
    const moveY = (deltaY / distance) * force

    if (!sourceNode.fixed) {
      sourceNode.x += moveX
      sourceNode.y += moveY
    }
    if (!targetNode.fixed) {
      targetNode.x -= moveX
      targetNode.y -= moveY
    }
  }

  for (const node of nodes) {
    if (node.fixed)
      continue

    node.vx = (node.vx + (graphCenterX - node.x) * centerStrength) * 0.72
    node.vy = (node.vy + (graphCenterY - node.y) * centerStrength) * 0.72
    node.x = Math.min(graphWidth - graphPadding, Math.max(graphPadding, node.x + node.vx))
    node.y = Math.min(graphHeight - graphPadding, Math.max(graphPadding, node.y + node.vy))
  }

  positionedNodes.value = [...nodes]
  simulationAlpha.value *= 0.965

  if (simulationAlpha.value > 0.02 || interaction.mode === 'drag-node')
    animationFrame = window.requestAnimationFrame(tickSimulation)
}

function startSimulation() {
  if (typeof window === 'undefined')
    return
  if (animationFrame)
    window.cancelAnimationFrame(animationFrame)
  animationFrame = window.requestAnimationFrame(tickSimulation)
}

function restartSimulation() {
  simulationAlpha.value = 1
  simulationRunning.value = true
  startSimulation()
}

const activeNodeId = computed(() => selectedNodeId.value || hoveredNodeId.value)

const relatedNodeIds = computed(() => {
  if (!activeNodeId.value)
    return new Set<string>()

  const related = new Set<string>()
  for (const edge of props.data.edges) {
    if (edge.source === activeNodeId.value)
      related.add(edge.target)
    if (edge.target === activeNodeId.value)
      related.add(edge.source)
  }

  return related
})

const selectedNode = computed(() => {
  return props.data.nodes.find(node => node.id === activeNodeId.value)
})

const relatedNodes = computed(() => {
  return props.data.nodes.filter(node => relatedNodeIds.value.has(node.id)).slice(0, 12)
})

function isEdgeActive(edge: GraphViewEdge): boolean {
  return activeNodeId.value === edge.source || activeNodeId.value === edge.target
}

function isNodeActive(node: GraphViewNode): boolean {
  return activeNodeId.value === node.id || relatedNodeIds.value.has(node.id)
}

function labelOf(node: GraphViewNode): string {
  const maxLabelLength = options.maxLabelLength || defaultOptions.maxLabelLength
  if (node.title.length <= maxLabelLength)
    return node.title

  return `${node.title.slice(0, maxLabelLength - 1)}...`
}

function selectNode(node: GraphViewNode) {
  selectedNodeId.value = selectedNodeId.value === node.id ? undefined : node.id
}

function clampScale(value: number): number {
  return Math.min(3, Math.max(0.35, value))
}

function eventToGraphPoint(event: PointerEvent | WheelEvent): { x: number, y: number } {
  const rect = svgElement.value?.getBoundingClientRect()
  if (!rect)
    return { x: graphCenterX, y: graphCenterY }

  const viewX = ((event.clientX - rect.left) / rect.width) * graphWidth
  const viewY = ((event.clientY - rect.top) / rect.height) * graphHeight

  return {
    x: (viewX - viewport.x) / viewport.scale,
    y: (viewY - viewport.y) / viewport.scale,
  }
}

function handleWheel(event: WheelEvent) {
  const point = eventToGraphPoint(event)
  const rect = svgElement.value?.getBoundingClientRect()
  if (!rect)
    return

  const viewX = ((event.clientX - rect.left) / rect.width) * graphWidth
  const viewY = ((event.clientY - rect.top) / rect.height) * graphHeight
  const nextScale = clampScale(viewport.scale * (event.deltaY > 0 ? 0.88 : 1.12))

  viewport.x = viewX - point.x * nextScale
  viewport.y = viewY - point.y * nextScale
  viewport.scale = nextScale
}

function handleCanvasPointerDown(event: PointerEvent) {
  if (event.button !== 0)
    return

  interaction.mode = 'pan'
  interaction.pointerId = event.pointerId
  interaction.nodeId = null
  interaction.startClientX = event.clientX
  interaction.startClientY = event.clientY
  interaction.startViewportX = viewport.x
  interaction.startViewportY = viewport.y
}

function handleNodePointerDown(event: PointerEvent, node: PositionedNode) {
  if (event.button !== 0)
    return

  interaction.mode = 'drag-node'
  interaction.pointerId = event.pointerId
  interaction.nodeId = node.id
  node.fixed = true
  node.vx = 0
  node.vy = 0
  selectedNodeId.value = node.id
  simulationAlpha.value = Math.max(simulationAlpha.value, 0.35)
  startSimulation()
}

function handlePointerMove(event: PointerEvent) {
  if (interaction.mode === 'idle')
    return

  if (interaction.mode === 'pan') {
    const rect = svgElement.value?.getBoundingClientRect()
    if (!rect)
      return

    viewport.x = interaction.startViewportX + ((event.clientX - interaction.startClientX) / rect.width) * graphWidth
    viewport.y = interaction.startViewportY + ((event.clientY - interaction.startClientY) / rect.height) * graphHeight
    return
  }

  if (interaction.mode === 'drag-node' && interaction.nodeId) {
    const point = eventToGraphPoint(event)
    const node = positionedNodes.value.find(item => item.id === interaction.nodeId)
    if (!node)
      return

    node.x = Math.min(graphWidth - graphPadding, Math.max(graphPadding, point.x))
    node.y = Math.min(graphHeight - graphPadding, Math.max(graphPadding, point.y))
    positionedNodes.value = [...positionedNodes.value]
  }
}

function handlePointerUp() {
  if (interaction.mode === 'drag-node') {
    simulationAlpha.value = Math.max(simulationAlpha.value, 0.15)
    startSimulation()
  }

  interaction.mode = 'idle'
  interaction.pointerId = null
  interaction.nodeId = null
}

function resetView() {
  viewport.x = 0
  viewport.y = 0
  viewport.scale = 1
}

function zoomBy(multiplier: number) {
  viewport.scale = clampScale(viewport.scale * multiplier)
}

function releaseNodes() {
  for (const node of positionedNodes.value)
    node.fixed = false
  restartSimulation()
}

function openNode(node: GraphViewNode) {
  window.location.href = node.url
}

watch([visibleNodes, visibleEdges], () => {
  buildInitialNodes()
}, { immediate: true })

onMounted(async () => {
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  await nextTick()
  restartSimulation()
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  if (animationFrame)
    window.cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <section class="VPNolebaseGraphView" :style="{ minHeight: heightStyle }">
    <div v-if="showToolbar" class="VPNolebaseGraphViewToolbar">
      <div>
        <h2>{{ props.title || t('graphView.title') }}</h2>
        <p>{{ visibleNodes.length }} {{ t('graphView.nodes') }} · {{ visibleEdges.length }} {{ t('graphView.edges') }}</p>
      </div>
      <div class="VPNolebaseGraphViewToolbarActions">
        <input
          v-model="search"
          type="search"
          :placeholder="t('graphView.searchPlaceholder')"
          class="VPNolebaseGraphViewSearch"
        >
        <div class="VPNolebaseGraphViewControls" aria-label="Graph controls">
          <button type="button" title="Zoom out" aria-label="Zoom out" @click="zoomBy(0.82)">
            −
          </button>
          <span>{{ zoomPercent }}</span>
          <button type="button" title="Zoom in" aria-label="Zoom in" @click="zoomBy(1.18)">
            +
          </button>
          <button type="button" title="Reset view" aria-label="Reset view" @click="resetView">
            ↺
          </button>
          <button type="button" title="Release fixed nodes" aria-label="Release fixed nodes" @click="releaseNodes">
            ◌
          </button>
        </div>
      </div>
    </div>

    <div v-if="!props.data.nodes.length" class="VPNolebaseGraphViewEmpty">
      {{ t('graphView.empty') }}
    </div>

    <div v-else class="VPNolebaseGraphViewCanvas" :style="{ height: heightStyle }">
      <svg
        ref="svgElement"
        :viewBox="`0 0 ${graphWidth} ${graphHeight}`"
        role="img"
        :aria-label="props.title || t('graphView.title')"
        @wheel.prevent="handleWheel"
        @pointerdown="handleCanvasPointerDown"
      >
        <g class="VPNolebaseGraphViewViewport" :transform="graphTransform">
          <rect class="VPNolebaseGraphViewHitArea" :width="graphWidth" :height="graphHeight" />
          <g class="VPNolebaseGraphViewEdges">
          <template v-for="edge of visibleEdges" :key="`${edge.source}-${edge.target}-${edge.type}`">
            <line
              v-if="positionedNodeById.get(edge.source) && positionedNodeById.get(edge.target)"
              :x1="positionedNodeById.get(edge.source)?.x"
              :y1="positionedNodeById.get(edge.source)?.y"
              :x2="positionedNodeById.get(edge.target)?.x"
              :y2="positionedNodeById.get(edge.target)?.y"
              :class="{ active: isEdgeActive(edge) }"
            />
          </template>
          </g>

          <g class="VPNolebaseGraphViewNodes">
          <g
            v-for="node of positionedNodes"
            :key="node.id"
            :class="{ active: isNodeActive(node), selected: selectedNodeId === node.id, external: node.external }"
            @mouseenter="hoveredNodeId = node.id"
            @mouseleave="hoveredNodeId = undefined"
            @pointerdown.stop.prevent="handleNodePointerDown($event, node)"
            @click.stop.prevent="selectNode(node)"
            @dblclick.stop.prevent="openNode(node)"
          >
            <circle :cx="node.x" :cy="node.y" :r="Math.min(22, 7 + node.degree * 1.8)" />
            <text :x="node.x" :y="node.y + Math.min(34, 20 + node.degree * 1.8)">{{ labelOf(node) }}</text>
          </g>
          </g>
        </g>
      </svg>

      <aside v-if="selectedNode" class="VPNolebaseGraphViewPanel">
        <a :href="selectedNode.url" :target="selectedNode.external ? '_blank' : undefined" :rel="selectedNode.external ? 'noreferrer' : undefined">
          <h3>{{ selectedNode.title }}</h3>
        </a>
        <p>{{ selectedNode.filePath }}</p>
        <a class="VPNolebaseGraphViewOpen" :href="selectedNode.url">
          {{ t('graphView.openPage') }}
        </a>
        <div v-if="relatedNodes.length" class="VPNolebaseGraphViewRelated">
          <strong>{{ t('graphView.relatedPages') }}</strong>
          <a v-for="node of relatedNodes" :key="node.id" :href="node.url">{{ node.title }}</a>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.VPNolebaseGraphView {
  position: relative;
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  overflow: hidden;
}

.VPNolebaseGraphViewToolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.VPNolebaseGraphViewToolbar h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
}

.VPNolebaseGraphViewToolbar p {
  margin: 2px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.VPNolebaseGraphViewToolbarActions {
  display: flex;
  min-width: min(520px, 56%);
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}

.VPNolebaseGraphViewSearch {
  min-width: 180px;
  max-width: 260px;
  width: min(260px, 100%);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 7px 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.VPNolebaseGraphViewControls {
  display: inline-flex;
  flex: none;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
}

.VPNolebaseGraphViewControls button,
.VPNolebaseGraphViewControls span {
  display: inline-grid;
  min-width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-right: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  font: inherit;
  font-size: 13px;
}

.VPNolebaseGraphViewControls button {
  cursor: pointer;
}

.VPNolebaseGraphViewControls button:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.VPNolebaseGraphViewControls span {
  min-width: 48px;
  color: var(--vp-c-text-2);
}

.VPNolebaseGraphViewControls :last-child {
  border-right: 0;
}

.VPNolebaseGraphViewCanvas {
  position: relative;
  min-height: 360px;
  user-select: none;
}

.VPNolebaseGraphViewCanvas svg {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.VPNolebaseGraphViewCanvas svg:active {
  cursor: grabbing;
}

.VPNolebaseGraphViewHitArea {
  fill: transparent;
  pointer-events: all;
}

.VPNolebaseGraphViewEdges line {
  stroke: var(--vp-nolebase-graph-edge);
  stroke-width: 1.4;
  transition: stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease;
}

.VPNolebaseGraphViewEdges line.active {
  stroke: var(--vp-nolebase-graph-edge-active);
  stroke-width: 2.4;
}

.VPNolebaseGraphViewNodes g {
  color: var(--vp-c-text-2);
  cursor: grab;
  outline: none;
}

.VPNolebaseGraphViewNodes g:active {
  cursor: grabbing;
}

.VPNolebaseGraphViewNodes circle {
  fill: var(--vp-nolebase-graph-node);
  stroke: var(--vp-c-bg);
  stroke-width: 3;
  transition: fill 0.2s ease, r 0.2s ease, opacity 0.2s ease;
}

.VPNolebaseGraphViewNodes text {
  pointer-events: none;
  text-anchor: middle;
  fill: currentColor;
  font-size: 13px;
  paint-order: stroke;
  stroke: var(--vp-c-bg);
  stroke-width: 4px;
  stroke-linejoin: round;
}

.VPNolebaseGraphViewNodes g.active,
.VPNolebaseGraphViewNodes g.selected {
  color: var(--vp-c-text-1);
}

.VPNolebaseGraphViewNodes g.active circle,
.VPNolebaseGraphViewNodes g.selected circle {
  fill: var(--vp-nolebase-graph-node-active);
}

.VPNolebaseGraphViewNodes g.external circle {
  fill: var(--vp-c-warning-1);
}

.VPNolebaseGraphViewPanel {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: min(320px, calc(100% - 32px));
  padding: 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: color-mix(in srgb, var(--vp-c-bg) 94%, transparent);
  box-shadow: var(--vp-shadow-3);
  backdrop-filter: blur(8px);
}

.VPNolebaseGraphViewPanel h3 {
  margin: 0;
  font-size: 15px;
}

.VPNolebaseGraphViewPanel p {
  margin: 6px 0 10px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.VPNolebaseGraphViewOpen {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 600;
}

.VPNolebaseGraphViewRelated {
  display: grid;
  gap: 5px;
  font-size: 13px;
}

.VPNolebaseGraphViewRelated strong {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.VPNolebaseGraphViewEmpty {
  display: grid;
  min-height: 260px;
  place-items: center;
  color: var(--vp-c-text-2);
}

@media (max-width: 767px) {
  .VPNolebaseGraphViewToolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .VPNolebaseGraphViewToolbarActions {
    min-width: 0;
    align-items: stretch;
    flex-direction: column;
  }

  .VPNolebaseGraphViewSearch {
    max-width: none;
    width: 100%;
  }
}
</style>

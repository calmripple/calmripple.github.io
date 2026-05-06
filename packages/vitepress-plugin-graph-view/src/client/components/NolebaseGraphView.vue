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
  radius: number
  labelOffsetY: number
  fixed?: boolean
}

const options = inject(InjectionKey, defaultOptions)
const { t } = useI18n()

const searchInput = ref('')
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
const initialGraphScale = 0.62

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
let searchDebounceTimer: ReturnType<typeof window.setTimeout> | undefined

const heightStyle = computed(() => {
  const height = props.height || options.height || defaultOptions.height
  return typeof height === 'number' ? `${height}px` : height
})

const showToolbar = computed(() => options.showToolbar ?? defaultOptions.showToolbar)

const maxNodes = computed(() => {
  const value = props.maxNodes ?? options.maxNodes ?? defaultOptions.maxNodes
  return value > 0 ? value : defaultOptions.maxNodes
})

function radiusForDegree(degree: number): number {
  return Math.min(18, 4 + degree * 1.1)
}

function labelOffsetForRadius(radius: number): number {
  return Math.min(34, radius + 13)
}

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

const labelVisibleNodeIds = computed(() => {
  const top = [...visibleNodes.value]
    .sort((a, b) => {
      return radiusForDegree((degreeByNodeId.value.get(b.id) || 0)) - radiusForDegree((degreeByNodeId.value.get(a.id) || 0))
    })
    .slice(0, 20)

  return new Set(top.map(node => node.id))
})

const positionedNodeById = computed(() => {
  return new Map(positionedNodes.value.map(node => [node.id, node]))
})

const renderedEdges = computed(() => {
  return visibleEdges.value.flatMap((edge) => {
    const source = positionedNodeById.value.get(edge.source)
    const target = positionedNodeById.value.get(edge.target)
    if (!source || !target)
      return []

    return [{
      key: `${edge.source}-${edge.target}-${edge.type}`,
      x1: source.x,
      y1: source.y,
      x2: target.x,
      y2: target.y,
      active: isEdgeActive(edge),
    }]
  })
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
        radius: radiusForDegree(degreeByNodeId.value.get(node.id) || 0),
        labelOffsetY: labelOffsetForRadius(radiusForDegree(degreeByNodeId.value.get(node.id) || 0)),
      }
    }

    const angle = (Math.PI * 2 * index) / Math.max(visibleNodes.value.length, 1)
    const radius = Math.min(graphWidth, graphHeight) * 0.42

    return {
      ...node,
      x: graphCenterX + Math.cos(angle) * radius,
      y: graphCenterY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      degree: degreeByNodeId.value.get(node.id) || 0,
      radius: radiusForDegree(degreeByNodeId.value.get(node.id) || 0),
      labelOffsetY: labelOffsetForRadius(radiusForDegree(degreeByNodeId.value.get(node.id) || 0)),
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
  const repulsionStrength = 240 * alpha
  const linkStrength = 0.028 * alpha
  const centerStrength = 0.006 * alpha
  const repulsionDistance = alpha > 0.45 ? 9999 : 320
  const repulsionDistanceSquared = repulsionDistance * repulsionDistance

  for (let sourceIndex = 0; sourceIndex < nodes.length; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < nodes.length; targetIndex += 1) {
      const sourceNode = nodes[sourceIndex]
      const targetNode = nodes[targetIndex]
      const deltaX = sourceNode.x - targetNode.x || 0.1
      const deltaY = sourceNode.y - targetNode.y || 0.1
      const distanceSquared = deltaX * deltaX + deltaY * deltaY
      if (distanceSquared > repulsionDistanceSquared)
        continue

      const distance = Math.max(Math.sqrt(distanceSquared), 12)
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
    const desiredDistance = 180 + Math.min(120, (sourceNode.degree + targetNode.degree) * 2.4)
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
  viewport.scale = initialGraphScale
  viewport.x = (graphWidth - graphWidth * initialGraphScale) / 2
  viewport.y = (graphHeight - graphHeight * initialGraphScale) / 2
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

watch(searchInput, (value) => {
  if (typeof window === 'undefined') {
    search.value = value
    return
  }

  if (searchDebounceTimer)
    window.clearTimeout(searchDebounceTimer)

  searchDebounceTimer = window.setTimeout(() => {
    search.value = value
  }, 120)
})

watch([visibleNodes, visibleEdges], () => {
  buildInitialNodes()
}, { immediate: true })

onMounted(async () => {
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  await nextTick()
  resetView()
  restartSimulation()
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  if (searchDebounceTimer)
    window.clearTimeout(searchDebounceTimer)
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
          v-model="searchInput"
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
          <template v-for="edge of renderedEdges" :key="edge.key">
            <line
              :x1="edge.x1"
              :y1="edge.y1"
              :x2="edge.x2"
              :y2="edge.y2"
              :class="{ active: edge.active }"
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
            <circle :cx="node.x" :cy="node.y" :r="node.radius" />
            <text
              v-if="labelVisibleNodeIds.has(node.id)"
              :x="node.x"
              :y="node.y + node.labelOffsetY"
            >
              {{ labelOf(node) }}
            </text>
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
  margin: 0;
  border: 1px solid rgb(255 255 255 / 6%);
  border-radius: 14px;
  background:
    radial-gradient(circle at 20% 16%, rgb(120 150 255 / 10%), transparent 24%),
    radial-gradient(circle at 80% 18%, rgb(120 255 214 / 8%), transparent 22%),
    linear-gradient(180deg, #10141c 0%, #0c1017 100%);
  box-shadow: 0 18px 48px rgb(0 0 0 / 28%);
  overflow: hidden;
}

.VPNolebaseGraphViewToolbar {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  z-index: 3;
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 12px;
  background: rgb(11 14 20 / 62%);
  backdrop-filter: blur(14px);
}

.VPNolebaseGraphViewToolbar h2 {
  margin: 0;
  color: rgb(236 240 246 / 92%);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.VPNolebaseGraphViewToolbar p {
  margin: 2px 0 0;
  color: rgb(180 188 203 / 74%);
  font-size: 12px;
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
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 10px;
  padding: 7px 10px;
  background: rgb(255 255 255 / 4%);
  color: rgb(236 240 246 / 92%);
}

.VPNolebaseGraphViewSearch::placeholder {
  color: rgb(180 188 203 / 54%);
}

.VPNolebaseGraphViewControls {
  display: inline-flex;
  flex: none;
  align-items: center;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 10px;
  background: rgb(255 255 255 / 4%);
}

.VPNolebaseGraphViewControls button,
.VPNolebaseGraphViewControls span {
  display: inline-grid;
  min-width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-right: 1px solid rgb(255 255 255 / 8%);
  background: transparent;
  color: rgb(204 212 225 / 82%);
  font: inherit;
  font-size: 13px;
}

.VPNolebaseGraphViewControls button {
  cursor: pointer;
}

.VPNolebaseGraphViewControls button:hover {
  background: rgb(255 255 255 / 7%);
  color: rgb(245 247 250 / 96%);
}

.VPNolebaseGraphViewControls span {
  min-width: 48px;
  color: rgb(180 188 203 / 72%);
}

.VPNolebaseGraphViewControls :last-child {
  border-right: 0;
}

.VPNolebaseGraphViewCanvas {
  position: relative;
  min-height: 360px;
  user-select: none;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.03) 1px, transparent 1px);
  background-position: center center;
  background-size: 32px 32px;
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
  stroke: rgb(140 154 183 / 26%);
  stroke-width: 0.9;
  opacity: 0.42;
  transition: stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease;
}

.VPNolebaseGraphViewEdges line.active {
  stroke: rgb(151 196 255 / 92%);
  stroke-width: 1.5;
  opacity: 0.92;
}

.VPNolebaseGraphViewNodes g {
  color: rgb(160 170 188 / 52%);
  cursor: grab;
  outline: none;
}

.VPNolebaseGraphViewNodes g:active {
  cursor: grabbing;
}

.VPNolebaseGraphViewNodes circle {
  fill: rgb(132 153 192 / 84%);
  stroke: rgb(16 20 28 / 92%);
  stroke-width: 2;
  filter: drop-shadow(0 0 10px rgb(118 147 194 / 18%));
  transition: fill 0.2s ease, r 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
}

.VPNolebaseGraphViewNodes text {
  pointer-events: none;
  text-anchor: middle;
  fill: currentColor;
  font-size: 11px;
  font-weight: 500;
  paint-order: stroke;
  stroke: rgb(12 16 23 / 92%);
  stroke-width: 5px;
  stroke-linejoin: round;
}

.VPNolebaseGraphViewNodes g.active,
.VPNolebaseGraphViewNodes g.selected {
  color: rgb(238 242 249 / 96%);
}

.VPNolebaseGraphViewNodes g.active circle,
.VPNolebaseGraphViewNodes g.selected circle {
  fill: rgb(114 177 255 / 98%);
  filter: drop-shadow(0 0 18px rgb(114 177 255 / 36%));
}

.VPNolebaseGraphViewNodes g.external circle {
  fill: rgb(247 187 95 / 96%);
}

.VPNolebaseGraphViewPanel {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 2;
  width: min(320px, calc(100% - 32px));
  padding: 14px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 12px;
  background: rgb(10 13 19 / 82%);
  box-shadow: 0 18px 40px rgb(0 0 0 / 30%);
  backdrop-filter: blur(14px);
}

.VPNolebaseGraphViewPanel h3 {
  margin: 0;
  font-size: 15px;
  color: rgb(244 247 250 / 96%);
}

.VPNolebaseGraphViewPanel p {
  margin: 6px 0 10px;
  color: rgb(174 183 198 / 72%);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.VPNolebaseGraphViewOpen {
  display: inline-flex;
  margin-bottom: 10px;
  color: rgb(144 190 255 / 96%);
  font-size: 13px;
  font-weight: 600;
}

.VPNolebaseGraphViewRelated {
  display: grid;
  gap: 5px;
  font-size: 13px;
}

.VPNolebaseGraphViewRelated strong {
  color: rgb(174 183 198 / 72%);
  font-size: 12px;
}

.VPNolebaseGraphViewEmpty {
  display: grid;
  min-height: 260px;
  place-items: center;
  color: rgb(174 183 198 / 72%);
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

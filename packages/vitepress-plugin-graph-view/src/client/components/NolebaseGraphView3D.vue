<script setup lang="ts">
import type { GraphViewData, GraphViewNode } from '../../vitepress'

import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useI18n } from '../composables/i18n'
import { defaultOptions, InjectionKey } from '../constants'

const props = defineProps<{
  data: GraphViewData
  height?: number | string
  maxNodes?: number
  title?: string
}>()

const options = inject(InjectionKey, defaultOptions)
const { t } = useI18n()

const containerEl = ref<HTMLDivElement>()
const searchInput = ref('')
const search = ref('')
const hoveredNode = ref<GraphViewNode>()
const selectedNode = ref<GraphViewNode>()
const isDarkTheme = ref(true)

let graphInstance: any
let searchDebounce: ReturnType<typeof setTimeout>
let themeObserver: MutationObserver | undefined

// ─── helpers ────────────────────────────────────────────────────────────────

const heightStyle = computed(() => {
  const h = props.height || options.height || defaultOptions.height
  return typeof h === 'number' ? `${h}px` : h
})

const maxNodes = computed(() => {
  const v = props.maxNodes ?? options.maxNodes ?? defaultOptions.maxNodes
  return v > 0 ? v : defaultOptions.maxNodes
})

const degreeByNodeId = computed(() => {
  const deg = new Map<string, number>()
  for (const n of props.data.nodes) deg.set(n.id, 0)
  for (const e of props.data.edges) {
    deg.set(e.source, (deg.get(e.source) || 0) + 1)
    deg.set(e.target, (deg.get(e.target) || 0) + 1)
  }
  return deg
})

const filteredNodes = computed(() => {
  const kw = search.value.trim().toLowerCase()
  const base = kw
    ? props.data.nodes.filter(n =>
        n.title.toLowerCase().includes(kw)
        || n.filePath.toLowerCase().includes(kw)
        || n.url.toLowerCase().includes(kw),
      )
    : props.data.nodes
  return base
    .slice()
    .sort((a, b) => (degreeByNodeId.value.get(b.id) || 0) - (degreeByNodeId.value.get(a.id) || 0))
    .slice(0, maxNodes.value)
})

const filteredNodeIds = computed(() => new Set(filteredNodes.value.map(n => n.id)))

const filteredEdges = computed(() =>
  props.data.edges.filter(
    e => filteredNodeIds.value.has(e.source) && filteredNodeIds.value.has(e.target),
  ),
)

const labelVisibleNodeIds = computed(() => {
  return new Set(filteredNodes.value.slice(0, 40).map(n => n.id))
})

const graphPalette = computed(() => {
  if (isDarkTheme.value) {
    return {
      node: '#8499c0',
      nodeHover: '#a8d0ff',
      nodeSelected: '#72b1ff',
      nodeExternal: '#f7bb5f',
      edge: 'rgba(140,160,200,0.22)',
      label: 'rgba(200,212,232,0.80)',
      labelHover: '#d0e8ff',
      labelSelected: '#e8f2ff',
      labelStroke: 'rgba(10,14,22,0.96)',
      ambient: 0xffffff,
      ambientIntensity: 0.72,
      directional: 0xaaddff,
      directionalIntensity: 0.62,
    }
  }

  return {
    node: '#4f6fa3',
    nodeHover: '#3f76d3',
    nodeSelected: '#245fbe',
    nodeExternal: '#c8822f',
    edge: 'rgba(66,88,120,0.26)',
    label: 'rgba(38,52,76,0.82)',
    labelHover: '#2f5ea8',
    labelSelected: '#19427f',
    labelStroke: 'rgba(245,248,252,0.96)',
    ambient: 0xffffff,
    ambientIntensity: 0.9,
    directional: 0xffffff,
    directionalIntensity: 0.48,
  }
})

function syncThemeMode() {
  if (typeof window === 'undefined')
    return
  isDarkTheme.value = document.documentElement.classList.contains('dark')
}

function setupThemeWatcher() {
  if (typeof window === 'undefined')
    return

  syncThemeMode()
  themeObserver = new MutationObserver(() => {
    syncThemeMode()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
}

// ─── graph data ─────────────────────────────────────────────────────────────

function buildGraphData() {
  return {
    nodes: filteredNodes.value.map(n => ({
      id: n.id,
      label: n.title,
      url: n.url,
      external: n.external,
      degree: degreeByNodeId.value.get(n.id) || 0,
      __raw: n,
    })),
    links: filteredEdges.value.map(e => ({ source: e.source, target: e.target })),
  }
}

function refreshGraphStyle() {
  if (!graphInstance)
    return

  graphInstance.nodeColor(graphInstance.nodeColor())
  graphInstance.linkColor(() => graphPalette.value.edge)
  graphInstance.nodeThreeObject(graphInstance.nodeThreeObject())
}

// ─── init ────────────────────────────────────────────────────────────────────

async function initGraph() {
  if (typeof window === 'undefined' || !containerEl.value)
    return

  // dynamic import avoids SSR issues
  const { default: ForceGraph3D } = await import('3d-force-graph')
  const THREE = await import('three')

  const el = containerEl.value
  const width = el.clientWidth || 960
  const heightPx = el.clientHeight || 620

  // @ts-ignore - 3d-force-graph type mismatch
  graphInstance = (ForceGraph3D as any)()(el)
    .width(width)
    .height(heightPx)
    .backgroundColor('rgba(0,0,0,0)')
    .showNavInfo(false)
    // ── nodes ────────────────────────────────────────────────────────────────
    .nodeRelSize(4)
    .nodeVal((node: any) => Math.min(16, 2 + node.degree * 1.1))
    .nodeColor((node: any) =>
      node.id === selectedNode.value?.id
        ? graphPalette.value.nodeSelected
        : node.id === hoveredNode.value?.id
          ? graphPalette.value.nodeHover
          : node.external
            ? graphPalette.value.nodeExternal
            : graphPalette.value.node,
    )
    .nodeOpacity(0.92)
    .nodeResolution(12)
    // ── three-object: node sphere + text label that scales with distance ──────
    .nodeThreeObject((node: any) => {
      const group = new THREE.Group()

      // sphere
      const deg = node.degree || 0
      const r = Math.min(6, 1.6 + deg * 0.7)
      const isSelected = node.id === selectedNode.value?.id
      const isHovered = node.id === hoveredNode.value?.id
      const colorHex = isSelected
        ? graphPalette.value.nodeSelected
        : isHovered
          ? graphPalette.value.nodeHover
          : node.external
            ? graphPalette.value.nodeExternal
            : graphPalette.value.node
      const color = Number.parseInt(colorHex.replace('#', ''), 16)
      const geo = new THREE.SphereGeometry(r, 12, 8)
      const mat = new THREE.MeshLambertMaterial({
        color,
        transparent: true,
        opacity: 0.92,
      })
      group.add(new THREE.Mesh(geo, mat))

      // text sprite – scales naturally with perspective camera ──────────────
      // Only top-40 degree nodes carry permanent labels; others show on hover/select
      const showLabel = labelVisibleNodeIds.value.has(node.id) || isSelected || isHovered

      if (showLabel && node.label) {
        const canvas = document.createElement('canvas')
        const scale = 2
        canvas.width = 256 * scale
        canvas.height = 56 * scale
        const ctx = canvas.getContext('2d')!
        ctx.scale(scale, scale)
        const fontSize = 13
        ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        // shadow / outline
        ctx.strokeStyle = graphPalette.value.labelStroke
        ctx.lineWidth = 4
        ctx.strokeText(node.label, 128, 28)
        ctx.fillStyle = isSelected
          ? graphPalette.value.labelSelected
          : isHovered
            ? graphPalette.value.labelHover
            : graphPalette.value.label
        ctx.fillText(node.label, 128, 28)

        const tex = new THREE.CanvasTexture(canvas)
        tex.needsUpdate = true
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
        const sprite = new THREE.Sprite(spriteMat)
        // sprite width/height in world units – perspective camera does the scaling
        sprite.scale.set(20, 5, 1)
        sprite.position.set(0, r + 3.5, 0)
        group.add(sprite)
      }

      return group
    })
    .nodeThreeObjectExtend(false)
    // ── links ────────────────────────────────────────────────────────────────
    .linkColor(() => graphPalette.value.edge)
    .linkWidth(0.5)
    .linkDirectionalParticles(0)
    // ── camera ───────────────────────────────────────────────────────────────
    .d3AlphaDecay(0.022)
    .d3VelocityDecay(0.34)
    // ── events ───────────────────────────────────────────────────────────────
    .onNodeHover((node: any) => {
      hoveredNode.value = node?.__raw ?? undefined
      el.style.cursor = node ? 'pointer' : 'default'
      // refresh node colours
      graphInstance.nodeColor(graphInstance.nodeColor())
      graphInstance.nodeThreeObject(graphInstance.nodeThreeObject())
    })
    .onNodeClick((node: any) => {
      selectedNode.value = selectedNode.value?.id === node.id ? undefined : node.__raw
      graphInstance.nodeColor(graphInstance.nodeColor())
      graphInstance.nodeThreeObject(graphInstance.nodeThreeObject())
    })
    .onNodeRightClick((node: any) => {
      window.location.href = node.url
    })
    .onBackgroundClick(() => {
      selectedNode.value = undefined
      graphInstance.nodeColor(graphInstance.nodeColor())
    })

  // Make layout more compact: shorter links + weaker repulsion + limited charge range.
  const chargeForce = graphInstance.d3Force('charge')
  chargeForce?.strength?.(-26)
  chargeForce?.distanceMax?.(220)

  const linkForce = graphInstance.d3Force('link')
  linkForce?.distance?.(56)
  linkForce?.strength?.(0.78)

  // scene lighting
  const scene = graphInstance.scene()
  scene.add(new THREE.AmbientLight(graphPalette.value.ambient, graphPalette.value.ambientIntensity))
  const dir = new THREE.DirectionalLight(graphPalette.value.directional, graphPalette.value.directionalIntensity)
  dir.position.set(1, 1, 1)
  scene.add(dir)

  // fix camera initial distance
  graphInstance.cameraPosition({ x: 0, y: 0, z: 320 })

  // feed data
  graphInstance.graphData(buildGraphData())

  // handle resize
  window.addEventListener('resize', handleResize)
}

function handleResize() {
  if (!containerEl.value || !graphInstance)
    return
  graphInstance.width(containerEl.value.clientWidth)
  graphInstance.height(containerEl.value.clientHeight)
}

// ─── watchers ────────────────────────────────────────────────────────────────

watch([filteredNodes, filteredEdges], () => {
  graphInstance?.graphData(buildGraphData())
})

watch(isDarkTheme, () => {
  refreshGraphStyle()
})

watch([hoveredNode, selectedNode], () => {
  refreshGraphStyle()
})

watch(searchInput, (v) => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => { search.value = v }, 120)
})

onMounted(async () => {
  setupThemeWatcher()
  await initGraph()
})

onBeforeUnmount(() => {
  clearTimeout(searchDebounce)
  themeObserver?.disconnect()
  window.removeEventListener('resize', handleResize)
  graphInstance?._destructor?.()
  if (containerEl.value)
    containerEl.value.innerHTML = ''
})

// related nodes for selected panel
const relatedNodes = computed(() => {
  if (!selectedNode.value)
    return []
  const relIds = new Set<string>()
  for (const e of props.data.edges) {
    if (e.source === selectedNode.value.id) relIds.add(e.target)
    if (e.target === selectedNode.value.id) relIds.add(e.source)
  }
  return props.data.nodes.filter(n => relIds.has(n.id)).slice(0, 12)
})
</script>

<template>
  <section class="VPNolebaseGraphView3D" :style="{ minHeight: heightStyle }">
    <!-- floating toolbar -->
    <div class="VPGraph3DToolbar">
      <div class="VPGraph3DInfo">
        <span class="VPGraph3DTitle">{{ props.title || t('graphView.title') }}</span>
        <span class="VPGraph3DStats">{{ filteredNodes.length }} {{ t('graphView.nodes') }} · {{ filteredEdges.length }} {{ t('graphView.edges') }}</span>
      </div>
      <input
        v-model="searchInput"
        type="search"
        :placeholder="t('graphView.searchPlaceholder')"
        class="VPGraph3DSearch"
      >
    </div>

    <!-- 3d canvas -->
    <div
      ref="containerEl"
      class="VPGraph3DCanvas"
      :style="{ height: heightStyle }"
    />

    <!-- selected node panel -->
    <aside v-if="selectedNode" class="VPGraph3DPanel">
      <a
        :href="selectedNode.url"
        :target="selectedNode.external ? '_blank' : undefined"
        :rel="selectedNode.external ? 'noreferrer' : undefined"
      >
        <h3>{{ selectedNode.title }}</h3>
      </a>
      <p>{{ selectedNode.filePath }}</p>
      <a class="VPGraph3DOpen" :href="selectedNode.url">
        {{ t('graphView.openPage') }}
      </a>
      <div v-if="relatedNodes.length" class="VPGraph3DRelated">
        <strong>{{ t('graphView.relatedPages') }}</strong>
        <a v-for="n of relatedNodes" :key="n.id" :href="n.url">{{ n.title }}</a>
      </div>
    </aside>
  </section>
</template>

<style scoped>
/* ── container ──────────────────────────────────────────────────────────────── */
.VPNolebaseGraphView3D {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background:
    radial-gradient(circle at 18% 14%, color-mix(in srgb, var(--vp-c-brand-1) 20%, transparent), transparent 28%),
    radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--vp-c-brand-2) 16%, transparent), transparent 24%),
    linear-gradient(170deg, color-mix(in srgb, var(--vp-c-bg-soft) 84%, var(--vp-c-bg)) 0%, var(--vp-c-bg) 100%);
  box-shadow: 0 24px 64px color-mix(in srgb, #000 24%, transparent);
}

:global(.dark) .VPNolebaseGraphView3D {
  border: 1px solid rgb(255 255 255 / 6%);
  background:
    radial-gradient(circle at 18% 14%, rgb(120 150 255 / 10%), transparent 26%),
    radial-gradient(circle at 82% 18%, rgb(100 240 200 / 7%), transparent 22%),
    linear-gradient(170deg, #0f1420 0%, #080c14 100%);
  box-shadow: 0 24px 64px rgb(0 0 0 / 38%);
}

/* ── canvas ──────────────────────────────────────────────────────────────────  */
.VPGraph3DCanvas {
  display: block;
  width: 100%;
}

/* ── floating toolbar ─────────────────────────────────────────────────────── */
.VPGraph3DToolbar {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  z-index: 4;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: color-mix(in srgb, var(--vp-c-bg) 84%, transparent);
  backdrop-filter: blur(14px);
  transition: all 0.2s ease;
}

:global(.dark) .VPGraph3DToolbar {
  border: 1px solid rgb(255 255 255 / 7%);
  background: rgb(8 12 20 / 68%);
}

.VPGraph3DInfo {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.VPGraph3DTitle {
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.VPGraph3DStats {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.VPGraph3DSearch {
  min-width: 180px;
  max-width: 260px;
  width: min(260px, 100%);
  padding: 7px 11px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 72%, transparent);
  color: var(--vp-c-text-1);
  font-size: 13px;
  outline: none;
  transition: border-color 0.18s, background 0.18s;
}

.VPGraph3DSearch::placeholder {
  color: color-mix(in srgb, var(--vp-c-text-2) 78%, transparent);
}

.VPGraph3DSearch:focus {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 56%, transparent);
  background: color-mix(in srgb, var(--vp-c-bg-soft) 88%, transparent);
}

:global(.dark) .VPGraph3DSearch {
  border: 1px solid rgb(255 255 255 / 8%);
  background: rgb(255 255 255 / 4%);
  color: rgb(234 240 248 / 92%);
}

:global(.dark) .VPGraph3DSearch::placeholder {
  color: rgb(174 185 204 / 50%);
}

:global(.dark) .VPGraph3DSearch:focus {
  border-color: rgb(114 177 255 / 52%);
  background: rgb(255 255 255 / 7%);
}

/* ── right-click hint ─────────────────────────────────────────────────────── */
.VPGraph3DCanvas::after {
  content: '右键双击节点打开页面 · 滚动缩放 · 拖拽移动';
  position: absolute;
  right: 14px;
  bottom: 14px;
  color: color-mix(in srgb, var(--vp-c-text-2) 62%, transparent);
  font-size: 11px;
  pointer-events: none;
  text-align: right;
  line-height: 1.5;
}

/* ── selected panel ─────────────────────────────────────────────────────────  */
.VPGraph3DPanel {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 4;
  width: min(300px, calc(100% - 28px));
  padding: 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: color-mix(in srgb, var(--vp-c-bg) 86%, transparent);
  box-shadow: 0 18px 48px color-mix(in srgb, #000 26%, transparent);
  backdrop-filter: blur(14px);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:global(.dark) .VPGraph3DPanel {
  border: 1px solid rgb(255 255 255 / 8%);
  background: rgb(8 12 20 / 85%);
  box-shadow: 0 18px 48px rgb(0 0 0 / 32%);
}

.VPGraph3DPanel h3 {
  margin: 0 0 6px;
  color: var(--vp-c-text-1);
  font-size: 15px;
  font-weight: 600;
}

.VPGraph3DPanel p {
  margin: 0 0 10px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  overflow-wrap: anywhere;
  line-height: 1.5;
}

.VPGraph3DOpen {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.VPGraph3DOpen:hover {
  opacity: 0.8;
}

.VPGraph3DRelated {
  display: grid;
  gap: 5px;
  font-size: 13px;
}

.VPGraph3DRelated strong {
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 600;
}

.VPGraph3DRelated a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s ease;
}

.VPGraph3DRelated a:hover {
  color: var(--vp-c-brand-1);
}

/* ── responsive ─────────────────────────────────────────────────────────────  */
@media (max-width: 767px) {
  .VPGraph3DToolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .VPGraph3DSearch {
    max-width: none;
    width: 100%;
  }

  .VPGraph3DCanvas::after {
    font-size: 10px;
    right: 10px;
    bottom: 10px;
  }

  .VPGraph3DPanel {
    right: 10px;
    bottom: 10px;
    width: min(280px, calc(100% - 20px));
  }
}
</style>

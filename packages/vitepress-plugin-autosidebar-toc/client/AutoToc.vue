<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useRoute } from 'vitepress'
import type {
  TocSidebarDirectoryEntry,
  TocSidebarDoctreePayload,
  TocSidebarFileEntry,
  TocSidebarRawTree,
  TocSidebarRawTreeNode,
} from '../types'

interface AutoTocEntry {
  text: string
  link: string
}

interface AutoTocRouteTreeEntry {
  kind: 'directory' | 'file'
  text: string
  link?: string
  items?: AutoTocRouteTreeEntry[]
}

interface DisplayEntry {
  text: string
  link: string
  active: boolean
  kind: 'directory' | 'file'
}

const route = useRoute()
// 缓存已加载的 doctree 数据，避免重复加载
const cachedDoctreeData = shallowRef<TocSidebarRawTree | null>(null)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTocSidebarFileEntry(value: unknown): value is TocSidebarFileEntry {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.name === 'string'
    && typeof value.path === 'string'
    && typeof value.link === 'string'
    && typeof value.displayText === 'string'
    && isRecord(value.frontmatter)
    && (value.h1 === null || typeof value.h1 === 'string')
}

function isTocSidebarDirectoryEntry(value: unknown): value is TocSidebarDirectoryEntry {
  if (!isRecord(value)) {
    return false
  }

  const hasValidIndexFile = value.indexFile === null || isTocSidebarFileEntry(value.indexFile)
  return typeof value.name === 'string'
    && typeof value.path === 'string'
    && (value.link === null || typeof value.link === 'string')
    && typeof value.displayText === 'string'
    && hasValidIndexFile
}

function isTocSidebarRawTreeNode(value: unknown): value is TocSidebarRawTreeNode {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.path === 'string'
    && Array.isArray(value.directoryItems)
    && value.directoryItems.every(isTocSidebarDirectoryEntry)
    && Array.isArray(value.fileItems)
    && value.fileItems.every(isTocSidebarFileEntry)
}

function isTocSidebarRawTree(value: unknown): value is TocSidebarRawTree {
  if (!isRecord(value)) {
    return false
  }

  return Object.values(value).every(isTocSidebarRawTreeNode)
}

function isTocSidebarDoctreePayload(value: unknown): value is TocSidebarDoctreePayload {
  return isRecord(value) && isTocSidebarRawTree(value.tree)
}

function normalizeDoctreePayload(payload: unknown): TocSidebarRawTree | null {
  if (isTocSidebarDoctreePayload(payload)) {
    return payload.tree
  }

  if (isTocSidebarRawTree(payload)) {
    return payload
  }

  return null
}

// 异步加载 doctree 数据，只在必要时加载
async function loadDoctreeData(): Promise<TocSidebarRawTree | null> {
  if (cachedDoctreeData.value) {
    return cachedDoctreeData.value
  }

  try {
    // 动态导入虚拟模块，避免初始化时加载
    const doctreeModule = await import('virtual:@knewbeing/toc-sidebar-doctree')
    const payload = normalizeDoctreePayload(doctreeModule.default)
    if (payload) {
      cachedDoctreeData.value = payload
    }
    return payload
  }
  catch (error) {
    console.warn('[AutoToc] Failed to load doctree data:', error)
    return null
  }
}

const rawTree = shallowRef<TocSidebarRawTree | null>(null)

// 当组件需要数据时才异步加载
watch(
  () => route.path,
  async () => {
    const tree = await loadDoctreeData()
    rawTree.value = tree
  },
  { immediate: true }
)

function safeDecode(input: string): string {
  try {
    return decodeURIComponent(input)
  }
  catch {
    return input
  }
}

function stripQueryAndHash(link: string): string {
  const queryIndex = link.indexOf('?')
  const hashIndex = link.indexOf('#')
  const cutIndex = [queryIndex, hashIndex]
    .filter(index => index >= 0)
    .reduce((min, current) => Math.min(min, current), Number.POSITIVE_INFINITY)

  return Number.isFinite(cutIndex) ? link.slice(0, cutIndex) : link
}

function normalizePath(path: string, preserveTrailingSlash = false): string {
  if (!path)
    return '/'

  let normalized = safeDecode(stripQueryAndHash(path))
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`
  }
  normalized = normalized.replace(/\/+/g, '/')

  if (normalized !== '/' && normalized.endsWith('/index')) {
    normalized = `${normalized.slice(0, -6) || '/'}${normalized === '/index' ? '' : '/'}`
  }

  if (!preserveTrailingSlash && normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  return normalized || '/'
}

function isDirectoryRoutePath(path: string): boolean {
  const normalized = normalizePath(path, true)
  return normalized === '/' || normalized.endsWith('/')
}

function parentDirectoryPath(routePath: string): string {
  const normalized = normalizePath(routePath)
  if (normalized === '/') {
    return '/'
  }

  const parts = normalized.split('/').filter(Boolean)
  if (isDirectoryRoutePath(routePath)) {
    return `/${parts.join('/')}`
  }

  const parent = parts.slice(0, -1).join('/')
  return parent ? `/${parent}` : '/'
}

function toRawTreeKeyFromRoutePath(routePath: string): string {
  const normalized = normalizePath(routePath)
  if (normalized === '/') {
    return '/'
  }

  return normalized.replace(/^\/+|\/+$/g, '')
}

function buildRouteTreeFromRawTree(
  sourceRawTree: TocSidebarRawTree,
  rawTreeKey: string,
): AutoTocRouteTreeEntry[] {
  const node = sourceRawTree[rawTreeKey]
  if (!node) {
    return []
  }

  const items: AutoTocRouteTreeEntry[] = []

  for (const dirEntry of node.directoryItems) {
    const childNode = sourceRawTree[dirEntry.path]
    const children = childNode
      ? buildRouteTreeFromRawTree(sourceRawTree, dirEntry.path)
      : []

    items.push({
      kind: 'directory',
      text: dirEntry.displayText,
      ...(dirEntry.link ? { link: dirEntry.link } : {}),
      ...(children.length > 0 ? { items: children } : {}),
    })
  }

  for (const fileEntry of node.fileItems) {
    if (fileEntry.name === 'index.md') {
      continue
    }

    items.push({
      kind: 'file',
      text: fileEntry.displayText,
      link: fileEntry.link,
    })
  }

  return items
}

function getCurrentRouteTree(sourceRawTree: TocSidebarRawTree | null, routePath: string): AutoTocRouteTreeEntry[] {
  if (!sourceRawTree) {
    return []
  }

  const normalizedRoute = normalizePath(routePath, true)
  const targetDirPath = isDirectoryRoutePath(normalizedRoute)
    ? normalizedRoute
    : parentDirectoryPath(normalizedRoute)
  const targetKey = toRawTreeKeyFromRoutePath(targetDirPath)
  const routeTree = buildRouteTreeFromRawTree(sourceRawTree, targetKey)
  if (routeTree.length > 0) {
    return routeTree
  }

  // 次级回退：路由与目录映射不一致时，尝试路由本身对应节点。
  const fallbackKey = toRawTreeKeyFromRoutePath(normalizedRoute)
  if (fallbackKey === targetKey) {
    return []
  }

  const fallbackTree = buildRouteTreeFromRawTree(sourceRawTree, fallbackKey)
  return fallbackTree
}

function isDirectoryLink(link: string): boolean {
  return isDirectoryRoutePath(link)
}

function routeMatches(routePath: string, link: string): boolean {
  return normalizePath(routePath, true) === normalizePath(link, true)
}

function pickCurrentLevelEntries(entries: AutoTocRouteTreeEntry[]): AutoTocEntry[] {
  return entries
    .filter(entry => !!entry.link)
    .map(entry => ({
      text: entry.text,
      link: entry.link!,
    }))
}

const siblingEntries = computed<DisplayEntry[]>(() => {
  const currentRouteTree = getCurrentRouteTree(rawTree.value, route.path)
  const siblings = currentRouteTree.length > 0 ? pickCurrentLevelEntries(currentRouteTree) : []

  const seen = new Set<string>()

  return siblings
    .map((item) => {
      const link = item.link
      const text = item.text || link
      const kind: DisplayEntry['kind'] = isDirectoryLink(link) ? 'directory' : 'file'
      return {
        text,
        link,
        active: routeMatches(route.path, link),
        kind,
      }
    })
    .filter((item) => {
      const key = normalizePath(item.link, true)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
})

const groupedEntries = computed(() => {
  const directories: DisplayEntry[] = []
  const files: DisplayEntry[] = []

  for (const entry of siblingEntries.value) {
    if (entry.kind === 'directory') {
      directories.push(entry)
    }
    else {
      files.push(entry)
    }
  }

  return {
    directories,
    files,
  }
})
</script>

<template>
  <nav v-if="groupedEntries.directories.length || groupedEntries.files.length" class="auto-toc" aria-label="同级目录">
    <h2 class="auto-toc__title">
      同级目录
    </h2>

    <section v-if="groupedEntries.files.length" class="auto-toc__section auto-toc__section--file">
      <h3 class="auto-toc__section-title">
        <span class="auto-toc__icon">📄</span> 文章
      </h3>
      <ul class="auto-toc__list">
        <li v-for="item in groupedEntries.files" :key="item.link" class="auto-toc__item">
          <a :href="item.link" :class="['auto-toc__link', { 'is-active': item.active }]">
            {{ item.text }}
          </a>
        </li>
      </ul>
    </section>

    <section v-if="groupedEntries.directories.length" class="auto-toc__section auto-toc__section--dir">
      <h3 class="auto-toc__section-title">
        <span class="auto-toc__icon">📁</span> 目录
      </h3>
      <ul class="auto-toc__list">
        <li v-for="item in groupedEntries.directories" :key="item.link" class="auto-toc__item">
          <a :href="item.link" :class="['auto-toc__link', { 'is-active': item.active }]">
            {{ item.text }}
          </a>
        </li>
      </ul>
    </section>
  </nav>
</template>

<style scoped>
.auto-toc {
  margin: 32px 0;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  width: 100%;
  box-sizing: border-box;
}

.auto-toc__title {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider-light);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-2);
}

.auto-toc__section {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  transition: border-color 0.3s ease;
}

.auto-toc__section:first-of-type {
  margin-top: 0;
}

.auto-toc__section:hover {
  border-color: var(--vp-c-brand-2);
}

.auto-toc__section--file {
  border-left: 3px solid var(--vp-c-brand-1);
}

.auto-toc__section--dir {
  border-left: 3px solid var(--vp-c-brand-soft);
}

.auto-toc__section-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.auto-toc__icon {
  margin-right: 4px;
  font-style: normal;
}

.auto-toc__list {
  margin: 0;
  padding-left: 8px;
  list-style-type: none;
}

.auto-toc__item {
  margin: 0;
  line-height: 1;
}

.auto-toc__link {
  display: block;
  padding: 6px 10px;
  border-radius: 6px;
  color: var(--vp-c-text-1);
  font-size: 14px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.auto-toc__link:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  text-decoration: none;
}

.auto-toc__link.is-active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  background: var(--vp-c-brand-soft);
  background: color-mix(in srgb, var(--vp-c-brand-soft) 15%, transparent);
}

@media (max-width: 1024px) {
  .auto-toc {
    margin: 24px 0;
    padding: 16px;
  }

  .auto-toc__section {
    padding: 12px 14px;
  }
}

@media (max-width: 640px) {
  .auto-toc {
    margin: 20px 0;
    padding: 14px;
    border-radius: 8px;
  }

  .auto-toc__title {
    margin: 0 0 12px;
    padding-bottom: 10px;
    font-size: 13px;
  }

  .auto-toc__section {
    margin-top: 12px;
    padding: 10px 12px;
  }

  .auto-toc__link {
    padding: 5px 8px;
    font-size: 13px;
  }
}
</style>

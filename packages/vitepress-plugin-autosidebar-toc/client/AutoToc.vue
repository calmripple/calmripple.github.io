<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useRoute } from 'vitepress'
import type {
  TocSidebarRawTreeNode,
} from '../types'

interface DisplayEntry {
  text: string
  link: string
  active: boolean
  kind: 'directory' | 'file'
}

const route = useRoute()
const currentNode = shallowRef<TocSidebarRawTreeNode | null>(null)
const nodeCache = new Map<string, TocSidebarRawTreeNode | null>()

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

function routeMatches(routePath: string, link: string): boolean {
  return normalizePath(routePath, true) === normalizePath(link, true)
}

async function loadNode(dirKey: string): Promise<TocSidebarRawTreeNode | null> {
  if (nodeCache.has(dirKey)) {
    return nodeCache.get(dirKey)!
  }

  try {
    const { loadDirectoryNode } = await import('virtual:@knewbeing/toc-sidebar-doctree')
    const node = await loadDirectoryNode(dirKey)
    nodeCache.set(dirKey, node)
    return node
  }
  catch (error) {
    console.warn('[AutoToc] Failed to load directory node:', error)
    nodeCache.set(dirKey, null)
    return null
  }
}

watch(
  () => route.path,
  async () => {
    const normalizedRoute = normalizePath(route.path, true)
    const targetDirPath = isDirectoryRoutePath(normalizedRoute)
      ? normalizedRoute
      : parentDirectoryPath(normalizedRoute)
    const targetKey = toRawTreeKeyFromRoutePath(targetDirPath)

    let node = await loadNode(targetKey)

    // 回退：尝试路由本身对应的目录键
    if (!node) {
      const fallbackKey = toRawTreeKeyFromRoutePath(normalizedRoute)
      if (fallbackKey !== targetKey) {
        node = await loadNode(fallbackKey)
      }
    }

    currentNode.value = node
  },
  { immediate: true },
)

const siblingEntries = computed<DisplayEntry[]>(() => {
  const node = currentNode.value
  if (!node) {
    return []
  }

  const entries: DisplayEntry[] = []

  for (const dirEntry of node.directoryItems) {
    if (dirEntry.link) {
      entries.push({
        text: dirEntry.displayText,
        link: dirEntry.link,
        active: routeMatches(route.path, dirEntry.link),
        kind: 'directory',
      })
    }
  }

  for (const fileEntry of node.fileItems) {
    if (fileEntry.name === 'index.md') {
      continue
    }
    entries.push({
      text: fileEntry.displayText,
      link: fileEntry.link,
      active: routeMatches(route.path, fileEntry.link),
      kind: 'file',
    })
  }

  const seen = new Set<string>()
  return entries.filter((item) => {
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
    <h2 class="auto-toc__title">同级目录</h2>

    <section v-if="groupedEntries.files.length" class="auto-toc__section auto-toc__section--file">
      <h3 class="auto-toc__section-title">
        <span class="auto-toc__badge auto-toc__badge--file">文章</span>
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
        <span class="auto-toc__badge auto-toc__badge--dir">目录</span>
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
  margin: 24px 0;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);

  /* 占满整个父级宽度 */
  width: 100%;
  box-sizing: border-box;
}

.auto-toc__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.auto-toc__section {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.auto-toc__section--dir {
  border-left: 4px solid #1d8f4e;
}

.auto-toc__section--file {
  border-left: 4px solid #2f6feb;
}

.auto-toc__section-title {
  margin: 0 0 8px;
  font-size: 13px;
}

.auto-toc__badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.5;
  font-weight: 600;
}

.auto-toc__badge--dir {
  color: #0f5c2f;
  background: #dff3e8;
}

.auto-toc__badge--file {
  color: #1f4ea8;
  background: #e2edff;
}

.auto-toc__list {
  margin: 0;
  padding-left: 20px;
  list-style-type: none;
}

.auto-toc__item {
  margin: 8px 0;
  line-height: 1.6;
}

.auto-toc__link {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s ease;
}

.auto-toc__link:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.auto-toc__link.is-active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* 平板设备响应式调整 */
@media (max-width: 1024px) {
  .auto-toc {
    margin: 20px auto;
    padding: 14px;
    font-size: 14px;
  }

  .auto-toc__section {
    padding: 10px 12px;
  }
}

/* 手机设备响应式调整 */
@media (max-width: 640px) {
  .auto-toc {
    margin: 16px auto;
    padding: 12px;
    font-size: 13px;
    border-radius: 8px;
  }

  .auto-toc__title {
    margin: 0 0 10px;
    font-size: 13px;
  }

  .auto-toc__section {
    margin-top: 10px;
    padding: 10px;
  }

  .auto-toc__badge {
    padding: 2px 8px;
    font-size: 11px;
  }

  .auto-toc__list {
    padding-left: 16px;
  }

  .auto-toc__item {
    margin: 6px 0;
  }
}
</style>

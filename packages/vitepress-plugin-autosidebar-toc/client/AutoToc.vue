<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useRoute } from 'vitepress'
import type {
  TocSidebarRawTreeNode,
} from '../types'

interface DisplayEntry {
  text: string
  link: string
  active: boolean
}

const route = useRoute()
const currentNode = shallowRef<TocSidebarRawTreeNode | null>(null)
const allFileEntries = shallowRef<DisplayEntry[]>([])
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

async function collectAllFileEntries(dirKey: string, routePath: string): Promise<DisplayEntry[]> {
  const node = await loadNode(dirKey)
  if (!node) {
    return []
  }

  const entries: DisplayEntry[] = []

  for (const fileEntry of node.fileItems) {
    if (fileEntry.name === 'index.md') {
      continue
    }
    entries.push({
      text: fileEntry.displayText,
      link: fileEntry.link,
      active: routeMatches(routePath, fileEntry.link),
    })
  }

  const childResults = await Promise.all(
    node.directoryItems.map(dir => collectAllFileEntries(dir.path, routePath)),
  )

  for (const childEntries of childResults) {
    entries.push(...childEntries)
  }

  return entries
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

    const rootKey = node ? targetKey : toRawTreeKeyFromRoutePath(normalizedRoute)
    const entries = await collectAllFileEntries(rootKey, route.path)

    // 去重（同一 link 只保留一条）
    const seen = new Set<string>()
    allFileEntries.value = entries.filter((item) => {
      const key = normalizePath(item.link, true)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  },
  { immediate: true },
)

const fileEntries = allFileEntries
</script>

<template>
<<<<<<< HEAD
  <nav v-if="fileEntries.length" class="auto-toc" aria-label="当前目录文章">
    <h2 class="auto-toc__title">当前目录</h2>
    <ul class="auto-toc__list">
      <li v-for="item in fileEntries" :key="item.link" class="auto-toc__item">
        <a :href="item.link" :class="['auto-toc__link', { 'is-active': item.active }]">
          {{ item.text }}
        </a>
      </li>
    </ul>
=======
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
>>>>>>> agents/blonde-barracuda
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

<<<<<<< HEAD
=======
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

>>>>>>> agents/blonde-barracuda
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
<<<<<<< HEAD
=======

  .auto-toc__section {
    padding: 12px 14px;
  }
>>>>>>> agents/blonde-barracuda
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

<<<<<<< HEAD
  .auto-toc__list {
    padding-left: 16px;
  }

  .auto-toc__item {
    margin: 6px 0;
=======
  .auto-toc__section {
    margin-top: 12px;
    padding: 10px 12px;
  }

  .auto-toc__link {
    padding: 5px 8px;
    font-size: 13px;
>>>>>>> agents/blonde-barracuda
  }
}
</style>

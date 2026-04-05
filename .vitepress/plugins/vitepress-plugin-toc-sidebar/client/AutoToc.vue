<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, withBase } from 'vitepress'
import type { TocSidebarRawTree } from '../types'

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
const rawTree = shallowRef<TocSidebarRawTree | null>(null)

let rawTreePromise: Promise<TocSidebarRawTree | null> | null = null

async function loadRawTree(): Promise<TocSidebarRawTree | null> {
  if (!rawTreePromise) {
    rawTreePromise = fetch(withBase('/doctree.json'), {
      cache: 'no-cache',
    })
      .then(async (response) => {
        if (!response.ok) {
          return null
        }

        const payload = await response.json()
        return payload as TocSidebarRawTree
      })
      .catch(() => null)
  }

  return rawTreePromise
}

onMounted(async () => {
  rawTree.value = await loadRawTree()
})

function safeDecode(input: string): string {
  try {
    return decodeURIComponent(input)
  }
  catch {
    return input
  }
}

function stripHash(link: string): string {
  const i = link.indexOf('#')
  return i >= 0 ? link.slice(0, i) : link
}

function normalizePath(path: string): string {
  if (!path)
    return '/'

  let normalized = safeDecode(stripHash(path))
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`
  }
  normalized = normalized.replace(/\/+/g, '/')

  if (normalized !== '/' && normalized.endsWith('/index')) {
    normalized = normalized.slice(0, -6) || '/'
  }

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  return normalized || '/'
}

function parentDirectoryPath(routePath: string): string {
  const normalized = normalizePath(routePath)
  if (normalized === '/') {
    return '/'
  }

  const parts = normalized.split('/').filter(Boolean)
  if (routePath.endsWith('/')) {
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

function joinRawTreeKey(baseKey: string, childDirName: string): string {
  if (baseKey === '/') {
    return childDirName
  }

  return `${baseKey}/${childDirName}`
}

function toDirectoryLinkFromRawTreeKey(rawTreeKey: string): string {
  if (!rawTreeKey || rawTreeKey === '/') {
    return '/'
  }

  return `/${rawTreeKey}/`
}

function toPageLinkFromRelativeFile(relativeMdPath: string): string {
  const normalized = relativeMdPath.replace(/\\/g, '/').replace(/^\/+/, '')
  let link = `/${normalized}`

  if (link.endsWith('.md')) {
    link = link.slice(0, -3)
  }
  if (link.endsWith('/index')) {
    link = link.slice(0, -6)
  }
  if (!link) {
    return '/'
  }

  return link
}

function toFileDisplayText(fileName: string): string {
  return fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName
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

  for (const dirName of node.directories) {
    const childKey = joinRawTreeKey(rawTreeKey, dirName)
    const childNode = sourceRawTree[childKey]
    if (!childNode) {
      continue
    }

    const hasIndex = childNode.files.includes('index.md')
    const children = buildRouteTreeFromRawTree(sourceRawTree, childKey)

    items.push({
      kind: 'directory',
      text: dirName,
      ...(hasIndex ? { link: toDirectoryLinkFromRawTreeKey(childKey) } : {}),
      ...(children.length > 0 ? { items: children } : {}),
    })
  }

  for (const fileName of node.files) {
    if (!fileName.endsWith('.md') || fileName === 'index.md') {
      continue
    }

    const relativeFile = rawTreeKey === '/' ? fileName : `${rawTreeKey}/${fileName}`
    items.push({
      kind: 'file',
      text: toFileDisplayText(fileName),
      link: toPageLinkFromRelativeFile(relativeFile),
    })
  }

  return items
}

function getCurrentRouteTree(sourceRawTree: TocSidebarRawTree | null, routePath: string): AutoTocRouteTreeEntry[] {
  if (!sourceRawTree) {
    return []
  }

  const targetDirPath = parentDirectoryPath(routePath)
  const targetKey = toRawTreeKeyFromRoutePath(targetDirPath)
  const routeTree = buildRouteTreeFromRawTree(sourceRawTree, targetKey)
  if (routeTree.length > 0) {
    return routeTree
  }

  const normalizedRoute = normalizePath(routePath)
  const fallbackKey = toRawTreeKeyFromRoutePath(normalizedRoute)
  const fallbackTree = buildRouteTreeFromRawTree(sourceRawTree, fallbackKey)
  if (fallbackTree.length > 0) {
    return fallbackTree
  }

  const parentKey = toRawTreeKeyFromRoutePath(parentDirectoryPath(normalizedRoute))
  return buildRouteTreeFromRawTree(sourceRawTree, parentKey)
}

function isDirectoryLink(link: string): boolean {
  const normalized = safeDecode(stripHash(link))
  return normalized === '/' || normalized.endsWith('/')
}

function routeMatches(routePath: string, link: string): boolean {
  return normalizePath(routePath) === normalizePath(link)
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
      const key = normalizePath(item.link)
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
  margin: 20px 0;
  padding: 14px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.auto-toc__title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.auto-toc__section {
  margin-top: 10px;
  padding: 10px 12px;
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
}

.auto-toc__badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.6;
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
  padding-left: 18px;
}

.auto-toc__item {
  margin: 6px 0;
}

.auto-toc__link {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.auto-toc__link:hover {
  color: var(--vp-c-brand-1);
}

.auto-toc__link.is-active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
</style>

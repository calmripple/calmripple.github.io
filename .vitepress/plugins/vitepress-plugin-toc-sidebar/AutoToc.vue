<script setup lang="ts">
import type { DefaultTheme } from 'vitepress'
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'

type SidebarItem = DefaultTheme.SidebarItem
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
const { theme } = useData()

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

function isDirectoryLink(link: string): boolean {
  const normalized = safeDecode(stripHash(link))
  return normalized === '/' || normalized.endsWith('/')
}

function routeMatches(routePath: string, link: string): boolean {
  return normalizePath(routePath) === normalizePath(link)
}

function flattenRouteTreeEntries(entries: AutoTocRouteTreeEntry[]): AutoTocEntry[] {
  const links: AutoTocEntry[] = []

  const walk = (nodes: AutoTocRouteTreeEntry[]): void => {
    for (const node of nodes) {
      if (node.link) {
        links.push({ text: node.text, link: node.link })
      }

      if (node.items?.length) {
        walk(node.items)
      }
    }
  }

  walk(entries)
  return links
}

function pickSidebarForRoute(
  sidebar: DefaultTheme.Sidebar | undefined,
  routePath: string,
): SidebarItem[] {
  if (!sidebar) {
    return []
  }

  if (Array.isArray(sidebar)) {
    return sidebar
  }

  const keys = Object.keys(sidebar)
  if (keys.length === 0) {
    return []
  }

  const normalizedRoute = normalizePath(routePath)
  const selectedKey = keys
    .filter((key) => {
      const base = normalizePath(key)
      return normalizedRoute === base || normalizedRoute.startsWith(`${base}/`)
    })
    .sort((a, b) => normalizePath(b).length - normalizePath(a).length)[0]

  const pickSectionItems = (section: SidebarItem[] | { items: SidebarItem[], base: string } | undefined): SidebarItem[] => {
    if (!section) {
      return []
    }
    return Array.isArray(section) ? section : (section.items ?? [])
  }

  if (!selectedKey) {
    return pickSectionItems(sidebar['/'])
  }

  return pickSectionItems(sidebar[selectedKey])
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

function findCurrentRouteTree(items: SidebarItem[], routePath: string): AutoTocRouteTreeEntry[] {
  const targetDirPath = parentDirectoryPath(routePath)
  const normalizedRoute = normalizePath(routePath)

  const dfs = (list: SidebarItem[]): AutoTocRouteTreeEntry[] => {
    for (const item of list) {
      const routeTree = (((item as any).__autoTocRouteTree) ?? []) as AutoTocRouteTreeEntry[]
      const itemDirPath = normalizePath(((item as any).__autoTocDirPath ?? '') as string)

      if (routeTree.length > 0) {
        if (itemDirPath && itemDirPath === targetDirPath) {
          return routeTree
        }

        if ('link' in item && item.link && routeMatches(normalizedRoute, item.link)) {
          return routeTree
        }
      }

      if ('items' in item && item.items?.length) {
        const found = dfs(item.items)
        if (found.length > 0) {
          return found
        }
      }
    }

    return []
  }

  return dfs(items)
}

const siblingEntries = computed<DisplayEntry[]>(() => {
  const sectionItems = pickSidebarForRoute(theme.value.sidebar, route.path)
  const currentRouteTree = findCurrentRouteTree(sectionItems, route.path)
  const siblings = currentRouteTree.length > 0 ? flattenRouteTreeEntries(currentRouteTree) : []

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

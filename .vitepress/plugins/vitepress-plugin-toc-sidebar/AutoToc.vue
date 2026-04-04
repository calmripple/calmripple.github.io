<script setup lang="ts">
import type { DefaultTheme } from 'vitepress'
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'

type SidebarItem = DefaultTheme.SidebarItem
interface AutoTocEntry {
  text: string
  link: string
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

function routeMatches(routePath: string, link: string): boolean {
  return normalizePath(routePath) === normalizePath(link)
}

function toLinkItems(entries: AutoTocEntry[]): SidebarItem[] {
  return entries.map(entry => ({ text: entry.text, link: entry.link })) as SidebarItem[]
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

function findSameLevelGroup(items: SidebarItem[], routePath: string): SidebarItem[] | null {
  const normalizedRoute = normalizePath(routePath)
  const routeLooksLikeDirectory = routePath.endsWith('/')

  const dfs = (list: SidebarItem[]): SidebarItem[] | null => {
    for (const item of list) {
      if ('link' in item && item.link && routeMatches(normalizedRoute, item.link)) {
        const hiddenLinks = ((item as any).__autoTocLinks ?? []) as AutoTocEntry[]
        const hiddenItems = hiddenLinks.length ? toLinkItems(hiddenLinks) : []

        if ('items' in item && item.items?.length) {
          return [...item.items, ...hiddenItems]
        }

        if (hiddenItems.length) {
          return hiddenItems
        }

        if (routeLooksLikeDirectory) {
          return []
        }

        return list
      }

      if ('items' in item && item.items?.length) {
        const found = dfs(item.items)
        if (found) {
          return found
        }
      }
    }

    return null
  }

  return dfs(items)
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

function findLinksByDirectoryPath(items: SidebarItem[], routePath: string): SidebarItem[] | null {
  const targetDirPath = parentDirectoryPath(routePath)

  const dfs = (list: SidebarItem[]): SidebarItem[] | null => {
    for (const item of list) {
      const itemDirPath = normalizePath(((item as any).__autoTocDirPath ?? '') as string)
      const hiddenLinks = ((item as any).__autoTocLinks ?? []) as AutoTocEntry[]
      if (itemDirPath && itemDirPath === targetDirPath && hiddenLinks.length > 0) {
        return toLinkItems(hiddenLinks)
      }

      if ('items' in item && item.items?.length) {
        const found = dfs(item.items)
        if (found) {
          return found
        }
      }
    }

    return null
  }

  return dfs(items)
}

const siblingEntries = computed(() => {
  const sidebarItems = pickSidebarForRoute(theme.value.sidebar, route.path)
  const siblings = findSameLevelGroup(sidebarItems, route.path)
    ?? findLinksByDirectoryPath(sidebarItems, route.path)
    ?? []

  return siblings
    .filter(item => 'link' in item && !!item.link)
    .map((item) => {
      const link = (item as { link: string }).link
      const text = item.text
      return {
        text,
        link,
        active: routeMatches(route.path, link),
      }
    })
})
</script>

<template>
  <nav v-if="siblingEntries.length" class="auto-toc" aria-label="同级目录">
    <h2 class="auto-toc__title">同级目录</h2>
    <ul class="auto-toc__list">
      <li v-for="item in siblingEntries" :key="item.link" class="auto-toc__item">
        <a :href="item.link" :class="['auto-toc__link', { 'is-active': item.active }]">
          {{ item.text }}
        </a>
      </li>
    </ul>
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

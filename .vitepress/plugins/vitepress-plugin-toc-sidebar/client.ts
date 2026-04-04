import type { App } from 'vue'
import AutoToc from './AutoToc.vue'

export function registerTocSidebarComponents(app: App): void {
  app.component('AutoToc', AutoToc)
}

export interface TocSidebarClientPlugin {
  name: 'vitepress-plugin-toc-sidebar:client'
  enhanceApp: (app: App) => void
}

export function createTocSidebarClientPlugin(): TocSidebarClientPlugin {
  return {
    name: 'vitepress-plugin-toc-sidebar:client',
    enhanceApp(app: App) {
      registerTocSidebarComponents(app)
    },
  }
}

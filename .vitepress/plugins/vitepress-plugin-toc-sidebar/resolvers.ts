import type { ComponentResolver } from 'unplugin-vue-components/types'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function isESM() {
  return typeof __filename === 'undefined' || typeof __dirname === 'undefined'
}
export function getDirname() {
  return isESM() ? path.dirname(fileURLToPath(import.meta.url)) : __dirname
}
export interface TocSidebarResolverOptions {
  componentName?: string
  from?: string
}

export function TocSidebarResolver(options: TocSidebarResolverOptions = {}): ComponentResolver {
  const componentName = options.componentName ?? 'AutoToc'
  const from = options.from ?? `${getDirname()}/AutoToc.vue`

  return {
    type: 'component',
    resolve(name: string) {
      if (name !== componentName) {
        return undefined
      }

      return {
        name: 'default',
        as: componentName,
        from,
      }
    },
  }
}

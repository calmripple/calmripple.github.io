import type { ComponentResolver } from 'unplugin-vue-components/types'
import type { AutoTocResolverOptions } from '../types'

/**
 * 创建 `AutoToc` 组件的按需自动导入解析器。
 *
 * @param options 解析器配置项。
 * @returns 可供 `unplugin-vue-components` 使用的组件解析器。
 */
export function createAutoTocComponentResolver(options: AutoTocResolverOptions = {}): ComponentResolver {
  const componentName = options.componentName ?? 'AutoToc'
  const from = options.from ?? '@knewbeing/vitepress-plugin-autosidebar-toc/client/AutoToc.vue'

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

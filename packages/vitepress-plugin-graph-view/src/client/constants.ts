import type { InjectionKey as VueInjectionKey } from 'vue'

import type { Options } from './types'

import { defaultLocales } from './locales'

export const InjectionKey: VueInjectionKey<Options> = Symbol('vitepress-nolebase-graph-view')

export const defaultOptions: Required<Pick<Options, 'height' | 'maxLabelLength' | 'maxNodes' | 'showToolbar'>> & Pick<Options, 'locales'> = {
  height: 520,
  maxLabelLength: 24,
  maxNodes: 120,
  showToolbar: true,
  locales: defaultLocales,
}

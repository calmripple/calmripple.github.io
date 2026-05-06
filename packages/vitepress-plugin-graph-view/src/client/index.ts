import type { Plugin } from 'vue'

import type { Locale, Options } from './types'

import NolebaseGraphView from './components/NolebaseGraphView.vue'

import { InjectionKey } from './constants'

export {
  InjectionKey,
  NolebaseGraphView,
}

export type {
  Locale,
  Options,
}

const components = {
  NolebaseGraphView,
}

export const NolebaseGraphViewPlugin: Plugin<Options[], Options[]> = {
  install(app, options?) {
    if (typeof options !== 'undefined' && typeof options === 'object')
      app.provide(InjectionKey, options)

    for (const key of Object.keys(components))
      app.component(key, components[key as keyof typeof components])
  },
}

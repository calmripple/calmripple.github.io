import type { GraphViewData } from '../vitepress'

export interface Locale extends Record<string, any> {
  graphView?: {
    title?: string
    searchPlaceholder?: string
    empty?: string
    nodes?: string
    edges?: string
    openPage?: string
    relatedPages?: string
  }
}

export interface Options {
  height?: number | string
  maxLabelLength?: number
  maxNodes?: number
  showToolbar?: boolean
  locales?: Record<string, Locale>
}

export type {
  GraphViewData,
}

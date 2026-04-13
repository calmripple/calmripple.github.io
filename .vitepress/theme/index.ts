import type { Theme } from 'vitepress'

import { presetClient } from '@nolebase/integrations/vitepress/client'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import DocFooter from '@/theme/components/DocFooter.vue'
import Share from '@/theme/components/Share.vue'
import SidebarArticleList from '@knewbeing/vitepress-plugin-autosidebar-toc/client/SidebarArticleList.vue'
import '@knewbeing/vitepress-plugin-autosidebar-toc/client/style.css'
import IndexAutoToc from '@/theme/components/IndexAutoToc.vue'
import IndexTagsAside from '@/theme/components/IndexTagsAside.vue'
import 'virtual:uno.css'
import '@/styles/main.css'
import '@/styles/vars.css'

const nolebase = presetClient<{
  tags: string[]
  progress: number
}>({
  thumbnailHash: false,
  enhancedReadabilities: {
    options: {
      layoutSwitch: {
        defaultMode: 4,
      },
      spotlight: {
        defaultToggle: true,
        hoverBlockColor: 'rgb(240 197 52 / 7%)',
      },
    },
  },
})

const ExtendedTheme: Theme = {
  extends: DefaultTheme,
  Layout: () => {
    const slots = nolebase!.enhanceLayout?.() ?? {}

    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'doc-top': () => [
        ...slots['doc-top'].map(slot => slot()),
      ],
      'aside-outline-before': () => [
        h(IndexTagsAside),
      ],
      'doc-before': () => [
        h(IndexAutoToc),
      ],
      'doc-footer-before': () => [
        h(DocFooter),
      ],
      'sidebar-nav-after': () => [
        h(SidebarArticleList),
      ],
      'nav-bar-content-after': () => [
        h(Share),
        ...slots['nav-bar-content-after'].map(slot => slot()),
      ],

      'nav-screen-content-after': () => [
        ...slots['nav-screen-content-after'].map(slot => slot()),
      ],
    })
  },
  async enhanceApp(ctx) {
    await nolebase?.enhanceApp?.(ctx)
  },
}

export default ExtendedTheme

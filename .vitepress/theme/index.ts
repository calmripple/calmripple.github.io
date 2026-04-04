import type { Theme } from 'vitepress'

import { presetClient } from '@nolebase/integrations/vitepress/client'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import { createTocSidebarClientPlugin } from '@/plugins/vitepress-plugin-toc-sidebar/client'
import DocFooter from '@/theme/components/DocFooter.vue'
import Share from '@/theme/components/Share.vue'
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

const tocSidebarClientPlugin = createTocSidebarClientPlugin()

const ExtendedTheme: Theme = {
  extends: DefaultTheme,
  Layout: () => {
    const slots = nolebase!.enhanceLayout?.() ?? {}

    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'doc-top': () => [
        ...slots['doc-top'].map(slot => slot()),
      ],
      'doc-footer-before': () => [
        h(DocFooter),
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
    tocSidebarClientPlugin.enhanceApp(ctx.app)
  },
}

export default ExtendedTheme

<script setup lang="ts">
import { useData } from 'vitepress'
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ code: string }>()

const { isDark } = useData()
const container = ref<HTMLElement | null>(null)

// Unique id per component instance to avoid Mermaid duplicate-id errors.
const uid = `mermaid-${Math.random().toString(36).slice(2)}`

function decodeBase64Utf8(encoded: string): string {
  const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

async function renderDiagram() {
  if (!container.value)
    return

  const { default: mermaid } = await import('mermaid')

  mermaid.initialize({
    startOnLoad: false,
    theme: isDark.value ? 'dark' : 'default',
  })

  // Remove stale SVG left by a previous render so Mermaid re-assigns the id.
  const stale = document.getElementById(uid)
  stale?.remove()

  const source = decodeBase64Utf8(props.code)
  const { svg } = await mermaid.render(uid, source)
  if (container.value)
    container.value.innerHTML = svg
}

onMounted(renderDiagram)

// Re-render when switching between light/dark mode.
watch(isDark, renderDiagram)
</script>

<template>
  <div ref="container" class="mermaid-diagram" />
</template>

<style scoped>
.mermaid-diagram {
  overflow-x: auto;
  text-align: center;
}
</style>

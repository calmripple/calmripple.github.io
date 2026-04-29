// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { computed, ref } from 'vue'

// Module-level singleton: shared between AutoToc and IndexTagsAside on the same page
const selectedTags = ref<Set<string>>(new Set())

function toggleTag(tag: string) {
  const next = new Set(selectedTags.value)
  if (next.has(tag)) next.delete(tag)
  else next.add(tag)
  selectedTags.value = next
}

function clearTags() {
  selectedTags.value = new Set()
}

function setTags(tags: Iterable<string>) {
  selectedTags.value = new Set(tags)
}

// Backward-compatible single tag view for legacy call sites/types.
const selectedTag = computed<string | null>({
  get() {
    return selectedTags.value.values().next().value ?? null
  },
  set(tag) {
    if (!tag) {
      clearTags()
      return
    }
    selectedTags.value = new Set([tag])
  },
})

export function useIndexTagsStore() {
  return { selectedTag, selectedTags, toggleTag, clearTags, setTags }
}

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vitepress";
import { useTocEntries } from "@knewbeing/vitepress-plugin-autosidebar-toc/client/useTocEntries";
import { useIndexTagsStore } from "@knewbeing/vitepress-plugin-autosidebar-toc/client/useIndexTagsStore";
import TagsCloud from "@knewbeing/vitepress-plugin-autosidebar-toc/client/TagsCloud.vue";

const route = useRoute();

const isIndexPage = computed(() => {
  const path = route.path;
  return (
    path === "/" ||
    path.endsWith("/") ||
    path.endsWith("/index") ||
    path.endsWith("/index.html") ||
    path.endsWith("/index.md")
  );
});

// 给 body 打标记，供全局 CSS 隐藏大纲
watch(
  isIndexPage,
  (val) => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("is-index-page", val);
  },
  { immediate: true },
);

const { fileItems: fileEntries } = useTocEntries({
  rootKeyStrategy: "currentDir",
});

const allTags = computed(() => {
  const tagMap = new Map<string, number>();
  for (const item of fileEntries.value) {
    for (const tag of item.tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }
  return [...tagMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
});

const { selectedTag } = useIndexTagsStore();

function handleTagSelect(tag: string) {
  selectedTag.value = selectedTag.value === tag ? null : tag;
}
</script>

<template>
  <div v-if="isIndexPage && allTags.length" class="index-tags-aside">
    <TagsCloud
      :tags="allTags"
      :selected="selectedTag ?? undefined"
      title="🏷️ 标签"
      @select="handleTagSelect"
    />
  </div>
</template>

<style scoped>
.index-tags-aside {
  padding-bottom: 8px;
}
</style>

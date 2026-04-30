<script setup lang="ts">
import { computed, ref, watch } from "vue";
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

const isTocPage = computed(() => {
  const path = route.path;
  return (
    path === "/toc" ||
    path === "/toc.html" ||
    path.endsWith("/toc") ||
    path.endsWith("/toc.html") ||
    path.endsWith("/toc.md")
  );
});

const shouldShowTagsAside = computed(() => isIndexPage.value || isTocPage.value);

// 给 body 打标记，供全局 CSS 在显示 tags 时隐藏大纲
watch(
  shouldShowTagsAside,
  (val) => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("is-tags-aside-page", val);
  },
  { immediate: true },
);

const { fileItems: fileEntries } = useTocEntries({
  rootKeyStrategy: "currentDir",
});

const tagsStore = useIndexTagsStore() as any;
const selectedTags = tagsStore.selectedTags;
const toggleTag = tagsStore.toggleTag as (tag: string) => void;
const syncingFromUrl = ref(false);
const RECENT_UPDATES_LIMIT = 6;

function readTagsFromUrl(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const url = new URL(window.location.href);
  const tagParam = url.searchParams.get("tag");
  if (!tagParam) return new Set();
  return new Set(tagParam.split(",").map((s) => s.trim()).filter(Boolean));
}

function writeTagsToUrl(tags: Set<string>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (tags.size > 0) {
    url.searchParams.set("tag", [...tags].join(","));
  } else {
    url.searchParams.delete("tag");
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

watch(
  () => route.path,
  () => {
    if (!shouldShowTagsAside.value) return;
    syncingFromUrl.value = true;
    if (typeof tagsStore.setTags === "function") {
      tagsStore.setTags(readTagsFromUrl());
    } else {
      selectedTags.value = readTagsFromUrl();
    }
    syncingFromUrl.value = false;
  },
  { immediate: true },
);

watch(selectedTags, (tags: Set<string>) => {
  if (!shouldShowTagsAside.value) return;
  if (syncingFromUrl.value) return;
  writeTagsToUrl(tags);
});

const filteredEntries = computed(() => {
  if (selectedTags.value.size === 0) return fileEntries.value;
  return fileEntries.value.filter((item) =>
    [...selectedTags.value].every((tag) => item.tags.includes(tag)),
  );
});

const allTags = computed(() => {
  const tagMap = new Map<string, number>();
  for (const item of filteredEntries.value) {
    for (const tag of item.tags) {
      if (!selectedTags.value.has(tag)) {
        tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
      }
    }
  }
  return [...selectedTags.value].map((name) => ({ name, count: -1 })).concat(
    [...tagMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  );
});

const recentUpdates = computed(() =>
  fileEntries.value.slice(0, RECENT_UPDATES_LIMIT),
);

function handleTagSelect(tag: string) {
  toggleTag(tag);
}
</script>

<template>
  <div v-if="shouldShowTagsAside && (recentUpdates.length || allTags.length)" class="index-tags-aside">
    <section v-if="recentUpdates.length" class="recent-updates-panel" aria-label="最近更新">
      <h3 class="recent-updates-panel__title">最近更新</h3>
      <ul class="recent-updates-panel__list">
        <li v-for="item in recentUpdates" :key="item.link" class="recent-updates-panel__item">
          <a :href="item.link" class="recent-updates-panel__link">{{ item.text }}</a>
          <time v-if="item.date" :datetime="item.date" class="recent-updates-panel__date">{{ item.date }}</time>
        </li>
      </ul>
    </section>

    <TagsCloud
      v-if="allTags.length"
      :tags="allTags"
      :selected="selectedTags"
      title="🏷️ 标签"
      @select="handleTagSelect"
    />
  </div>
</template>

<style scoped>
.index-tags-aside {
  padding-bottom: 8px;
}

.recent-updates-panel {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.recent-updates-panel__title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.recent-updates-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-updates-panel__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-updates-panel__link {
  color: var(--vp-c-text-1);
  text-decoration: none;
  font-size: 12px;
  line-height: 1.4;
}

.recent-updates-panel__link:hover {
  color: var(--vp-c-brand-1);
}

.recent-updates-panel__date {
  font-size: 11px;
  color: var(--vp-c-text-3);
}

:global(body.is-tags-aside-page .VPDocAsideOutline) {
  display: none !important;
}
</style>

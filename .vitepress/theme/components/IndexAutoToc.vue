<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vitepress";
import AutoToc from "@knewbeing/vitepress-plugin-autosidebar-toc/client/AutoToc.vue";

const route = useRoute();

const isIndexPage = computed(() => {
  const path = route.path;
  return (
    path.endsWith("/") ||
    path.endsWith("/index") ||
    path.endsWith("/index.html")
  );
});
</script>

<template>
  <AutoToc v-if="isIndexPage" />
</template>

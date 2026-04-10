<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vitepress'
import { useTocEntries } from './useTocEntries'

const PAGE_SIZE = 10

const router = useRouter()

const { fileItems: fileEntries } = useTocEntries({ rootKeyStrategy: 'currentDir' })

const currentPage = ref(1)

function getTotalPages() {
  return Math.ceil(fileEntries.value.length / PAGE_SIZE)
}

function getStartIdx() {
  return (currentPage.value - 1) * PAGE_SIZE
}

function getCurrentPageItems() {
  const start = getStartIdx()
  return fileEntries.value.slice(start, start + PAGE_SIZE)
}

watch(
  fileEntries,
  (items) => {
    const activeIndex = items.findIndex((item) => item.active)
    if (activeIndex !== -1) {
      currentPage.value = Math.floor(activeIndex / PAGE_SIZE) + 1
    } else {
      currentPage.value = 1
    }
  },
  { immediate: true },
)

function goToPage(page: number) {
  currentPage.value = page
}

function handleClick(e: MouseEvent, link: string) {
  e.preventDefault()
  router.go(link)
}
</script>

<template>
  <nav v-if="fileEntries.length" class="auto-toc" aria-label="当前目录文章">
    <div class="auto-toc__header">
      <h2 class="auto-toc__title">
        当前目录
      </h2>
    </div>
    <ul class="auto-toc__list" :style="getTotalPages() > 1 ? { minHeight: PAGE_SIZE * 26 + 'px' } : undefined">
      <li v-for="(item, idx) in getCurrentPageItems()" :key="item.link" class="auto-toc__item">
        <a
          :href="item.link"
          :class="['auto-toc__link', { 'is-active': item.active }]"
          @click="(e) => handleClick(e, item.link)"
        >
          <span class="auto-toc__index">{{ getStartIdx() + idx + 1 }}.</span>
          <span class="auto-toc__text">{{ item.text }}</span>
          <span v-if="item.date" class="auto-toc__date">{{ item.date }}</span>
        </a>
      </li>
    </ul>
    <div v-if="getTotalPages() > 1" class="auto-toc__pagination">
      <button
        v-for="page in getTotalPages()"
        :key="page"
        :class="['auto-toc__page-btn', { 'is-active': page === currentPage }]"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
    </div>
  </nav>
</template>

<style scoped>
.auto-toc {
  margin: 32px 0;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  width: 100%;
  box-sizing: border-box;
}

.auto-toc__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider-light);
}

.auto-toc__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-2);
}

.auto-toc__pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--vp-c-divider-light);
}

.auto-toc__page-btn {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s;
  line-height: 26px;
}

.auto-toc__page-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.auto-toc__page-btn.is-active {
  color: #fff;
  background-color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.auto-toc__list {
  margin: 0;
  padding-left: 8px;
  list-style-type: none;
}

.auto-toc__item {
  margin: 0;
  line-height: 1;
}

.auto-toc__link {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  color: var(--vp-c-text-1);
  font-size: 14px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.auto-toc__index {
  flex-shrink: 0;
  min-width: 1.6em;
  color: var(--vp-c-text-3);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.auto-toc__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auto-toc__date {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--vp-c-text-3);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.auto-toc__link:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  text-decoration: none;
}

.auto-toc__link.is-active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  background: color-mix(in srgb, var(--vp-c-brand-soft) 15%, transparent);
}

@media (max-width: 1024px) {
  .auto-toc {
    margin: 24px 0;
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .auto-toc {
    margin: 20px 0;
    padding: 14px;
    border-radius: 8px;
  }

  .auto-toc__title {
    margin: 0 0 12px;
    padding-bottom: 10px;
    font-size: 13px;
  }

  .auto-toc__list {
    padding-left: 16px;
  }

  .auto-toc__item {
    margin: 6px 0;
  }

  .auto-toc__link {
    padding: 5px 8px;
    font-size: 13px;
  }
}
</style>

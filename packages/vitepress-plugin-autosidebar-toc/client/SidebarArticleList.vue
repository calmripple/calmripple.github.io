<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vitepress'
import { useTocEntries } from './useTocEntries'

const PAGE_SIZE = 9

const router = useRouter()

const { fileItems } = useTocEntries({ rootKeyStrategy: 'navRoot' })

// Pagination
const currentPage = ref(1);

function getTotalPages() {
  return Math.ceil(fileItems.value.length / PAGE_SIZE);
}

function getStartIdx() {
  return (currentPage.value - 1) * PAGE_SIZE;
}

function getCurrentPageItems() {
  const start = getStartIdx();
  return fileItems.value.slice(start, start + PAGE_SIZE);
}

watch(
  fileItems,
  (items) => {
    const activeIndex = items.findIndex((item) => item.active);
    if (activeIndex !== -1) {
      currentPage.value = Math.floor(activeIndex / PAGE_SIZE) + 1;
    } else {
      currentPage.value = 1;
    }
  },
  { immediate: true },
);

function changePage() {
  currentPage.value = (currentPage.value % getTotalPages()) + 1;
}

function handleClick(e: MouseEvent, link: string) {
  e.preventDefault();
  router.go(link);
}
</script>

<template>
  <div
    v-if="fileItems.length"
    class="sidebar-articles"
    data-pagefind-ignore="all"
  >
    <!-- 头部 -->
    <div class="sidebar-articles__header">
      <span class="sidebar-articles__header-title">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
          />
        </svg>
        相关文章
      </span>
      <button
        v-if="fileItems.length > PAGE_SIZE"
        class="sidebar-articles__change-btn"
        @click="changePage"
      >
        换一组
      </button>
    </div>
    <!-- 文章列表 -->
    <ol v-if="getCurrentPageItems().length" class="sidebar-articles__list">
      <li
        v-for="(item, idx) in getCurrentPageItems()"
        :key="item.link"
        class="sidebar-articles__item"
      >
        <!-- 序号 -->
        <i class="sidebar-articles__num">{{ getStartIdx() + idx + 1 }}</i>
        <!-- 文章信息 -->
        <div class="sidebar-articles__content">
          <a
            :href="item.link"
            :class="['sidebar-articles__link', { 'is-active': item.active }]"
            @click="(e) => handleClick(e, item.link)"
          >
            <span>{{ item.text }}</span>
          </a>
          <div v-if="item.date" class="sidebar-articles__date">
            {{ item.date }}
          </div>
        </div>
      </li>
    </ol>
    <div v-else class="sidebar-articles__empty">暂无相关文章</div>
  </div>
</template>

<style scoped>
.sidebar-articles {
  padding: 0;
  margin-top: 8px;
}

/* 头部样式 */
.sidebar-articles__header {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  box-sizing: border-box;
}

.sidebar-articles__header-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-articles__change-btn {
  font-size: 11px;
  color: var(--vp-c-brand-1);
  background: none;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
  line-height: 1.4;
}

.sidebar-articles__change-btn:hover {
  color: #fff;
  background-color: var(--vp-c-brand-1);
}

/* 列表样式 */
.sidebar-articles__list {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0 10px 0 0;
  width: 100%;
}

.sidebar-articles__item {
  display: flex;
  margin: 0;
  padding: 0;
}

/* 序号样式 */
.sidebar-articles__num {
  display: block;
  font-size: 13px;
  color: var(--vp-c-text-3);
  font-weight: 600;
  font-style: normal;
  margin: 8px 6px 10px 12px;
  width: 20px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  flex-shrink: 0;
}

/* 前三名序号高亮 */
.sidebar-articles__item:nth-child(1) .sidebar-articles__num,
.sidebar-articles__item:nth-child(2) .sidebar-articles__num,
.sidebar-articles__item:nth-child(3) .sidebar-articles__num {
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

/* 文章内容区域 */
.sidebar-articles__content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
  padding: 4px 0;
}

/* 链接样式 */
.sidebar-articles__link {
  font-size: 13px;
  color: var(--vp-c-text-1);
  word-break: break-all;
  white-space: break-spaces;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.25s;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.sidebar-articles__link:hover {
  color: var(--vp-c-brand-1);
}

.sidebar-articles__link.is-active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* 日期样式 */
.sidebar-articles__date {
  font-size: 11px;
  color: var(--vp-c-text-3);
  margin-top: 2px;
  font-weight: 400;
  flex-shrink: 0;
}

/* 空状态 */
.sidebar-articles__empty {
  padding: 12px;
  font-size: 13px;
  text-align: center;
  color: var(--vp-c-text-3);
}
</style>

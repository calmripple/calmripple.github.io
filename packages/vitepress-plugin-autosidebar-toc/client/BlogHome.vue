<script setup lang="ts">
import { useRouter } from "vitepress";
import { useBlogHome } from "./useBlogHome";

const router = useRouter();
const {
  articles,
  pagedArticles,
  allTags,
  selectedTag,
  currentPage,
  totalPages,
  selectTag,
  goToPage,
} = useBlogHome();

function handleClick(e: MouseEvent, link: string) {
  e.preventDefault();
  router.go(link);
}

function getPaginationRange(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
</script>

<template>
  <div class="blog-home">
    <div class="blog-home__main">
      <!-- Article List -->
      <div class="blog-home__articles">
        <div v-if="selectedTag" class="blog-home__filter-info">
          <span
            >标签筛选：<strong>{{ selectedTag }}</strong></span
          >
          <span class="blog-home__filter-count"
            >（{{ articles.length }} 篇）</span
          >
          <button class="blog-home__filter-clear" @click="selectTag(null)">
            清除筛选
          </button>
        </div>

        <article
          v-for="item in pagedArticles"
          :key="item.link"
          class="blog-card"
        >
          <div class="blog-card__content">
            <h2 class="blog-card__title">
              <a :href="item.link" @click="(e) => handleClick(e, item.link)">
                {{ item.title }}
              </a>
            </h2>
            <div class="blog-card__meta">
              <span v-if="item.date" class="blog-card__date">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {{ item.date }}
              </span>
              <span v-if="item.tags.length" class="blog-card__tags-inline">
                <span
                  v-for="tag in item.tags"
                  :key="tag"
                  class="blog-card__tag"
                  @click="selectTag(tag)"
                >
                  #{{ tag }}
                </span>
              </span>
            </div>
            <p v-if="item.description" class="blog-card__desc">
              {{ item.description }}
            </p>
          </div>
          <div v-if="item.cover" class="blog-card__cover">
            <img :src="item.cover" :alt="item.title" loading="lazy" />
          </div>
        </article>

        <div v-if="!pagedArticles.length" class="blog-home__empty">
          暂无文章
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="blog-home__pagination">
          <button
            class="pagination__btn"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            ‹
          </button>
          <template
            v-for="p in getPaginationRange(currentPage, totalPages)"
            :key="p"
          >
            <span v-if="p === '...'" class="pagination__ellipsis">…</span>
            <button
              v-else
              :class="['pagination__btn', { 'is-active': p === currentPage }]"
              @click="goToPage(p as number)"
            >
              {{ p }}
            </button>
          </template>
          <button
            class="pagination__btn"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            ›
          </button>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <aside class="blog-home__sidebar">
      <!-- Stats -->
      <div class="sidebar-card">
        <div class="sidebar-card__stats">
          <div class="stat-item">
            <span class="stat-item__number">{{ articles.length }}</span>
            <span class="stat-item__label">文章</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__number">{{ allTags.length }}</span>
            <span class="stat-item__label">标签</span>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="allTags.length" class="sidebar-card">
        <h3 class="sidebar-card__title">🏷️ 标签</h3>
        <div class="sidebar-tags">
          <button
            v-for="tag in allTags"
            :key="tag.name"
            :class="['sidebar-tag', { 'is-active': selectedTag === tag.name }]"
            @click="selectTag(tag.name)"
          >
            {{ tag.name }}
            <span class="sidebar-tag__count">{{ tag.count }}</span>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.blog-home {
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.blog-home__main {
  flex: 1;
  min-width: 0;
}

.blog-home__sidebar {
  flex-shrink: 0;
  width: 300px;
}

.blog-home__filter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.blog-home__filter-count {
  color: var(--vp-c-text-3);
}

.blog-home__filter-clear {
  margin-left: auto;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--vp-c-brand-1);
  background: none;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.blog-home__filter-clear:hover {
  color: #fff;
  background: var(--vp-c-brand-1);
}

/* Article Card */
.blog-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  margin-bottom: 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.blog-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.blog-card__content {
  flex: 1;
  min-width: 0;
}

.blog-card__title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.blog-card__title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s;
}

.blog-card__title a:hover {
  color: var(--vp-c-brand-1);
}

.blog-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.blog-card__date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.blog-card__tags-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.blog-card__tag {
  padding: 2px 8px;
  font-size: 12px;
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-soft) 30%, transparent);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.blog-card__tag:hover {
  background: color-mix(in srgb, var(--vp-c-brand-soft) 60%, transparent);
}

.blog-card__desc {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-card__cover {
  flex-shrink: 0;
  width: 180px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
}

.blog-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Pagination */
.blog-home__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.pagination__btn {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination__btn:hover:not(:disabled) {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__btn.is-active {
  color: #fff;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.pagination__ellipsis {
  padding: 0 4px;
  color: var(--vp-c-text-3);
}

.blog-home__empty {
  padding: 60px 0;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 15px;
}

/* Sidebar */
.sidebar-card {
  padding: 20px;
  margin-bottom: 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

.sidebar-card__title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.sidebar-card__stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item__number {
  font-size: 24px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.stat-item__label {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.sidebar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sidebar-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-tag:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.sidebar-tag.is-active {
  color: #fff;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.sidebar-tag__count {
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.06);
}

.sidebar-tag.is-active .sidebar-tag__count {
  background: rgba(255, 255, 255, 0.25);
}

/* Responsive */
@media (max-width: 960px) {
  .blog-home {
    flex-direction: column;
    padding: 16px;
  }

  .blog-home__sidebar {
    width: 100%;
    order: -1;
  }

  .blog-card__cover {
    width: 140px;
    height: 96px;
  }
}

@media (max-width: 640px) {
  .blog-card {
    flex-direction: column;
    padding: 16px;
  }

  .blog-card__cover {
    width: 100%;
    height: 160px;
    order: -1;
  }

  .blog-card__title {
    font-size: 16px;
  }
}
</style>

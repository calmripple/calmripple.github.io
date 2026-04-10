<script setup lang="ts">
import { useTocEntries } from './useTocEntries'

const { fileItems: fileEntries } = useTocEntries({ rootKeyStrategy: 'currentDir' })
</script>

<template>
  <nav v-if="fileEntries.length" class="auto-toc" aria-label="当前目录文章">
    <h2 class="auto-toc__title">
      当前目录
    </h2>
    <ul class="auto-toc__list">
      <li v-for="(item, index) in fileEntries" :key="item.link" class="auto-toc__item">
        <a :href="item.link" :class="['auto-toc__link', { 'is-active': item.active }]">
          <span class="auto-toc__index">{{ index + 1 }}.</span>
          <span class="auto-toc__text">{{ item.text }}</span>
          <span v-if="item.date" class="auto-toc__date">{{ item.date }}</span>
        </a>
      </li>
    </ul>
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

.auto-toc__title {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider-light);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-2);
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

<script setup>
import { useVoerkaI18n } from '@voerkai18n/vue'
import { ref } from 'vue'
import { i18nScope } from '../../../languages'

const { activeLanguage, languages } = useVoerkaI18n(i18nScope)
const isOpen = ref(false)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectLanguage(langName) {
  i18nScope.change(langName)
  isOpen.value = false
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  const dropdown = event.currentTarget
  if (!dropdown.contains(event.target)) {
    isOpen.value = false
  }
}
</script>

<template>
  <div class="language-selector" @click.self="handleClickOutside">
    <button class="language-button" type="button" @click="toggleDropdown">
      <span class="language-text">{{ activeLanguage }}</span>
      <span class="dropdown-arrow" :class="{ open: isOpen }">▼</span>
    </button>

    <ul v-show="isOpen" class="language-dropdown">
      <li
v-for="lang in languages" :key="lang.name" class="language-item"
          :class="{ active: activeLanguage === lang.name }" @click="selectLanguage(lang.name)"
>
        {{ lang.nativeTitle || lang.title || lang.name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.language-selector {
  position: relative;
  display: inline-block;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--vp-c-border);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.language-button:hover {
  background-color: var(--vp-c-bg-soft);
}

.language-text {
  font-weight: 500;
}

.dropdown-arrow {
  font-size: 0.7rem;
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 8rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 0.25rem 0;
  margin: 0;
  z-index: 100;
}

.language-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.language-item:hover {
  background-color: var(--vp-c-bg-soft);
}

.language-item.active {
  color: var(--vp-c-brand);
  font-weight: 500;
  background-color: var(--vp-c-bg-soft);
}
</style>

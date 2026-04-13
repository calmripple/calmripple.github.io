<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type: "原创" | "转载" | "翻译" | "引用" | "AI" | "整理";
    source?: string;
    url?: string;
    author?: string;
  }>(),
  {
    source: undefined,
    url: undefined,
    author: undefined,
  },
);

const typeConfig: Record<
  string,
  {
    icon: string;
    color: string;
    bg: string;
    border: string;
    text: (p: typeof props) => string;
  }
> = {
  原创: {
    icon: "✍️",
    color: "var(--vp-c-green-1)",
    bg: "var(--vp-c-green-soft)",
    border: "var(--vp-c-green-2)",
    text: () => "本文为原创内容，未经许可禁止转载。转载请联系作者并注明出处。",
  },
  转载: {
    icon: "🔄",
    color: "var(--vp-c-blue-1)",
    bg: "var(--vp-c-blue-soft)",
    border: "var(--vp-c-blue-2)",
    text: (p) =>
      p.source
        ? `本文转载自 ${p.source}，版权归原作者所有。`
        : "本文为转载内容，版权归原作者所有。",
  },
  翻译: {
    icon: "🌐",
    color: "var(--vp-c-purple-1)",
    bg: "var(--vp-c-purple-soft)",
    border: "var(--vp-c-purple-2)",
    text: (p) =>
      p.source
        ? `本文翻译自 ${p.source}，原文版权归原作者所有。`
        : "本文为翻译内容，原文版权归原作者所有。",
  },
  引用: {
    icon: "📎",
    color: "var(--vp-c-yellow-1)",
    bg: "var(--vp-c-yellow-soft)",
    border: "var(--vp-c-yellow-2)",
    text: (p) =>
      p.source
        ? `本文内容引用自 ${p.source}，仅供学习参考。`
        : "本文内容引用自第三方，仅供学习参考。",
  },
  AI: {
    icon: "🤖",
    color: "var(--vp-c-indigo-1)",
    bg: "var(--vp-c-indigo-soft)",
    border: "var(--vp-c-indigo-2)",
    text: () => "本文由 AI 辅助生成，内容仅供参考，请自行验证。",
  },
  整理: {
    icon: "📝",
    color: "var(--vp-c-gray-1)",
    bg: "var(--vp-c-gray-soft)",
    border: "var(--vp-c-gray-2)",
    text: (p) =>
      p.source
        ? `本文整理自 ${p.source}，如有侵权请联系删除。`
        : "本文整理自多方资料，如有侵权请联系删除。",
  },
};

const config = computed(() => typeConfig[props.type] ?? typeConfig["引用"]);
const message = computed(() => config.value.text(props));
</script>

<template>
  <div
    class="citation-block"
    :style="{
      '--cb-color': config.color,
      '--cb-bg': config.bg,
      '--cb-border': config.border,
    }"
  >
    <div class="citation-header">
      <span class="citation-icon">{{ config.icon }}</span>
      <span class="citation-type">{{ type }}</span>
    </div>
    <p class="citation-text">
      {{ message }}
      <a
        v-if="url"
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        class="citation-link"
      >
        查看原文 ↗
      </a>
    </p>
    <p v-if="author" class="citation-author">—— {{ author }}</p>
  </div>
</template>

<style scoped>
.citation-block {
  margin: 16px 0;
  padding: 12px 16px;
  border-left: 4px solid var(--cb-border);
  border-radius: 4px;
  background: var(--cb-bg);
  font-size: 14px;
  line-height: 1.6;
}

.citation-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--cb-color);
}

.citation-icon {
  font-size: 16px;
}

.citation-type {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.citation-text {
  margin: 0;
  color: var(--vp-c-text-2);
}

.citation-link {
  margin-left: 4px;
  color: var(--cb-color);
  text-decoration: none;
  font-weight: 500;
}

.citation-link:hover {
  text-decoration: underline;
}

.citation-author {
  margin: 6px 0 0;
  color: var(--vp-c-text-3);
  font-style: italic;
  font-size: 13px;
}
</style>

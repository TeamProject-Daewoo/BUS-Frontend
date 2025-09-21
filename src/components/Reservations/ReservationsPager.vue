<template>
  <div class="pager">
    <div class="pages">
      <button class="page-btn" :disabled="page===1" @click="$emit('prev')">이전</button>
      <button
        v-for="p in pages"
        :key="p"
        class="page-btn"
        :class="{ on: p===page }"
        @click="$emit('update:page', p)"
      >{{ p }}</button>
      <button class="page-btn" :disabled="page===maxPage" @click="$emit('next')">다음</button>
    </div>
    <div class="page-info">{{ page }} / {{ maxPage }}</div>
  </div>
</template>

<script setup>
defineProps({
  page: { type: Number, required: true },
  maxPage: { type: Number, required: true },
  pages: { type: Array, required: true }
})
defineEmits(['update:page', 'prev', 'next'])
</script>

<style scoped>
.pager { display:flex; align-items:center; gap:12px; justify-content:flex-end; padding:12px 4px; }
.page-btn { border:1px solid var(--border); background:#fff; color:#111827; min-width:36px; padding:6px 10px; border-radius: var(--radius-sm); }
.page-btn:hover:not(:disabled) { background:#111827; color:#fff; border-color:#111827; transform: translateY(-1px); }
.page-btn:disabled { opacity:.45; cursor:not-allowed; }
.pages { display:flex; gap:6px; flex-wrap:wrap; }
.pages .on { background:#111827; color:#fff; border-color:#111827; }
.page-info { display:flex; align-items:center; gap:6px; color:#6b7280; }
</style>

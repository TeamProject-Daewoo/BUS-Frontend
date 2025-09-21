<template>
  <div class="header">
    <h1>예약 목록</h1>
    <div class="sub">총 {{ total.toLocaleString() }}건의 예약이 있습니다.</div>
    <div class="header-actions">
      <button class="btn-outline" @click="$emit('export')" aria-label="엑셀 다운로드">엑셀 다운로드</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  total: { type: Number, required: true }
})
defineEmits(['export'])
</script>

<style scoped>
.header { display:flex; align-items:center; gap:12px; }
.header h1 { font-size:27px; font-weight:700; margin:0; }
.sub { color:var(--muted); }
.header-actions { margin-left:auto; display:flex; gap:8px; }
.btn-outline { border:1px solid var(--border); background:#fff; color:var(--primary-ink); padding: 8px 12px; border-radius: var(--radius-sm); }
.btn-outline:hover { border-color: var(--border-strong); background:#f8fafc; }
</style>

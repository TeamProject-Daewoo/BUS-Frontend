<!-- src/views/HotelsSelectView.vue -->
<template>
  <div class="page">
    <h1>호텔 선택</h1>

    <div v-if="store.loading" class="hint">불러오는 중…</div>
    <div v-else-if="!store.hotels.length" class="hint">표시할 호텔이 없습니다.</div>

    <div class="grid">
      <div class="card hotel" v-for="h in store.hotels" :key="h.contentid" @click="choose(h.contentid)">
        <div class="title">{{ h.title || '(제목 없음)' }}</div>
        <div class="addr">{{ h.addr1 || '-' }}</div>
        <div class="cid">contentid: {{ h.contentid }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'

const store = useHotelStore()
const router = useRouter()

onMounted(async () => {
  if (!store.hotels.length) {
    await store.loadHotels()
  }
})

function choose(contentid) {
  store.setSelected(contentid)
  router.push('/dashboard')
}
</script>

<style scoped>
.page { max-width: 980px; margin: 0 auto; }
.hint { margin: 12px 0; color:#6b7280; }
.grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap:12px; margin-top:12px; }
.card { border:1px solid #e5e7eb; border-radius:12px; background:#fff; padding:14px; cursor:pointer; }
.card:hover { border-color:#d1d5db; background:#fafafa; }
.hotel .title { font-weight:700; font-size:16px; margin-bottom:6px; }
.addr { color:#6b7280; font-size:13px; margin-bottom:6px; }
.cid { color:#9ca3af; font-size:12px; }
</style>

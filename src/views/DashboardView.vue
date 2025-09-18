<!-- src/views/DashboardView.vue -->
<template>
  <div class="dashboard">
    <h1>대시보드</h1>

    <div v-if="!store.selectedContentId" class="hint">
      사이드바 또는 <RouterLink to="/hotels">호텔 선택</RouterLink>에서 호텔을 먼저 선택하세요.
    </div>

    <div v-else>
      <div class="toolbar">
        <div class="today">기준일: {{ todayLabel }}</div>
        <button class="btn" :disabled="loading" @click="load">새로고침</button>
      </div>

      <div class="stats-grid">
        <div class="card">
          <h3>오늘의 체크인</h3>
          <p class="stat-number" :class="{ dim: loading }">{{ loading ? '…' : n(todayCheckIns) }}</p>
        </div>
        <div class="card">
          <h3>오늘의 체크아웃</h3>
          <p class="stat-number" :class="{ dim: loading }">{{ loading ? '…' : n(todayCheckOuts) }}</p>
        </div>
        <div class="card">
          <h3>객실 점유율</h3>
          <p class="stat-number" :class="{ dim: loading }">
            {{ loading ? '…' : (roomsTotal ? Math.round(occupancyPct) + '%' : '0%') }}
          </p>
          <div class="sub" v-if="!loading">
            ({{ activeRoomCount }} / {{ roomsTotal }})
          </div>
        </div>
        <div class="card">
          <h3>총 예약 건수</h3>
          <p class="stat-number" :class="{ dim: loading }">{{ loading ? '…' : n(totalReservations) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'
import { getReservations, getRooms } from '@/api/business'

const store = useHotelStore()
const loading = ref(false)
const reservations = ref([])
const rooms = ref([])

const todayStr = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})
const todayLabel = computed(() => todayStr.value)

async function load() {
  if (!store.selectedContentId) return
  loading.value = true
  try {
    const [resResv, resRooms] = await Promise.all([
      getReservations(store.selectedContentId),
      getRooms(store.selectedContentId),
    ])
    reservations.value = Array.isArray(resResv.data) ? resResv.data : []
    rooms.value = Array.isArray(resRooms.data) ? resRooms.data : []
  } catch (e) {
    console.error('[dashboard] load failed', e)
    reservations.value = []
    rooms.value = []
  } finally {
    loading.value = false
  }
}

watch(() => store.selectedContentId, async (cid) => {
  if (!cid) { reservations.value = []; rooms.value = []; return }
  await load()
}, { immediate: true })

const n = (v) => (v ?? 0).toLocaleString()
const isCanceled = (status) =>
  (status || '').toUpperCase().includes('CANCEL') || (status || '').includes('취소')

const totalReservations = computed(() => reservations.value.length)
const todayCheckIns = computed(() =>
  reservations.value.filter(r => r.checkInDate === todayStr.value && !isCanceled(r.status)).length
)
const todayCheckOuts = computed(() =>
  reservations.value.filter(r => r.checkOutDate === todayStr.value && !isCanceled(r.status)).length
)
const activeRoomCodesToday = computed(() => {
  const set = new Set()
  for (const r of reservations.value) {
    if (isCanceled(r.status)) continue
    const inOk = r.checkInDate && r.checkInDate <= todayStr.value
    const outOk = r.checkOutDate && r.checkOutDate > todayStr.value
    if (inOk && outOk) {
      set.add(r.roomcode || `__unknown_${r.reservationId}`)
    }
  }
  return set
})
const activeRoomCount = computed(() => activeRoomCodesToday.value.size)
const roomsTotal = computed(() => rooms.value.length)
const occupancyPct = computed(() => roomsTotal.value
  ? (activeRoomCount.value / roomsTotal.value) * 100
  : 0
)
</script>

<style scoped>
.dashboard { max-width: 1080px; }
.toolbar { display:flex; align-items:center; justify-content:space-between; margin-top: 8px; }
.today { color: #6b7280; font-size: 14px; }
.btn { background:#22c55e; color:#fff; border:none; padding:8px 12px; border-radius:8px; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-top: 24px; }
.card { background: #fff; border: 1px solid var(--border-color, #e5e7eb); border-radius: 12px; padding: 16px; }
.card h3 { margin: 0; font-size: 14px; color: #6b7280; }
.stat-number { font-size: 36px; font-weight: 700; color: var(--primary-color, #16a34a); margin: 8px 0 0; }
.stat-number.dim { opacity: .5; }
.sub { margin-top: 6px; color:#6b7280; font-size: 12px; }
.hint { margin: 12px 0; color:#6b7280; }
</style>

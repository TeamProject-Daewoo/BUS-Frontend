<template>
  <div class="page">
    <!-- 상단 헤더 -->
    <ReservationsHeader
      :total="filtered.length"
      @export="exportCsv"
    />

    <!-- 툴바 -->
    <ReservationsToolbar
      :bulk="bulk"
      :start-date="startDate"
      :end-date="endDate"
      :q="q"
      :scope="scope"
      :checked-count="checked.size"
      @update:bulk="v => (bulk = v)"
      @update:startDate="v => (startDate = v)"
      @update:endDate="v => (endDate = v)"
      @update:q="v => (q = v)"
      @update:scope="onScopeSelected"
      @search="filter"
      @apply-bulk="applyBulk"
      @clear-dates="() => { startDate = ''; endDate = '' }"
    />

    <!-- 안내 -->
    <div class="hint" v-if="scope==='single' && !store.selectedContentId">
      사이드바 또는 <RouterLink to="/hotels">호텔 선택</RouterLink>에서 호텔을 먼저 선택하세요.
    </div>

    <!-- 예약 표 -->
    <div v-else class="card table-wrap">
      <ReservationsTable
        :rows="paged"
        :all-checked="allChecked"
        :checked-set="checked"
        :more-open="moreOpen"
        :isCancelling="isCancelling"
        :dt="dt"
        :format-date-time="formatDateTime"
        :resolved-room-title="resolvedRoomTitle"
        :title-tooltip="titleTooltip"
        @toggle="toggle"
        @toggle-all="toggleAll"
        @toggle-more="toggleMore"
        @delete="deleteReservation"
      />
    </div>

    <!-- 페이징 -->
    <ReservationsPager
      v-if="rows.length"
      :page="page"
      :max-page="maxPage"
      :pages="pages"
      @update:page="v => (page = v)"
      @prev="() => (page = Math.max(1, page - 1))"
      @next="() => (page = Math.min(maxPage, page + 1))"
    />

    <!-- 수정 모달 -->
    <ReservationsEditModal
      v-if="editing"
      :editing="editing"
      @save="saveEdit"
      @cancel="() => (editing = null)"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'
import { getReservations, getRooms, bulkReservations, updateReservation } from '@/api/business'
import { useUiStore } from '@/stores/commonUiStore';

import ReservationsHeader from './ReservationsHeader.vue'
import ReservationsToolbar from './ReservationsToolbar.vue'
import ReservationsTable from './ReservationsTable.vue'
import ReservationsPager from './ReservationsPager.vue'
import ReservationsEditModal from './ReservationsEditModal.vue'
import api from '@/api/axios';

const store = useHotelStore()
const uiStore = useUiStore();

// ── state
const rows = ref([])
const q = ref('')
const page = ref(1)
const size = ref(10)
let bulk = ref('')
const checked = ref(new Set())

let startDate = ref('')
let endDate = ref('')
let scope = ref('single')

// 더보기
const moreOpen = ref(null)
function toggleMore(id) { moreOpen.value = moreOpen.value === id ? null : id }

// 삭제 모달
let editing = ref(null)
const isCancelling = reactive({});
async function deleteReservation(r) {
  moreOpen.value = null
  if(confirm('정말로 취소 하시겠습니까?')) {
    isCancelling[r.reservationId] = true; 
    try {
      const response = await api.post('/api/payment/cancel', {
          reservationId: r.reservationId,
          cancelReason: '고객 요청'
      });
      await loadReservations(); 
    } catch (error) {
        console.error("예약 취소 실패:", error);
        alert('예약 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
        isCancelling[r.reservationId] = false;
    }
  }
}
async function saveEdit(form) {
  try {
    const statusMap = { active: 'DONE', pending: 'PENDING', cancel: 'CANCEL' }
    const paymentMap = { paid: 'PAID', due: 'DUE', refund: 'REFUND' }

    await updateReservation({
      reservationId: form.reservationId,
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      numAdults: form.numAdults,
      numChildren: form.numChildren,
      status: statusMap[form.statusType],
      paymentStatus: paymentMap[form.paymentType],
      paymentId: form.paymentId
    })

    uiStore.openModal('수정 완료')
    editing.value = null
    await loadReservations()
  } catch (e) {
    console.error(e)
    uiStore.openModal('수정 실패')
  }
}

// 객실명 처리
const titleById = ref({})
const titleByCode = ref({})
const norm = (v) => String(v ?? '').trim().toLowerCase()
function roomTitleFromMaps(codeOrId) {
  const idKey = String(codeOrId ?? '').trim()
  const codeKey = norm(codeOrId)
  return titleById.value[idKey] || titleByCode.value[codeKey] || ''
}
const isLikelyCode = (v) => /^[A-Za-z0-9._-]{1,24}$/.test(String(v ?? '').trim())
function resolvedRoomTitle(r) {
  if (r.roomtitle && String(r.roomtitle).trim()) return String(r.roomtitle).trim()
  const fromMap = roomTitleFromMaps(r.roomcode)
  if (fromMap) return fromMap
  if (!isLikelyCode(r.roomcode)) return String(r.roomcode || '미지정')
  return '미지정'
}
function titleTooltip(r) { return `객실: ${resolvedRoomTitle(r)}${r.roomcode ? ` / 코드: ${r.roomcode}` : ''}` }

// 데이터 로드
watch(() => [store.selectedContentId, scope.value], async () => {
  if (scope.value === 'single' && !store.selectedContentId) { rows.value = []; return }
  await loadRooms()
  await loadReservations()
}, { immediate: true })

async function loadRooms() {
  try {
    let list = []
    if (scope.value === 'all') {
      const hotels = store.hotels || []
      const allRooms = await Promise.all(
        hotels.map(h => getRooms(h.contentid).then(res => res.data || []))
      )
      list = allRooms.flat()
    } else {
      if (!store.selectedContentId) { titleById.value = {}; titleByCode.value = {}; return }
      const { data } = await getRooms(store.selectedContentId)
      list = Array.isArray(data) ? data : []
    }
    titleById.value = Object.fromEntries(list.map(r => [String(r.id), String(r.roomtitle ?? '').trim()]))
    titleByCode.value = Object.fromEntries(list.map(r => [norm(r.roomcode), String(r.roomtitle ?? '').trim()]))
  } catch {
    titleById.value = {}
    titleByCode.value = {}
  }
}

async function loadReservations() {
  try {
    let data
    if (scope.value === 'all') data = (await getReservations()).data
    else data = (await getReservations(store.selectedContentId)).data
    rows.value = (data ?? []).map(toUiRow)
    checked.value.clear()
    page.value = 1
  } catch { rows.value = [] }
}

function toUiRow(x) {
  const status = (x.status || '').toUpperCase()
  let statusType = 'active'
  let statusLabel = '확정'
  if (status === 'CANCELLED') { statusType = 'cancel'; statusLabel = '취소' }
  else if (status === 'PENDING') { statusType = 'pending'; statusLabel = '대기' }
  else if (status === 'DONE' || status === 'PAID') { statusType = 'active'; statusLabel = '확정' }

  const paymentStatus = (x.paymentStatus || '').toUpperCase()
  let paymentType = 'none'
  let paymentLabel = '—'
  if (paymentStatus === 'PAID' || paymentStatus === 'DONE') { paymentType = 'paid'; paymentLabel = '결제완료' }
  else if (paymentStatus === 'DUE') { paymentType = 'due'; paymentLabel = '미결제' }
  else if (paymentStatus === 'CANCELED') { paymentType = 'refund'; paymentLabel = '환불' }

  return {
    reservationId: x.reservationId,
    paymentId: x.paymentId,
    customerName: x.reservName || x.userDisplayName || '-',
    userName: x.userName,
    userEmail: x.userEmail,
    userPhone: x.userPhone,
    reservPhone: x.reservPhone,
    checkInDate: x.checkInDate,
    checkOutDate: x.checkOutDate,
    reservationDate: x.reservationDate,
    roomcode: x.roomcode,
    roomtitle: x.roomtitle || '',
    statusType, statusLabel,
    paymentType, paymentLabel,
    numAdults: x.numAdults,
    numChildren: x.numChildren
  }
}

// 검색/필터/페이징
const filtered = computed(() => {
  let list = rows.value
  if (q.value) {
    const kw = q.value.trim().toLowerCase()
    list = list.filter(r =>
      (r.customerName || '').toLowerCase().includes(kw) ||
      (r.userName || '').toLowerCase().includes(kw) ||
      (r.userEmail || '').toLowerCase().includes(kw)
    )
  }
  if (startDate.value) list = list.filter(r => r.checkInDate && r.checkInDate >= startDate.value)
  if (endDate.value) list = list.filter(r => r.checkInDate && r.checkInDate <= endDate.value)
  return list
})
const maxPage = computed(() => Math.max(1, Math.ceil(filtered.value.length / size.value)))
const paged = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))
const pages = computed(() => Array.from({ length: maxPage.value }, (_, i) => i + 1))
function filter() { page.value = 1 }

const allChecked = computed(() => !!paged.value.length && paged.value.every(r => checked.value.has(r.reservationId)))
function toggle(id) { const s = new Set(checked.value); s.has(id) ? s.delete(id) : s.add(id); checked.value = s }
function toggleAll(e) {
  const s = new Set(checked.value)
  e.target.checked ? paged.value.forEach(r => s.add(r.reservationId)) : paged.value.forEach(r => s.delete(r.reservationId))
  checked.value = s
}

// 유틸
function dt(v) { return v ? String(v).replace('T', ' ') : '' }
function formatDateTime(v) {
  if (!v) return ''
  const d = new Date(v)
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(/\./g, '-').replace(/\s/g, '')
}

// 일괄 작업
async function applyBulk() {
  if (!bulk.value || !checked.value.size) return
  const ids = Array.from(checked.value)
  try {
    await bulkReservations(scope.value === 'single' ? store.selectedContentId : null, ids, bulk.value)
    uiStore.openModal('일괄 작업이 완료되었습니다.')
    await loadReservations()
  } catch (e) {
    console.error(e)
    uiStore.openModal('일괄 작업 실패')
  }
  checked.value.clear()
  bulk.value = ''
}

// CSV
function toCsv(rows) {
  if (!rows?.length) return ''
  const headers = Object.keys(rows[0])
  const esc = v => `"${String(v ?? '').replaceAll('"', '""')}"`
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n')
}
function download(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
function exportCsv() {
  const rowsOut = filtered.value.map(r => ({
    예약ID: r.reservationId,
    고객: r.customerName,
    이메일또는아이디: r.userEmail || r.userName,
    예약상태: r.statusLabel,
    객실: resolvedRoomTitle(r),
    연락처: r.userPhone || r.reservPhone,
    성인: r.numAdults ?? '',
    어린이: r.numChildren ?? '',
    체크인: dt(r.checkInDate),
    체크아웃: dt(r.checkOutDate),
    예약일시: formatDateTime(r.reservationDate),
    결제상태: r.paymentLabel
  }))
  download('reservations.csv', toCsv(rowsOut))
}

// scope 선택 시 즉시 로드 (기존 동작 보존)
function onScopeSelected(v) {
  scope.value = v
  loadRooms()
  loadReservations()
}
</script>

<style scoped>
/* ───────── Theme tokens & page-level wrappers (공용 변수만 여기서) ───────── */
.page { --primary:#2563eb; --primary-ink:#111827; --primary-hover:#1d4ed8; --success:#16a34a; --warning:#d97706; --danger:#dc2626; --border:#e5e7eb; --border-strong:#d1d5db; --muted:#6b7280; --bg:#ffffff; --shadow:0 6px 16px rgba(0,0,0,.06); --shadow-soft:0 2px 8px rgba(0,0,0,.05); --radius:12px; --radius-sm:8px; --ease:cubic-bezier(.2,.6,.2,1); }

/* 컨테이너/카드 껍데기 */
.card { padding:0; border:1px solid var(--border); border-radius:var(--radius); background:var(--bg); box-shadow: var(--shadow-soft); }
.table-wrap { overflow: visible; border-radius: var(--radius); }

/* 안내 */
.hint { margin: 12px 0; color:var(--muted); }
</style>

<template>
  <div>
    <h1>숙소 예약</h1>

    <div class="toolbar">
      <button class="btn" @click="exportCsv">엑셀 다운로드</button>
      <input v-model="q" placeholder="예약자 이름 검색" />
      <button class="btn-outline" @click="filter">검색</button>
    </div>

    <div class="card table-container">
      <table>
        <thead>
          <tr>
            <th>예약 ID</th>
            <th>예약 상태</th>
            <th>객실</th>
            <th>체크인 ~ 체크아웃</th>
            <th>예약자</th>
            <th>연락처</th>
            <th>판매 금액</th>
            <th>예약 일시</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in paged" :key="r.reservationId">
            <td class="id">{{ r.reservationId }}</td>
            <td><span class="badge" :class="statusClass(r.status)">{{ r.status || '-' }}</span></td>
            <td>{{ r.roomcode || '-' }}</td>
            <td>{{ r.checkIn || '-' }} ~ {{ r.checkOut || '-' }}</td>
            <td>{{ r.userDisplayName || '-' }} <span v-if="r.userName">({{ r.userName }})</span></td>
            <td>{{ r.userPhone || '-' }}</td>
            <td>{{ n(r.totalPrice) }}원</td>
            <td>{{ dt(r.reservationDate) }}</td>
          </tr>
          <tr v-if="!paged.length">
            <td colspan="8" class="empty">데이터가 없습니다</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pager">
      <button :disabled="page===1" @click="page--">〈</button>
      <span>{{ page }}</span>
      <button :disabled="page*size>=filtered.length" @click="page++">〉</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getReservations } from '@/api/business'

// (선택) utils/csv가 없으면 간단 대체
function toCsv(rows) {
  if (!rows?.length) return ''
  const headers = Object.keys(rows[0])
  const escape = v => `"${String(v ?? '').replaceAll('"','""')}"`
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))]
  return lines.join('\n')
}
function download(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const list = ref([])
const q = ref('')
const page = ref(1)
const size = ref(10)

onMounted(async () => {
  try {
    const { data } = await getReservations()
    // ✅ 백엔드 ReservationDTO 필드에 정확히 맞춤
    // ReservationDTO: reservationId, userName, userDisplayName, userEmail, userPhone,
    //                 checkIn, checkOut, roomcode, status, totalPrice, reservationDate
    list.value = (data ?? []).map(x => ({
      reservationId: x.reservationId,
      status: x.status,
      roomcode: x.roomcode,
      checkIn: x.checkIn,
      checkOut: x.checkOut,
      userDisplayName: x.userDisplayName,
      userName: x.userName,
      userEmail: x.userEmail,
      userPhone: x.userPhone,
      totalPrice: x.totalPrice,
      reservationDate: x.reservationDate
    }))
  } catch (e) {
    console.error('[reservations] load failed', e)
    list.value = []
  }
})

const filtered = computed(() =>
  !q.value ? list.value
    : list.value.filter(x =>
        (x.userDisplayName || '').includes(q.value) || (x.userName || '').includes(q.value)
      )
)

const paged = computed(() =>
  filtered.value.slice((page.value-1)*size.value, page.value*size.value)
)

function statusClass(s) {
  if (!s) return ''
  if (s.includes('PAID') || s.includes('확정')) return 'success'
  if (s.includes('PENDING') || s.includes('대기')) return 'warning'
  if (s.includes('취소') || s.includes('CANCEL')) return 'danger'
  return ''
}

function n(v){ return (v ?? 0).toLocaleString() }
function dt(v){ return v ? String(v).replace('T',' ') : '' }
function filter(){ page.value = 1 }

function exportCsv() {
  const rows = filtered.value.map(r => ({
    예약ID: r.reservationId,
    상태: r.status,
    객실: r.roomcode,
    체크인: r.checkIn,
    체크아웃: r.checkOut,
    예약자: r.userDisplayName,
    아이디: r.userName,
    연락처: r.userPhone,
    금액: r.totalPrice,
    예약일시: r.reservationDate
  }))
  download('reservations.csv', toCsv(rows))
}
</script>

<style scoped>
.toolbar { display:flex; gap:8px; align-items:center; margin:12px 0; }
.table-container { padding:0; }
table { width:100%; border-collapse:collapse; }
th, td { padding:12px; border-bottom:1px solid #eee; text-align:left; }
thead { background:#f9fafb; }
.badge { padding:4px 8px; border-radius:8px; font-size:12px; }
.badge.success{ background:#e6f7ee; color:#16a34a }
.badge.warning{ background:#fff7e6; color:#d97706 }
.badge.danger{ background:#ffe6e6; color:#dc2626 }
.id { color:#2563eb; font-weight:600; }
.empty { text-align:center; color:#999; }
.pager { display:flex; gap:8px; justify-content:center; padding:16px; }
.btn { padding:8px 12px; background:#22c55e; color:#fff; border:none; border-radius:6px; }
.btn-outline { padding:8px 12px; border:1px solid #ddd; background:#fff; border-radius:6px; }
</style>

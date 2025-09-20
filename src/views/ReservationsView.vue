<template>
  <div class="page">
    <!-- 상단 헤더 -->
    <div class="header">
      <h1>예약 목록</h1>
      <div class="sub">총 {{ filtered.length.toLocaleString() }}건의 예약이 있습니다.</div>
      <div class="header-actions">
        <button class="btn-outline" @click="exportCsv" aria-label="엑셀 다운로드">엑셀 다운로드</button>
      </div>
    </div>

    <!-- 툴바 -->
    <div class="toolbar">
      <div class="bulk">
        <select v-model="bulk" class="select" aria-label="일괄 작업 선택">
          <option value="">일괄 작업</option>
          <option value="paidreservation">예약 완료</option>
          <option value="cancel">예약 취소</option>
          <option value="paidpayment">결제 완료 처리</option>
          <option value="refund">결제 환불 처리</option>
        </select>
        <button class="btn" @click="applyBulk" :disabled="!checked.size || !bulk">적용</button>

        <div class="date-filter">
          <input type="date" v-model="startDate" aria-label="체크인 시작일" />
          <span class="tilde">~</span>
          <input type="date" v-model="endDate" aria-label="체크인 종료일" />
        </div>
      </div>

      <!-- 검색 -->
      <div class="search">
        <div class="seg">
          <button class="seg-btn" :class="{ active: scope === 'all' }" @click="scope = 'all'; loadReservations()">전체 호텔</button>
          <button class="seg-btn" :class="{ active: scope === 'single' }" @click="scope = 'single'; loadReservations()">선택 호텔</button>
        </div>
        <input v-model="q" @keyup.enter="filter" placeholder="예약자 / 아이디 검색" aria-label="예약 검색" />
        <button class="btn" @click="filter">검색</button>
      </div>
    </div>

    <!-- 안내 -->
    <div class="hint" v-if="scope==='single' && !store.selectedContentId">
      사이드바 또는 <RouterLink to="/hotels">호텔 선택</RouterLink>에서 호텔을 먼저 선택하세요.
    </div>

    <!-- 예약 표 -->
    <div v-else class="card table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th style="width:42px"><input type="checkbox" :checked="allChecked" @change="toggleAll" /></th>
            <th style="width:110px">예약 ID</th>
            <th>고객</th>
            <th style="width:120px">예약 상태</th>
            <th style="width:160px">객실</th>
            <th style="width:130px">연락처</th>
            <th style="width:100px">성인</th>
            <th style="width:100px">어린이</th>
            <th style="width:130px">체크인</th>
            <th style="width:130px">체크아웃</th>
            <th style="width:160px">예약일시</th>
            <th style="width:110px">결제 상태</th>
            <th style="width:56px"></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="r in paged" :key="r.reservationId">
            <td><input type="checkbox" :checked="checked.has(r.reservationId)" @change="toggle(r.reservationId)" /></td>
            <td class="id">{{ r.reservationId }}</td>

            <!-- 고객 -->
            <td class="customer">
              <div class="avatar" :style="{ background: avatarColor(r.customerName) }">{{ initials(r.customerName) }}</div>
              <div class="c-info">
                <div class="c-name">{{ r.customerName || '-' }}</div>
                <div class="c-sub">{{ r.userEmail || r.userName || '-' }}</div>
              </div>
            </td>

            <!-- 예약 상태 -->
            <td><span class="badge" :class="{ success: r.statusType==='active', warning: r.statusType==='pending', danger: r.statusType==='cancel' }">{{ r.statusLabel }}</span></td>

            <!-- 객실 -->
            <td :title="titleTooltip(r)"><span class="room-name">{{ resolvedRoomTitle(r) }}</span></td>

            <!-- 연락처 -->
            <td>{{ r.userPhone || r.reservPhone || '-' }}</td>
            <td>{{ r.numAdults ?? '-' }}</td>
            <td>{{ r.numChildren ?? '-' }}</td>
            <td>{{ dt(r.checkInDate) }}</td>
            <td>{{ dt(r.checkOutDate) }}</td>
            <td>{{ formatDateTime(r.reservationDate) }}</td>

            <!-- 결제 상태 -->
            <td><span class="pay" :class="{ paid: r.paymentType==='paid', due: r.paymentType==='due', refund: r.paymentType==='refund' }">{{ r.paymentLabel }}</span></td>

            <!-- 더보기 -->
            <td class="more">
              <div class="more-wrap">
                <button class="btn-more" @click="toggleMore(r.reservationId)">⋯</button>
                <transition name="fade-slide">
                  <div v-if="moreOpen === r.reservationId" class="dropdown">
                    <button class="dropdown-item" @click="editReservation(r)">수정</button>
                  </div>
                </transition>
              </div>
            </td>
          </tr>

          <tr v-if="!paged.length"><td colspan="13" class="empty">데이터가 없습니다</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ✅ 페이징 -->
    <div v-if="rows.length" class="pager">
      <div class="pages">
        <button class="page-btn" :disabled="page===1" @click="page--">이전</button>
        <button v-for="p in pages" :key="p" class="page-btn" :class="{ on: p===page }" @click="page=p">{{ p }}</button>
        <button class="page-btn" :disabled="page===maxPage" @click="page++">다음</button>
      </div>
      <div class="page-info">{{ page }} / {{ maxPage }}</div>
    </div>

    <!-- ✅ 수정 모달 -->
    <div v-if="editing" class="overlay">
      <div class="modal">
        <h2>예약 수정</h2>

        <div class="form">
          <label>체크인 <input type="date" v-model="editing.checkInDate" /></label>
          <label>체크아웃 <input type="date" v-model="editing.checkOutDate" /></label>

          <label>성인 <input type="number" min="1" v-model.number="editing.numAdults" /></label>
          <label>어린이 <input type="number" min="0" v-model.number="editing.numChildren" /></label>

          <label>예약 상태
            <select v-model="editing.statusType">
              <option value="active">확정</option>
              <option value="pending">대기</option>
              <option value="cancel">취소</option>
            </select>
          </label>

          <label>결제 상태
            <select v-model="editing.paymentType">
              <option value="paid">결제완료</option>
              <option value="due">미결제</option>
              <option value="refund">환불</option>
            </select>
          </label>
        </div>

        <div class="actions">
          <button class="btn" @click="saveEdit">저장</button>
          <button class="btn-outline" @click="editing=null">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'
import { getReservations, getRooms, bulkReservations, updateReservation } from '@/api/business'

const store = useHotelStore()
const rows = ref([])
const q = ref('')
const page = ref(1)
const size = ref(10)
const bulk = ref('')
const checked = ref(new Set())

const startDate = ref('')
const endDate = ref('')
const scope = ref("single")

// 더보기
const moreOpen = ref(null)
function toggleMore(id) { moreOpen.value = moreOpen.value === id ? null : id }

// 수정 모달
const editing = ref(null)
function editReservation(r) {
  editing.value = { ...r }
  moreOpen.value = null
}
async function saveEdit() {
  try {
    const statusMap = { active: "DONE", pending: "PENDING", cancel: "CANCEL" }
    const paymentMap = { paid: "PAID", due: "DUE", refund: "REFUND" }

    await updateReservation({
      reservationId: editing.value.reservationId,
      checkInDate: editing.value.checkInDate,
      checkOutDate: editing.value.checkOutDate,
      numAdults: editing.value.numAdults,
      numChildren: editing.value.numChildren,
      status: statusMap[editing.value.statusType],
      paymentStatus: paymentMap[editing.value.paymentType],
      paymentId: editing.value.paymentId 
    })

    alert("수정 완료")
    editing.value = null
    await loadReservations()
  } catch (e) {
    console.error(e)
    alert("수정 실패")
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
function resolvedRoomTitle(r){
  if (r.roomtitle && String(r.roomtitle).trim()) return String(r.roomtitle).trim()
  const fromMap = roomTitleFromMaps(r.roomcode)
  if (fromMap) return fromMap
  if (!isLikelyCode(r.roomcode)) return String(r.roomcode || '미지정')
  return '미지정'
}
function titleTooltip(r){ return `객실: ${resolvedRoomTitle(r)}${r.roomcode ? ` / 코드: ${r.roomcode}` : ''}` }

// 데이터 로드
watch(() => [store.selectedContentId, scope.value], async () => {
  if (scope.value === "single" && !store.selectedContentId) { rows.value = []; return }
  await loadRooms()
  await loadReservations()
}, { immediate: true })

async function loadRooms() {
  try {
    let list = []
    if (scope.value === "all") {
      // ✅ 전체 호텔 → 내 모든 호텔 객실 합치기
      const hotels = store.hotels || []
      const allRooms = await Promise.all(
        hotels.map(h => getRooms(h.contentid).then(res => res.data || []))
      )
      list = allRooms.flat()
    } else {
      // ✅ 선택 호텔
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
    if (scope.value === "all") data = (await getReservations()).data
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
  if (status === 'CANCEL') { statusType = 'cancel'; statusLabel = '취소' }
  else if (status === 'PENDING') { statusType = 'pending'; statusLabel = '대기' }
  else if (status === 'DONE') { statusType = 'active'; statusLabel = '확정' }

  const paymentStatus = (x.paymentStatus || '').toUpperCase()
  let paymentType = 'none'
  let paymentLabel = '—'
  if (paymentStatus === 'PAID') { paymentType = 'paid'; paymentLabel = '결제완료' }
  else if (paymentStatus === 'DUE') { paymentType = 'due'; paymentLabel = '미결제' }
  else if (["REFUND","REFUNDED"].includes(paymentStatus)) { paymentType = 'refund'; paymentLabel = '환불' }

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
const pages = computed(() => Array.from({length: maxPage.value}, (_,i)=>i+1))
function filter(){ page.value = 1 }

const allChecked = computed(() => !!paged.value.length && paged.value.every(r => checked.value.has(r.reservationId)))
function toggle(id){ const s = new Set(checked.value); s.has(id) ? s.delete(id) : s.add(id); checked.value = s }
function toggleAll(e){ const s = new Set(checked.value); e.target.checked ? paged.value.forEach(r => s.add(r.reservationId)) : paged.value.forEach(r => s.delete(r.reservationId)); checked.value = s }

// 유틸
function initials(name){ const v=(name||'').trim(); if(!v) return '—'; const parts=v.split(/\s+/); return (parts[0][0]||'')+(parts[1]?.[0]||'') }
function avatarColor(seed){ const s=(seed||'A').charCodeAt(0); const h=(s*37)%360; return `hsl(${h} 70% 90%)` }
function dt(v){ return v ? String(v).replace('T',' ') : '' }
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
    alert('일괄 작업이 완료되었습니다.')
    await loadReservations()
  } catch (e) {
    console.error(e)
    alert('일괄 작업 실패')
  }
  checked.value.clear()
  bulk.value = ''
}

// CSV
function toCsv(rows) {
  if (!rows?.length) return ''
  const headers = Object.keys(rows[0])
  const esc = v => `"${String(v ?? '').replaceAll('"','""')}"`
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
</script>

<style scoped>
/* ───────── Theme tokens ───────── */
.page { --primary:#2563eb; --primary-ink:#111827; --primary-hover:#1d4ed8; --success:#16a34a; --warning:#d97706; --danger:#dc2626; --border:#e5e7eb; --border-strong:#d1d5db; --muted:#6b7280; --bg:#ffffff; --shadow:0 6px 16px rgba(0,0,0,.06); --shadow-soft:0 2px 8px rgba(0,0,0,.05); --radius:12px; --radius-sm:8px; --ease:cubic-bezier(.2,.6,.2,1); }
.header { display:flex; align-items:center; gap:12px; }
.header h1 { font-size:27px; font-weight:700; margin:0; }
.sub { color:var(--muted); }
.header-actions { margin-left:auto; display:flex; gap:8px; }
.toolbar { display:flex; gap:12px; align-items:center; margin:14px 0; justify-content:space-between; flex-wrap:wrap; }
.bulk { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.date-filter { display:flex; align-items:center; gap:6px; }
.date-filter input[type="date"] { padding:6px 8px; border:1px solid var(--border); border-radius: var(--radius-sm); font-size:13px; }
.date-filter .tilde { color:#94a3b8; }
.select { padding:8px 10px; border:1px solid var(--border); border-radius:var(--radius-sm); background:#fff; transition: border-color .18s var(--ease), box-shadow .18s var(--ease); }
.select:hover { border-color: var(--border-strong); }
.select:focus { outline:none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.select.sm { padding:6px 8px; font-size:13px; }
.search { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.search input { padding:8px 10px; border:1px solid var(--border); border-radius:var(--radius-sm); }
.search input[placeholder] { width:200px; }
.search button { white-space:nowrap; }
.btn { background:#22c55e; color:#fff; border:1px solid #22c55e; padding:8px 12px; border-radius: var(--radius-sm); transition: background-color .18s var(--ease), transform .08s ease-out, box-shadow .18s var(--ease); }
.btn:hover:not(:disabled) { background:#16a34a; border-color:#16a34a; transform: translateY(-1px); box-shadow: var(--shadow); }
.btn:active:not(:disabled) { transform: translateY(0); box-shadow: var(--shadow-soft); }
.btn:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }
.btn-outline { border:1px solid var(--border); background:#fff; color:var(--primary-ink); padding: 8px 12px; border-radius: var(--radius-sm); }
.btn-outline:hover { border-color: var(--border-strong); background:#f8fafc; }
.card { padding:0; border:1px solid var(--border); border-radius:var(--radius); background:var(--bg); box-shadow: var(--shadow-soft); }
.table-wrap { overflow: visible; border-radius: var(--radius); }
.table { width:100%; border-collapse:separate; min-width:1040px; border-spacing:0; }
thead th { position:sticky; top:0; background:#f9fafb; z-index:1; box-shadow: 0 1px 0 #eef2f7; }
th, td { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-size:14px; text-align:left; }
tbody tr:nth-child(even) td { background:#fcfcfd; }
tbody tr:hover td { background:#f8fafc; }
.customer { display:flex; align-items:center; gap:10px; }
.avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; color:#374151; border:1px solid var(--border); background:#eef2ff; }
.c-info .c-name { font-weight:600; color:#111827; }
.c-info .c-sub { font-size:12px; color:var(--muted); }
.badge { padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; }
.badge.success{ background:#e6f7ee; color:#16a34a; }
.badge.warning{ background:#fff7e6; color:#d97706; }
.badge.danger{  background:#ffe6e6; color:#dc2626; }
.pay { font-weight:700; font-size:12px; }
.pay.paid { color:#16a34a; }
.pay.due  { color:#d97706; }
.id { color:var(--primary); font-weight:600; }
.more-wrap { position: relative; display: inline-block; }
.btn-more { background:none; border:1px solid transparent; font-size:18px; cursor:pointer; color:#6b7280; padding:4px 8px; border-radius:6px; }
.btn-more:hover { background:#f1f5f9; border-color:#d1d5db; }
.dropdown { position: absolute; right:0; top:32px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,.08); display:flex; flex-direction:column; min-width:120px; z-index:1000; }
.dropdown-item { padding:8px 12px; text-align:left; background:#fff; border:none; cursor:pointer; font-size:14px; }
.dropdown-item:hover { background:#f9fafb; }
.dropdown-item.danger { color:#dc2626; }
.dropdown-item.danger:hover { background:#fee2e2; }
.room-name { font-weight:600; }
.hint { margin: 12px 0; color:var(--muted); }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(-5px); }
.fade-slide-enter-to { opacity: 1; transform: translateY(0); }
.fade-slide-leave-from { opacity: 1; transform: translateY(0); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-5px); }
.seg { display: flex; gap: 6px; }
.seg-btn { background: #f1f5f9; color: #475569; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; }
.seg-btn.active { background: #111827; color: #fff; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal { background: #fff; padding: 28px; border-radius: 14px; box-shadow: 0 10px 32px rgba(0,0,0,0.25); width: 420px; animation: pop 0.25s ease; }
.modal h2 { margin: 0 0 16px; font-size: 20px; font-weight: 700; color: var(--primary-ink); }
.form { display: flex; flex-direction: column; gap: 14px; }
.form label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 600; color: #374151; }
.form input, .form select { padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; }
.form input:focus, .form select:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }
@keyframes pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.pager { display:flex; align-items:center; gap:12px; justify-content:flex-end; padding:12px 4px; }
.page-btn { border:1px solid var(--border); background:#fff; color:#111827; min-width:36px; padding:6px 10px; border-radius: var(--radius-sm); }
.page-btn:hover:not(:disabled) { background:#111827; color:#fff; border-color:#111827; transform: translateY(-1px); }
.page-btn:disabled { opacity:.45; cursor:not-allowed; }
.pages { display:flex; gap:6px; flex-wrap:wrap; }
.pages .on { background:#111827; color:#fff; border-color:#111827; }
.page-info { display:flex; align-items:center; gap:6px; color:#6b7280; }
</style>

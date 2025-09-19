<!-- src/views/ReservationsView.vue -->
<template>
  <div class="page">
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
          <option>결제 완료 처리</option>
          <option>예약 취소</option>
          <option>삭제</option>
        </select>
        <button class="btn" @click="applyBulk" :disabled="!checked.size || !bulk">적용</button>
      </div>
      <div class="search">
        <input v-model="q" @keyup.enter="filter" placeholder="예약자 / 아이디 검색" aria-label="예약 검색" />
        <button class="btn-outline" @click="filter">검색</button>
      </div>
    </div>

    <!-- 선택 안내 -->
    <div class="hint" v-if="!store.selectedContentId">
      사이드바 또는 <RouterLink to="/hotels">호텔 선택</RouterLink>에서 호텔을 먼저 선택하세요.
    </div>

    <!-- 표 -->
    <div v-else class="card table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th style="width:42px">
              <input type="checkbox" :checked="allChecked" @change="toggleAll" aria-label="현재 페이지 전체 선택" />
            </th>
            <th style="width:110px">예약 ID</th>
            <th>고객</th>
            <th style="width:130px">패키지</th>
            <th style="width:120px">예약 상태</th>
            <th style="width:160px">객실</th>
            <th style="width:130px">연락처</th>
            <th style="width:130px">체크인</th>
            <th style="width:130px">체크아웃</th>
            <th style="width:110px">결제 상태</th>
            <th style="width:56px"></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="r in paged" :key="r.reservationId">
            <td><input type="checkbox" :checked="checked.has(r.reservationId)" @change="toggle(r.reservationId)" :aria-label="`예약 ${r.reservationId} 선택`" /></td>
            <td class="id">{{ r.reservationId }}</td>

            <!-- 고객 -->
            <td class="customer">
              <div class="avatar" :style="{ background: avatarColor(r.customerName) }">{{ initials(r.customerName) }}</div>
              <div class="c-info">
                <div class="c-name">{{ r.customerName || '-' }}</div>
                <div class="c-sub">{{ r.userEmail || r.userName || '-' }}</div>
              </div>
            </td>

            <td>{{ r.pkg }}</td>

            <!-- 예약 상태 -->
            <td>
              <span class="badge" :class="{ success: r.statusType==='active', warning: r.statusType==='pending', danger: r.statusType==='cancel' }">
                {{ r.statusLabel }}
              </span>
            </td>

            <!-- ✅ 객실명: 서버 roomtitle 우선, 없으면 rooms 맵(id/roomcode) → 그래도 없으면 휴리스틱 -->
            <td :title="titleTooltip(r)">
              <span class="room-name">{{ resolvedRoomTitle(r) }}</span>
              <span v-if="showRoomCode(r)" class="room-code"></span>
            </td>

            <td>{{ r.userPhone || r.reservPhone || '-' }}</td>
            <td>{{ dt(r.checkInDate) }}</td>
            <td>{{ dt(r.checkOutDate) }}</td>

            <!-- 결제 상태 -->
            <td>
              <span class="pay" :class="{ paid: r.paymentType==='paid', due: r.paymentType==='due' }">
                {{ r.paymentLabel }}
              </span>
            </td>
            <td class="more" title="더보기">⋯</td>
          </tr>

          <tr v-if="!paged.length">
            <td colspan="11" class="empty">데이터가 없습니다</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이징 -->
    <div v-if="store.selectedContentId" class="pager">
      <button :disabled="page===1" @click="page--" class="page-btn">이전</button>
      <div class="pages">
        <button v-for="p in pages" :key="p" class="page-btn" :class="{ on: p===page }" @click="page=p">{{ p }}</button>
      </div>
      <button :disabled="page>=maxPage" @click="page++" class="page-btn">다음</button>
      <div class="page-info">페이지&nbsp;
        <select v-model.number="page" :disabled="!maxPage" class="select sm" aria-label="페이지 선택">
          <option v-for="p in maxPage" :key="p" :value="p">{{ p }}</option>
        </select>
        <span>/ {{ maxPage || 1 }}</span>
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

const rows = ref([])
const q = ref('')
const page = ref(1)
const size = ref(10)
const bulk = ref('')
const checked = ref(new Set())

// ── 객실 타이틀 맵(둘 다 준비: id → title, roomcode → title)
const titleById = ref({})
const titleByCode = ref({})

const norm = (v) => String(v ?? '').trim().toLowerCase()

function roomTitleFromMaps(codeOrId) {
  const idKey = String(codeOrId ?? '').trim()
  const codeKey = norm(codeOrId)
  return titleById.value[idKey] || titleByCode.value[codeKey] || ''
}

// 코드처럼 보이는지(영숫자/._- 만, 1~24자)
const isLikelyCode = (v) => /^[A-Za-z0-9._-]{1,24}$/.test(String(v ?? '').trim())

function resolvedRoomTitle(r){
  if (r.roomtitle && String(r.roomtitle).trim()) return String(r.roomtitle).trim()
  const fromMap = roomTitleFromMaps(r.roomcode)
  if (fromMap) return fromMap
  // roomcode가 한글/공백 등 → 사실상 제목으로 들어온 것으로 간주
  if (!isLikelyCode(r.roomcode)) return String(r.roomcode || '미지정')
  return '미지정'
}
function showRoomCode(r){
  return isLikelyCode(r.roomcode) && resolvedRoomTitle(r) !== String(r.roomcode)
}
function titleTooltip(r){
  const name = resolvedRoomTitle(r)
  const code = r.roomcode ? ` / 코드: ${r.roomcode}` : ''
  return `객실: ${name}${code}`
}

// ── 데이터 로드
watch(() => store.selectedContentId, async (cid) => {
  if (!cid) { rows.value = []; return }
  await loadRooms()
  await loadReservations()
}, { immediate: true })

async function loadRooms() {
  try {
    const { data } = await getRooms(store.selectedContentId)
    const list = Array.isArray(data) ? data : []
    titleById.value = Object.fromEntries(list.map(r => [String(r.id), String(r.roomtitle ?? '').trim()]))
    titleByCode.value = Object.fromEntries(list.map(r => [norm(r.roomcode), String(r.roomtitle ?? '').trim()]))
  } catch (e) {
    console.error('[rooms] load failed', e)
    titleById.value = {}
    titleByCode.value = {}
  }
}

async function loadReservations() {
  try {
    const { data } = await getReservations(store.selectedContentId)
    rows.value = (data ?? []).map(toUiRow)
    checked.value.clear()
    page.value = 1
  } catch (e) {
    console.error('[reservations] load failed', e)
    rows.value = []
  }
}

function toUiRow(x) {
  const status = (x.status || '').toUpperCase()
  const statusType =
    status.includes('CANCEL') || status.includes('취소') ? 'cancel'
    : status.includes('PENDING') || status.includes('대기') ? 'pending'
    : 'active'
  const statusLabel = statusType === 'active' ? '확정' : statusType === 'pending' ? '대기' : '취소'

  const isPaid = /PAID|결제완료|확정/.test(status)
  const paymentType = isPaid ? 'paid' : (statusType==='pending' ? 'due' : 'paid')
  const paymentLabel = paymentType === 'paid' ? '결제완료' : '미결제'

  return {
    reservationId: x.reservationId,
    customerName: x.reservName || x.userDisplayName || '-',
    userName: x.userName,
    userEmail: x.userEmail,
    userPhone: x.userPhone,
    reservPhone: x.reservPhone,
    checkInDate: x.checkInDate,
    checkOutDate: x.checkOutDate,
    roomcode: x.roomcode,        // rooms.id 또는 rooms.roomcode(문자열)
    roomtitle: x.roomtitle || '', // 서버 제공 시 우선
    pkg: guessPackage(x.totalPrice),
    statusType, statusLabel,
    paymentType, paymentLabel
  }
}

function guessPackage(amount) {
  if (amount == null) return '—'
  if (amount >= 300000) return '허니문'
  if (amount >= 200000) return '휴가'
  if (amount >= 150000) return '스위트'
  return '기본'
}

// ── 검색 / 페이징
const filtered = computed(() => {
  if (!q.value) return rows.value
  const kw = q.value.trim().toLowerCase()
  return rows.value.filter(r =>
    (r.customerName || '').toLowerCase().includes(kw) ||
    (r.userName || '').toLowerCase().includes(kw) ||
    (r.userEmail || '').toLowerCase().includes(kw)
  )
})
const maxPage = computed(() => Math.max(1, Math.ceil(filtered.value.length / size.value)))
const paged = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))
const pages = computed(() => Array.from({length: maxPage.value}, (_,i)=>i+1))
function filter(){ page.value = 1 }

// ── 선택
const allChecked = computed(() => !!paged.value.length && paged.value.every(r => checked.value.has(r.reservationId)))
function toggle(id){ const s = new Set(checked.value); s.has(id) ? s.delete(id) : s.add(id); checked.value = s }
function toggleAll(e){ const s = new Set(checked.value); e.target.checked ? paged.value.forEach(r => s.add(r.reservationId)) : paged.value.forEach(r => s.delete(r.reservationId)); checked.value = s }
function applyBulk(){ checked.value.clear(); bulk.value = '' }

// ── 유틸
function initials(name){ const v=(name||'').trim(); if(!v) return '—'; const parts=v.split(/\s+/); return (parts[0][0]||'')+(parts[1]?.[0]||'') }
function avatarColor(seed){ const s=(seed||'A').charCodeAt(0); const h=(s*37)%360; return `hsl(${h} 70% 90%)` }
function dt(v){ return v ? String(v).replace('T',' ') : '' }

// CSV도 객실명 우선
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
    패키지: r.pkg,
    예약상태: r.statusLabel,
    객실: resolvedRoomTitle(r),
    연락처: r.userPhone || r.reservPhone,
    체크인: dt(r.checkInDate),
    체크아웃: dt(r.checkOutDate),
    결제상태: r.paymentLabel
  }))
  download('reservations.csv', toCsv(rowsOut))
}
</script>

<style scoped>
/* ───────── Theme tokens ───────── */
.page {
  --primary: #2563eb;
  --primary-ink: #111827;
  --primary-hover: #1d4ed8;
  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
  --border: #e5e7eb;
  --border-strong: #d1d5db;
  --muted: #6b7280;
  --bg: #ffffff;
  --shadow: 0 6px 16px rgba(0,0,0,.06);
  --shadow-soft: 0 2px 8px rgba(0,0,0,.05);
  --radius: 12px;
  --radius-sm: 8px;
  --ease: cubic-bezier(.2,.6,.2,1);
}

/* ───────── Layout ───────── */
.header { display:flex; align-items:center; gap:12px; }
.header h1 { font-size:27px; font-weight:700; margin:0; letter-spacing:.2px; }
.sub { color:var(--muted); }
.header-actions { margin-left:auto; display:flex; gap:8px; }

/* ───────── Controls ───────── */
.toolbar { display:flex; gap:12px; align-items:center; margin:14px 0; justify-content:space-between; flex-wrap:wrap; }
.bulk { display:flex; gap:8px; align-items:center; }
.select {
  padding:8px 10px; border:1px solid var(--border); border-radius:var(--radius-sm); background:#fff;
  transition: border-color .18s var(--ease), box-shadow .18s var(--ease);
}
.select:hover { border-color: var(--border-strong); }
.select:focus { outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,.15); border-color: var(--primary); }
.select.sm { padding:6px 8px; font-size:13px; }

.search { display:flex; gap:8px; }
.search input {
  width:280px; padding:10px 12px; border:1px solid var(--border); border-radius:var(--radius-sm);
  transition: border-color .18s var(--ease), box-shadow .18s var(--ease), background-color .18s var(--ease);
  background:#fff;
}
.search input:hover { border-color: var(--border-strong); background:#fcfcfd; }
.search input:focus { outline:none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.15); }

/* Buttons */
.btn, .btn-outline, .page-btn {
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  transition: background-color .18s var(--ease), border-color .18s var(--ease), color .18s var(--ease), transform .08s ease-out, box-shadow .18s var(--ease);
  will-change: transform;
}
.btn {
  background:#22c55e; color:#fff; border:1px solid #22c55e;
  box-shadow: var(--shadow-soft);
}
.btn:hover:not(:disabled) { background:#16a34a; border-color:#16a34a; transform: translateY(-1px); box-shadow: var(--shadow); }
.btn:active:not(:disabled) { transform: translateY(0); box-shadow: var(--shadow-soft); }
.btn:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }

.btn-outline {
  border:1px solid var(--border); background:#fff; color:var(--primary-ink);
}
.btn-outline:hover { border-color: var(--border-strong); background:#f8fafc; transform: translateY(-1px); box-shadow: var(--shadow-soft); }
.btn-outline:active { transform: translateY(0); box-shadow: none; }

/* Pager */
.pager {
  display:flex; align-items:center; gap:12px; justify-content:flex-end; padding:12px 4px; 
  flex-wrap: nowrap; /* 줄바꿈 방지 */
}
.page-btn {
  border:1px solid var(--border); background:#fff; color:var(--primary-ink); min-width:36px;
}
.page-btn:hover:not(:disabled) { background:#111827; color:#fff; border-color:#111827; transform: translateY(-1px); }
.page-btn:disabled { opacity:.45; cursor:not-allowed; }
.pages { display:flex; gap:6px; flex-wrap:wrap; }
.pages .on { background:#111827; color:#fff; border-color:#111827; }
.page-info { display:flex; align-items:center; gap:6px; color:var(--muted); }

/* Table */
.card { padding:0; border:1px solid var(--border); border-radius:var(--radius); background:var(--bg); box-shadow: var(--shadow-soft); }
.table-wrap { overflow:auto; border-radius: var(--radius); }

.table { width:100%; border-collapse:separate; border-spacing:0; min-width:1040px; }
thead th { position:sticky; top:0; background:#f9fafb; z-index:1; box-shadow: 0 1px 0 #eef2f7; }
th, td { padding:12px 14px; border-bottom:1px solid #f1f5f9; text-align:left; font-size:14px; }
tbody tr:nth-child(even) td { background:#fcfcfd; }
tbody tr:hover td { background:#f8fafc; }

.customer { display:flex; align-items:center; gap:10px; }
.avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; color:#374151; border:1px solid var(--border); transition: transform .12s ease-out, box-shadow .18s var(--ease); background:#eef2ff; }
.customer:hover .avatar { transform: translateY(-1px); box-shadow: var(--shadow-soft); }
.c-info .c-name { font-weight:600; color:#111827; }
.c-info .c-sub { font-size:12px; color:var(--muted); }

.badge { padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; border:1px solid transparent; transition: transform .08s ease-out; }
.badge.success{ background:#e6f7ee; color:#16a34a; border-color:#c7f0d4; }
.badge.warning{ background:#fff7e6; color:#d97706; border-color:#fde1b3; }
.badge.danger{  background:#ffe6e6; color:#dc2626;  border-color:#ffcccc; }
.badge:hover{ transform: translateY(-1px); }

.pay { font-weight:700; font-size:12px; }
.pay.paid { color:#16a34a; }
.pay.due  { color:#d97706; }

.id { color:var(--primary); font-weight:600; }
.more { text-align:center; color:#94a3b8; cursor:pointer; border-radius:6px; transition: background-color .18s var(--ease); }
.more:hover { background:#f1f5f9; }

/* 객실 셀 보조 표시 */
.room-name { font-weight:600; }
.room-code { color:#94a3b8; }
.hint { margin: 12px 0; color:var(--muted); }
</style>

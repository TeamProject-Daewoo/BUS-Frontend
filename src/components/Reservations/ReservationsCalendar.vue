<template>
  <div class="cal">
    <!-- ===== Top Bar ===== -->
    <div class="cal-top">
      <div class="nav-wrap">
        <button type="button" class="nav ghost" @click="goPrev" aria-label="이전 달">‹</button>

        <!-- 월 타이틀: 드롭다운 or 텍스트 -->
        <div v-if="!useTextMonthTitle" class="month-switch">
          <select class="picker" :value="year" @change="onYearChange($event.target.value)" aria-label="연도 선택">
            <option v-for="y in years" :key="`y-${y}`" :value="y">{{ y }}</option>
          </select>
          <select class="picker" :value="monthNum" @change="onMonthChange($event.target.value)" aria-label="월 선택">
            <option v-for="(m, i) in monthLabels" :key="`m-${i}`" :value="i + 1">{{ m }}</option>
          </select>
        </div>
        <div v-else class="month-title">
          {{ year }}년 {{ monthLabels[monthNum - 1] }}
        </div>

        <button type="button" class="nav ghost" @click="goNext" aria-label="다음 달">›</button>
      </div>

      <div class="actions">
        <button class="btn ghost" @click="goToday">오늘</button>

        <div class="quick-group" role="group" aria-label="빠른 선택">
          <button class="chip" @click="pickToday">오늘</button>
          <!-- '이번 주' 버튼 제거 -->
          <button class="chip" @click="pickThisMonth">이번 달(전체)</button>
        </div>

        <!-- 선택한 날짜 표시/초기화 -->
        <div class="selected-wrap">
          <span class="label">선택일</span>
          <span class="date-chip" :class="{ empty: !selectedDisplay }">{{ selectedDisplay || '—' }}</span>
          <button class="btn ghost" @click="clearSelection" :disabled="!selectedDisplay">전체 보기</button>
        </div>
      </div>
    </div>

    <!-- ===== Week Header ===== -->
    <div class="grid header">
      <div
        v-for="(w, i) in weekLabels"
        :key="`w-${i}`"
        class="cell head"
        :class="{ sun: i===0, sat: i===6 }"
      >{{ w }}</div>
    </div>

    <!-- ===== Calendar Body ===== -->
    <div
      class="grid body"
      @keydown="onKeydown"
      tabindex="0"
      aria-label="달력 날짜 그리드"
    >
      <div
        v-for="d in days"
        :key="d.key"
        class="cell day"
        :class="dayClass(d)"
        @mousedown.prevent="onMouseDownDay(d, $event)"
        @mouseenter="onMouseEnterDay(d)"
        @mouseup="onMouseUpDay($event)"
        @touchstart.passive="onTouchStartDay(d, $event)"
        @touchmove.passive="onTouchMoveDay($event)"
        @touchend.passive="onTouchEndDay($event)"
        :title="d.tooltip"
        :aria-label="ariaOfDay(d)"
        :data-date="d.key"
      >
        <div class="date">
          <span class="num">{{ d.day }}</span>
          <span v-if="d.isToday" class="pill today">오늘</span>
        </div>

        <!-- 예약 칩: 1열 -->
        <transition-group name="chiplist" tag="div" class="chips" @click.stop>
          <div
  v-for="(b, idx) in visibleItems(d)"
  :key="b.id ?? `${d.key}-${b.customerName}-${b.email}-${idx}`"
  class="booking-chip"
  :class="{
    pending: b.statusType==='pending',
    cancel: b.statusType==='cancel',
    active: b.statusType==='active'
  }"
  :title="chipTitle(b)"
  role="button"
  tabindex="0"
  @click.stop="onClickBooking(b)"
  @mousedown.stop
  @mouseup.stop
  @touchstart.stop
  @touchend.stop
  @keydown.enter.stop.prevent="onClickBooking(b)"
  @keydown.space.stop.prevent="onClickBooking(b)"
>
            <!-- IN / OUT 코너 배지 -->
            <span v-if="isIn(b, d.key)" class="corner in">IN</span>
            <span v-else-if="isOut(b, d.key)" class="corner out">OUT</span>

            <span class="avatar" :style="{ background: avatarColor(b.customerName) }">
              {{ initials(b.customerName) }}
            </span>

            <!-- 본문(말줄임) + 호버시 '위'로 확장 패널 -->
            <span class="label">
              <span class="name trunc">{{ b.customerName || '-' }}</span>
              <span v-if="b.email" class="email trunc">{{ b.email }}</span>
              <span v-if="b.roomTitle" class="room trunc">{{ b.roomTitle }}</span>

              <!-- 호버 패널 -->
              <div class="hover-reveal" aria-hidden="true">
                <div class="name-line">
                  <span class="usr-ico">👤</span>
                  <span class="name-full">{{ b.customerName || '-' }}</span>
                  <span v-if="b.email" class="sep">·</span>
                  <span v-if="b.email" class="email-inline">{{ b.email }}</span>
                </div>
                <div v-if="b.roomTitle" class="line room-full">🛏️ {{ b.roomTitle }}</div>
                <div v-if="b.hotelTitle" class="line hotel-full">🏨 {{ b.hotelTitle }}</div>
              </div>
            </span>
          </div>
        </transition-group>

        <!-- 더보기 / 접기 -->
        <button
          v-show="showMore(d)"
          class="more-chip"
          type="button"
          @click.stop="toggleExpand(d.key)"
          :title="expanded.has(d.key) ? '접기' : `외 ${overflowCount(d)}건 더 보기`"
        >
          {{ expanded.has(d.key) ? '접기' : `+${overflowCount(d)}` }}
        </button>

        <!-- 단일 선택 하이라이트 -->
        <div v-if="selectedDate && d.key === selectedDate" class="selected-bg" />
      </div>
    </div>

    <!-- ===== Legend ===== -->
    <div class="legend">
      <span class="legend-item"><i class="dot total"></i>확정</span>
      <span class="legend-item"><i class="dot pending"></i>대기</span>
      <span class="legend-item"><i class="dot cancel"></i>취소</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/* ===== Props / Emits ===== */
const props = defineProps({
  reservations: { type: Array, default: () => [] },
  /** 표시 월: "YYYY-MM" */
  month: { type: String, required: true },
  /** ✅ 외부에서 객실/호텔명을 계산해 주는 함수 받기 */
  roomResolver: { type: Function, default: null },   // (row) => string
  hotelResolver:{ type: Function, default: null },   // (row) => string
  /** ✅ 사이드바 선택 호텔명 등 기본값 (단일 모드에서만 부모가 넘김) */
  hotelTitleDefault: { type: String, default: '' }
})
const emit = defineEmits(['update:month', 'select-date', 'search-name'])

/** 드롭다운 대신 큰 텍스트 타이틀을 쓰고 싶다면 true */
const useTextMonthTitle = false
/** 기본 표시 수 */
const MAX_ITEMS = 3

/* ===== Date Utils ===== */
function parseMonthParts(ym) {
  const [y, m] = ym.split('-').map(Number)
  return { y, m }
}
function pad2(n) { return String(n).padStart(2, '0') }
function toYmd(d) {
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  return `${y}-${m}-${day}`
}
function fromYmd(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1) }

/* ===== Current Month / Title ===== */
const monthLabels = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const weekLabels = ['일','월','화','수','목','금','토']

const monthDate = computed(() => {
  const { y, m } = parseMonthParts(props.month)
  return new Date(y, m - 1, 1)
})
const year = computed(() => monthDate.value.getFullYear())
const monthNum = computed(() => monthDate.value.getMonth() + 1)
const years = computed(() => {
  const cur = new Date().getFullYear()
  const arr = []
  for (let y = cur - 5; y <= cur + 5; y++) arr.push(y)
  return arr
})

function onYearChange(y) { emit('update:month', `${y}-${pad2(monthNum.value)}`) }
function onMonthChange(m) { emit('update:month', `${year.value}-${pad2(m)}`) }
function goPrev() { const prev = addMonths(monthDate.value, -1); emit('update:month', `${prev.getFullYear()}-${pad2(prev.getMonth()+1)}`) }
function goNext() { const next = addMonths(monthDate.value, 1); emit('update:month', `${next.getFullYear()}-${pad2(next.getMonth()+1)}`) }
function goToday(){ const t=new Date(); emit('update:month', `${t.getFullYear()}-${pad2(t.getMonth()+1)}`) }

/* ===== Utilities for avatar ===== */
function initials(name){
  const v=(name||'').trim()
  if(!v) return '–'
  const parts=v.split(/\s+/)
  return (parts[0][0]||'').toUpperCase()
}
function avatarColor(seed){
  const s=(seed||'A').charCodeAt(0)
  const h=(s*37)%360
  return `hsl(${h} 70% 92%)`
}

/* ===== Helpers: range equality (토글 판정에 사용) ===== */
function isRangeSelected(r){
  return !!r?.start && !!r?.end
}
function isSameRange(a, b){
  if (!a || !b) return false
  return a.start === b.start && a.end === b.end
}

/* ===== Day aggregation (with items) ===== */
const dayStats = computed(() => {
  const map = Object.create(null)
  const list = props.reservations || []
  for (const r of list) {
    if (!r?.checkInDate) continue
    const s = new Date(r.checkInDate)
    const e = new Date(r.checkOutDate || r.checkInDate)
    const start = s <= e ? s : e
    const end   = s <= e ? e : s
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = toYmd(d)
      map[key] ||= { total: 0, pending: 0, cancel: 0, items: [] }
      map[key].total++
      const st = (r.statusType || '').toLowerCase()
      if (st === 'pending') map[key].pending++
      if (st === 'cancel')  map[key].cancel++
      map[key].items.push({
        id: r.reservationId,
        customerName: r.customerName || r.userDisplayName || r.userName || '-',
        email: r.userEmail || r.userName || '',
        // ✅ 외부 리졸버 우선 사용
        roomTitle:
          (props.roomResolver && props.roomResolver(r)) ||
          r.roomtitle || r.roomTitle || r.room_name || r.room?.name || '',
        hotelTitle:
          (props.hotelResolver && props.hotelResolver(r)) ||
          r.hotelTitle || r.hotel || r.hotelName || r.contentTitle || r.hotel?.name || props.hotelTitleDefault || '',
        statusType: st || 'active',
        checkInDate: r.checkInDate ? toYmd(new Date(r.checkInDate)) : '',
        checkOutDate: r.checkOutDate ? toYmd(new Date(r.checkOutDate)) : ''
      })
    }
  }
  // 정렬: 확정>대기>취소, 이름순
  for (const key in map) {
    map[key].items.sort((a,b) => {
      const order = { active: 0, paid: 0, pending: 1, cancel: 2 }
      const oa = order[a.statusType] ?? 1
      const ob = order[b.statusType] ?? 1
      if (oa !== ob) return oa - ob
      return (a.customerName||'').localeCompare(b.customerName||'','ko')
    })
  }
  return map
})

/* ===== Grid / expand handling ===== */
const expanded = ref(new Set())

function visibleItems(d) {
  return expanded.value.has(d.key) ? d.items : d.items.slice(0, MAX_ITEMS)
}
function toggleExpand(key) {
  const s = new Set(expanded.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  expanded.value = s
}

function showMore(d){ return d.items.length > MAX_ITEMS }
function overflowCount(d){ return Math.max(0, d.items.length - MAX_ITEMS) }

/* ===== Build calendar cells ===== */
const days = computed(() => {
  const start = startOfMonth(monthDate.value)
  const startIdx = start.getDay()
  const gridStart = new Date(start)
  gridStart.setDate(start.getDate() - startIdx)

  const todayKey = toYmd(new Date())
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    const inMonth = d.getMonth() === monthDate.value.getMonth()
    const dow = d.getDay()
    const key = toYmd(d)
    const stat = dayStats.value[key] || { total: 0, pending: 0, cancel: 0, items: [] }
    const tooltip = stat.total
      ? `확정 ${stat.total - stat.pending - stat.cancel} · 대기 ${stat.pending} · 취소 ${stat.cancel}`
      : ''
    cells.push({
      key,
      day: d.getDate(),
      dow,
      inMonth,
      isToday: key === todayKey,
      ...stat,
      tooltip
    })
  }
  return cells
})

/* ===== Selection state ===== */
const selectedDate = ref('')                         // 단일
const selectedRange = ref({ start: '', end: '' })    // 구간

const selectedDisplay = computed(() => {
  const { start, end } = selectedRange.value || {}
  if (start && end) return `${start} ~ ${end}`
  return selectedDate.value || ''
})

/* ===== 선택(토글 포함) ===== */
function emitSelectDate(ymd){
  // 이미 같은 날짜가 단일 선택되어 있으면 해제
  if (selectedDate.value === ymd && !isRangeSelected(selectedRange.value)) {
    clearSelection()
    return
  }
  selectedRange.value = { start: '', end: '' }
  selectedDate.value = ymd
  emit('select-date', ymd)
}
function clearSelection() {
  selectedDate.value = ''
  selectedRange.value = { start: '', end: '' }
  emit('select-date', '')
}

/* ===== Drag range (mouse & touch) ===== */
/** 핵심 포인트:
 * - 마우스를 누른 직후엔 드래그 모드가 아님(isMouseDown만 true)
 * - 다른 셀로 'mouseenter'가 발생해야 드래그 모드로 전환(dragActive=true)
 * - 같은 셀에서 mouseup이면 '단일 선택'
 */
const isMouseDown = ref(false)
const dragActive  = ref(false)
const dragStartKey = ref('')
const dragEndKey = ref('')

function normalizedRange(a, b) {
  if (!a || !b) return { start: '', end: '' }
  return a <= b ? { start: a, end: b } : { start: b, end: a }
}

function onMouseDownDay(d, e) {
  if (!(e.currentTarget?.classList?.contains('day'))) return
  isMouseDown.value = true
  dragActive.value = false
  dragStartKey.value = d.key
  dragEndKey.value = d.key
}
function onMouseEnterDay(d) {
  // 마우스를 누른 상태로 다른 셀에 들어오면 드래그 시작
  if (isMouseDown.value) {
    dragActive.value = true
    dragEndKey.value = d.key
  }
}
function onMouseUpDay() { finishPointer() }

/** 공통 마무리(마우스/터치) — 동일 구간이면 해제(토글) */
function finishPointer() {
  if (!dragStartKey.value) return
  const startKey = dragStartKey.value
  const endKey   = dragEndKey.value

  if (!dragActive.value) {
    // 단일 선택: 같은 날짜면 emitSelectDate 내부에서 해제 처리
    emitSelectDate(startKey)
  } else {
    const next = normalizedRange(startKey, endKey)
    if (!next.start || !next.end || next.start === next.end) {
      emitSelectDate(next.start || next.end)
    } else {
      // 같은 범위를 다시 드래그하면 해제
      if (isSameRange(selectedRange.value, next)) {
        clearSelection()
      } else {
        selectedDate.value = ''
        selectedRange.value = next
        emit('select-date', next)
      }
    }
  }
  // reset
  isMouseDown.value = false
  dragActive.value = false
  dragStartKey.value = ''
  dragEndKey.value = ''
}

/* ===== Touch (모바일) ===== */
function pointToDateKeyFromEvent(evt) {
  const t = evt.touches?.[0] || evt.changedTouches?.[0]
  if (!t) return ''
  const el = document.elementFromPoint(t.clientX, t.clientY)
  const cell = el?.closest?.('.cell.day')
  return cell?.getAttribute?.('data-date') || ''
}
function onTouchStartDay(d) {
  dragActive.value = false
  dragStartKey.value = d.key
  dragEndKey.value = d.key
}
function onTouchMoveDay(evt) {
  const key = pointToDateKeyFromEvent(evt)
  if (key && key !== dragStartKey.value) {
    dragActive.value = true
    dragEndKey.value = key
  }
}
function onTouchEndDay(evt) {
  const key = pointToDateKeyFromEvent(evt)
  if (key) dragEndKey.value = key
  finishPointer()
}

/* ===== Helpers ===== */
function chipTitle(b){
  const parts = []
  if (b.customerName) parts.push(b.customerName)
  if (b.email) parts.push(b.email)
  if (b.roomTitle) parts.push(b.roomTitle)
  if (b.hotelTitle) parts.push(b.hotelTitle)
  return parts.join(' · ')
}
function onClickBooking(b){
  const name = (b?.customerName || '').trim()
  if (!name) return
  emit('search-name', name)
}
function isIn(item, dayKey){ return item.checkInDate && item.checkInDate === dayKey }
function isOut(item, dayKey){ return item.checkOutDate && item.checkOutDate === dayKey }

/* ===== Keyboard ===== */
function moveFocus(from, delta) {
  const target = from ? fromYmd(from) : new Date()
  target.setDate(target.getDate() + delta)
  const ymd = toYmd(target)
  const el = document.querySelector(`[data-date="${ymd}"]`)
  if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  return ymd
}
function onKeydown(e) {
  let base = selectedDate.value || toYmd(new Date())
  switch (e.key) {
    case 'ArrowLeft':  e.preventDefault(); base = moveFocus(base, -1);  emitSelectDate(base); break
    case 'ArrowRight': e.preventDefault(); base = moveFocus(base, +1);  emitSelectDate(base); break
    case 'ArrowUp':    e.preventDefault(); base = moveFocus(base, -7);  emitSelectDate(base); break
    case 'ArrowDown':  e.preventDefault(); base = moveFocus(base, +7);  emitSelectDate(base); break
    case 'Enter':
    case ' ':
      e.preventDefault(); emitSelectDate(base); break
    case 'Escape':
      clearSelection(); break
  }
}

/* ===== Quick picks (토글 동작) ===== */
function pickToday() {
  const t = toYmd(new Date())

  // 이미 '오늘'이 단일 선택 상태면 해제
  if (selectedDate.value === t && !isRangeSelected(selectedRange.value)) {
    clearSelection()
    return
  }

  emit('update:month', `${t.slice(0,4)}-${t.slice(5,7)}`)
  emitSelectDate(t)
}
/* ✅ 이번 달 = 해당 월의 1일 ~ 말일 전체 구간 선택 (같은 범위를 다시 누르면 해제) */
function pickThisMonth() {
  const now = new Date()
  const sDate = startOfMonth(now)                                     // 1일
  const eDate = new Date(sDate.getFullYear(), sDate.getMonth() + 1, 0)  // 말일
  const start = toYmd(sDate)
  const end   = toYmd(eDate)
  const newRange = { start, end }

  // 이미 같은 월 전체 범위가 선택되어 있으면 해제
  if (isSameRange(selectedRange.value, newRange)) {
    clearSelection()
    return
  }

  emit('update:month', `${now.getFullYear()}-${pad2(now.getMonth()+1)}`)
  selectedDate.value = ''
  selectedRange.value = newRange
  emit('select-date', newRange)
}

/* ===== Day classes ===== */
function dayClass(d) {
  const { start, end } = dragActive.value
    ? normalizedRange(dragStartKey.value, dragEndKey.value)
    : (selectedRange.value || { start: '', end: '' })

  const inRange = !!start && !!end && d.key >= start && d.key <= end
  const isStart = !!start && d.key === start
  const isEnd   = !!end && d.key === end

  return {
    out: !d.inMonth,
    today: d.isToday,
    clickable: true,
    sun: d.dow === 0,
    sat: d.dow === 6,
    selected: selectedDate.value && d.key === selectedDate.value,
    'in-range': inRange,
    'range-start': isStart,
    'range-end': isEnd
  }
}

/* ===== ARIA ===== */
function ariaOfDay(d) {
  const info = []
  if (!d.inMonth) info.push('다른 달')
  if (d.isToday) info.push('오늘')
  info.push(d.key)
  if (d.total) info.push(`확정 ${d.total - d.pending - d.cancel} · 대기 ${d.pending} · 취소 ${d.cancel}`)
  if (selectedDate.value === d.key) info.push('선택됨')
  return info.join(', ')
}

/* ===== doc mouseup(바깥에서 놓아도 마무리) ===== */
function onDocMouseUp(){ 
  if (isMouseDown.value) finishPointer()
}
onMounted(() => document.addEventListener('mouseup', onDocMouseUp))
onBeforeUnmount(() => document.removeEventListener('mouseup', onDocMouseUp))
</script>

<style scoped>
/* ===== Container ===== */
.cal {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow-soft);
  /* ✅ 패널이 캘린더 밖으로 넘쳐도 보이도록 */
  overflow: visible;
}

/* ===== Top Bar ===== */
.cal-top {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-bottom: 1px solid var(--border);
}
.nav-wrap { display:flex; align-items:center; gap:10px; }

.month-switch { display:flex; align-items:center; gap:8px; }
.picker {
  border:1px solid var(--border); background:#fff;
  padding:10px 14px; border-radius:12px;
  font-weight:800; color:#0f172a; font-size:16px;
}

.month-title { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: .2px; }

.nav {
  border:1px solid var(--border); background:#fff;
  padding:8px 12px; border-radius:12px;
  box-shadow: 0 1px 0 rgba(0,0,0,.02);
  font-size:18px; line-height:1;
}
.nav.ghost:hover { background:#f1f5f9; }

.actions { display:flex; align-items:center; gap:14px; flex-wrap:wrap; justify-content:flex-end; }
.btn { border-radius: 10px; padding: 9px 12px; font-weight:800; font-size:13px; transition:.15s var(--ease); }
.btn.ghost { border:1px solid var(--border); background:#fff; color:#111827; }
.btn.ghost:hover { background:#f8fafc; }

.quick-group { display:flex; gap:8px; }
.chip { padding:7px 12px; border-radius:999px; border:1px solid #e5e7eb; background:#fff; color:#0f172a; font-weight:800; font-size:12px; }
.chip:hover { background:#f8fafc; }

.selected-wrap { display:flex; align-items:center; gap:8px; }
.label { color:#6b7280; font-size:12px; }
.date-chip { padding: 7px 11px; border-radius: 10px; background:#f8fafc; border:1px solid #e5e7eb; font-weight:800; font-size:13px; color:#0f172a; }
.date-chip.empty { color:#9ca3af; font-weight:700; }

/* ===== Grid ===== */
.grid { display:grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
/* ✅ 어떤 래퍼에서도 가려지지 않게 */
.grid, .body { overflow: visible; }

.header { background:#f9fafb; border-bottom:1px solid var(--border); }
.cell { position:relative; padding:14px; border-right:1px solid #f3f4f6; border-bottom:1px solid #f3f4f6; min-height:112px; min-width:0; user-select: none; overflow: visible; }
.cell:nth-child(7n) { border-right:none; }
/* 셀 기본과 호버 시 레이어 순서 보정 */
.cell.day { position: relative; z-index: 0; }              /* 기본 레벨 */
.cell.day:hover,
.cell.day:focus-within { z-index: 20000; }                 /* 호버/키보드 포커스 시 최상단 */

/* (선택) 툴팁 자체도 한 단계 더 올려 두면 안전 */
.cell.day:hover .hover-reveal,
.cell.day:focus-within .hover-reveal { z-index: 20001; }
.body:focus { outline: none; box-shadow: inset 0 0 0 2px rgba(37,99,235,.18); border-radius: 0; }

/* Week header */
.head { text-align:center; font-weight:900; color:#475569; padding:12px 0; min-height:auto; font-size:12px; text-transform: uppercase; letter-spacing:.5px; }
.head.sun { color:#dc2626; }
.head.sat { color:#2563eb; }

/* Day cells */
.day { cursor:pointer; background:#fff; transition: background .12s var(--ease); }
.day:hover { background:#f8fafc; }
.day.out { color:#9ca3af; background:#fafafa; }
.day.sun .num { color:#dc2626; }
.day.sat .num { color:#2563eb; }
.date { display:flex; align-items:baseline; gap:6px; position: relative; z-index: 2; margin-bottom: 6px; }
.date .num { font-weight:900; font-size:16px; color:#0f172a; transition: color .12s; }
.today .num { color:#1d4ed8; }
.pill.today { font-size:10px; font-weight:900; color:#1d4ed8; background:#e6f2ff; padding:2px 6px; border-radius:999px; }

/* Booking chips: 1열 */
.chips { display:flex; flex-direction:column; gap: 6px; margin-top:8px; position:relative; z-index:1; }

/* 칩 */
.booking-chip {
  display:flex; align-items:center; gap:8px;
  padding:6px 8px; border-radius:10px; border:1px solid #e5e7eb; background:#fff;
  font-size:12px; line-height:1.2; box-shadow: 0 2px 6px rgba(0,0,0,.04);
  min-height: 40px; width: 100%;
  overflow: visible;             /* ✅ 패널이 칩 경계를 넘도록 */
  box-sizing: border-box;
  transition: box-shadow .15s var(--ease), transform .15s var(--ease), z-index .15s;
  position: relative; z-index: 1;
  cursor: pointer;
}
.booking-chip:hover { 
  box-shadow: 0 6px 16px rgba(0,0,0,.08); 
  transform: translateY(-1px); 
  z-index: 10000;               /* ✅ 항상 최상단 레이어로 */
}

/* 좌상단 IN/OUT 코너 배지 */
.corner{
  position:absolute; top:-6px; left:-6px;
  font-size:10px; font-weight:900;
  padding:2px 5px; border-radius:6px;
  color:#fff; border:1px solid rgba(0,0,0,.08);
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
  z-index: 10001;               /* ✅ 패널 위에 */
}
.corner.in{ background:#16a34a; }
.corner.out{ background:#2563eb; }

/* 아바타/라벨 */
.booking-chip .avatar {
  width:22px; height:22px; border-radius:999px; display:flex; align-items:center; justify-content:center;
  font-weight:900; color:#374151; border:1px solid var(--border); flex: 0 0 22px;
}
.booking-chip .label {
  display:flex; flex-direction:column; align-items:flex-start; gap:2px; color:#0f172a;
  flex: 1 1 auto; min-width: 0;
  position: relative;
}

/* 기본 말줄임 */
.trunc { display:block; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* === 호버 패널: 칩 ‘바로 위’, 텍스트 길이에 맞춰 가로 확대 === */
.cell, .chips, .booking-chip { overflow: visible; }

.hover-reveal {
  position: absolute;
  bottom: calc(100% - 4px);
  left: 0;
  display: inline-block;
  width: fit-content;
  min-width: 100%;
  max-width: 720px;
  white-space: normal;
  overflow-x: hidden;
  overflow-y: auto;
  max-height: 240px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 12px 28px rgba(0,0,0,.16);

  z-index: 9999;               /* ✅ 다른 모든 요소 위로 */
  pointer-events: auto;

  opacity: 0;
  transition: opacity .12s ease;
}

/* 첫 줄(이름 + 이메일 한 줄) */
.name-line{
  display:flex; align-items:center; gap:8px;
  flex-wrap: wrap;
  margin-bottom:6px;
}
.usr-ico { line-height:1; }
.name-full{ font-weight:800; color:#111827; }
.sep{ color:#cbd5e1; }
.email-inline{ color:#6b7280; }

/* 객실/호텔 */
.hover-reveal .line { display:block; }
.room-full { color:#64748b; }
.hotel-full { color:#0f172a; font-weight:700; }

/* ✅ 칩/패널 중 하나라도 호버 중이면 계속 보이게 */
.booking-chip:hover .hover-reveal,
.hover-reveal:hover { opacity: 1; }

/* 상태별 테두리/배경 */
.booking-chip.active { border-color:#c7d2fe; background:#f8fafc; }
.booking-chip.pending { border-color:#fde68a; background:#fffbeb; }
.booking-chip.cancel  { border-color:#fecaca; background:#fff1f2; }

/* 더보기 / 접기 버튼 */
.more-chip {
  margin-top:8px;
  align-self:stretch;
  background:#111827; color:#fff; border:1px solid #111827;
  padding:8px 10px; border-radius:999px; font-size:12px; font-weight:800;
  text-align:center;
  position: relative; z-index: 2;
}
.more-chip:hover { background:#1f2937; }

/* 리스트 애니메이션 */
.chiplist-enter-from, .chiplist-leave-to { opacity:0; transform: translateY(-4px); }
.chiplist-enter-active, .chiplist-leave-active { transition: all .16s cubic-bezier(.2,.6,.2,1); }
.chiplist-move { transition: transform .16s cubic-bezier(.2,.6,.2,1); }

/* 단일 선택 하이라이트 */
.selected { background:#eef2ff; }
.selected-bg {
  position:absolute; inset:6px; background:#e6edff; border-radius:12px;
  z-index: 0;
  pointer-events: none;
}

/* ===== Range highlight ===== */
.day.in-range { background: #e6edff; }
.day.range-start .date .num,
.day.range-end .date .num { color:#ffffff; }
.day.range-start::after,
.day.range-end::after {
  content: '';
  position: absolute;
  top: 6px; bottom: 6px;
  left: 6px; right: 6px;
  border-radius: 12px;
  background: #3b82f6;
  z-index: 0;
}
.day.in-range:not(.range-start):not(.range-end)::after {
  content: '';
  position: absolute;
  top: 6px; bottom: 6px;
  left: 6px; right: 6px;
  border-radius: 12px;
  background: #cfe0ff;
  z-index: 0;
}

/* Legend */
.legend { display:flex; gap:12px; padding:12px; font-size:13px; color:#6b7280; border-top:1px solid var(--border); background:#fff; }
.legend-item { display:flex; align-items:center; gap:6px; }
.dot { width:10px; height:10px; border-radius:999px; display:inline-block; }
.dot.total   { background:#1d4ed8; }
.dot.pending { background:#d97706; }
.dot.cancel  { background:#dc2626; }
</style>

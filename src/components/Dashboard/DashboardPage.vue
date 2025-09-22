<template>
  <div>
    <!-- 상단 바 -->
    <DashboardTopBar
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      v-model:rangeDays="rangeDays"
      v-model:scope="scope"
      :loading="loading"
      @apply="applyCustomRange"
      @clear="clearCustomRange"
      @reload="load"
    />

    <!-- KPI -->
    <KpiCards
      :loading="loading"
      :day-count="dayCount"
      :total-bookings-in-range="totalBookingsInRange"
      :this-month-bookings="thisMonthBookings"
      :this-week-bookings="thisWeekBookings"
      :active-today="activeToday"
      :rooms-total="roomsTotal"
      :rooms-available="roomsAvailable"
      :profit-total="profitTotal"
      :profit-month="profitMonth"
      :profit-week="profitWeek"
      :expenses-total="expensesTotal"
      :expenses-month="expensesMonth"
      :expenses-week="expensesWeek"
      :spark-bookings="sparkBookings"
      :spark-rooms="sparkRooms"
      :spark-profit="sparkProfit"
      :spark-expenses="sparkExpenses"
    />

    <!-- 중단 차트 -->
    <ChartsRow
      v-model:pkgRangeDays="pkgRangeDays"
      v-model:typeRangeDays="typeRangeDays"
      :day-count="dayCount"
      :loading="loading"
      :top-pkg-chart="topPkgChart"
      :revenue-chart="revenueChart"
      :room-type-chart="roomTypeChart"
    />

    <!-- 하단 -->
    <div class="grid bottom">
      <IncomeExpensesPanel
        v-model:rangeDays="rangeDays"
        :loading="loading"
        :income-expense-chart="incomeExpenseChart"
      />

      <NewCustomers :reservations="reservations" />
      <RecentActivities :reservations="reservations" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useHotelStore } from '@/stores/hotel'
import { getReservations, getRooms } from '@/api/business'

import DashboardTopBar from './DashboardTopBar.vue'
import KpiCards from './KpiCards.vue'
import ChartsRow from './ChartsRow.vue'
import IncomeExpensesPanel from './IncomeExpensesPanel.vue'
import NewCustomers from './NewCustomers.vue'
import RecentActivities from './RecentActivities.vue'

const store = useHotelStore()

const loading = ref(true)
const reservations = ref([])   // 전체/단일 모두 여기로 집계
const rooms = ref([])

const scope = ref('single')     // 'single' | 'all'
const rangeDays = ref(30)
const pkgRangeDays = ref(30)
const typeRangeDays = ref(30)

/* 날짜 범위 */
const startDate = ref('')
const endDate   = ref('')
function applyCustomRange () {
  if (!startDate.value || !endDate.value) return
  if (new Date(startDate.value) > new Date(endDate.value)) {
    const t = startDate.value; startDate.value = endDate.value; endDate.value = t
  }
}
function clearCustomRange () { startDate.value = ''; endDate.value = '' }

/* 유틸 */
const n = (v) => Number(v ?? 0).toLocaleString('ko-KR')
const dOnly = (v) => (v ? String(v).slice(0,10) : '')
const addDays = (dt, days) => { const d = new Date(dt); d.setDate(d.getDate()+days); return d }
const isCanceled = (s) => (s || '').toUpperCase().includes('CANCEL') || (s || '').includes('취소')
const moneyOf = (r) => Number(r.totalPrice ?? r.total ?? r.amount ?? r.price ?? 0)
const safeChart = (series = [], options = {}) => ({ series, options })

/* 날짜 라벨 */
const rangeDateLabels = computed(() => {
  const end = endDate.value ? new Date(endDate.value) : new Date()
  const start = startDate.value ? new Date(startDate.value) : addDays(end, -(rangeDays.value - 1))
  let s = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  let e = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  if (s > e) [s,e] = [e,s]
  const arr = []; const cur = new Date(s)
  while (cur <= e) {
    arr.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`)
    cur.setDate(cur.getDate()+1)
  }
  return arr
})
const dayCount = computed(() => rangeDateLabels.value.length)

/* 데이터 로드 */
async function load () {
  loading.value = true
  try {
    // 전체 모드
    if (scope.value === 'all') {
      // 호텔 목록이 없으면 로드
      if (!store.hotels.length) {
        await store.loadHotels()
      }
      const ids = (store.hotels || []).map(h => h.contentid).filter(Boolean)

      // 모든 호텔의 예약/객실을 병렬로 수집
      const resvAll = await Promise.all(ids.map(async (cid) => {
        try {
          const { data } = await getReservations(cid)
          return Array.isArray(data) ? data.map(x => ({ ...x, _hid: cid })) : []
        } catch { return [] }
      }))
      const roomsAll = await Promise.all(ids.map(async (cid) => {
        try {
          const { data } = await getRooms(cid)
          return Array.isArray(data) ? data.map(x => ({ ...x, _hid: cid })) : []
        } catch { return [] }
      }))

      reservations.value = resvAll.flat()
      rooms.value = roomsAll.flat()
    }
    // 단일(선택 호텔) 모드
    else {
      if (!store.selectedContentId) { reservations.value=[]; rooms.value=[]; return }
      const [resResv, resRooms] = await Promise.all([
        getReservations(store.selectedContentId),
        getRooms(store.selectedContentId)
      ])
      reservations.value = Array.isArray(resResv.data) ? resResv.data.map(x => ({ ...x, _hid: store.selectedContentId })) : []
      rooms.value        = Array.isArray(resRooms.data) ? resRooms.data.map(x => ({ ...x, _hid: store.selectedContentId })) : []
    }
  } finally {
    loading.value = false
  }
}

/* scope/선택호텔 바뀔 때마다 로드 */
watch([() => store.selectedContentId, scope], load, { immediate: true })

/* KPI (공통: reservations/rooms만 보고 계산) */
const bookingsByDay = computed(() => {
  const map = Object.fromEntries(rangeDateLabels.value.map(x => [x,0]))
  for (const r of reservations.value) {
    const d = dOnly(r.checkInDate)
    if (d in map && !isCanceled(r.status)) map[d]++
  }
  return map
})
const totalBookingsInRange = computed(() => Object.values(bookingsByDay.value).reduce((a,b)=>a+b,0))
const thisMonthBookings = computed(() => {
  const d = new Date(); const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  return reservations.value.filter(r => dOnly(r.checkInDate).startsWith(ym) && !isCanceled(r.status)).length
})
const thisWeekBookings = computed(() => {
  const now = new Date(); const monday = addDays(now, -((now.getDay()+6)%7)); const set = new Set()
  for (let i=0;i<7;i++){ const d = addDays(monday,i); set.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`) }
  return reservations.value.filter(r => set.has(dOnly(r.checkInDate)) && !isCanceled(r.status)).length
})

// 전체 객실 수
const roomsTotal = computed(() => 
  rooms.value.reduce((sum, r) => sum + (r.roomcount ?? 0), 0)
)

// 이용 중 객실
const activeToday = computed(() => {
  const t = rangeDateLabels.value[rangeDateLabels.value.length-1]
  let count = 0
  for (const r of reservations.value) {
    if (isCanceled(r.status)) continue
    const inOk = dOnly(r.checkInDate) <= t
    const outOk = dOnly(r.checkOutDate) > t
    if (inOk && outOk) {
      count += (r.roomcount ?? 1) // 예약에서 실제 몇 실이 사용됐는지
    }
  }
  return count
})

// 이용 가능 객실
const roomsAvailable = computed(() => 
  Math.max(roomsTotal.value - activeToday.value, 0)
)
/* 매출/지출/순이익 */
const revenueDailyRaw = computed(() => {
  const map = Object.fromEntries(rangeDateLabels.value.map(d => [d,0]))
  for (const r of reservations.value) {
    const d = dOnly(r.checkInDate)
    if (d in map && !isCanceled(r.status)) map[d] += moneyOf(r)
  }
  return map
})
const expensesDailyRaw = computed(() => {
  const out = {}; for (const d of Object.keys(revenueDailyRaw.value)) out[d] = Math.round(revenueDailyRaw.value[d]*0.35)
  return out
})
const profitDailyRaw = computed(() => {
  const out = {}; for (const d of rangeDateLabels.value) out[d] = (revenueDailyRaw.value[d]||0)-(expensesDailyRaw.value[d]||0)
  return out
})

const profitTotal = computed(() => Object.values(profitDailyRaw.value).reduce((a,b)=>a+b,0))
const profitMonth = computed(() => {
  const d = new Date(); const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  return Object.entries(profitDailyRaw.value).reduce((s,[k,v])=>s+(k.startsWith(ym)?v:0),0)
})
const profitWeek = computed(() => {
  const now = new Date(); const monday = addDays(now,-((now.getDay()+6)%7)); const set = new Set()
  for (let i=0;i<7;i++){ const d = addDays(monday,i); set.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`) }
  return Object.entries(profitDailyRaw.value).reduce((s,[k,v])=>s+(set.has(k)?v:0),0)
})
const expensesTotal = computed(() => Object.values(expensesDailyRaw.value).reduce((a,b)=>a+b,0))
const expensesMonth = computed(() => {
  const d = new Date(); const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  return Object.entries(expensesDailyRaw.value).reduce((s,[k,v])=>s+(k.startsWith(ym)?v:0),0)
})
const expensesWeek = computed(() => {
  const now = new Date(); const monday = addDays(now,-((now.getDay()+6)%7)); const set = new Set()
  for (let i=0;i<7;i++){ const d = addDays(monday,i); set.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`) }
  return Object.entries(expensesDailyRaw.value).reduce((s,[k,v])=>s+(set.has(k)?v:0),0)
})

/* 스파크 */
const toSpark = (map) => { const vals = Object.values(map); const max = Math.max(1, ...vals); return vals.map((v,i)=>({id:i,h:Math.round((v/max)*100)})) }
const sparkBookings = computed(() => toSpark(bookingsByDay.value))
const sparkRooms    = computed(() => toSpark(bookingsByDay.value))
const sparkExpenses = computed(() => toSpark(expensesDailyRaw.value))
const sparkProfit   = computed(() => toSpark(profitDailyRaw.value))

/* 차트 데이터 */
const topPkgData = computed(() => {
  const cutoff = addDays(new Date(), -pkgRangeDays.value); const map = {}
  for (const r of reservations.value) {
    const d = new Date(dOnly(r.checkInDate)); if (isNaN(d) || d < cutoff) continue
    if (isCanceled(r.status)) continue
    const title = (r.roomtitle || r.roomTitle || r.title || r.roomcode || '미지정').toString().trim()
    map[title] = (map[title]||0)+1
  }
  const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,6)
  return { labels: entries.map(e=>e[0]), data: entries.map(e=>e[1]) }
})
const topPkgChart = computed(() => safeChart(
  [{ data: topPkgData.value.data ?? [] }],
  { chart:{toolbar:{show:false},foreColor:'#6b7280'}, colors:['#60a5fa'],
    plotOptions:{bar:{horizontal:true,borderRadius:6,columnWidth:'60%'}},
    xaxis:{categories:topPkgData.value.labels ?? [], axisBorder:{show:false}, axisTicks:{show:false}},
    dataLabels:{enabled:false}, grid:{strokeDashArray:4, borderColor:'#edf1f7'}, tooltip:{theme:'light'} }
))
const roomTypeChart = computed(() => {
  const cutoff = addDays(new Date(), -typeRangeDays.value); const counts = {}
  for (const r of reservations.value) {
    if (isCanceled(r.status)) continue
    const d = new Date(dOnly(r.checkInDate)); if (isNaN(d) || d < cutoff) continue
    const title = (r.roomtitle || r.roomTitle || r.title || r.roomcode || '미지정').toString().trim()
    counts[title] = (counts[title]||0)+1
  }
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1])
  if (!entries.length) return safeChart([1], { labels:['데이터 없음'], legend:{position:'bottom'}, dataLabels:{enabled:true, formatter:()=> '100%'} })
  const TOP = 6; let top = entries
  if (entries.length > TOP) {
    const head = entries.slice(0,TOP); const tail = entries.slice(TOP)
    const others = tail.reduce((s,[,v])=>s+v,0); top = [...head, ['기타', others]]
  }
  const labels = top.map(([k])=>k); const series = top.map(([,v])=>v)
  return safeChart(series, { labels, legend:{position:'bottom'}, dataLabels:{enabled:true, formatter:(v)=>v.toFixed(1)+'%'}, tooltip:{ y:{ formatter:(v)=>Number(v).toLocaleString('ko-KR')+' 건' } } })
})
const revenueChart = computed(() => safeChart(
  [{ name:'매출', data: rangeDateLabels.value.map(d=>revenueDailyRaw.value[d]||0) }],
  { chart:{toolbar:{show:false}}, colors:['#6ea8fe'],
    plotOptions:{bar:{columnWidth:'40%', borderRadius:6}},
    xaxis:{ categories:rangeDateLabels.value, tickAmount:rangeDateLabels.value.length, tickPlacement:'between',
      labels:{ rotate:0, trim:false, hideOverlappingLabels:false, formatter:(val,_ts,th)=> {
        const labels = (th && typeof th==='object' && th.w?.globals?.labels) ? th.w.globals.labels : rangeDateLabels.value
        const idx = (th && typeof th==='object' && typeof th.i==='number') ? th.i : labels.indexOf(val)
        const last = Math.max(0, labels.length-1); return (idx===0 || idx===last) ? val : ''
      }, style:{colors:'#94a3b8'} },
      axisTicks:{show:false}, axisBorder:{show:false} },
    yaxis:{ labels:{ formatter:(v)=>n(Math.round(v)) } }, dataLabels:{enabled:false},
    grid:{ strokeDashArray:4, borderColor:'#edf1f7' }, tooltip:{ y:{ formatter:(v)=>n(Math.round(v))+' 원' } } }
))
const incomeExpenseChart = computed(() => safeChart(
  [
    { name:'수입', data: rangeDateLabels.value.map(d=>revenueDailyRaw.value[d]||0) },
    { name:'지출', data: rangeDateLabels.value.map(d=>expensesDailyRaw.value[d]||0) }
  ],
  { chart:{toolbar:{show:false}}, colors:['#60d0a8','#f78fb3'],
    stroke:{width:3, curve:'smooth'}, markers:{size:0},
    xaxis:{ categories:rangeDateLabels.value, tickAmount:rangeDateLabels.value.length,
      labels:{ rotate:0, trim:false, hideOverlappingLabels:false, formatter:(val,_ts,th)=> {
        const labels = (th && typeof th==='object' && th.w?.globals?.labels) ? th.w.globals.labels : rangeDateLabels.value
        const idx = (th && typeof th==='object' && typeof th.i==='number') ? th.i : labels.indexOf(val)
        const last = Math.max(0, labels.length-1); return (idx===0 || idx===last) ? val : ''
      }, style:{colors:'#94a3b8'} },
      axisTicks:{show:false}, axisBorder:{show:false} },
    yaxis:{ labels:{ formatter:(v)=>n(Math.round(v)) } }, dataLabels:{enabled:false},
    grid:{ strokeDashArray:4, borderColor:'#edf1f7' }, tooltip:{ y:{ formatter:(v)=>n(Math.round(v))+' 원' } } }
))
</script>


<style>
/* 공통 레이아웃/스타일 (자식에서도 사용될 클래스를 전역으로 둠) */
.topbar{ display:flex; align-items:center; justify-content:space-between; gap:16px; margin:6px 0 12px; flex-wrap:wrap; }
.date-filter{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.date-filter .label{ color:#475569; font-weight:700; }
.input-date{ border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; background:#fff; }
.tilde{ color:#94a3b8; }
.btn{ background:#111827; color:#fff; border:none; padding:10px 14px; border-radius:10px; font-weight:600; transition: background-color .3s ease, transform .2s ease; }
.btn:hover{ background:#4b5563; transform: translateY(-1px); }
.btn.ghost{ background:#fff; color:#374151; border:1px solid #e5e7eb; }
.btn.ghost:hover{ background:#f8fafc; }
.select{ border:1px solid #e5e7eb; border-radius:10px; padding:13px 12px; background:#fff; }
.select.sm{ padding:6px 10px; font-size:13px; }
.grid{ display:grid; gap:30px; }
.top-cards{ grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.mid{ grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top:40px; gap:70px; }
.bottom{ grid-template-columns: 2fr 1.5fr 1.5fr; margin-top:40px; gap:70px; }
@media (max-width:1200px){ .mid, .bottom{ grid-template-columns: 1fr; } }
.card, .panel{ background: linear-gradient(145deg, #ffffff, #f3f4f6); border-radius:16px; padding:18px; box-shadow:0 8px 20px rgba(17,24,39,.1); transition: box-shadow .3s ease, transform .2s ease; }
.card:hover, .panel:hover{ transform: translateY(-2px); box-shadow:0 12px 24px rgba(17,24,39,.15); }
.panel-head{ display:flex; align-items:baseline; justify-content:space-between; margin-bottom:10px; }
.muted{ color:#9aa3b2; font-size:12px; }

/* KPI 카드 전역 클래스 */
.card.kpi{ --kpi-accent:#e2e8f0; background:#fff; border:1px solid #eef2f7; padding:16px 18px; border-left:4px solid var(--kpi-accent); }
.kpi--bookings{ --kpi-accent:#cfe2ff; } .kpi--rooms{ --kpi-accent:#c9f7e2; }
.kpi--expenses{ --kpi-accent:#ffe2e7; } .kpi--profit{ --kpi-accent:#dcfce7; }
.kpi-head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.kpi-title{ font-size:13px; color:#64748b; font-weight:700; letter-spacing:.2px; }
.kpi-badge{ display:inline-flex; align-items:center; gap:6px; font-size:11px; padding:3px 8px; border-radius:999px; background:#f8fafc; color:#64748b; border:1px solid #eef2f7; line-height:1; }
.kpi-badge::before{ content:"→"; font-size:10px; transform: translateY(-.5px); }
.kpi-badge.up{ color:#16a34a; background:#e7f6ee; border-color:#d1fae5; }
.kpi-badge.up::before{ content:"▲"; }
.kpi-badge.down{ color:#dc2626; background:#ffecec; border-color:#ffe1e1; }
.kpi-badge.down::before{ content:"▼"; }
.kpi-main{ display:flex; align-items:baseline; gap:6px; margin-top:2px; }
.kpi-main .v{ font-size:clamp(28px,3.2vw,34px); font-weight:800; color:#0f172a; letter-spacing:-.02em; line-height:1; font-variant-numeric:tabular-nums; }
.kpi-main .unit{ font-size:16px; color:#94a3b8; font-weight:700; position:relative; top:-1px; }
.kpi-main.ratio .slash{ margin:0 6px; color:#cbd5e1; font-weight:700; }
.kpi-main.ratio .total{ color:#94a3b8; font-weight:800; }
.kpi-divider{ height:1px; background:#f1f5f9; margin:10px 0 8px; border-radius:1px; }
.kpi-sub{ display:flex; gap:20px; margin-top:4px; } .kpi-sub.two{ gap:36px; }
.kpi-sub .kpi-subv{ font-weight:800; color:#0f172a; font-variant-numeric:tabular-nums; }
.mini-bars{ display:flex; gap:6px; align-items:flex-end; height:42px; margin-top:12px; justify-content:flex-end; }
.mini-bars .bar{ width:9px; background:linear-gradient(180deg,#e2e8f0,#cbd5e1); border-radius:6px 6px 0 0; }
.mini-skeleton{ height:46px; border-radius:10px; background: repeating-linear-gradient(-45deg,#f3f4f6,#f3f4f6 10px,#e5e7eb 10px,#e5e7eb 20px); }

/* people/timeline (NewCustomers/RecentActivities에서 사용) */
.people{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
.people-item{ display:flex; align-items:center; gap:12px; padding:12px; border:1px solid #f1f5f9; border-radius:12px; background:linear-gradient(180deg,#ffffff 0%, #fafbfd 100%); transition: transform .15s ease, box-shadow .15s ease, border-color .2s ease; }
.people-item:hover{ transform: translateY(-2px); box-shadow:0 10px 24px rgba(2,6,23,.06); border-color:#e2e8f0; }
.avatar{ min-width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:800; color:#0f172a; background:#eef2ff; }
.avatar-grad{ background: conic-gradient(from 200deg,#dbeafe,#ede9fe,#dcfce7,#ffe4e6,#dbeafe); color:#0f172a; }
.meta{ flex:1; min-width:0; }
.title{ font-weight:700; color:#111827; display:flex; align-items:center; gap:8px; }
.sub{ color:#6b7280; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.chip{ background:#eef2ff; color:#4f46e5; font-weight:700; font-size:10px; padding:2px 6px; border-radius:999px; }
.arrow{ color:#cbd5e1; font-size:20px; line-height:1; }
.timeline{ position:relative; padding-left:14px; }
.timeline:before{ content:''; position:absolute; left:6px; top:0; bottom:0; width:2px; background: linear-gradient(#e5e7eb,#f1f5f9); }
.tl-item{ position:relative; display:flex; gap:12px; margin-bottom:14px; }
.tl-dot{ position:absolute; left:-2px; top:4px; width:10px; height:10px; border-radius:50%; background:linear-gradient(180deg,#a5b4fc,#60a5fa); border:2px solid #fff; box-shadow:0 0 0 2px #e5e7eb; }
.tl-card{ margin-left:16px; background:#fff; border:1px solid #eef1f7; border-radius:12px; padding:12px; box-shadow:0 8px 18px rgba(2,6,23,.04); width:100%; }
.tl-title{ font-weight:700; color:#0f172a; margin-bottom:4px; }
.tl-meta{ color:#64748b; font-size:12px; }
</style>

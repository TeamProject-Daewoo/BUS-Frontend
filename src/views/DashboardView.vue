<!-- src/views/DashboardView.vue -->
<template>
  <div class="dashboard">
    <h1>대시보드</h1>
    <div class="headline-divider"></div>

    <div v-if="!store.selectedContentId" class="hint">
      사이드바 또는 <RouterLink to="/hotels">호텔 선택</RouterLink>에서 호텔을 먼저 선택하세요.
    </div>

    <div v-else>
      <!-- 날짜 필터(좌) + 상단 도구막대(우) 한 줄 -->
      <div class="topbar">
        <!-- 날짜 범위 필터 -->
        <div class="date-filter">
          <label class="label">기간</label>
          <input type="date" v-model="startDate" class="input-date" />
          <span class="tilde">~</span>
          <input type="date" v-model="endDate" class="input-date" />
          <button class="btn" :disabled="!startDate || !endDate" @click="applyCustomRange">적용</button>
          <button class="btn ghost" v-if="startDate || endDate" @click="clearCustomRange">초기화</button>
        </div>

        <!-- 상단 도구막대 -->
        <div class="toolbar">
          <select v-model="rangeDays" class="select">
            <option :value="7">최근 7일</option>
            <option :value="14">최근 14일</option>
            <option :value="30">최근 30일</option>
            <option :value="90">최근 90일</option>
          </select>
          <button class="btn" :disabled="loading" @click="load">새로고침</button>
        </div>
      </div>

      <!-- 상단 KPI 카드 -->
      <div class="grid top-cards">
        <!-- 총 예약 -->
        <div class="card kpi kpi--bookings">
          <div class="kpi-head">
            <div class="kpi-title">총 예약(최근 {{ dayCount }}일)</div>
            <div class="kpi-badge" :class="trend(totalBookingsInRange).cls">
              {{ trend(totalBookingsInRange).label }}
            </div>
          </div>

          <div class="kpi-main">
            <span class="v">{{ loading ? '…' : n(totalBookingsInRange) }}</span>
          </div>

          <div class="kpi-divider"></div>

          <div class="kpi-sub">
            <div><div class="muted">이달</div><div class="kpi-subv">{{ n(thisMonthBookings) }}</div></div>
            <div><div class="muted">이번 주</div><div class="kpi-subv">{{ n(thisWeekBookings) }}</div></div>
          </div>

          <div class="mini-bars" v-if="!loading">
            <div v-for="v in sparkBookings" :key="'b'+v.id" class="bar" :style="{height: v.h+'%'}"></div>
          </div>
          <div class="mini-skeleton" v-else />
        </div>

        <!-- 현재 이용 중 객실 / 전체 -->
        <div class="card kpi kpi--rooms">
          <div class="kpi-head"><div class="kpi-title">현재 이용 중 객실 / 전체</div></div>

          <div class="kpi-main ratio">
            <span class="v">{{ loading ? '…' : n(activeToday) }}</span>
            <span class="slash">/</span>
            <span class="total">{{ n(roomsTotal) }}</span>
          </div>

          <div class="kpi-divider"></div>

          <div class="kpi-sub two">
            <div><div class="muted">가용 객실</div><div class="kpi-subv">{{ n(roomsAvailable) }}</div></div>
            <div><div class="muted">점유율</div><div class="kpi-subv">{{ roomsTotal ? Math.round((activeToday/roomsTotal)*100) : 0 }}%</div></div>
          </div>

          <div class="mini-bars" v-if="!loading">
            <div v-for="v in sparkRooms" :key="'r'+v.id" class="bar" :style="{height: v.h+'%'}"></div>
          </div>
          <div class="mini-skeleton" v-else />
        </div>

        <!-- 순이익(추정) -->
        <div class="card kpi kpi--profit">
          <div class="kpi-head"><div class="kpi-title">순이익(추정)</div></div>

          <div class="kpi-main money">
            <span class="v">{{ loading ? '…' : n(profitTotal) }}</span>
            <span class="unit">원</span>
          </div>

          <div class="kpi-divider"></div>

          <div class="kpi-sub">
            <div><div class="muted">이달</div><div class="kpi-subv">{{ n(profitMonth) }}원</div></div>
            <div><div class="muted">이번 주</div><div class="kpi-subv">{{ n(profitWeek) }}원</div></div>
          </div>

          <div class="mini-bars" v-if="!loading">
            <div v-for="v in sparkProfit" :key="'p'+v.id" class="bar" :style="{height: v.h+'%'}"></div>
          </div>
          <div class="mini-skeleton" v-else />
        </div>

        <!-- 지출(추정) -->
        <div class="card kpi kpi--expenses">
          <div class="kpi-head"><div class="kpi-title">지출(추정)</div></div>

          <div class="kpi-main money">
            <span class="v">{{ loading ? '…' : n(expensesTotal) }}</span>
            <span class="unit">원</span>
          </div>

          <div class="kpi-divider"></div>

          <div class="kpi-sub">
            <div><div class="muted">이달</div><div class="kpi-subv">{{ n(expensesMonth) }}원</div></div>
            <div><div class="muted">이번 주</div><div class="kpi-subv">{{ n(expensesWeek) }}원</div></div>
          </div>

          <div class="mini-bars" v-if="!loading">
            <div v-for="v in sparkExpenses" :key="'e'+v.id" class="bar" :style="{height: v.h+'%'}"></div>
          </div>
          <div class="mini-skeleton" v-else />
        </div>
      </div>

      <!-- 중단 차트 -->
      <div class="grid mid">
        <div class="panel">
          <div class="panel-head">
            <h3>인기 객실</h3>
            <select v-model="pkgRangeDays" class="select sm">
              <option :value="7">최근 7일</option>
              <option :value="14">최근 14일</option>
              <option :value="30">최근 30일</option>
              <option :value="90">최근 90일</option>
            </select>
          </div>
          <apexchart
            v-if="!loading"
            type="bar"
            height="300"
            :options="topPkgChart.options"
            :series="topPkgChart.series"
          />
          <div v-else class="skeleton-chart"/>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h3>매출 추이</h3>
            <span class="muted">최근 {{ dayCount }}일</span>
          </div>
          <apexchart
            v-if="!loading"
            type="bar"
            height="300"
            :options="revenueChart.options"
            :series="revenueChart.series"
          />
          <div v-else class="skeleton-chart"/>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h3>예약 객실 비중</h3>
            <select v-model="typeRangeDays" class="select sm">
              <option :value="7">최근 7일</option>
              <option :value="14">최근 14일</option>
              <option :value="30">최근 30일</option>
              <option :value="90">최근 90일</option>
            </select>
          </div>
          <apexchart
            v-if="!loading"
            type="donut"
            height="300"
            :options="roomTypeChart.options"
            :series="roomTypeChart.series"
          />
          <div v-else class="skeleton-chart"/>
        </div>
      </div>

      <!-- 하단 -->
      <div class="grid bottom">
        <div class="panel tall">
          <div class="panel-head">
            <h3>수입 vs 지출</h3>
            <select v-model="rangeDays" class="select sm">
              <option :value="7">최근 7일</option>
              <option :value="14">최근 14일</option>
              <option :value="30">최근 30일</option>
              <option :value="90">최근 90일</option>
            </select>
          </div>
          <apexchart
            v-if="!loading"
            type="line"
            height="360"
            :options="incomeExpenseChart.options"
            :series="incomeExpenseChart.series"
          />
          <div v-else class="skeleton-chart"/>
        </div>

        <div class="panel tall">
          <div class="panel-head">
            <h3>신규 고객</h3>
            <button class="muted linklike" @click="openCustomersModal">전체 보기</button>
          </div>
          <ul class="people scroll">
            <li v-for="c in newCustomers" :key="c.id" class="people-item">
              <div class="avatar avatar-grad">{{ initials(c.name) }}</div>
              <div class="meta">
                <div class="title">
                  {{ c.name }}
                  <span class="chip">신규</span>
                </div>
                <div class="sub">{{ c.email || '이메일 없음' }}</div>
              </div>
              <div class="arrow">›</div>
            </li>
            <li v-if="newCustomers.length===0" class="empty">데이터가 없습니다.</li>
          </ul>
        </div>

        <div class="panel tall">
          <div class="panel-head"><h3>최근 활동</h3></div>
          <div class="timeline scroll" v-if="recentActivities.length">
            <div class="tl-item" v-for="a in recentActivities" :key="a.id">
              <div class="tl-dot"></div>
              <div class="tl-card">
                <div class="tl-title">{{ a.title }}</div>
                <div class="tl-meta">{{ a.timeAgo }}</div>
              </div>
            </div>
          </div>
          <ul class="list scroll" v-else>
            <li class="empty">최근 활동이 없습니다.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 신규 고객 전체보기 모달 -->
    <div v-if="showCustomersModal" class="overlay" @click.self="closeCustomersModal">
      <div class="modal" role="dialog" aria-modal="true" aria-label="신규 고객 전체 보기">
        <div class="modal-head">
          <h3>신규 고객 전체</h3>
          <button class="iconbtn" @click="closeCustomersModal" aria-label="닫기">×</button>
        </div>

        <div class="modal-body">
          <ul class="people">
            <li v-for="c in customersPageItems" :key="c.id" class="people-item">
              <div class="avatar avatar-grad">{{ initials(c.name) }}</div>
              <div class="meta">
                <div class="title">
                  {{ c.name }}
                  <span class="chip">신규</span>
                </div>
                <div class="sub">{{ c.email || '이메일 없음' }}</div>
              </div>
              <div class="arrow">›</div>
            </li>
            <li v-if="customersPageItems.length===0" class="empty">표시할 고객이 없습니다.</li>
          </ul>
        </div>

        <div class="modal-foot">
          <div class="pagi">
            <button class="pbtn" @click="custPage=1" :disabled="custPage===1">«</button>
            <button class="pbtn" @click="custPage--" :disabled="custPage===1">‹</button>

            <button
              v-for="p in customersPageWindow"
              :key="'p'+p"
              class="pbtn"
              :class="{active: p===custPage}"
              @click="custPage=p"
            >{{ p }}</button>

            <button class="pbtn" @click="custPage++" :disabled="custPage===customersPageCount">›</button>
            <button class="pbtn" @click="custPage=customersPageCount" :disabled="custPage===customersPageCount">»</button>

            <span class="muted small">총 {{ allCustomers.length }}명 · {{ CUS_PAGE_SIZE }}개/페이지</span>
          </div>
        </div>
      </div>
    </div>
    <!-- // 모달 -->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import apexchart from 'vue3-apexcharts'
import { useHotelStore } from '@/stores/hotel'
import { getReservations, getRooms } from '@/api/business'

const store = useHotelStore()
const loading = ref(true)
const reservations = ref([])
const rooms = ref([])

const rangeDays = ref(30)
const pkgRangeDays = ref(30)
const typeRangeDays = ref(30)

/* 사용자 지정 날짜 범위 */
const startDate = ref('') // YYYY-MM-DD
const endDate   = ref('') // YYYY-MM-DD
function applyCustomRange() {
  if (!startDate.value || !endDate.value) return
  if (new Date(startDate.value) > new Date(endDate.value)) {
    const t = startDate.value
    startDate.value = endDate.value
    endDate.value = t
  }
}
function clearCustomRange() {
  startDate.value = ''
  endDate.value = ''
}

/* 유틸 */
const n = (v) => Number(v ?? 0).toLocaleString('ko-KR')
const dOnly = (v) => (v ? String(v).slice(0,10) : '')
const addDays = (dt, days) => { const d = new Date(dt); d.setDate(d.getDate()+days); return d }
const isCanceled = (s) => (s || '').toUpperCase().includes('CANCEL') || (s || '').includes('취소')
const moneyOf = (r) => Number(r.totalPrice ?? r.total ?? r.amount ?? r.price ?? 0)
const safeChart = (series = [], options = {}) => ({ series, options })

// 객실/고객 표시용
const roomTitleOf = (r) =>
  (r.roomtitle || r.roomTitle || r.title || r.roomcode || '미지정').toString().trim()
const guestNameOf = (r) =>
  r.reservName || r.userDisplayName || r.customerName || r.name || r.userName || r.username || '고객'

// 고객 이메일/이름 추출 함수 (여러 곳에서 사용)
const emailOf = (r) =>
  r.email ?? r.userEmail ?? r.user?.email ?? r.customerEmail ?? r.customer?.email ??
  r.user_name ?? r.userName ?? r.username ?? ''
const nameOf = (r) =>
  r.reservName || r.userDisplayName || r.customerName || r.name || r.userName || r.username || '고객'

/* 날짜 라벨(사용자 지정이 있으면 우선) */
const rangeDateLabels = computed(() => {
  const end = endDate.value ? new Date(endDate.value) : new Date()
  const start = startDate.value ? new Date(startDate.value) : addDays(end, -(rangeDays.value - 1))

  let s = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  let e = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  if (s > e) [s, e] = [e, s]

  const arr = []
  const cur = new Date(s)
  while (cur <= e) {
    arr.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`)
    cur.setDate(cur.getDate() + 1)
  }
  return arr
})
const dayCount = computed(() => rangeDateLabels.value.length)

/* Apex x축 라벨(양끝만 표시) */
const edgeLabel = (val, _ts, third) => {
  const labels =
    (third && typeof third === 'object' && third.w?.globals?.labels)
      ? third.w.globals.labels
      : rangeDateLabels.value
  const idx =
    (third && typeof third === 'object' && typeof third.i === 'number')
      ? third.i
      : (typeof third === 'number' ? third : labels.indexOf(val))
  const last = Math.max(0, labels.length - 1)
  return (idx === 0 || idx === last) ? val : ''
}

/* 데이터 로드(호텔별) */
async function load() {
  if (!store.selectedContentId) {
    loading.value = false
    reservations.value = []
    rooms.value = []
    return
  }
  loading.value = true
  try {
    const [resResv, resRooms] = await Promise.all([
      getReservations(store.selectedContentId),
      getRooms(store.selectedContentId)
    ])
    reservations.value = Array.isArray(resResv.data) ? resResv.data : []
    rooms.value        = Array.isArray(resRooms.data) ? resRooms.data : []
  } catch (e) {
    console.error('[dashboard] load failed', e)
    reservations.value = []
    rooms.value = []
  } finally {
    loading.value = false
  }
}
watch(() => store.selectedContentId, load, { immediate: true })

/* KPI */
const bookingsByDay = computed(() => {
  const map = Object.fromEntries(rangeDateLabels.value.map(x => [x, 0]))
  for (const r of reservations.value) {
    const d = dOnly(r.checkInDate)
    if (d in map && !isCanceled(r.status)) map[d]++
  }
  return map
})
const totalBookingsInRange = computed(() => Object.values(bookingsByDay.value).reduce((a,b)=>a+b,0))
const thisMonthBookings = computed(() => {
  const d = new Date()
  const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  return reservations.value.filter(r => dOnly(r.checkInDate).startsWith(ym) && !isCanceled(r.status)).length
})
const thisWeekBookings = computed(() => {
  const now = new Date()
  const monday = addDays(now, -((now.getDay()+6)%7))
  const set = new Set()
  for (let i=0;i<7;i++){
    const d = addDays(monday,i)
    set.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
  }
  return reservations.value.filter(r => set.has(dOnly(r.checkInDate)) && !isCanceled(r.status)).length
})

const roomsTotal = computed(() => rooms.value.length)
const activeToday = computed(() => {
  const t = rangeDateLabels.value[rangeDateLabels.value.length-1]
  const set = new Set()
  for (const r of reservations.value) {
    if (isCanceled(r.status)) continue
    const inOk = dOnly(r.checkInDate) <= t
    const outOk = dOnly(r.checkOutDate) > t
    if (inOk && outOk) set.add(r.roomcode || `unknown_${r.reservationId}`)
  }
  return set.size
})
const roomsAvailable = computed(() => Math.max(roomsTotal.value - activeToday.value, 0))

/* 순이익(= 매출 - 지출) */
const profitDailyRaw = computed(() => {
  const out = {}
  for (const d of rangeDateLabels.value) {
    out[d] = (revenueDailyRaw.value[d] || 0) - (expensesDailyRaw.value[d] || 0)
  }
  return out
})
const profitTotal = computed(() => Object.values(profitDailyRaw.value).reduce((a,b)=>a+b,0))
const profitMonth = computed(() => {
  const d = new Date()
  const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  return Object.entries(profitDailyRaw.value).reduce((sum,[k,v]) => sum + (k.startsWith(ym)?v:0), 0)
})
const profitWeek = computed(() => {
  const now = new Date()
  const monday = addDays(now, -((now.getDay()+6)%7))
  const set = new Set()
  for (let i=0;i<7;i++){
    const d = addDays(monday,i)
    set.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
  }
  return Object.entries(profitDailyRaw.value).reduce((s,[k,v]) => s + (set.has(k)?v:0), 0)
})

/* 스파크 바 */
const toSpark = (map) => {
  const vals = Object.values(map)
  const max = Math.max(1, ...vals)
  return vals.map((v,i) => ({ id:i, h: Math.round((v/max)*100) }))
}
const sparkBookings = computed(() => toSpark(bookingsByDay.value))
const sparkRooms    = computed(() => toSpark(bookingsByDay.value))
const sparkExpenses = computed(() => toSpark(expensesDailyRaw.value))
const sparkProfit   = computed(() => toSpark(profitDailyRaw.value))

const trend = (val) => (val > 0 ? { label: '상승', cls: 'up' } : val < 0 ? { label: '하락', cls: 'down' } : { label: '보합', cls: '' })

/* 인기 객실 */
const topPkgData = computed(() => {
  const cutoff = addDays(new Date(), -pkgRangeDays.value)
  const map = {}
  for (const r of reservations.value) {
    const d = new Date(dOnly(r.checkInDate))
    if (isNaN(d) || d < cutoff) continue
    if (isCanceled(r.status)) continue
    const title = (r.roomtitle || r.roomTitle || r.title || r.roomcode || '미지정').toString().trim()
    map[title] = (map[title] || 0) + 1
  }
  const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,6)
  return { labels: entries.map(e=>e[0]), data: entries.map(e=>e[1]) }
})
const topPkgChart = computed(() => safeChart(
  [{ data: topPkgData.value.data ?? [] }],
  {
    chart: { toolbar: { show:false }, foreColor: '#6b7280' },
    colors: ['#60a5fa'],
    plotOptions: { bar: { horizontal: true, borderRadius: 6, columnWidth: '60%' } },
    xaxis: { categories: topPkgData.value.labels ?? [], axisBorder:{show:false}, axisTicks:{show:false} },
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 4, borderColor: '#edf1f7' },
    tooltip: { theme: 'light' }
  }
))

/* 객실 비중 */
const roomTypeChart = computed(() => {
  const cutoff = addDays(new Date(), -typeRangeDays.value)
  const counts = {}
  for (const r of reservations.value) {
    if (isCanceled(r.status)) continue
    const d = new Date(dOnly(r.checkInDate))
    if (isNaN(d) || d < cutoff) continue
    const title = (r.roomtitle || r.roomTitle || r.title || r.roomcode || '미지정').toString().trim()
    counts[title] = (counts[title] || 0) + 1
  }
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1])
  if (!entries.length) {
    return safeChart([1], {
      labels: ['데이터 없음'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true, formatter: () => '100%' }
    })
  }
  const TOP = 6
  let top = entries
  if (entries.length > TOP) {
    const head = entries.slice(0, TOP)
    const tail = entries.slice(TOP)
    const others = tail.reduce((s, [,v]) => s+v, 0)
    top = [...head, ['기타', others]]
  }
  const labels = top.map(([k]) => k)
  const series = top.map(([,v]) => v)
  return safeChart(series, {
    labels,
    legend: { position: 'bottom' },
    dataLabels: { enabled: true, formatter: (v) => v.toFixed(1) + '%' },
    tooltip: { y: { formatter: (v) => Number(v).toLocaleString('ko-KR') + ' 건' } }
  })
})

/* 매출/지출(전역 기간 사용) */
const revenueDailyRaw = computed(() => {
  const map = Object.fromEntries(rangeDateLabels.value.map(d => [d, 0]))
  for (const r of reservations.value) {
    const d = dOnly(r.checkInDate)
    if (d in map && !isCanceled(r.status)) map[d] += moneyOf(r)
  }
  return map
})
const expensesTotal = computed(() => Object.values(expensesDailyRaw.value).reduce((a,b)=>a+b,0))
const expensesMonth = computed(() => {
  const d = new Date()
  const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  return Object.entries(expensesDailyRaw.value).reduce((sum,[k,v]) => sum + (k.startsWith(ym)?v:0), 0)
})
const expensesWeek = computed(() => {
  const now = new Date()
  const monday = addDays(now, -((now.getDay()+6)%7))
  const set = new Set()
  for (let i=0;i<7;i++){
    const d = addDays(monday,i)
    set.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
  }
  return Object.entries(expensesDailyRaw.value).reduce((s,[k,v]) => s + (set.has(k)?v:0), 0)
})
const revenueChart = computed(() => safeChart(
  [{ name: '매출', data: rangeDateLabels.value.map(d => revenueDailyRaw.value[d] || 0) }],
  {
    chart: { toolbar: { show:false } },
    colors: ['#6ea8fe'],
    plotOptions: { bar: { columnWidth:'40%', borderRadius: 6 } },
    xaxis: {
      categories: rangeDateLabels.value,
      tickAmount: rangeDateLabels.value.length,
      tickPlacement: 'between',
      labels: {
        rotate: 0,
        trim: false,
        hideOverlappingLabels: false,
        formatter: edgeLabel,
        style: { colors: '#94a3b8' }
      },
      axisTicks:{ show:false }, axisBorder:{ show:false }
    },
    yaxis: { labels: { formatter: (v) => n(Math.round(v)) } },
    dataLabels: { enabled:false },
    grid: { strokeDashArray: 4, borderColor: '#edf1f7' },
    tooltip: { y: { formatter: (v)=> n(Math.round(v)) + ' 원' } }
  }
))

/* 수입 vs 지출 */
const expensesDailyRaw = computed(() => {
  const out = {}
  for (const d of Object.keys(revenueDailyRaw.value)) out[d] = Math.round(revenueDailyRaw.value[d] * 0.35)
  return out
})
const incomeExpenseChart = computed(() => safeChart(
  [
    { name: '수입', data: rangeDateLabels.value.map(d => revenueDailyRaw.value[d] || 0) },
    { name: '지출', data: rangeDateLabels.value.map(d => expensesDailyRaw.value[d] || 0) }
  ],
  {
    chart: { toolbar: { show:false } },
    colors: ['#60d0a8', '#f78fb3'],
    stroke: { width: 3, curve:'smooth' },
    markers: { size: 0 },
    xaxis: {
      categories: rangeDateLabels.value,
      tickAmount: rangeDateLabels.value.length,
      labels: {
        rotate: 0,
        trim: false,
        hideOverlappingLabels: false,
        formatter: edgeLabel,
        style: { colors: '#94a3b8' }
      },
      axisTicks:{ show:false }, axisBorder:{ show:false }
    },
    yaxis: { labels: { formatter: (v) => n(Math.round(v)) } },
    dataLabels: { enabled:false },
    grid: { strokeDashArray: 4, borderColor: '#edf1f7' },
    tooltip: { y: { formatter: (v)=> n(Math.round(v)) + ' 원' } }
  }
))

/* 신규 고객(패널용 6명) */
const newCustomers = computed(() => {
  const pick = []
  const seen = new Set()
  for (const r of reservations.value.slice().reverse()) {
    const name = nameOf(r)
    const email = emailOf(r)
    const key = (name || '') + '|' + (email || '')
    if (seen.has(key)) continue
    seen.add(key)
    pick.push({ id: r.reservationId ?? key, name, email })
    if (pick.length >= 6) break
  }
  return pick
})

/* 신규 고객 전체보기(모달) */
const showCustomersModal = ref(false)
const CUS_PAGE_SIZE = 5
const custPage = ref(1)

const allCustomers = computed(() => {
  // 최신 예약 순으로 정렬 후, 이름+이메일 기준으로 유니크
  const list = reservations.value.slice().sort((a,b) =>
    (b.reservationDate||'').localeCompare(a.reservationDate||'')
  )
  const out = []
  const seen = new Set()
  for (const r of list) {
    const name = nameOf(r)
    const email = emailOf(r)
    const key = (name || '') + '|' + (email || '')
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ id: r.reservationId ?? key, name, email })
  }
  return out
})
const customersPageCount = computed(() =>
  Math.max(1, Math.ceil(allCustomers.value.length / CUS_PAGE_SIZE))
)
const customersPageItems = computed(() => {
  const start = (custPage.value - 1) * CUS_PAGE_SIZE
  return allCustomers.value.slice(start, start + CUS_PAGE_SIZE)
})
const customersPageWindow = computed(() => {
  // 페이지 버튼을 최대 5개만 노출
  const MAX_BTN = 5
  const total = customersPageCount.value
  const half = Math.floor(MAX_BTN / 2)
  let start = Math.max(1, custPage.value - half)
  let end = Math.min(total, start + MAX_BTN - 1)
  start = Math.max(1, Math.min(start, Math.max(1, total - MAX_BTN + 1)))
  end = Math.min(total, Math.max(start + MAX_BTN - 1, MAX_BTN))
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

function openCustomersModal() {
  showCustomersModal.value = true
  custPage.value = 1
}
function closeCustomersModal() {
  showCustomersModal.value = false
}

// ESC 닫기
function onKey(e){ if(e.key === 'Escape' && showCustomersModal.value) closeCustomersModal() }
onMounted(()=> document.addEventListener('keydown', onKey))
onUnmounted(()=> document.removeEventListener('keydown', onKey))

/* 최근 활동 */
const recentActivities = computed(() => {
  const titleOf = (r) => {
    const room  = roomTitleOf(r)
    const guest = guestNameOf(r)
    return isCanceled(r.status)
      ? `예약 취소 · ${room} · ${guest}`
      : `예약 접수 · ${room} · ${guest}`
  }

  return reservations.value
    .slice()
    .sort((a,b) => (b.reservationDate||'').localeCompare(a.reservationDate||'')) // 최신순
    .slice(0, 6)
    .map(r => ({
      id: r.reservationId ?? `${roomTitleOf(r)}|${guestNameOf(r)}|${r.reservationDate}`,
      title: titleOf(r),
      timeAgo: (r.reservationDate||'').replace('T',' ')
    }))
})

const initials = (name) => {
  if (!name) return '•'
  const s = String(name).trim()
  try {
    const seg = new Intl.Segmenter('ko', { granularity: 'grapheme' })
    const iter = seg.segment(s)[Symbol.iterator]()
    const first = iter.next().value?.segment
    return (first || s[0]).toUpperCase?.() ?? '•'
  } catch {
    return (s[0] || '•').toUpperCase?.() ?? '•'
  }
}
</script>

<style scoped>
/* 레이아웃 기본 */
.dashboard { max-width: 100%; }
.hint { margin: 12px 0; color: #6b7280; }

/* 제목 아래 구분선 */
.headline-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 8px 0 14px;
}

/* 상단 한 줄 바 */
.topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  margin: 6px 0 12px;
  flex-wrap: wrap; /* 작은 화면에서는 줄바꿈 */
}

/* 날짜 범위 필터 */
.date-filter { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.date-filter .label { color:#475569; font-weight:700; }
.input-date { border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; background:#fff; }
.tilde { color:#94a3b8; }
.btn.ghost { background:#fff; color:#374151; border:1px solid #e5e7eb; }
.btn.ghost:hover { background:#f8fafc; }

/* 툴바(우측) */
.toolbar { display:flex; align-items:center; gap:10px; margin:0; }
.select { border:1px solid #e5e7eb; border-radius:10px; padding:13px 12px; background:#fff; }
.select.sm { padding: 6px 10px; font-size:13px; }
.btn {
  background:#111827; color:#fff; border:none; padding:10px 14px;
  border-radius:10px; font-weight:600;
  transition: background-color .3s ease, transform .2s ease;
}
.btn:hover { background:#4b5563; transform: translateY(-1px); }

/* 링크처럼 보이는 버튼 */
.linklike {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
}

/* 그리드 */
.grid { display:grid; gap:30px; }
.top-cards { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.mid { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top:40px; gap:70px; }
.bottom { grid-template-columns: 2fr 1.5fr 1.5fr; margin-top:40px; gap:70px; }
@media (max-width: 1200px) { .mid, .bottom { grid-template-columns: 1fr; } }

.mid-panel { min-height: 400px; }
.mid-panel .skeleton-chart { height: 320px; }

/* 카드 & 패널 공통 */
.card, .panel {
  background: linear-gradient(145deg, #ffffff, #f3f4f6);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.1);
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}
.card:hover, .panel:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(17, 24, 39, 0.15); }

/* 패널 헤더 */
.panel-head { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:10px; }
.panel-head h3 { margin:0; font-size:16px; font-weight:700; color:#111827; }
.muted { color:#9aa3b2; font-size:12px; }

/* KPI 카드 */
.card.kpi {
  --kpi-accent: #e2e8f0;
  background:#fff;
  border:1px solid #eef2f7;
  padding:16px 18px;
  border-left:4px solid var(--kpi-accent);
}
.kpi--bookings { --kpi-accent:#cfe2ff; }
.kpi--rooms    { --kpi-accent:#c9f7e2; }
.kpi--expenses { --kpi-accent:#ffe2e7; }
.kpi--profit   { --kpi-accent:#dcfce7; }

.kpi-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.kpi-title { font-size:13px; color:#64748b; font-weight:700; letter-spacing:.2px; }

.kpi-badge {
  position: relative; display: inline-flex; align-items: center; gap: 6px;
  font-size:11px; padding:3px 8px; border-radius:999px;
  background:#f8fafc; color:#64748b; border:1px solid #eef2f7; line-height: 1;
}
.kpi-badge::before { content: "→"; font-size: 10px; line-height: 1; transform: translateY(-0.5px); color: inherit; }
.kpi-badge.up   { color:#16a34a; background:#e7f6ee; border-color:#d1fae5; }
.kpi-badge.up::before { content: "▲"; }
.kpi-badge.down { color:#dc2626; background:#ffecec; border-color:#ffe1e1; }
.kpi-badge.down::before { content: "▼"; }

.kpi-main { display:flex; align-items:baseline; gap:6px; margin-top:2px; }
.kpi-main .v { font-size: clamp(28px, 3.2vw, 34px); font-weight:800; color:#0f172a; letter-spacing:-0.02em; line-height:1; font-variant-numeric: tabular-nums; }
.kpi-main .unit { font-size:16px; color:#94a3b8; font-weight:700; position:relative; top:-1px; }

.kpi-main.ratio .slash { margin:0 6px; color:#cbd5e1; font-weight:700; }
.kpi-main.ratio .total { color:#94a3b8; font-weight:800; }

.kpi-divider { height:1px; background:#f1f5f9; margin:10px 0 8px; border-radius:1px; }

.kpi-sub { display:flex; gap:20px; margin-top:4px; }
.kpi-sub.two { gap:36px; }
.kpi-sub .kpi-subv { font-weight:800; color:#0f172a; font-variant-numeric: tabular-nums; }

.mini-bars { display:flex; gap:6px; align-items:flex-end; height:42px; margin-top:12px; justify-content:flex-end; }
.mini-bars .bar { width:9px; background:linear-gradient(180deg,#e2e8f0,#cbd5e1); border-radius:6px 6px 0 0; }
.mini-skeleton { height:46px; border-radius:10px; background: repeating-linear-gradient(-45deg,#f3f4f6,#f3f4f6 10px,#e5e7eb 10px,#e5e7eb 20px); }

.skeleton-chart { height:260px; border-radius:12px; background: repeating-linear-gradient(-45deg,#f3f4f6,#f3f4f6 10px,#e5e7eb 10px,#e5e7eb 20px); }

.panel.tall { display:flex; flex-direction:column; min-height:430px; }
.scroll { overflow:auto; max-height:260px; padding-right:6px; flex: 1;}

/* 신규 고객 리스트 */
.people { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
.people-item {
  display:flex; align-items:center; gap:12px; padding:12px;
  border:1px solid #f1f5f9; border-radius:12px;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfd 100%);
  transition: transform .15s ease, box-shadow .15s ease, border-color .2s ease;
}
.people-item:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(2,6,23,0.06); border-color: #e2e8f0; }
.avatar { min-width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:800; color:#0f172a; background:#eef2ff; }
.avatar-grad { background: conic-gradient(from 200deg, #dbeafe, #ede9fe, #dcfce7, #ffe4e6, #dbeafe); color:#0f172a; }
.meta { flex:1; min-width:0; }
.title { font-weight:700; color:#111827; display:flex; align-items:center; gap:8px; }
.sub { color:#6b7280; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.chip { background:#eef2ff; color:#4f46e5; font-weight:700; font-size:10px; padding:2px 6px; border-radius:999px; }
.arrow { color:#cbd5e1; font-size:20px; line-height:1; }

/* 최근 활동 타임라인 */
.timeline { position: relative; padding-left: 14px; }
.timeline:before { content:''; position:absolute; left:6px; top:0; bottom:0; width:2px; background: linear-gradient(#e5e7eb, #f1f5f9); }
.tl-item { position: relative; display:flex; gap:12px; margin-bottom:14px; }
.tl-dot { position:absolute; left:-2px; top:4px; width:10px; height:10px; border-radius:50%; background:linear-gradient(180deg,#a5b4fc,#60a5fa); border:2px solid #fff; box-shadow:0 0 0 2px #e5e7eb; }
.tl-card { margin-left: 16px; background:#fff; border:1px solid #eef1f7; border-radius:12px; padding:12px; box-shadow: 0 8px 18px rgba(2,6,23,.04); width: 100%; }
.tl-title { font-weight:700; color:#0f172a; margin-bottom:4px; }
.tl-meta { color:#64748b; font-size:12px; }

/* 모달 오버레이 */
.overlay{
  position: fixed; inset: 0; z-index: 60;
  background: rgba(15,23,42,0.45);
  backdrop-filter: blur(2px);
  display:flex; align-items:center; justify-content:center; padding:20px;
}
.modal{
  width: 520px; max-width: 92vw; max-height: 86vh;
  display:flex; flex-direction:column;
  background:#fff; border-radius:16px;
  box-shadow: 0 30px 60px rgba(2,6,23,.25);
  border:1px solid #eef2f7;
}
.modal-head{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 16px; border-bottom:1px solid #f1f5f9;
}
.modal-head h3{ margin:0; font-size:16px; font-weight:800; color:#0f172a; }
.iconbtn{
  background:#111827; color:#fff; border:none; width:32px; height:32px;
  border-radius:10px; font-size:20px; line-height:1; cursor:pointer;
}
.iconbtn:hover{ background:#374151; }
.modal-body{ padding:14px 16px; overflow:auto; }
.modal-foot{
  padding:10px 12px; border-top:1px solid #f1f5f9; display:flex; justify-content:center;
}

/* 페이지네이션 */
.pagi{ display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.pbtn{
  min-width:32px; height:32px; padding:0 8px;
  border:1px solid #e5e7eb; border-radius:8px; background:#fff; cursor:pointer;
  font-weight:700; color:#334155;
}
.pbtn:hover{ background:#f8fafc; }
.pbtn[disabled]{ opacity:.4; cursor:not-allowed; }
.pbtn.active{ background:#111827; color:#fff; border-color:#111827; }
.small{ font-size:12px; margin-left:6px; }

/* (남겨둠) */
.seg { display:flex; gap:6px; }
.seg-btn { background:#f1f5f9; color:#475569; border:none; padding:6px 10px; border-radius:10px; font-weight:700; font-size:12px; }
.seg-btn.active { background:#111827; color:#fff; }
</style>

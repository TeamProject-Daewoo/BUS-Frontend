<template>
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
</template>

<script setup>
const props = defineProps({
  loading: Boolean,
  dayCount: Number,
  totalBookingsInRange: Number,
  thisMonthBookings: Number,
  thisWeekBookings: Number,
  activeToday: Number,
  roomsTotal: Number,
  roomsAvailable: Number,
  profitTotal: Number,
  profitMonth: Number,
  profitWeek: Number,
  expensesTotal: Number,
  expensesMonth: Number,
  expensesWeek: Number,
  sparkBookings: Array,
  sparkRooms: Array,
  sparkProfit: Array,
  sparkExpenses: Array
})

const n = (v) => Number(v ?? 0).toLocaleString('ko-KR')
const trend = (val) => (val > 0 ? { label:'상승', cls:'up' } : val < 0 ? { label:'하락', cls:'down' } : { label:'보합', cls:'' })
</script>

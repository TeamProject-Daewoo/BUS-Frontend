<template>
  <div class="grid mid">
    <div class="panel">
      <div class="panel-head">
        <h3>인기 객실</h3>
        <select class="select sm" :value="pkgRangeDays" @change="$emit('update:pkgRangeDays', Number($event.target.value))">
          <option :value="7">최근 7일</option>
          <option :value="14">최근 14일</option>
          <option :value="30">최근 30일</option>
          <option :value="90">최근 90일</option>
        </select>
      </div>
      <apexchart v-if="!loading" type="bar" height="300" :options="topPkgChart.options" :series="topPkgChart.series" />
      <div v-else class="skeleton-chart"/>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>매출 추이</h3>
        <span class="muted">최근 {{ dayCount }}일</span>
      </div>
      <apexchart v-if="!loading" type="bar" height="300" :options="revenueChart.options" :series="revenueChart.series" />
      <div v-else class="skeleton-chart"/>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>예약 객실 비중</h3>
        <select class="select sm" :value="typeRangeDays" @change="$emit('update:typeRangeDays', Number($event.target.value))">
          <option :value="7">최근 7일</option>
          <option :value="14">최근 14일</option>
          <option :value="30">최근 30일</option>
          <option :value="90">최근 90일</option>
        </select>
      </div>
      <apexchart v-if="!loading" type="donut" height="300" :options="roomTypeChart.options" :series="roomTypeChart.series" />
      <div v-else class="skeleton-chart"/>
    </div>
  </div>
</template>

<script setup>
import apexchart from 'vue3-apexcharts'
defineProps({
  loading: Boolean,
  dayCount: Number,
  pkgRangeDays: Number,
  typeRangeDays: Number,
  topPkgChart: Object,
  revenueChart: Object,
  roomTypeChart: Object
})
defineEmits(['update:pkgRangeDays','update:typeRangeDays'])
</script>

<style scoped>
.skeleton-chart{ height:260px; border-radius:12px; background: repeating-linear-gradient(-45deg,#f3f4f6,#f3f4f6 10px,#e5e7eb 10px,#e5e7eb 20px); }
</style>

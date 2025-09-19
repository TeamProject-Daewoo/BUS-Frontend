<template>
  <div class="panel tall">
    <div class="panel-head">
      <h3>수입 vs 지출</h3>
      <select class="select sm" :value="rangeDays" @change="$emit('update:rangeDays', Number($event.target.value))">
        <option :value="7">최근 7일</option>
        <option :value="14">최근 14일</option>
        <option :value="30">최근 30일</option>
        <option :value="90">최근 90일</option>
      </select>
    </div>
    <apexchart v-if="!loading" type="line" height="360" :options="incomeExpenseChart.options" :series="incomeExpenseChart.series" />
    <div v-else class="skeleton-chart"/>
  </div>
</template>

<script setup>
import apexchart from 'vue3-apexcharts'
defineProps({
  loading: Boolean,
  rangeDays: Number,
  incomeExpenseChart: Object
})
defineEmits(['update:rangeDays'])
</script>

<style scoped>
.panel.tall{ display:flex; flex-direction:column; min-height:430px; }
.skeleton-chart{ height:260px; border-radius:12px; background: repeating-linear-gradient(-45deg,#f3f4f6,#f3f4f6 10px,#e5e7eb 10px,#e5e7eb 20px); }
</style>

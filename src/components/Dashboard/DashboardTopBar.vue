<template>
  <div class="topbar">
    <div class="date-filter">
      <label class="label">기간</label>
      <input type="date" class="input-date" :value="startDate" @input="$emit('update:startDate',$event.target.value)" />
      <span class="tilde">~</span>
      <input type="date" class="input-date" :value="endDate" @input="$emit('update:endDate',$event.target.value)" />
      <button class="btn" :disabled="!startDate || !endDate" @click="$emit('apply')">적용</button>
      <button class="btn ghost" v-if="startDate || endDate" @click="$emit('clear')">초기화</button>
    </div>

    <div class="toolbar">
      <select class="select" :value="rangeDays" @change="$emit('update:rangeDays', Number($event.target.value))">
        <option :value="7">최근 7일</option>
        <option :value="14">최근 14일</option>
        <option :value="30">최근 30일</option>
        <option :value="90">최근 90일</option>
      </select>
      <button class="btn" :disabled="loading" @click="$emit('reload')">새로고침</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  startDate: String,
  endDate: String,
  rangeDays: Number,
  loading: Boolean
})
defineEmits(['update:startDate','update:endDate','update:rangeDays','apply','clear','reload'])
</script>
<style scoped>
select:nth-child(1){
    margin-right: 10px;
}
</style>
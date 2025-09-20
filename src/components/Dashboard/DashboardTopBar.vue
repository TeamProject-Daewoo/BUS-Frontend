<template>
  <div class="topbar">
    <!-- 날짜 범위 필터 -->
    <div class="date-filter">
      <label class="label">기간</label>
      <input type="date" v-model="modelStartDate" class="input-date" />
      <span class="tilde">~</span>
      <input type="date" v-model="modelEndDate" class="input-date" />
      <button class="btn" :disabled="!modelStartDate || !modelEndDate" @click="$emit('apply')">적용</button>
      <button class="btn ghost" v-if="modelStartDate || modelEndDate" @click="$emit('clear')">초기화</button>
    </div>

    <!-- 우측: 범위/새로고침 + 전체/선택 토글 -->
    <div class="toolbar">
      <div class="seg">
        <button
          class="seg-btn"
          :class="{ active: modelScope === 'all' }"
          @click="modelScope = 'all'"
        >
          전체 호텔
        </button>
        <button
          class="seg-btn"
          :class="{ active: modelScope === 'single' }"
          @click="modelScope = 'single'"
        >
          선택 호텔
        </button>
      </div>

      <select v-model.number="modelRangeDays" class="select">
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
import { computed } from 'vue'

const props = defineProps({
  startDate: String,
  endDate: String,
  rangeDays: { type: Number, default: 30 },
  loading: { type: Boolean, default: false },
  /** 'single' | 'all' */
  scope: { type: String, default: 'single' }
})
const emit = defineEmits([
  'update:startDate', 'update:endDate', 'update:rangeDays', 'update:scope',
  'apply', 'clear', 'reload'
])

const modelStartDate = computed({
  get: () => props.startDate,
  set: v => emit('update:startDate', v)
})
const modelEndDate = computed({
  get: () => props.endDate,
  set: v => emit('update:endDate', v)
})
const modelRangeDays = computed({
  get: () => props.rangeDays,
  set: v => emit('update:rangeDays', v)
})
const modelScope = computed({
  get: () => props.scope,
  set: v => emit('update:scope', v)
})
</script>

<style scoped>
.topbar{ display:flex; align-items:center; justify-content:space-between; gap:16px; margin:6px 0 12px; flex-wrap:wrap; }
.date-filter{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.date-filter .label{ color:#475569; font-weight:700; }
.input-date{ border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; background:#fff; }
.tilde{ color:#94a3b8; }

.toolbar{ display:flex; align-items:center; gap:10px; margin:0; }
.select{ border:1px solid #e5e7eb; border-radius:10px; padding:13px 12px; background:#fff; }
.btn{ background:#111827; color:#fff; border:none; padding:10px 14px; border-radius:10px; font-weight:600; }
.btn.ghost{ background:#fff; color:#374151; border:1px solid #e5e7eb; }

/* 세그먼트 토글 */
.seg{ display:flex; gap:6px; }
.seg-btn{ background:#f1f5f9; color:#475569; border:none; padding:8px 12px; border-radius:10px; font-weight:700; font-size:12px; cursor:pointer; }
.seg-btn.active{ background:#111827; color:#fff; }
</style>

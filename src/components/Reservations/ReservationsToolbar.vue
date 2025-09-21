<template>
  <div class="toolbar">
    <div class="bulk">
      <select :value="bulk" @change="$emit('update:bulk', $event.target.value)" class="select" aria-label="일괄 작업 선택">
        <option value="">일괄 작업</option>
        <option value="paidreservation">예약 완료</option>
        <option value="cancel">예약 취소</option>
        <option value="paidpayment">결제 완료 처리</option>
        <option value="refund">결제 환불 처리</option>
      </select>
      <button class="btn" @click="$emit('apply-bulk')" :disabled="!checkedCount || !bulk">적용</button>

      <div class="date-filter">
        <input type="date" :value="startDate" @change="$emit('update:startDate', $event.target.value)" aria-label="체크인 시작일" />
        <span class="tilde">~</span>
        <input type="date" :value="endDate" @change="$emit('update:endDate', $event.target.value)" aria-label="체크인 종료일" />

        <!-- ✅ 날짜가 하나라도 있으면 초기화 버튼 표시 -->
        <button
          v-if="startDate || endDate"
          class="btn-reset"
          @click="$emit('clear-dates')"
        >
          초기화
        </button>
      </div>
    </div>

    <!-- 검색 -->
    <div class="search">
      <div class="seg">
        <button
          class="seg-btn"
          :class="{ active: scope === 'all' }"
          @click="$emit('update:scope','all')"
        >전체 호텔</button>
        <button
          class="seg-btn"
          :class="{ active: scope === 'single' }"
          @click="$emit('update:scope','single')"
        >선택 호텔</button>
      </div>

      <input :value="q" @keyup.enter="$emit('search')" @input="$emit('update:q',$event.target.value)" placeholder="예약자 / 아이디 검색" aria-label="예약 검색" />
      <button class="btn" @click="$emit('search')">검색</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  bulk: String,
  startDate: String,
  endDate: String,
  q: String,
  scope: { type: String, default: 'single' },
  checkedCount: { type: Number, default: 0 }
})
defineEmits([
  'update:bulk',
  'update:startDate',
  'update:endDate',
  'update:q',
  'update:scope',
  'search',
  'apply-bulk',
  'clear-dates'
])
</script>

<style scoped>
.toolbar { display:flex; gap:12px; align-items:center; margin:14px 0; justify-content:space-between; flex-wrap:wrap; }
.bulk { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }

.date-filter { display:flex; align-items:center; gap:6px; }
.date-filter input[type="date"] { padding:6px 8px; border:1px solid var(--border); border-radius: var(--radius-sm); font-size:13px; }
.date-filter .tilde { color:#94a3b8; }

/* ✅ 초기화 버튼 (선택 호텔 색상 동일) */
.btn-reset {
  background: #111827;
  color: #fff;
  border: 1px solid #111827;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-reset:hover {
  background: #1f2937;
  border-color: #1f2937;
}

.select { padding:8px 10px; border:1px solid var(--border); border-radius:var(--radius-sm); background:#fff; transition: border-color .18s var(--ease), box-shadow .18s var(--ease); }
.select:hover { border-color: var(--border-strong); }
.select:focus { outline:none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.15); }

.search { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.search input { padding:8px 10px; border:1px solid var(--border); border-radius:var(--radius-sm); }
.search input[placeholder] { width:200px; }

.btn { background:#22c55e; color:#fff; border:1px solid #22c55e; padding:8px 12px; border-radius: var(--radius-sm); transition: background-color .18s var(--ease), transform .08s ease-out, box-shadow .18s var(--ease); white-space:nowrap; }
.btn:hover:not(:disabled) { background:#16a34a; border-color:#16a34a; transform: translateY(-1px); box-shadow: var(--shadow); }
.btn:active:not(:disabled) { transform: translateY(0); box-shadow: var(--shadow-soft); }
.btn:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }

.seg { display: flex; gap: 6px; }
.seg-btn { background: #f1f5f9; color: #475569; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; }
.seg-btn.active { background: #111827; color: #fff; }
</style>

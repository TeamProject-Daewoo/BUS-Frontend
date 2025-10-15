<template>
  <div class="toolbar">
    <!-- 일괄 작업 + 날짜 검색 + 캘린더 -->
    <div class="bulk">
      <!-- 일괄 작업 -->
      <select
        :value="bulk"
        @change="$emit('update:bulk', $event.target.value)"
        class="select"
        aria-label="일괄 작업 선택"
      >
        <option value="">일괄 작업</option>
        <option value="paidreservation">예약 완료</option>
        <option value="cancel">예약 취소</option>
        <option value="paidpayment">결제 완료 처리</option>
        <option value="refund">결제 환불 처리</option>
      </select>

      <button
        class="btn"
        @click="$emit('apply-bulk')"
        :disabled="!checkedCount || !bulk"
      >
        적용
      </button>

      <!-- ⬅️ 날짜 검색(캘린더 버튼 왼쪽) -->
      <div class="date-range" role="group" aria-label="날짜 검색">
        <input
          class="date"
          type="date"
          :value="startDate"
          @change="$emit('update:startDate', $event.target.value)"
          aria-label="시작일"
        />
        <span class="dash">~</span>
        <input
          class="date"
          type="date"
          :value="endDate"
          @change="$emit('update:endDate', $event.target.value)"
          aria-label="종료일"
        />
        <button
          class="btn ghost"
          type="button"
          @click="$emit('search')"
          :disabled="!startDate && !endDate"
          title="날짜로 검색"
        >
          날짜 검색
        </button>
      </div>

      <!-- 캘린더 토글 버튼 -->
      <button
        class="btn"
        type="button"
        @click="$emit('toggle-calendar')"
        aria-controls="calendar-panel"
      >
        캘린더
      </button>
    </div>

    <!-- 검색 / 범위 -->
    <div class="search">
      <div class="seg" role="tablist" aria-label="조회 범위">
        <button
          class="seg-btn"
          :class="{ active: scope === 'all' }"
          @click="$emit('update:scope','all')"
          role="tab"
          :aria-selected="scope === 'all'"
        >
          전체 호텔
        </button>
        <button
          class="seg-btn"
          :class="{ active: scope === 'single' }"
          @click="$emit('update:scope','single')"
          role="tab"
          :aria-selected="scope === 'single'"
        >
          선택 호텔
        </button>
      </div>

      <input
        :value="q"
        @keyup.enter="$emit('search')"
        @input="$emit('update:q',$event.target.value)"
        placeholder="예약자 / 아이디 검색"
        aria-label="예약 검색"
      />
      <button class="btn" @click="$emit('search')">검색</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  bulk: String,
  q: String,
  scope: { type: String, default: 'single' },
  checkedCount: { type: Number, default: 0 },
  /** ⬇️ 날짜 검색 값을 부모와 양방향으로 */
  startDate: { type: String, default: '' }, // 'YYYY-MM-DD'
  endDate:   { type: String, default: '' }  // 'YYYY-MM-DD'
})

defineEmits([
  'update:bulk',
  'update:q',
  'update:scope',
  'search',
  'apply-bulk',
  'toggle-calendar',
])
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 14px 0;
  justify-content: space-between;
  flex-wrap: wrap;
}

.bulk {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: #fff;
  transition: border-color .18s var(--ease), box-shadow .18s var(--ease);
}
.select:hover { border-color: var(--border-strong); }
.select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .15);
}

/* 날짜 검색 UI */
.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.date {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: #fff;
  min-width: 140px;
}
.dash { color: #6b7280; user-select: none; }

.search {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.search input {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  min-width: 200px;
}

.btn {
  background: #22c55e;
  color: #fff;
  border: 1px solid #22c55e;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  transition: background-color .18s var(--ease), transform .08s ease-out, box-shadow .18s var(--ease);
  white-space: nowrap;
}
.btn:hover:not(:disabled) {
  background: #16a34a;
  border-color: #16a34a;
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}
.btn:active:not(:disabled) { transform: translateY(0); box-shadow: var(--shadow-soft); }
.btn:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }

/* 보조 버튼 톤(날짜 검색) */
.btn.ghost {
  background: #fff;
  color: #111827;
  border: 1px solid var(--border);
}
.btn.ghost:hover { background: #f8fafc; }

.seg { display: flex; gap: 6px; }
.seg-btn {
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.seg-btn.active { background: #111827; color: #fff; }
</style>

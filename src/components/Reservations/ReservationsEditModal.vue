<template>
  <div class="overlay">
    <div class="modal">
      <h2>예약 수정</h2>

      <div class="form">
        <label>체크인 <input type="date" v-model="form.checkInDate" /></label>
        <label>체크아웃 <input type="date" v-model="form.checkOutDate" /></label>

        <label>성인 <input type="number" min="1" v-model.number="form.numAdults" /></label>
        <label>어린이 <input type="number" min="0" v-model.number="form.numChildren" /></label>

        <label>예약 상태
          <select v-model="form.statusType">
            <option value="active">확정</option>
            <option value="pending">대기</option>
            <option value="cancel">취소</option>
          </select>
        </label>

        <label>결제 상태
          <select v-model="form.paymentType">
            <option value="paid">결제완료</option>
            <option value="due">미결제</option>
            <option value="refund">환불</option>
          </select>
        </label>
      </div>

      <div class="actions">
        <button class="btn" @click="$emit('save', form)">저장</button>
        <button class="btn-outline" @click="$emit('cancel')">취소</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, toRaw } from 'vue'

const props = defineProps({
  editing: { type: Object, required: true }
})
defineEmits(['save', 'cancel'])

const form = ref({ ...props.editing })
watch(() => props.editing, (v) => { form.value = { ...v } }, { immediate: true, deep: true })
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal { background: #fff; padding: 28px; border-radius: 14px; box-shadow: 0 10px 32px rgba(0,0,0,0.25); width: 420px; animation: pop 0.25s ease; }
.modal h2 { margin: 0 0 16px; font-size: 20px; font-weight: 700; color: var(--primary-ink); }
.form { display: flex; flex-direction: column; gap: 14px; }
.form label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 600; color: #374151; }
.form input, .form select { padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; }
.form input:focus, .form select:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }

.btn { background:#22c55e; color:#fff; border:1px solid #22c55e; padding:8px 12px; border-radius: var(--radius-sm); transition: background-color .18s var(--ease), transform .08s ease-out, box-shadow .18s var(--ease); }
.btn:hover:not(:disabled) { background:#16a34a; border-color:#16a34a; transform: translateY(-1px); box-shadow: var(--shadow); }
.btn:active:not(:disabled) { transform: translateY(0); box-shadow: var(--shadow-soft); }

.btn-outline { border:1px solid var(--border); background:#fff; color:var(--primary-ink); padding: 8px 12px; border-radius: var(--radius-sm); }
.btn-outline:hover { border-color: var(--border-strong); background:#f8fafc; }

@keyframes pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>

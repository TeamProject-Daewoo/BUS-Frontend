<template>
  <table class="table">
    <thead>
      <tr>
        <th style="width:42px"><input type="checkbox" :checked="allChecked" @change="$emit('toggle-all', $event)" /></th>
        <th style="width:110px">예약 ID</th>
        <th>고객</th>
        <th style="width:160px">객실</th>
        <th style="width:130px">연락처</th>
        <th style="width:100px">성인</th>
        <th style="width:130px">체크인</th>
        <th style="width:130px">체크아웃</th>
        <th style="width:160px">예약일시</th>
        <th style="width:110px">예약 상태</th>
        <th style="width:56px;">관리</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="r in rows" :key="r.reservationId">
        <td><input type="checkbox" :checked="checkedSet.has(r.reservationId)" @change="$emit('toggle', r.reservationId)" /></td>
        <td class="id">{{ r.reservationId }}</td>

        <!-- 고객 -->
        <td class="customer">
          <div class="avatar" :style="{ background: avatarColor(r.customerName) }">{{ initials(r.customerName) }}</div>
          <div class="c-info">
            <div class="c-name">{{ r.customerName || '-' }}</div>
            <div class="c-sub">{{ r.userEmail || r.userName || '-' }}</div>
          </div>
        </td>

        <!-- 객실 -->
        <td :title="titleTooltip(r)"><span class="room-name">{{ resolvedRoomTitle(r) }}</span></td>

        <!-- 연락처 -->
        <td>{{ r.userPhone || r.reservPhone || '-' }}</td>
        <td>{{ r.numAdults ?? '-' }}</td>
        <td>{{ dt(r.checkInDate) }}</td>
        <td>{{ dt(r.checkOutDate) }}</td>
        <td>{{ formatDateTime(r.reservationDate) }}</td>

        <!-- 예약 상태 -->
        <td>
          <span 
            class="badge"
            :class="{ 
            warning: isCancelling[r.reservationId] || r.statusType === 'pending', 
            success: !isCancelling[r.reservationId] && r.statusType==='active', 
            danger: !isCancelling[r.reservationId] && r.statusType==='cancel',
          }">
            {{ isCancelling[r.reservationId] ? '취소 중..' : r.statusLabel }}
          </span>
        </td>
        <td style="padding-left: 8px;">
          <button 
            :disabled="currentDate >= r.checkInDate || r.statusType!=='active' || isCancelling[r.reservationId]" 
            class="cancel-btn" 
            @click="$emit('delete', r)"
          >
            {{ isCancelling[r.reservationId] ? '처리 중' : '취소' }}
          </button>
        </td>
      </tr>

      <tr v-if="!rows.length"><td colspan="13" class="empty">데이터가 없습니다</td></tr>
    </tbody>
  </table>
</template>

<script setup>
const today = new Date();
const currentDate = today.toJSON().slice(0, 10);

const props = defineProps({
  rows: { type: Array, default: () => [] },
  allChecked: { type: Boolean, default: false },
  checkedSet: { type: Object, required: true }, // Set
  dt: { type: Function, required: true },
  formatDateTime: { type: Function, required: true },
  resolvedRoomTitle: { type: Function, required: true },
  titleTooltip: { type: Function, required: true },
  isCancelling: { type: Object }
})
defineEmits(['toggle', 'toggle-all', 'edit'])

// local helpers (원본 유틸 그대로 동작)
function initials(name){ const v=(name||'').trim(); if(!v) return '—'; const parts=v.split(/\s+/); return (parts[0][0]||'')+(parts[1]?.[0]||'') }
function avatarColor(seed){ const s=(seed||'A').charCodeAt(0); const h=(s*37)%360; return `hsl(${h} 70% 90%)` }
</script>

<style scoped>
.table { width:100%; border-collapse:separate; min-width:1040px; border-spacing:0; }
thead th { position:sticky; top:0; background:#f9fafb; z-index:1; box-shadow: 0 1px 0 #eef2f7; }
th, td { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-size:14px; text-align:left; }
tbody tr:nth-child(even) td { background:#fcfcfd; }
tbody tr:hover td { background:#f8fafc; }

.customer { display:flex; align-items:center; gap:10px; }
.avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; color:#374151; border:1px solid var(--border); background:#eef2ff; }
.c-info .c-name { font-weight:600; color:#111827; }
.c-info .c-sub { font-size:12px; color:var(--muted); }

.badge { padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; }
.badge.success{ background:#e6f7ee; color:#16a34a; }
.badge.warning{ background:#fff7e6; color:#d97706; }
.badge.danger{  background:#ffe6e6; color:#dc2626; }

.pay { font-weight:700; font-size:12px; }
.pay.paid { color:#16a34a; }
.pay.due  { color:#d97706; }

.id { color:var(--primary); font-weight:600; }

.cancel { text-align: left; justify-content: start;}
.cancel-btn { padding:4px 8px; text-align:left; background:#fff; border:none; cursor:pointer; font-size:14px; border: 1px solid rgb(157, 157, 157); border-radius: 50px;}
.cancel-btn:hover { background:#f9fafb; }
.cancel-btn:disabled { cursor: default; border: 1px solid rgb(210, 210, 210);}

.room-name { font-weight:600; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(-5px); }
.fade-slide-enter-to { opacity: 1; transform: translateY(0); }
.fade-slide-leave-from { opacity: 1; transform: translateY(0); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-5px); }

.empty { text-align:center; color:#6b7280; }
</style>

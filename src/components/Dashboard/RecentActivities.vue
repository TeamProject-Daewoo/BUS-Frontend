<template>
  <div class="panel tall">
    <div class="panel-head"><h3>최근 활동</h3></div>

    <div class="timeline scroll" v-if="items.length">
      <div class="tl-item" v-for="a in items" :key="a.id">
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
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ reservations: { type:Array, default:()=>[] } })

const dOnly = (v) => (v ? String(v).slice(0,10) : '')
const isCanceled = (s) => (s || '').toUpperCase().includes('CANCEL') || (s || '').includes('취소')
const roomTitleOf = (r) => (r.roomtitle || r.roomTitle || r.title || r.roomcode || '미지정').toString().trim()
const guestNameOf = (r) => r.reservName || r.userDisplayName || r.customerName || r.name || r.userName || r.username || '고객'

const items = computed(() => {
  const titleOf = (r) => {
    const room = roomTitleOf(r); const guest = guestNameOf(r)
    return isCanceled(r.status) ? `예약 취소 · ${room} · ${guest}` : `예약 접수 · ${room} · ${guest}`
  }
  return props.reservations.slice()
    .sort((a,b)=>(b.reservationDate||'').localeCompare(a.reservationDate||''))
    .slice(0,6)
    .map(r => ({
      id: r.reservationId ?? `${roomTitleOf(r)}|${guestNameOf(r)}|${r.reservationDate}`,
      title: titleOf(r),
      timeAgo: (r.reservationDate||'').replace('T',' ')
    }))
})
</script>

<style scoped>
.panel.tall{ display:flex; flex-direction:column; min-height:430px; }
.scroll{ overflow:auto; max-height:350px; padding-right:6px; flex:1; }
</style>

<!-- src/components/Dashboard/NewCustomers.vue -->
<template>
  <div class="panel tall">
    <div class="panel-head">
      <h3>신규 고객</h3>
      <button class="muted linklike" @click="openCustomersModal">전체 보기</button>
    </div>

    <ul class="people scroll">
      <li v-for="c in top6" :key="c.id" class="people-item">
        <div class="avatar avatar-grad">{{ initials(c.name) }}</div>
        <div class="meta">
          <div class="title">
            {{ c.name }}
            <span class="chip">신규</span>
          </div>
          <div class="sub">{{ c.email || '이메일 없음' }}</div>
        </div>
        <div class="arrow">›</div>
      </li>
      <li v-if="top6.length === 0" class="empty">데이터가 없습니다.</li>
    </ul>

    <!-- 모달: body로 텔레포트 -->
    <Teleport to="body">
      <div v-if="show" class="overlay" @click.self="closeCustomersModal">
        <div class="modal" role="dialog" aria-modal="true" aria-label="신규 고객 전체 보기">
          <div class="modal-head">
            <h3>신규 고객 전체</h3>
            <button class="iconbtn" @click="closeCustomersModal" aria-label="닫기">×</button>
          </div>

          <div class="modal-body">
            <ul class="people">
              <li v-for="c in pageItems" :key="c.id" class="people-item">
                <div class="avatar avatar-grad">{{ initials(c.name) }}</div>
                <div class="meta">
                  <div class="title">
                    {{ c.name }}
                    <span class="chip">신규</span>
                  </div>
                  <div class="sub">{{ c.email || '이메일 없음' }}</div>
                </div>
                <div class="arrow">›</div>
              </li>
              <li v-if="pageItems.length === 0" class="empty">표시할 고객이 없습니다.</li>
            </ul>
          </div>

          <div class="modal-foot">
            <div class="pagi">
              <button class="pbtn" @click="page = 1" :disabled="page === 1">«</button>
              <button class="pbtn" @click="page--" :disabled="page === 1">‹</button>

              <button
                v-for="p in windowPages"
                :key="'p' + p"
                class="pbtn"
                :class="{ active: p === page }"
                @click="page = p"
              >{{ p }}</button>

              <button class="pbtn" @click="page++" :disabled="page === pageCount">›</button>
              <button class="pbtn" @click="page = pageCount" :disabled="page === pageCount">»</button>

              <span class="muted small">총 {{ all.length }}명 · {{ PAGE_SIZE }}개/페이지</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

/** props: 예약 배열 주입 */
const props = defineProps({
  reservations: { type: Array, default: () => [] },
})

/** 상태 */
const PAGE_SIZE = 5
const show = ref(false)
const page = ref(1)

/** 예약에서 고객명/이메일 뽑기 */
const emailOf = (r) =>
  r.email ?? r.userEmail ?? r.user?.email ?? r.customerEmail ?? r.customer?.email ??
  r.user_name ?? r.userName ?? r.username ?? ''
const nameOf = (r) =>
  r.reservName || r.userDisplayName || r.customerName || r.name || r.userName || r.username || '고객'

/** 전체 고객(중복 제거: 이름+이메일) 최신순 */
const all = computed(() => {
  const list = props.reservations
    .slice()
    .sort((a, b) => (b.reservationDate || '').localeCompare(a.reservationDate || ''))
  const out = []
  const seen = new Set()
  for (const r of list) {
    const name = nameOf(r)
    const email = emailOf(r)
    const key = (name || '') + '|' + (email || '')
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ id: r.reservationId ?? key, name, email })
  }
  return out
})

/** 패널에 표시될 상위 6명 */
const top6 = computed(() => all.value.slice(0, 6))

/** 모달 페이지네이션 */
const pageCount = computed(() => Math.max(1, Math.ceil(all.value.length / PAGE_SIZE)))
const pageItems = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return all.value.slice(start, start + PAGE_SIZE)
})
const windowPages = computed(() => {
  // 페이지 버튼은 최대 5개만 노출 (페이지 수는 제한 없음)
  const MAX_BTN = 5
  const total = pageCount.value
  const half = Math.floor(MAX_BTN / 2)
  let start = Math.max(1, page.value - half)
  let end = Math.min(total, start + MAX_BTN - 1)
  start = Math.max(1, Math.min(start, Math.max(1, total - MAX_BTN + 1)))
  end = Math.min(total, Math.max(start + MAX_BTN - 1, MAX_BTN))
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

/** 모달 열기/닫기 + ESC */
function openCustomersModal() {
  show.value = true
  page.value = 1
}
function closeCustomersModal() {
  show.value = false
}
function onKey(e) {
  if (e.key === 'Escape' && show.value) closeCustomersModal()
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))


/** 모달 열릴 때 배경 스크롤 잠금 */
/*
watch(show, (open) => {
  const lock = open ? 'hidden' : ''
  document.documentElement.style.overflow = lock
  document.body.style.overflow = lock
})
onUnmounted(() => {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
})
*/

/** 아바타 이니셜 */
const initials = (name) => {
  if (!name) return '•'
  const s = String(name).trim()
  try {
    const seg = new Intl.Segmenter('ko', { granularity: 'grapheme' })
    const iter = seg.segment(s)[Symbol.iterator]()
    const first = iter.next().value?.segment
    return (first || s[0]).toUpperCase?.() ?? '•'
  } catch {
    return (s[0] || '•').toUpperCase?.() ?? '•'
  }
}

defineExpose({ PAGE_SIZE })
</script>

<style scoped>
/* 패널 내 리스트 */
.scroll { overflow: auto; max-height: 260px; padding-right: 6px; flex: 1; }
.linklike { background: none; border: none; padding: 0; cursor: pointer; text-decoration: underline; }

/* 고객 리스트 비주얼 */
.people { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.people-item {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  border: 1px solid #f1f5f9; border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfd 100%);
  transition: transform .15s ease, box-shadow .15s ease, border-color .2s ease;
}
.people-item:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(2,6,23,0.06); border-color: #e2e8f0; }
.avatar { min-width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #0f172a; background: #eef2ff; }
.avatar-grad { background: conic-gradient(from 200deg, #dbeafe, #ede9fe, #dcfce7, #ffe4e6, #dbeafe); color: #0f172a; }
.meta { flex: 1; min-width: 0; }
.title { font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; }
.sub { color: #6b7280; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chip { background: #eef2ff; color: #4f46e5; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 999px; }
.arrow { color: #cbd5e1; font-size: 20px; line-height: 1; }

/* 모달 오버레이 */
.overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15,23,42,0.45);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal {
  width: 520px; max-width: 92vw; max-height: 86vh;
  display: flex; flex-direction: column;
  background: #fff; border-radius: 16px;
  box-shadow: 0 30px 60px rgba(2,6,23,.25);
  border: 1px solid #eef2f7;
}
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f1f5f9; }
.modal-head h3 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
.iconbtn { background: #111827; color: #fff; border: none; width: 32px; height: 32px; border-radius: 10px; font-size: 20px; line-height: 1; cursor: pointer; }
.iconbtn:hover { background: #374151; }
.modal-body { padding: 14px 16px; overflow: auto; }
.modal-foot { padding: 10px 12px; border-top: 1px solid #f1f5f9; display: flex; justify-content: center; }

/* 페이지네이션 */
.pagi { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pbtn {
  min-width: 32px; height: 32px; padding: 0 8px;
  border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; cursor: pointer;
  font-weight: 700; color: #334155;
}
.pbtn:hover { background: #f8fafc; }
.pbtn[disabled] { opacity: .4; cursor: not-allowed; }
.pbtn.active { background: #111827; color: #fff; border-color: #111827; }
.small { font-size: 12px; margin-left: 6px; }
</style>

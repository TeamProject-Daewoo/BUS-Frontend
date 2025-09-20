<!-- src/views/HotelsSelectView.vue -->
<template>
  <div class="page">
    <h1>호텔 설정</h1>

    <!-- 현재 선택된 호텔 안내 -->
    <div v-if="selectedHotel" class="selected-hint">
      현재 선택된 호텔: <strong>{{ selectedHotel.title || selectedHotel.contentid }}</strong>
    </div>

    <div v-if="store.loading" class="hint">불러오는 중…</div>
    <div v-else-if="!store.hotels.length" class="hint">표시할 호텔이 없습니다.</div>

    <div class="grid">
      <!-- 호텔 카드들 -->
      <div
        class="card hotel"
        v-for="h in store.hotels"
        :key="h.contentid"
        :class="{ selected: h.contentid === store.selectedContentId }"
        role="button"
        tabindex="0"
        @click="choose(h.contentid)"
        @keydown.enter.prevent="choose(h.contentid)"
        @keydown.space.prevent="choose(h.contentid)"
      >
        <div class="thumb">
          <img :src="thumbOf(h)" :alt="(h.title || h.contentid) + ' 이미지'" loading="lazy" />
          <span v-if="h.contentid === store.selectedContentId" class="chip sel over">선택됨</span>
        </div>

        <div class="title">
          {{ h.title || '(제목 없음)' }}
        </div>
        <div class="addr">{{ h.addr1 || '-' }}</div>
        <div class="cid">contentid: {{ h.contentid }}</div>

        <div class="actions">
          <!-- 수정으로 이동 (카드 클릭 이벤트 버블링 방지) -->
          <RouterLink
            class="btn"
            :to="{ name: 'settings-edit', params: { contentid: h.contentid } }"
            @click.stop
          >수정</RouterLink>
        </div>
      </div>

      <!-- 추가 카드 (맨 뒤) -->
      <div
        class="card hotel add"
        role="button"
        tabindex="0"
        @click="goCreate"
        @keydown.enter.prevent="goCreate"
        @keydown.space.prevent="goCreate"
        aria-label="호텔 추가"
      >
        <div class="thumb add-thumb">
          <div class="plus">＋</div>
        </div>
        <div class="title">호텔 추가</div>
        <div class="addr">새 호텔을 등록합니다</div>
        <div class="actions">
          <button class="btn" @click.stop="goCreate">추가</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'

const store = useHotelStore()
const router = useRouter()

onMounted(async () => {
  if (!store.hotels.length) await store.loadHotels()
})

function choose(contentid) {
  store.setSelected(contentid)
}

function goCreate() {
  router.push({ name: 'settings-create' })
}

// 대표 이미지 없으면 플레이스홀더
function thumbOf(h) {
  return h.firstimage || 'https://placehold.co/640x360?text=No+Image'
}

const selectedHotel = computed(() =>
  store.hotels.find(h => h.contentid === store.selectedContentId) || null
)
</script>

<style scoped>
.page { max-width: 100%; margin: 0 auto; }
.hint { margin: 12px 0; color:#6b7280; }
.selected-hint { margin: 8px 0 12px; color:#334155; }

/* --- 3열 카드 그리드 --- */
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)); /* 기본 3개 */
  gap: 16px;
  margin-top: 12px;
}
@media (max-width: 1100px) {
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
}

/* 카드 */
.card {
  border:1px solid #e5e7eb;
  border-radius:12px;
  background:#fff;
  padding:14px;
  cursor:pointer;
  outline: none;
  transition: background .15s ease, border-color .15s ease, transform .15s ease, box-shadow .15s ease;
}
.card:hover { border-color:#d1d5db; background:#fafafa; transform: translateY(-1px); }
.card:focus { box-shadow: 0 0 0 3px rgba(59,130,246,.35); }
.card.selected { border-color:#16a34a; background:#f0fdf4; }

/* 추가 카드 강조 */
.card.add { display:flex; flex-direction:column; align-items:center; text-align:center; }

/* 썸네일 (16:9) */
.thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  background:#f1f5f9;
  border-radius:10px;
  overflow:hidden;
  margin-bottom:10px;
  position: relative;
}
.thumb img {
  width:100%;
  height:100%;
  object-fit: cover;
  display:block;
}

/* 추가 카드 썸네일(점선 + 플러스) */
.add-thumb {
  border:2px dashed #cbd5e1;
  display:flex;
  align-items:center;
  justify-content:center;
}
.plus {
  font-size: 44px;
  line-height: 1;
  color:#64748b;
  user-select:none;
}

/* 텍스트들 */
.hotel .title { font-weight:700; font-size:16px; margin-bottom:6px; display:flex; align-items:center; gap:8px; }
.addr { color:#6b7280; font-size:13px; margin-bottom:6px; }
.cid { color:#9ca3af; font-size:12px; }

.actions { margin-top: 10px; }
.btn {
  display:inline-block; padding:8px 12px; border-radius:8px;
  background:#111827; color:#fff; text-decoration:none; font-weight:600;
  cursor: pointer;
}
.btn:hover { opacity:.95; }

/* 배지 */
.chip.sel { background:#dcfce7; color:#16a34a; font-weight:700; font-size:11px; padding:2px 6px; border-radius:999px; }
.chip.sel.over { position:absolute; top:8px; left:8px; }
</style>

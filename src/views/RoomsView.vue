<template>
  <div>
    <h1>객실 관리</h1>

    <div class="toolbar" v-if="store.selectedContentId">
      <button class="btn" @click="goCreate">객실 추가</button>
      
    </div>

    <div class="hint" v-if="!store.selectedContentId">
      사이드바 또는 <RouterLink to="/hotels">호텔 선택</RouterLink>에서 호텔을 먼저 선택하세요.
    </div>
    <div v-else>
      <!-- 카드 그리드 (4열) -->
      <div class="room-grid">
        <div class="room-card" v-for="r in rooms" :key="r.id">
          <div class="thumb">
            <!-- 메인 이미지 -->
            <img
              :src="mainImgOf(r)"
              :alt="`${r.roomtitle} 사진`"
              loading="lazy"
              referrerpolicy="no-referrer"
              crossorigin="anonymous"
              @error="onImgError($event, r)"
            />
            <div class="chip people">기준 {{ r.roombasecount }} · 최대 {{ r.roommaxcount }}</div>
            <div class="chip price">₩ {{ n(r.roomoffseasonminfee1) }} ~ {{ n(r.roompeakseasonminfee1) }}</div>
          </div>

          <div class="body">
            <div class="title" :title="r.roomtitle">{{ r.roomtitle }}</div>

            <!-- 썸네일 스트립 -->
            <ul class="thumbs" v-if="thumbs(r).length">
              <li v-for="(t, i) in thumbs(r)" :key="i">
                <img
                  :src="safeUrl(t)"
                  loading="lazy"
                  @click="setMain(r.id, t)"  
                  @error="onThumbError($event, t)"
                />
              </li>
            </ul>

            <ul class="amenities">
              <li v-for="a in amenitiesOf(r)" :key="a.key"><span class="i">{{ a.icon }}</span>{{ a.label }}</li>
              <li v-if="!amenitiesOf(r).length" class="dim">옵션 정보 없음</li>
            </ul>
          </div>

          <div class="actions">
            <!-- 객실 수 -->
            <div class="room-count-wrapper">
              <span class="room-count">객실 수 : {{ r.roomcount > 0 ? r.roomcount + '실' : '0실' }}</span>
              <div class="counter-buttons">
                <button class="arrow-btn up" @click="adjustRoomCount(r, 1)">▲</button>
                <button
                  class="arrow-btn down"
                  @click="adjustRoomCount(r, -1)"
                  :disabled="r.roomcount <= 0"
                >▼</button>
              </div>
            </div>

            <!-- 버튼 묶음 -->
            <div class="action-buttons">
              <button class="btn-outline" @click="goEdit(r)">수정</button>
              <button class="btn-danger" @click="remove(r.id)">삭제</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 수정 다이얼로그 (정보 + 이미지 탭) -->
      <dialog ref="dlg">
        <div class="card">
          <h3>객실 수정</h3>
          <div class="tabs">
            <button :class="['tab', tab === 'info' && 'active']" @click="tab = 'info'">정보</button>
            <button :class="['tab', tab === 'images' && 'active']" @click="tab = 'images'">이미지</button>
          </div>

          <!-- 정보 탭 -->
          <div v-if="tab === 'info'" class="grid">
            <input v-model="editForm.roomtitle" placeholder="객실명" />
            <input v-model.number="editForm.roombasecount" type="number" placeholder="기준인원" />
            <input v-model.number="editForm.roommaxcount" type="number" placeholder="최대인원" />
            <input v-model.number="editForm.roomoffseasonminfee1" type="number" placeholder="비수기 요금" />
            <input v-model.number="editForm.roompeakseasonminfee1" type="number" placeholder="성수기 요금" />
          </div>

          <!-- 이미지 탭 -->
          <div v-else class="images-grid">
            <div class="img-item" v-for="idx in 5" :key="idx">
              <label>roomimg{{ idx }}</label>
              <input
                v-model="editForm[`roomimg${idx}`]"
                placeholder="이미지 URL을 입력하세요"
                @input="touchPreview(idx)"
              />
              <div class="preview">
                <img
                  :src="previewSrc(idx)"
                  alt="preview"
                  loading="lazy"
                  @error="onPreviewError($event, idx)"
                />
              </div>
            </div>
          </div>

          <div class="actions" style="justify-content: flex-end">
            <button class="btn" @click="save">저장</button>
            <button class="btn-outline" @click="close">닫기</button>
          </div>
        </div>
      </dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'
import { getRooms, updateRoomApi, deleteRoomApi } from '@/api/business'
import { useUiStore } from '@/stores/commonUiStore';
import CreateRoomForm from '@/rooms/CreateRoomForm.vue';

const uiStore = useUiStore();
const router = useRouter()
const store = useHotelStore()

const rooms = ref([])
const dlg = ref(null)
const editForm = ref({})
const editingId = ref(null)
const tab = ref('info')

const mainByRoomId = reactive({})  // 객실 ID별로 대표 이미지를 저장

// 객실 수정 페이지로 이동
function goEdit(r) {
  router.push({ path: `/rooms/edit`, query: { id:r.id, contentid:store.selectedContentId } })
}

// 추가 페이지로 이동
function goCreate() {
  if (!store.selectedContentId) return
  router.push({ path: '/rooms/new', query: { contentid: store.selectedContentId } })
}

// 이미지 로드
onMounted(loadOnMount)
watch(() => store.selectedContentId, loadOnMount)

async function loadOnMount() {
  console.log()
  if (!store.selectedContentId) { rooms.value = [] } 
  else await load()
}

async function adjustRoomCount(r, delta) {
  const newValue = (r.roomcount || 0) + delta
  if (newValue < 0) return

  try {
    // 프론트 값 먼저 변경
    r.roomcount = newValue

    // DB 업데이트 API 호출
    await updateRoomApi(r.id, { roomcount: newValue }, store.selectedContentId)
    console.log('roomcount 업데이트 성공:', newValue)
  } catch (e) {
    console.error('roomcount 업데이트 실패', e)
    uiStore.openModal({title:'객실 수 업데이트 실패'})
  }
}

async function load() {
  try {
    const { data } = await getRooms(store.selectedContentId)
    rooms.value = data ?? []

    // 대표 이미지 초기화 (https 강제 적용)
    rooms.value.forEach((r) => {
      const th = thumbs(r)
      mainByRoomId[r.id] = th[0] || imgSrc(r) // 대표 이미지 설정
    })
  } catch (e) {
    console.error('[rooms] load failed', e)
    rooms.value = []
  }
}

async function save() {
  try {
    await updateRoomApi(editingId.value, editForm.value, store.selectedContentId)
    close()
    await load()
  } catch (e) {
    console.error('[rooms] update failed', e)
  }
}

async function remove(id) {
  if (!confirm('삭제할까요?')) return
  try {
    await deleteRoomApi(id, store.selectedContentId)
    await load()
  } catch (e) {
    console.error('[rooms] delete failed', e)
  }
}

function n(v) { return (v ?? 0).toLocaleString() }

// 메인 이미지 변경
function setMain(roomId, url) {
  mainByRoomId[roomId] = safeUrl(url) // 클릭된 썸네일 이미지 URL을 메인 이미지로 설정
}

/* ===== 이미지 유틸: visitkorea http→https 강제 + 프록시 폴백 ===== */

function addOriginIfMissing(u) {
  const s = String(u || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s) || s.startsWith('//')) return s
  if (s.startsWith('/cms/')) return 'https://tong.visitkorea.or.kr' + s
  return s
}

function normalizeVisitKorea(u) {
  const s = addOriginIfMissing(u)
  if (!s) return ''
  return s.replace(/^http:\/\/(tong\.visitkorea\.or\.kr)/i, 'https://$1')
}

function safeUrl(u) {
  return viaProxy(u) // 이미지 요청을 프록시 서버를 통해
}

function viaProxy(u) {
  const fixed = normalizeVisitKorea(u)
  const naked = String(fixed || '').trim().replace(/^https?:\/\//i, '')
  return 'https://wsrv.nl/?url=' + encodeURIComponent(naked) // 프록시 URL
}

function candidateImages(r) {
  return [
    r.roomimg1, r.roomimg2, r.roomimg3, r.roomimg4, r.roomimg5,
    r.firstimage, r.image, r.photo, r.thumbnail
  ].filter(Boolean)
}

function imgSrc(r) {
  const c = candidateImages(r)
  if (c.length) return safeUrl(c[0]) // safeUrl로 변경하여 프록시 URL로 이미지 로드
  return placeholderImg(r.roomtitle)
}

function mainImgOf(r) {
  return mainByRoomId[r.id] || imgSrc(r) // mainByRoomId를 사용할 때도 safeUrl로 변경
}

function thumbs(r) {
  return candidateImages(r).map(safeUrl).slice(0, 5)
}

// 이미지 오류: https 강제 후보들 → 프록시 → 플레이스홀더
function onImgError(e, r) {
  const el = e.target
  el.src = placeholderImg(r.roomtitle)
}

function onThumbError(e) {
  e.target.src = placeholderImg('T')
}

function previewSrc(idx) {
  const v = editForm.value[`roomimg${idx}`]
  if (!v) return placeholderImg(editForm.value.roomtitle || '미리보기')
  return safeUrl(v) // v가 있을 때 safeUrl로 이미지 URL 요청
}
function touchPreview() {
  // v-model + previewSrc로 즉시 반영되므로 추가 작업 없음
}
function onPreviewError(e, idx) {
  e.target.src = placeholderImg(`IMG${idx}`)
}

function placeholderImg(title = '객실') {
  const t = String(title || 'R').trim()
  const initials = t.slice(0, 2).toUpperCase()
  const code = (t.charCodeAt(0) || 65) * 11
  const h1 = code % 360
  const h2 = (h1 + 40) % 360
  const c1 = `hsl(${h1} 85% 82%)`
  const c2 = `hsl(${h2} 80% 74%)`
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>
      </linearGradient></defs>
      <rect width='800' height='500' fill='url(#g)'/>
      <text x='50%' y='55%' font-family='system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
            font-size='140' font-weight='700' text-anchor='middle' fill='rgba(0,0,0,.45)'>
        ${initials}
      </text>
    </svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

/* 옵션(편의시설) */
const AMENITIES = [
  { key:'roomaircondition',  label:'에어컨',     icon:'❄️' },
  { key:'roombath',          label:'욕조',       icon:'🛁' },
  { key:'roombathfacility',  label:'욕실용품',   icon:'🧴' },
  { key:'roomcable',         label:'유선 TV',    icon:'📺' },
  { key:'roomtv',            label:'TV',         icon:'📺' },
  { key:'roominternet',      label:'인터넷',     icon:'🌐' },
  { key:'roompc',            label:'PC',         icon:'💻' },
  { key:'roomcook',          label:'취사 가능',  icon:'🍳' },
  { key:'roomrefrigerator',  label:'냉장고',     icon:'🧊' },
  { key:'roomhairdryer',     label:'헤어드라이어',icon:'🌀' },
  { key:'roomhometheater',   label:'홈시어터',   icon:'🎬' },
  { key:'roomsofa',          label:'소파',       icon:'🛋️' },
  { key:'roomtable',         label:'테이블',     icon:'🪑' },
  { key:'roomtoiletries',    label:'세면용품',   icon:'🧼' }
]
function isOn(v){
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return false
  return !['n','no','false','0','x','없음','미지원'].includes(s)
}
function amenitiesOf(r){
  return AMENITIES.filter(a => isOn(r[a.key]))
}
</script>

<style scoped>
/* 공통 */
.toolbar { display: flex; justify-content: flex-end; margin: 12px 0; gap: 8px; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.card { padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; margin: 12px 0; background: #fff; }
.hint { margin: 12px 0; color: #6b7280; }

.btn {
  background: #22c55e;
  color: #fff;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  transition: .18s;
  font-size: 16px;
}

.btn:hover {
  background: #16a34a;
  transform: translateY(-1px);
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}
@media (max-width: 1280px) { .room-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 920px)  { .room-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px)  { .room-grid { grid-template-columns: 1fr; } }

.room-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .04);
  transition: box-shadow .18s, transform .12s;
}
.room-card:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, .08); transform: translateY(-2px); }

.thumb { position: relative; aspect-ratio: 16 / 10; background: #f3f4f6; overflow: hidden; }
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

.chip {
  position: absolute;
  left: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, .9);
  color: #111827;
  border: 1px solid rgba(0, 0, 0, .06);
}
.chip.people { bottom: 10px; }
.chip.price  { bottom: 10px; right: 10px; left: auto; }

.body { padding: 12px 12px 8px; display: flex; flex-direction: column; gap: 10px; }
.title { font-weight: 700; font-size: 16px; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.thumbs { display: flex; gap: 8px; padding: 0; margin: 0; list-style: none; overflow-x: auto; }
.thumbs li { width: 64px; height: 64px; cursor: pointer; }
.thumbs img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }

.amenities { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: 0; }
.amenities li {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px; background: #f8fafc; border: 1px solid #e5e7eb;
  border-radius: 999px; font-size: 12px; color: #374151;
}
.amenities .i { font-size: 13px; line-height: 1; }
.amenities .dim { color: #9ca3af; background: #fff; border-style: dashed; }

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  margin-top: auto;
  border-top: 1px solid #eef2f7;
  background: #fafafa;
}

.room-count-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.counter-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 6px;
}

.arrow-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  width: 24px;
  height: 24px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  border-radius: 4px;
  transition: background 0.2s;
}
.arrow-btn:hover { background: #e5e7eb; }
.arrow-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}
.arrow-btn + .arrow-btn { margin-top: 4px; }
.arrow-btn.up {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.arrow-btn.down {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-outline {
  border: 1px solid #4CAF50;
  background: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  color: #4CAF50;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.3s ease;
}
.btn-outline:hover {
  background-color: #4CAF50;
  color: white;
}

.btn-danger {
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.3s ease;
}
.btn-danger:hover {
  background-color: #d32f2f;
}

.room-count {
  font-size: 14px;
  color: #555;
  font-weight: bold;
  display: inline-block;
  margin: 0;
}
</style>

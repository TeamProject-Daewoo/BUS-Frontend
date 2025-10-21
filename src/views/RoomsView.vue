<template>
  <div>
    <h1>객실 관리</h1>

    <!-- 상단 툴바 -->
    <div class="toolbar" v-if="store.selectedContentId">
      <div class="stats">
        <div class="stat-pill reserved" title="예약(취소 제외) 총 건수">
          <span class="label">예약</span>
          <span class="value">{{ n(reservedTotal) }}</span>
        </div>
        <div class="stat-pill inuse" title="현재 투숙 중(체크아웃 전) 건수">
          <span class="label">투숙 중</span>
          <span class="value">{{ n(inUseTotal) }}</span>
        </div>
        <div class="stat-pill planned" title="체크인 예정(취소 제외) 건수">
          <span class="label">체크인 예정</span>
          <span class="value">{{ n(plannedTotal) }}</span>
        </div>
      </div>

      <div style="display:flex; gap:8px; align-items:center;">
        <button class="btn" @click="goCreate">객실 추가</button>
      </div>
    </div>

    <div class="hint" v-if="!store.selectedContentId">
      사이드바 또는 <RouterLink to="/hotels">호텔 선택</RouterLink>에서 호텔을 먼저 선택하세요.
    </div>

    <!-- 카드 그리드 -->
    <div v-else class="room-grid">
      <div class="room-item" v-for="(r, i) in rooms" :key="keyOf(r, i)">
        <div class="room-card">
          <div class="thumb">
            <img
              :src="mainImgOf(r, i)"
              :alt="`${r.roomtitle || '객실'} 사진`"
              loading="lazy"
              referrerpolicy="no-referrer"
              crossorigin="anonymous"
              @error="onImgError($event, r)"
            />
            <div class="chip people">기준 {{ r.roombasecount }} · 최대 {{ r.roommaxcount }}</div>
            <div class="chip price">₩ {{ n(r.roomoffseasonminfee1) }} ~ {{ n(r.roompeakseasonminfee1) }}</div>
          </div>

          <div class="body">
            <div class="title" :title="r.roomtitle">{{ r.roomtitle || '미지정' }}</div>

            <ul class="thumbs" v-if="thumbs(r).length">
              <li v-for="(t, ti) in thumbs(r)" :key="ti">
                <img
                  :src="safeUrl(t)"
                  loading="lazy"
                  @click="setMain(r, i, t)"
                  @error="onThumbError($event, t)"
                />
              </li>
            </ul>

            <ul class="amenities">
              <li v-for="a in amenitiesOf(r)" :key="a.key">
                <span class="i">{{ a.icon }}</span>{{ a.label }}
              </li>
              <li v-if="!amenitiesOf(r).length" class="dim">옵션 정보 없음</li>
            </ul>
          </div>

          <div class="actions">
            <div class="stock-block">
              <div class="room-count-row">
                <span class="room-count">객실 수 : {{ r.roomcount > 0 ? r.roomcount + '실' : '0실' }}</span>
                <div class="counter-buttons horizontal">
                  <button
                    class="arrow-btn inline minus"
                    @click="openAdjustConfirm(r, -1)"
                    :disabled="(r.roomcount || 0) <= 0"
                  >−</button>
                  <button
                    class="arrow-btn inline plus"
                    @click="openAdjustConfirm(r, +1)"
                  >＋</button>
                </div>
              </div>

              <div class="check-inline">
                <span class="k">체크인 예정</span>
                <span class="v">{{ countCheckinPlanned(r) }}</span>
                <span class="sep">·</span>
                <span class="k">투숙 중</span>
                <span class="v inuse">{{ countCheckinOngoing(r) }}</span>
              </div>

              <div class="more-row">
                <button class="btn-more" @click="toggleMore(keyOf(r, i))">
                  {{ expanded[keyOf(r, i)] ? '닫기' : '더보기' }}
                </button>
              </div>
            </div>

            <div class="action-buttons">
              <button class="btn-outline" @click="goEdit(r)">수정</button>
              <button class="btn-danger" @click="remove(r.id)">삭제</button>
            </div>
          </div>
        </div>

        <!-- 카드 아래 '더보기' 패널 -->
        <transition name="fade">
          <div v-if="expanded[keyOf(r, i)]" class="more-panel">
            <div class="group">
              <div class="group-title">체크인 예정</div>
              <div class="chip-list" v-if="listCheckinPlanned(r).length">
                <div class="guest-chip" v-for="(g, gi) in listCheckinPlanned(r)" :key="'p'+gi">
                  <div class="badge planned">IN 예정</div>
                  <div class="name">{{ g.name }}</div>
                  <div class="meta">{{ g.email }}</div>
                  <div class="meta">{{ g.phone }}</div>
                  <div class="meta small">기간: {{ g.in }} ~ {{ g.out }}</div>
                  <div class="meta small">객실: {{ g.room }}</div>
                  <div class="meta small" :title="`성인 ${g.adults} · 어린이 ${g.children}`">
                    인원: {{ g.pax }}명
                  </div>
                </div>
              </div>
              <div class="empty" v-else>예정 없음</div>
            </div>

            <div class="group">
              <div class="group-title">투숙 중</div>
              <div class="chip-list" v-if="listCheckinOngoing(r).length">
                <div class="guest-chip" v-for="(g, oi) in listCheckinOngoing(r)" :key="'o'+oi">
                  <div class="badge ongoing">IN 중</div>
                  <div class="name">{{ g.name }}</div>
                  <div class="meta">{{ g.email }}</div>
                  <div class="meta">{{ g.phone }}</div>
                  <div class="meta small">기간: {{ g.in }} ~ {{ g.out }}</div>
                  <div class="meta small">객실: {{ g.room }}</div>
                  <div class="meta small" :title="`성인 ${g.adults} · 어린이 ${g.children}`">
                    인원: {{ g.pax }}명
                  </div>
                </div>
              </div>
              <div class="empty" v-else>투숙객 없음</div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 마지막 '객실 추가' 카드 -->
      <button
        class="room-card add-card"
        type="button"
        @click="goCreate"
        aria-label="객실 추가"
      >
        <div class="add-inner">
          <div class="plus">＋</div>
          <div class="add-text">객실 추가</div>
          <div class="add-sub">새 객실을 등록하세요</div>
        </div>
      </button>
    </div>

    <!-- 객실 정보 수정 다이얼로그 -->
    <dialog ref="dlg">
      <div class="card">
        <h3>객실 수정</h3>
        <div class="tabs">
          <button :class="['tab', tab === 'info' && 'active']" @click="tab = 'info'">정보</button>
          <button :class="['tab', tab === 'images' && 'active']" @click="tab = 'images'">이미지</button>
        </div>

        <div v-if="tab === 'info'" class="grid">
          <input v-model="editForm.roomtitle" placeholder="객실명" />
          <input v-model.number="editForm.roombasecount" type="number" placeholder="기준인원" />
          <input v-model.number="editForm.roommaxcount" type="number" placeholder="최대인원" />
          <input v-model.number="editForm.roomoffseasonminfee1" type="number" placeholder="비수기 요금" />
          <input v-model.number="editForm.roompeakseasonminfee1" type="number" placeholder="성수기 요금" />
        </div>

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

    <!-- 확인 모달 -->
    <dialog ref="confirmDlg" class="confirm-dlg">
      <div class="confirm-card">
        <h3 class="confirm-title">객실 수 변경</h3>
        <p class="confirm-text">
          정말 <strong>{{ confirmState.roomTitle }}</strong>의 객실 수를<br />
          <strong>{{ confirmState.current }}</strong>실 → <strong>{{ confirmState.next }}</strong>실로 변경하시겠습니까?
        </p>

        <div class="confirm-actions">
          <button class="confirm-btn cancel" @click="onCancelChange">취소</button>
          <button class="confirm-btn ok" @click="onConfirmChange">변경</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, reactive, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'
import { getRooms, getReservations, updateRoomApi, deleteRoomApi } from '@/api/business'
import { useUiStore } from '@/stores/commonUiStore'

const uiStore = useUiStore()
const router = useRouter()
const store = useHotelStore()

const rooms = ref([])
const reservations = ref([])          // 정규화 + 호텔/날짜 필터 후의 유효 예약만
const dlg = ref(null)
const editForm = ref({})
const editingId = ref(null)
const tab = ref('info')

/** 이미지/확장 패널 상태 (안전키 기반) */
const mainByKey = reactive({})
const expanded = reactive({})

/* ===== 확인 모달 상태 ===== */
const confirmDlg = ref(null)
const confirmState = reactive({
  targetRoom: null,
  delta: 0,
  current: 0,
  next: 0,
  roomTitle: ''
})

/* ===== 공통 유틸 ===== */
const norm = v => String(v ?? '').trim().toLowerCase()
function keyOf(r, i) {
  if (r?.id != null) return `id:${r.id}`
  if (r?.roomcode) return `code:${norm(r.roomcode)}`
  if (r?.roomtitle) return `title:${norm(r.roomtitle)}:${i}`
  return `idx:${i}`
}

/* ===== 날짜 기준 ===== */
const today = new Date().toISOString().slice(0, 10)
const targetDate = today
const INCLUDE_TODAY_AS_PLANNED = true

/* ===== 날짜 파서/보정 ===== */
function toYMD(v) {
  if (v instanceof Date && !isNaN(v)) {
    return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()))
      .toISOString().slice(0,10)
  }
  if (!v && v !== 0) return ''
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{4})[-./]?(\d{1,2})[-./]?(\d{1,2})/)
  if (m) {
    const y = +m[1], mo = String(+m[2]).padStart(2,'0'), d = String(+m[3]).padStart(2,'0')
    return `${y}-${mo}-${d}`
  }
  const d = new Date(s)
  if (!isNaN(d)) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString().slice(0,10)
  return ''
}
function addDays(ymd, n=1) {
  if(!ymd) return ''
  const [y,m,d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m-1, d))
  dt.setUTCDate(dt.getUTCDate()+n)
  return dt.toISOString().slice(0,10)
}

/* ===== 상태 보정 ===== */
function normalizeStatus(x) {
  const s = String(x || '').toUpperCase()
  if (['CANCELLED','CANCEL','CANCELED','REFUND'].includes(s)) return 'cancel'
  if (['PENDING','HOLD','WAIT','UNPAID'].includes(s)) return 'pending'
  if (['DONE','PAID','CONFIRMED','ACTIVE','APPROVED','BOOKED','SUCCESS'].includes(s)) return 'active'
  return 'active'
}

/* ===== 객실명 매핑 ===== */
const titleById = ref({})
const titleByCode = ref({})
const isLikelyCode = (v) => /^[A-Za-z0-9._-]{1,24}$/.test(String(v ?? '').trim())

function roomTitleFromMaps(codeOrId) {
  const idKey = String(codeOrId ?? '').trim()
  const codeKey = norm(codeOrId)
  return titleById.value[idKey] || titleByCode.value[codeKey] || ''
}
function resolvedRoomTitle(row) {
  if (row.roomtitle && String(row.roomtitle).trim()) return String(row.roomtitle).trim()
  const fromMap = roomTitleFromMaps(row.roomcode)
  if (fromMap) return fromMap
  if (!isLikelyCode(row.roomcode)) return String(row.roomcode || '미지정')
  return '미지정'
}
function titleTooltip(row) {
  return `객실: ${resolvedRoomTitle(row)}${row.roomcode ? ` / 코드: ${row.roomcode}` : ''}`
}

/* ===== 상단 통계 ===== */
const reservedTotal = computed(() =>
  (reservations.value || []).filter(r => normalizeStatus(r.status) !== 'cancel').length
)
const inUseTotal = computed(() =>
  (reservations.value || []).filter(isOngoing).length
)
const plannedTotal = computed(() =>
  (reservations.value || []).filter(isPlanned).length
)

/* ===== 상태 판정 (날짜 기반) ===== */
function isCanceled(x){ return normalizeStatus(x.status) === 'cancel' }
function isOngoing(x) {
  if (isCanceled(x)) return false
  const inD  = toYMD(x.checkInDate)
  let outD = toYMD(x.checkOutDate)
  if (!outD || outD <= inD) outD = addDays(inD, 1)
  return !!inD && !!outD && targetDate >= inD && targetDate < outD
}
function isPlanned(x) {
  if (isCanceled(x)) return false
  const inD = toYMD(x.checkInDate)
  return !!inD && (INCLUDE_TODAY_AS_PLANNED ? inD >= today : inD > today)
}

/* ===== 타이틀 정규화/숫자 기반 ===== */
function normalizeTitle(s='') {
  return String(s).toLowerCase().replace(/\s+/g,' ').trim()
}
const extractNums = s => (String(s||'').match(/\d+/g) || []).join('-')
function numberishMatch(a, b) {
  const na = extractNums(a), nb = extractNums(b)
  if (!na || !nb) return false
  return na === nb
}

/* ===== 매칭 ===== */
const stripCode = v => String(v ?? '').replace(/[^A-Za-z0-9]/g,'').toLowerCase()
function matchesRoom(x, r) {
  const idMatch = x.roomId != null && r.id != null && String(x.roomId) === String(r.id)
  if (idMatch) return true

  const rcX = stripCode(x.roomcode || '')
  const rcR = stripCode(r.roomcode || '')
  if (rcX && rcR && rcX === rcR) return true

  const rawTX = resolvedRoomTitle(x)
  const rawTR = r.roomtitle || ''
  const tX = normalizeTitle(rawTX)
  const tR = normalizeTitle(rawTR)
  const bad = (s) => !s || s === '미지정'
  if (!bad(rawTX) && !bad(rawTR) && tX && tR && tX === tR) return true

  return numberishMatch(resolvedRoomTitle(x), r.roomtitle || '')
}

/* ===== 카드별 집계/목록 ===== */
function countCheckinPlanned(r) {
  return (reservations.value || []).filter(x => matchesRoom(x, r) && isPlanned(x)).length
}
function countCheckinOngoing(r) {
  return (reservations.value || []).filter(x => matchesRoom(x, r) && isOngoing(x)).length
}
function toGuest(x){
  const adults = Number(x?.numAdults ?? 0)
  const children = Number(x?.numChildren ?? 0)
  const total = (isNaN(adults) ? 0 : adults) + (isNaN(children) ? 0 : children)
  return {
    name:  x.reservName || x.userDisplayName || x.customerName || x.name || x.guestName || '-',
    email: x.userEmail || x.email || x.userName || x.account || '-',
    phone: x.userPhone || x.phone || x.reservPhone || x.guestPhone || '-',
    room:  resolvedRoomTitle(x),
    in:    x.checkInDate,
    out:   x.checkOutDate,
    adults,
    children,
    pax: total
  }
}
function listCheckinPlanned(r){
  return (reservations.value || [])
    .filter(x => matchesRoom(x, r) && isPlanned(x))
    .map(toGuest)
}
function listCheckinOngoing(r){
  return (reservations.value || [])
    .filter(x => matchesRoom(x, r) && isOngoing(x))
    .map(toGuest)
}
function toggleMore(k){ expanded[k] = !expanded[k] }

/* ===== 라우팅/모달 ===== */
function goEdit(r) {
  router.push({ path: `/rooms/edit`, query: { id: r.id, contentid: store.selectedContentId } })
}
function goCreate() {
  if (!store.selectedContentId) return
  router.push({ path: '/rooms/new', query: { contentid: store.selectedContentId } })
}
function close() { try { dlg.value?.close?.() } catch {} }

/* ===== 데이터 로드 ===== */
onMounted(loadOnMount)
watch(() => store.selectedContentId, loadOnMount)

async function loadOnMount() {
  if (!store.selectedContentId) {
    rooms.value = []
    reservations.value = []
    titleById.value = {}
    titleByCode.value = {}
  } else {
    await Promise.all([loadRooms(), loadReservationsForHotel()])
  }
}

async function loadRooms() {
  try {
    const { data } = await getRooms(store.selectedContentId)
    rooms.value = Array.isArray(data) ? data : []

    rooms.value.forEach((r, i) => {
      const th = thumbs(r)
      const k = keyOf(r, i)
      mainByKey[k] = th[0] ? safeUrl(th[0]) : imgSrc(r)
    })

    titleById.value = Object.fromEntries(
      rooms.value
        .filter(r => r.id != null)
        .map(r => [String(r.id), String(r.roomtitle ?? '').trim()])
    )
    titleByCode.value = Object.fromEntries(
      rooms.value
        .filter(r => !!r.roomcode)
        .map(r => [norm(r.roomcode), String(r.roomtitle ?? '').trim()])
    )
  } catch (e) {
    console.error('[rooms] load failed', e)
    rooms.value = []
    titleById.value = {}
    titleByCode.value = {}
  }
}

/* ===== 예약 정규화 ===== */
function normalizeReservation(x){
  const pick = (obj, keys) => keys.map(k => obj?.[k]).find(v => v !== undefined && v !== null && v !== '')

  const checkInRaw  = pick(x, ['checkInDate','check_in','check_in_date','checkin','inDate','arrival','startDate','start_date','from','fromDate'])
  const checkOutRaw = pick(x, ['checkOutDate','check_out','check_out_date','checkout','outDate','departure','endDate','end_date','to','toDate'])
  const statusRaw   = pick(x, ['status','reservationStatus','state','bookingStatus','paymentStatus'])

  const roomIdRaw   = pick(x, ['roomId','room_id','roomid','roomID'])
  const roomCodeRaw = pick(x, ['roomcode','roomCode','room_code','roomNo','room_no','roomNumber'])
  const roomTitleRaw= pick(x, ['roomtitle','roomTitle','room_name','roomName','room','productName','roomTypeName','title'])

  const nameRaw     = pick(x, ['reservName','userDisplayName','customerName','name','guestName','buyerName'])
  const emailRaw    = pick(x, ['userEmail','email','userName','account','buyerEmail','memberEmail'])
  const phoneRaw    = pick(x, ['userPhone','phone','reservPhone','guestPhone','buyerPhone','memberPhone'])
  const hotelRaw    = pick(x, ['contentId','contentid','hotelId','hotel_id','propertyId','property_id','accommodationId'])
  const hotelTitle  = pick(x, ['hotelTitle','hotel','hotelName','contentTitle','propertyName','accommodationName'])

  const adultsRaw   = pick(x, ['numAdults','adults','adultCount','paxAdults'])
  const childrenRaw = pick(x, ['numChildren','children','childCount','paxChildren'])

  const inD  = toYMD(checkInRaw)
  let outD = toYMD(checkOutRaw)
  if (!outD || outD <= inD) outD = addDays(inD, 1)

  return {
    ...x,
    checkInDate: inD,
    checkOutDate: outD,
    status: normalizeStatus(statusRaw),
    roomId: roomIdRaw,
    roomcode: roomCodeRaw,
    roomtitle: roomTitleRaw,
    reservName: nameRaw,
    userEmail: emailRaw,
    userPhone: phoneRaw,
    contentId: hotelRaw,
    hotelTitle,
    numAdults: Number(adultsRaw ?? 0),
    numChildren: Number(childrenRaw ?? 0)
  }
}

/* ===== 호텔 기준 + 날짜 유효성 필터 ===== */
async function loadReservationsForHotel() {
  try {
    const { data } = await getReservations(store.selectedContentId)
    const arr = Array.isArray(data) ? data : []
    const cid = String(store.selectedContentId)

    const hotelFiltered = arr
      .map(normalizeReservation)
      .filter(x => {
        const cands = [x.contentId, x.contentid].map(v => v != null ? String(v) : '')
        return cands.includes(cid)
      })

    reservations.value = hotelFiltered.filter(x => {
      if (isCanceled(x)) return false
      const inD = toYMD(x.checkInDate), outD = toYMD(x.checkOutDate)
      return !!inD && !!outD
    })
  } catch (e) {
    console.error('[reservations] load failed', e)
    reservations.value = []
  }
}

/* ===== 업데이트 / 삭제 ===== */
function openAdjustConfirm(r, delta) {
  const current = Number(r.roomcount || 0)
  const next = current + delta
  if (next < 0) return

  confirmState.targetRoom = r
  confirmState.delta = delta
  confirmState.current = current
  confirmState.next = next
  confirmState.roomTitle = r.roomtitle || '미지정'

  try { confirmDlg.value?.showModal?.() } catch {}
  document.documentElement.classList.add('modal-open')
}
function onCancelChange() {
  try { confirmDlg.value?.close?.() } catch {}
  document.documentElement.classList.remove('modal-open')
  confirmState.targetRoom = null
}
async function onConfirmChange() {
  const r = confirmState.targetRoom
  const newValue = confirmState.next
  try {
    r.roomcount = newValue
    await updateRoomApi(r.id, { roomcount: newValue }, store.selectedContentId)
    uiStore.openModal?.({ title: '객실 수가 변경되었습니다.' })
  } catch (e) {
    console.error('roomcount 업데이트 실패', e)
    uiStore.openModal?.({ title: '객실 수 업데이트 실패' })
  } finally {
    onCancelChange()
  }
}
async function save() {
  try {
    await updateRoomApi(editingId.value, editForm.value, store.selectedContentId)
    close()
    await loadOnMount()
  } catch (e) { console.error('[rooms] update failed', e) }
}
async function remove(id) {
  await uiStore.openModal({
    title: '객실 삭제',
    message: '정말 삭제하시겠습니까?',
    showCancel: true,
    confirmText: '삭제',
    cancelText: '취소'
  })
  uiStore.openModal({ title: '삭제되었습니다' })
  try {
    await deleteRoomApi(id, store.selectedContentId)
    await loadOnMount()
  } catch (e) {
    console.error('[rooms] delete failed', e)
  }
}

/* ===== 이미지 유틸 ===== */
function n(v) { return (v ?? 0).toLocaleString() }
function setMain(r, i, url) { mainByKey[keyOf(r, i)] = safeUrl(url) }
function mainImgOf(r, i) { return mainByKey[keyOf(r, i)] || imgSrc(r) }
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
function safeUrl(u) { return viaProxy(u) }
function viaProxy(u) {
  const fixed = normalizeVisitKorea(u)
  const naked = String(fixed || '').trim().replace(/^https?:\/\//i, '')
  return 'https://wsrv.nl/?url=' + encodeURIComponent(naked)
}
function candidateImages(r) {
  return [
    r.roomimg1, r.roomimg2, r.roomimg3, r.roomimg4, r.roomimg5,
    r.firstimage, r.image, r.photo, r.thumbnail
  ].filter(Boolean)
}
function imgSrc(r) { return candidateImages(r).length ? safeUrl(candidateImages(r)[0]) : placeholderImg(r.roomtitle) }
function thumbs(r) { return candidateImages(r).slice(0, 5) }
function onImgError(e, r) { e.target.src = placeholderImg(r.roomtitle) }
function onThumbError(e) { e.target.src = placeholderImg('T') }
function previewSrc(idx) {
  const v = editForm.value[`roomimg${idx}`]
  return v ? safeUrl(v) : placeholderImg(editForm.value.roomtitle || '미리보기')
}
function touchPreview() {}
function onPreviewError(e, idx) { e.target.src = placeholderImg(`IMG${idx}`) }
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

/* ===== 옵션(편의시설) ===== */
const AMENITIES = [
  { key: 'roomaircondition',  label: '에어컨',       icon: '❄️' },
  { key: 'roombath',          label: '욕조',         icon: '🛁' },
  { key: 'roombathfacility',  label: '욕실용품',     icon: '🧴' },
  { key: 'roomcable',         label: '유선 TV',      icon: '📺' },
  { key: 'roomtv',            label: 'TV',           icon: '📺' },
  { key: 'roominternet',      label: '인터넷',       icon: '🌐' },
  { key: 'roompc',            label: 'PC',           icon: '💻' },
  { key: 'roomcook',          label: '취사 가능',    icon: '🍳' },
  { key: 'roomrefrigerator',  label: '냉장고',       icon: '🧊' },
  { key: 'roomhairdryer',     label: '헤어드라이어', icon: '🌀' },
  { key: 'roomhometheater',   label: '홈시어터',     icon: '🎬' },
  { key: 'roomsofa',          label: '소파',         icon: '🛋️' },
  { key: 'roomtable',         label: '테이블',       icon: '🪑' },
  { key: 'roomtoiletries',    label: '세면용품',     icon: '🧼' }
]
function isOn(v) {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return false
  return !['n', 'no', 'false', '0', 'x', '없음', '미지원'].includes(s)
}
function amenitiesOf(r) { return AMENITIES.filter(a => isOn(r[a.key])) }
</script>

<style scoped>
html.modal-open,
html.modal-open body { overflow: hidden !important; }

.btn { background:#22c55e; color:#fff; border:none; padding:12px 16px; border-radius:8px; transition:.18s; font-size:16px; }
.btn:hover { background:#16a34a; transform: translateY(-1px); }
.btn-outline { border:1px solid #2563eb; background:#fff; padding:10px 14px; border-radius:8px; color:#2563eb; font-size:14px; font-weight:600; transition:.18s; }
.btn-outline:hover { background:#2563eb; color:white; transform: translateY(-1px); }
.btn-danger { background:#f44336; color:#fff; border:none; padding:10px 16px; border-radius:8px; font-size:14px; font-weight:600; transition:.18s; }
.btn-danger:hover { background:#d32f2f; }

.toolbar { display:flex; justify-content:space-between; align-items:center; margin:12px 0; gap:12px; }
.stats { display:flex; gap:10px; align-items:center; }
.stat-pill { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; font-weight:700; border:1px solid #e5e7eb; background:#f8fafc; color:#111827; line-height:1; }
.stat-pill .label { font-size:12px; color:#6b7280; font-weight:600; }
.stat-pill .value { font-size:16px; }
.stat-pill.reserved { border-color:#e0e7ff; background:#eef2ff; }
.stat-pill.inuse    { border-color:#dcfce7; background:#ecfdf5; }
.stat-pill.planned  { border-color:#fee2e2; background:#fff1f2; }

.hint { margin: 12px 0; color: #6b7280; }

.room-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:16px; margin-top:16px; align-items:stretch; overflow:visible; }
@media (max-width: 1280px) { .room-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 920px)  { .room-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px)  { .room-grid { grid-template-columns: 1fr; } }

.room-item { display:flex; flex-direction:column; position:relative; overflow:visible; }

.room-card { display:flex; flex-direction:column; justify-content:space-between; height:100%; min-height:540px; background:#fff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04); transition: box-shadow .18s, transform .12s; position:relative; z-index:1; }
.room-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,.08); transform: translateY(-2px); }

.thumb { position:relative; aspect-ratio:16 / 10; background:#f3f4f6; overflow:hidden; }
.thumb img { width:100%; height:100%; object-fit:cover; display:block; }

.chip { position:absolute; left:10px; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; background:rgba(255,255,255,.9); color:#111827; border:1px solid rgba(0,0,0,.06); }
.chip.people { bottom:10px; }
.chip.price  { bottom:10px; right:10px; left:auto; }

.body { padding:12px 12px 8px; display:flex; flex-direction:column; gap:10px; }
.title { font-weight:700; font-size:16px; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.thumbs { display:flex; gap:8px; padding:0; margin:0; list-style:none; overflow-x:auto; }
.thumbs li { width:64px; height:64px; cursor:pointer; }
.thumbs img { width:100%; height:100%; object-fit:cover; border-radius:8px; }

.amenities { display:flex; flex-wrap:wrap; gap:6px; list-style:none; padding:0; margin:0; }
.amenities li { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:999px; font-size:12px; color:#374151; }
.amenities .i { font-size:13px; line-height:1; }
.amenities .dim { color:#9ca3af; background:#fff; border-style:dashed; }

.actions { display:grid; grid-template-columns:1fr auto; align-items:center; gap:12px; padding:12px; margin-top:auto; border-top:1px solid #eef2f7; background:#fafafa; }
.stock-block { display:flex; flex-direction:column; gap:6px; min-width:210px; }
.room-count-row { display:flex; align-items:center; gap:8px; }
.room-count { font-size:14px; color:#555; font-weight:bold; margin:0; }

.counter-buttons.horizontal { display:flex; gap:6px; }
.arrow-btn.inline { width:28px; height:28px; font-size:16px; font-weight:700; border-radius:6px; line-height:1; cursor:pointer; transition: transform .1s, filter .18s, opacity .18s; border:none; color:#fff; }
.arrow-btn.inline.minus { background:#ef4444; }
.arrow-btn.inline.plus  { background:#22c55e; }
.arrow-btn.inline.minus:hover, .arrow-btn.inline.plus:hover { filter:brightness(0.95); }
.arrow-btn.inline:active { transform: translateY(1px); }
.arrow-btn.inline:disabled { opacity:.5; cursor:not-allowed; }

.check-inline { display:flex; align-items:center; gap:6px; font-size:13px; }
.check-inline .k { color:#6b7280; }
.check-inline .v { font-weight:700; }
.check-inline .v.inuse { color:#16a34a; }
.check-inline .sep { color:#9ca3af; }

.more-row { display:flex; }
.btn-more { width: 80%; border:1px solid #d1d5db; background:#fff; padding:6px 10px; border-radius:6px; font-size:12px; cursor:pointer; transition:background .18s; }
.btn-more:hover { background:#f3f4f6; }

.action-buttons { display:flex; gap:8px; }

.more-panel { position:absolute; top:calc(100% + 10px); left:0; right:0; width:90%; margin:0; border:1px dashed #e5e7eb; background:#fff; padding:16px 18px; border-radius:12px; box-shadow:0 10px 24px rgba(0,0,0,0.1); z-index:10; animation: slideDown .2s ease; }
@keyframes slideDown { from { opacity:0; transform:translateY(-4px);} to { opacity:1; transform:translateY(0);} }
.group { margin-bottom:10px; }
.group-title { font-weight:700; font-size:13px; color:#374151; margin-bottom:8px; }
.chip-list { display:flex; flex-wrap:wrap; gap:10px; }
.guest-chip { position:relative; min-width:180px; max-width:260px; padding:10px 12px; border:1px solid #e5e7eb; border-radius:12px; background:#f9fafb; box-shadow:0 1px 2px rgba(0,0,0,.03); }
.guest-chip .badge { position:absolute; top:-8px; right:-8px; font-size:11px; padding:4px 6px; border-radius:999px; color:#111827; border:1px solid; background:#fff; }
.badge.planned { border-color:#c7d2fe; background:#eef2ff; }
.badge.ongoing { border-color:#bbf7d0; background:#ecfdf5; }
.guest-chip .name { font-weight:700; margin-bottom:2px; }
.guest-chip .meta { font-size:12px; color:#6b7280; line-height:1.3; }
.guest-chip .meta.small { font-size:11px; color:#9ca3af; }
.empty { font-size:12px; color:#9ca3af; }

.add-card { min-height:540px; border:2px dashed #d1d5db; background:#fbfbfb; cursor:pointer; align-items:center; justify-content:center; display:flex; outline:none; border-radius:14px; transition:.2s; }
.add-card:hover { border-color:#9ca3af; background:#f8fafc; transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,.08); }
.add-card:focus-visible { box-shadow:0 0 0 3px rgba(34,197,94,.35); }
.add-inner { display:flex; flex-direction:column; align-items:center; gap:6px; user-select:none; padding:20px; }
.add-inner .plus { font-size:48px; line-height:1; }
.add-inner .add-text { font-weight:700; font-size:16px; color:#111827; }
.add-inner .add-sub { font-size:12px; color:#6b7280; }

.fade-enter-active,.fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from,.fade-leave-to { opacity: 0; }

.confirm-dlg { border:none; outline:none; background:transparent; padding:0; --ok:#22c55e; --ok-hover:#16a34a; --cancel-bg:#f3f4f6; --cancel-text:#6b7280; --cancel-border:#e5e7eb; --cancel-hover:#e5e7eb; --title:#111827; --text:#4b5563; }
.confirm-dlg::backdrop { background: rgba(0,0,0,.45); backdrop-filter: blur(2px); }
.confirm-card { width:460px; max-width:92vw; background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:22px 24px; margin:0 auto; box-shadow:0 16px 40px rgba(0,0,0,0.14); }
.confirm-title { margin:2px 0 10px; font-size:18px; font-weight:800; color:var(--title); text-align:center; }
.confirm-text { margin:4px 0 18px; color:var(--text); line-height:1.6; font-size:14px; text-align:center; }
.confirm-text strong { font-weight:800; color:var(--title); }
.confirm-actions { display:flex; gap:12px; justify-content:center; align-items:center; margin-top:4px; }
.confirm-btn { appearance:none; border:none; cursor:pointer; font-weight:700; font-size:14px; padding:12px 0; width:180px; border-radius:12px; transition: background-color .15s ease, color .15s ease, filter .15s ease; line-height:1; user-select:none; }
.confirm-btn.cancel { background: var(--cancel-bg); color: var(--cancel-text); border: 1px solid var(--cancel-border); }
.confirm-btn.cancel:hover { background: var(--cancel-hover); color:#374151; filter:none; }
.confirm-btn.ok { background: var(--ok); color:#fff; border:1px solid var(--ok); }
.confirm-btn.ok:hover { background: var(--ok-hover); filter: brightness(0.98); }
.confirm-btn:focus-visible { outline: 3px solid rgba(34,197,94,.35); outline-offset: 2px; }
.confirm-dlg .confirm-btn:hover, .confirm-dlg .confirm-btn:active { transform: none; }
</style>

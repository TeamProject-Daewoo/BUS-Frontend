<template>
  <div class="hotel-form">
    <!-- 헤더 -->
    <header class="form-header">
      <h1 class="title">호텔 기본 정보</h1>
      <p class="subtitle">필수 항목을 입력하고 다음 단계로 진행하세요.</p>
    </header>

    <!-- 입력 필드들 -->
    <div class="form-body">
      <!-- 호텔명 -->
      <div class="field">
        <label>호텔명 <span class="required">*</span></label>
        <input
          ref="titleInput"
          v-model="hotel.title"
          :class="{ error: errors.title }"
          placeholder="예: 호텔 블라블라"
        />
        <p v-if="errors.title" class="err-msg">호텔명을 입력해주세요.</p>
      </div>

      <!-- 대표 이미지 -->
      <div class="field">
        <label>대표 이미지 <span class="required">*</span></label>
        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          @change="onFileChange"
          :class="{ error: errors.file }"
        />
        <div class="preview">
          <img v-if="hotel.previewUrl" :src="hotel.previewUrl" alt="대표 이미지" />
          <span v-else class="placeholder">이미지 미리보기 없음</span>
        </div>
        <small class="hint">PNG/JPG/WEBP/GIF, 최대 8MB</small>
        <p v-if="errors.file" class="err-msg">대표 이미지를 업로드해주세요.</p>
      </div>

      <!-- 전화번호 -->
      <div class="field">
        <label>전화번호 <span class="required">*</span></label>
        <input
          ref="telInput"
          v-model="hotel.tel"
          @input="formatTel"
          :class="{ error: errors.tel }"
          placeholder="02-123-4567"
        />
        <p v-if="errors.tel" class="err-msg">유효한 전화번호를 입력해주세요.</p>
      </div>

      <!-- 사업자번호 -->
      <div class="field">
        <label>사업자번호</label>
        <div class="biz-row">
          <input
            ref="bizInput"
            v-model="hotel.businessRegistrationNumber"
            readonly
            class="readonly"
            placeholder="자동으로 불러오는 중..."
          />
          <span
            class="chip"
            :class="{ good: !!hotel.businessRegistrationNumber, bad: !hotel.businessRegistrationNumber }"
          >
            {{ hotel.businessRegistrationNumber ? '불러옴' : '미확인' }}
          </span>
        </div>
        <small class="hint">로그인된 사용자 정보에서 자동으로 불러옵니다.</small>
        <p v-if="bizError" class="err-msg">사업자번호를 불러오지 못했습니다.</p>
      </div>

      <!-- 주소 -->
      <div class="field">
        <label>주소 <span class="required">*</span></label>
        <div class="addr-box">
          <input
            ref="addrInput"
            v-model="addrBase"
            :class="{ error: errors.addrBase }"
            placeholder="주소를 선택하세요"
            readonly
          />
          <button type="button" class="btn secondary" @click="openPostcode">
            주소 검색
          </button>
        </div>
        <p v-if="errors.addrBase" class="err-msg">주소를 검색하여 선택해주세요.</p>
      </div>

      <!-- 상세주소 -->
      <div class="field">
        <label>상세주소</label>
        <input v-model="addrDetail" placeholder="상세 주소 (선택)" />
      </div>

      <!-- 지도 -->
      <div class="field">
        <label>지도</label>
        <div id="map" class="map-box"></div>
        <small class="hint">주소 선택 시 자동으로 표시됩니다.</small>
      </div>

      <!-- 카테고리 -->
      <div class="field">
        <label>카테고리 <span class="required">*</span></label>
        <select
          ref="categorySelect"
          v-model="hotel.category"
          :class="{ error: errors.category }"
        >
          <option value="">선택하세요</option>
          <option value="B02010100">관광호텔</option>
          <option value="B02010700">콘도미니엄</option>
          <option value="B02010900">모텔</option>
          <option value="B02011100">민박</option>
          <option value="B02011600">펜션</option>
        </select>
        <p v-if="errors.category" class="err-msg">카테고리를 선택해주세요.</p>
      </div>

      <!-- 체크인/체크아웃 -->
      <div class="field-row">
        <div class="field">
          <label>체크인 <span class="required">*</span></label>
          <input
            ref="checkinInput"
            v-model="intro.checkintime"
            :class="{ error: errors.checkintime }"
            placeholder="15:00"
          />
          <p v-if="errors.checkintime" class="err-msg">체크인 시간을 입력해주세요.</p>
        </div>
        <div class="field">
          <label>체크아웃 <span class="required">*</span></label>
          <input
            ref="checkoutInput"
            v-model="intro.checkouttime"
            :class="{ error: errors.checkouttime }"
            placeholder="11:00"
          />
          <p v-if="errors.checkouttime" class="err-msg">체크아웃 시간을 입력해주세요.</p>
        </div>
      </div>

      <!-- 수용 인원 -->
      <div class="field">
        <label>수용 인원</label>
        <input type="number" v-model="intro.accomcountlodging" min="0" />
      </div>

      <!-- 시설 옵션 -->
      <div class="field">
        <label>시설 옵션</label>
        <div class="options-grid">
          <label v-for="field in facilityFields" :key="field.key" class="option-item">
            <input type="checkbox" v-model="intro[field.key]" />
            {{ field.label }}
          </label>
        </div>
      </div>
    </div>

    <!-- 버튼 -->
    <footer class="form-actions">
      <button type="button" class="btn primary" @click="mergeAddressAndNext">다음</button>
    </footer>

    <!-- 모달 -->
    <transition name="fade">
      <div v-if="modal.show" class="modal-overlay" @click.self="handleModalConfirm">
        <div class="modal-box">
          <div class="modal-icon">⚠️</div>
          <h3 class="modal-title">{{ modal.title }}</h3>
          <p class="modal-message" v-html="modal.message"></p>
          <button type="button" class="btn primary w-full" @click="handleModalConfirm">확인</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { loadKakaoSdk } from '@/utils/loadKakao'
import sigunguCodeMap from '@/data/sigunguCodeMap.json'
import { useAuthStore } from '@/api/auth'
import api from '@/api/axios'
import { useUiStore } from '@/stores/commonUiStore'
import { isValidFile } from '@/api/business'

const uiStore = useUiStore();

// props / emits
const props = defineProps({
  hotel: { type: Object, required: true },
  intro: { type: Object, required: true }
})
const emits = defineEmits(['next'])

// local states
const addrBase = ref('')
const addrDetail = ref('')
let map = null
let marker = null

// validation & modal
const errors = ref({})
const modal = ref({ show: false, title: '입력 오류', message: '', focusKey: null })
const bizError = ref(false)

// refs
const titleInput = ref(null)
const fileInput = ref(null)
const telInput = ref(null)
const addrInput = ref(null)
const categorySelect = ref(null)
const checkinInput = ref(null)
const checkoutInput = ref(null)
const bizInput = ref(null)

const facilityFields = [
  { key: 'barbecue', label: '바베큐장' },
  { key: 'beauty', label: '뷰티 시설' },
  { key: 'beverage', label: '음료 시설' },
  { key: 'bicycle', label: '자전거 대여' },
  { key: 'campfire', label: '캠프파이어' },
  { key: 'chkcooking', label: '취사 가능' },
  { key: 'fitness', label: '피트니스' },
  { key: 'foodplace', label: '식당' },
  { key: 'infocenterlodging', label: '안내 센터' },
  { key: 'karaoke', label: '노래방' },
  { key: 'parkinglodging', label: '주차장' },
  { key: 'publicbath', label: '대중탕' },
  { key: 'publicpc', label: '공용 PC' },
  { key: 'reservationlodging', label: '예약 안내' },
  { key: 'sauna', label: '사우나' },
  { key: 'seminar', label: '세미나실' },
  { key: 'sports', label: '스포츠 시설' },
]

const areaCodeMap = {
  서울: 1, 인천: 2, 대전: 3, 대구: 4, 광주: 5,
  부산: 6, 울산: 7, 세종: 8, 경기: 31, 강원: 32,
  충북: 33, 충남: 34, 전북: 35, 전남: 36, 경북: 37,
  경남: 38, 제주: 39,
}

// 이미지 업로드
async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const okTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  if (!okTypes.includes(file.type)) {
    e.target.value = '' // 초기화
    return showModal('입력 오류', '이미지 형식 오류', 'file')
  }
  if (file.size > 8 * 1024 * 1024) {
    e.target.value = '' // 초기화
    return showModal('입력 오류', '8MB 이하 파일만 가능합니다.', 'file')
  }

  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  //tika 유효성 검증
  const formData = new FormData();
  formData.append('fileObject', file);
  const isValid = await isValidFile(formData);
  if(!isValid.data || !allowedImageTypes.includes(file.type)) {
    uiStore.openModal({
      title: '파일 형식 오류',
      message: '이미지 파일(jpg, png, gif)만 업로드할 수 있습니다.'
    });
    return;
  }

  if (props.hotel.previewUrl) URL.revokeObjectURL(props.hotel.previewUrl)
  props.hotel.file = file
  props.hotel.previewUrl = URL.createObjectURL(file)
  errors.value.file = false
}

// 전화번호
function formatTel() {
  const raw = String(props.hotel.tel || '').replace(/[^\d]/g, '')
  let out = raw
  if (raw.startsWith('02')) {
    if (raw.length > 2 && raw.length <= 5) out = `${raw.slice(0,2)}-${raw.slice(2)}`
    else if (raw.length > 5 && raw.length <= 9) out = `${raw.slice(0,2)}-${raw.slice(2,5)}-${raw.slice(5)}`
    else if (raw.length > 9) out = `${raw.slice(0,2)}-${raw.slice(2,6)}-${raw.slice(6,10)}`
  } else {
    if (raw.length > 3 && raw.length <= 7) out = `${raw.slice(0,3)}-${raw.slice(3)}`
    else if (raw.length > 7) out = `${raw.slice(0,3)}-${raw.slice(3,7)}-${raw.slice(7,11)}`
  }
  props.hotel.tel = out
}

// 주소 검색
async function openPostcode() {
  await loadKakaoSdk()
  new window.daum.Postcode({
    oncomplete: (data) => {
      addrBase.value = data.roadAddress || data.jibunAddress
      const geocoder = new window.kakao.maps.services.Geocoder()
      geocoder.addressSearch(addrBase.value, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK && result[0]) {
          props.hotel.mapx = result[0].x
          props.hotel.mapy = result[0].y
          const addrInfo = result[0].address
          if (addrInfo) {
            const sido = addrInfo.region_1depth_name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')
            const sigungu = addrInfo.region_2depth_name
            props.hotel.areaCode = areaCodeMap[sido] || 0
            props.hotel.sigunguCode = sigunguCodeMap[sido]?.[sigungu] || 0
            if (!props.hotel.areaCode || !props.hotel.sigunguCode) {
              showModal('주소 오류', '지역코드를 찾을 수 없습니다. 다시 시도해주세요.')
            }
          }
          initMap(result[0].y, result[0].x)
        }
      })
    },
  }).open()
}

// 지도
function initMap(lat, lng) {
  if (!window.kakao || !window.kakao.maps) return
  const container = document.getElementById('map')
  if (!container) return
  const center = lat && lng ? new window.kakao.maps.LatLng(lat, lng) : new window.kakao.maps.LatLng(36.5, 127.5)
  map = new window.kakao.maps.Map(container, { center, level: lat && lng ? 3 : 14 })
  if (lat && lng) {
    if (marker) marker.setMap(null)
    marker = new window.kakao.maps.Marker({ position: center })
    marker.setMap(map)
  }
}

// 필수값 체크
function mergeAddressAndNext() {
  errors.value = {}
  if (!props.hotel.title) return showModal('입력 오류', '호텔명을 입력해주세요', 'title')
  if (!props.hotel.file && !props.hotel.firstimage) return showModal('입력 오류', '대표 이미지를 업로드해주세요', 'file')
  if (!props.hotel.tel || String(props.hotel.tel).replace(/[^\d]/g, '').length < 9) return showModal('입력 오류', '전화번호를 확인해주세요', 'tel')
  if (!addrBase.value) return showModal('입력 오류', '주소를 검색해주세요', 'addrBase')
  if (!props.hotel.category) return showModal('입력 오류', '카테고리를 선택해주세요', 'category')
  if (!props.intro.checkintime) return showModal('입력 오류', '체크인 시간을 입력해주세요', 'checkin')
  if (!props.intro.checkouttime) return showModal('입력 오류', '체크아웃 시간을 입력해주세요', 'checkout')
  props.hotel.addr1 = `${addrBase.value} ${addrDetail.value || ''}`.trim()
  emits('next')
}

// 모달
function showModal(title, message, focusKey = null) {
  modal.value.focusKey = focusKey;
  uiStore.openModal({
    title: title,
    message: message
  });
  //modal.value = { show: false, title, message, focusKey }
}
async function handleModalConfirm() {
  const key = modal.value.focusKey
  modal.value.show = false
  await nextTick()
  const refEl = { title: titleInput, file: fileInput, tel: telInput, addrBase: addrInput, category: categorySelect, checkin: checkinInput, checkout: checkoutInput, biz: bizInput }[key]?.value
  if (refEl && typeof refEl.focus === 'function') refEl.focus()
}

// 사업자번호 자동 로딩
async function loadBusinessNumber() {
  try {
    const auth = useAuthStore()
    const fromStore = auth?.loggedInUser?.businessRegistrationNumber
    if (fromStore) {
      props.hotel.businessRegistrationNumber = fromStore
      bizError.value = false
      return
    }
    const { data } = await api.get('/api/user/me')
    props.hotel.businessRegistrationNumber = data?.businessRegistrationNumber || data?.business_register_number || ''
    bizError.value = !props.hotel.businessRegistrationNumber
  } catch (e) {
    bizError.value = true
  }
}

onMounted(async () => {
  await loadBusinessNumber()
  try {
    await loadKakaoSdk()
    initMap()
  } catch (e) {
    console.error('Kakao SDK load failed', e)
  }
})

const auth = useAuthStore()
watch(() => auth.loggedInUser, (u) => {
  if (!props.hotel.businessRegistrationNumber && u?.businessRegistrationNumber) {
    props.hotel.businessRegistrationNumber = u.businessRegistrationNumber
    bizError.value = false
  }
})
</script>


<style scoped>
.hotel-form { max-width: 860px; margin: 0 auto; padding: 32px; }
.form-header { margin-bottom: 28px; }
.title { font-size: 26px; font-weight: 800; color: #111; }
.subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }

.form-body { display: flex; flex-direction: column; gap: 24px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

label { font-size: 14px; font-weight: 600; color: #111; }
.required { color: #ef4444; }

input, select {
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 15px;
  transition: all .2s;
}
input:focus, select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,.2);
}
input.error, select.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239,68,68,.15);
}
.readonly { background: #f9fafb; color: #6b7280; }

.preview {
  margin-top: 6px; width: 280px; height: 180px;
  border: 1px dashed #d1d5db; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.preview img { max-width: 100%; max-height: 100%; border-radius: 8px; }
.placeholder { font-size: 13px; color: #94a3b8; }

.map-box { width: 100%; height: 300px; border: 1px solid #e5e7eb; border-radius: 12px; }

.options-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.option-item { font-size: 14px; display: flex; align-items: center; gap: 8px; }

.biz-row { display: flex; gap: 10px; align-items: center; }
.chip {
  font-size: 12px; font-weight: 700;
  padding: 6px 10px; border-radius: 999px;
}
.chip.good { background: #ecfdf5; color: #065f46; }
.chip.bad { background: #fef2f2; color: #991b1b; }

.form-actions { margin-top: 32px; text-align: right; }
.btn {
  padding: 10px 18px; border-radius: 10px;
  font-weight: 600; cursor: pointer; border: none;
  transition: all .2s;
}
.btn.primary { background: #2563eb; color: #fff; }
.btn.secondary { background: #f3f4f6; color: #111; }
.btn.primary:hover { background: #1d4ed8; }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  display: flex; justify-content: center; align-items: center;
}
.modal-box {
  background: #fff; border-radius: 16px;
  padding: 24px; width: min(420px, 92%);
  box-shadow: 0 20px 40px rgba(0,0,0,.25);
  text-align: center;
  animation: pop .2s ease;
}
.modal-icon { font-size: 30px; margin-bottom: 10px; }
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.modal-message { font-size: 14px; color: #444; margin-bottom: 16px; }
.w-full { width: 100%; }

.err-msg { font-size: 12px; color: #ef4444; }
.hint { font-size: 12px; color: #6b7280; }
@keyframes pop { from { transform: scale(.95); opacity: .8 } to { transform: scale(1); opacity: 1 } }
</style>

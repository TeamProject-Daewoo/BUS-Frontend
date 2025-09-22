<template>
  <div class="card">
    <!-- 기본 정보 -->
    <h2 class="section-title">호텔 기본 정보</h2>

    <div class="form-table">
      <!-- 호텔명 -->
      <div class="form-row">
        <div class="form-label">호텔명 <span class="required">*</span></div>
        <div class="form-input">
          <input v-model="hotel.title" :class="{ error: errors.title }" placeholder="예: 호텔 블라블라" />
        </div>
      </div>

      <!-- 대표 이미지 -->
      <div class="form-row">
        <div class="form-label">대표 이미지 <span class="required">*</span></div>
        <div class="form-input">
          <input type="file" accept="image/*" @change="onFileChange" :class="{ error: errors.file }" />
          <div class="preview">
            <img v-if="hotel.previewUrl" :src="hotel.previewUrl" alt="대표 이미지 미리보기" />
            <span v-else class="placeholder">이미지 미리보기 없음</span>
          </div>
        </div>
      </div>

      <!-- 전화번호 -->
      <div class="form-row">
        <div class="form-label">전화번호 <span class="required">*</span></div>
        <div class="form-input">
          <input v-model="hotel.tel" :class="{ error: errors.tel }" placeholder="02-123-4567" />
        </div>
      </div>

      <!-- 사업자번호 -->
      <div class="form-row">
        <div class="form-label">사업자번호</div>
        <div class="form-input">
          <input v-model="hotel.businessRegistrationNumber" readonly class="readonly" />
        </div>
      </div>

      <!-- 주소 -->
      <div class="form-row">
        <div class="form-label">주소 <span class="required">*</span></div>
        <div class="form-input">
          <div class="addr-box">
            <input v-model="addrBase" :class="{ error: errors.addrBase }" placeholder="주소를 선택하세요" readonly />
            <button type="button" class="btn-secondary" @click="openPostcode">주소 검색</button>
          </div>
        </div>
      </div>

      <!-- 상세주소 -->
      <div class="form-row">
        <div class="form-label">상세주소</div>
        <div class="form-input">
          <input v-model="addrDetail" placeholder="상세 주소를 입력하세요" />
        </div>
      </div>

      <!-- 지도 -->
      <div class="form-row">
        <div class="form-label">지도</div>
        <div class="form-input">
          <div id="map" class="map-box"></div>
        </div>
      </div>

      <!-- 지역코드 & 시군구코드 (숨김 처리) -->
      <input type="hidden" v-model="hotel.areaCode" />
      <input type="hidden" v-model="hotel.sigunguCode" />

      <!-- 카테고리 -->
      <div class="form-row">
        <div class="form-label">카테고리 <span class="required">*</span></div>
        <div class="form-input">
          <select v-model="hotel.category" :class="{ error: errors.category }">
            <option value="">선택하세요</option>
            <option value="B02010100">관광호텔</option>
            <option value="B02010700">콘도미니엄</option>
            <option value="B02010900">모텔</option>
            <option value="B02011100">민박</option>
            <option value="B02011600">펜션</option>
          </select>
        </div>
      </div>

      <!-- 체크인/체크아웃 -->
      <div class="form-row">
        <div class="form-label">체크인 <span class="required">*</span></div>
        <div class="form-input">
          <input v-model="intro.checkintime" :class="{ error: errors.checkintime }" placeholder="15:00" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-label">체크아웃 <span class="required">*</span></div>
        <div class="form-input">
          <input v-model="intro.checkouttime" :class="{ error: errors.checkouttime }" placeholder="11:00" />
        </div>
      </div>

      <!-- 수용 인원 -->
      <div class="form-row">
        <div class="form-label">수용 인원</div>
        <div class="form-input">
          <input type="number" v-model="intro.accomcountlodging" min="0" />
        </div>
      </div>

      <!-- 시설 옵션 -->
      <div class="form-row">
        <div class="form-label">시설 옵션</div>
        <div class="form-input options-grid">
          <label v-for="field in facilityFields" :key="field.key" class="option-item">
            <input type="checkbox" v-model="intro[field.key]" />
            {{ field.label }}
          </label>
        </div>
      </div>

      <!-- 예약 URL -->
      <div class="form-row">
        <div class="form-label">예약 URL</div>
        <div class="form-input">
          <input v-model="intro.reservationurl" placeholder="https://example.com" />
        </div>
      </div>

      <!-- 객실 타입 -->
      <div class="form-row">
        <div class="form-label">객실 타입</div>
        <div class="form-input">
          <input v-model="intro.roomtype" placeholder="스탠다드, 디럭스 등" />
        </div>
      </div>

      <!-- 규모 -->
      <div class="form-row">
        <div class="form-label">규모</div>
        <div class="form-input">
          <input v-model="intro.scalelodging" placeholder="예: 지상 10층, 200실" />
        </div>
      </div>

      <!-- 부대시설 -->
      <div class="form-row">
        <div class="form-label">부대시설</div>
        <div class="form-input">
          <input v-model="intro.subfacility" placeholder="예: 회의실, 수영장 등" />
        </div>
      </div>
    </div>

    <!-- 버튼 -->
    <div class="actions">
      <button class="btn-primary" @click="mergeAddressAndNext">다음</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { loadKakaoSdk } from '@/utils/loadKakao'
import sigunguCodeMap from '@/data/sigunguCodeMap.json'

const props = defineProps({ hotel: Object, intro: Object })
const emits = defineEmits(['next'])

const addrBase = ref('')
const addrDetail = ref('')
let map = null
let marker = null

// 에러 상태
const errors = ref({})

// 시설 항목들
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

// 시/도 이름 → areaCode 매핑
const areaCodeMap = {
  "서울": 1, "인천": 2, "대전": 3, "대구": 4, "광주": 5,
  "부산": 6, "울산": 7, "세종": 8, "경기": 31, "강원": 32,
  "충북": 33, "충남": 34, "전북": 35, "전남": 36, "경북": 37,
  "경남": 38, "제주": 39
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  props.hotel.file = file
  props.hotel.previewUrl = URL.createObjectURL(file)
}

async function openPostcode() {
  await loadKakaoSdk()
  new window.daum.Postcode({
    oncomplete: function (data) {
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
            props.hotel.sigunguCode =
              (sigunguCodeMap[sido] && sigunguCodeMap[sido][sigungu])
                ? sigunguCodeMap[sido][sigungu]
                : 0
          } else {
            props.hotel.areaCode = 0
            props.hotel.sigunguCode = 0
          }

          initMap(result[0].y, result[0].x)
        }
      })
    },
  }).open()
}

function initMap(lat, lng) {
  const container = document.getElementById('map')
  if (!container) return
  const center = lat && lng
    ? new window.kakao.maps.LatLng(lat, lng)
    : new window.kakao.maps.LatLng(36.5, 127.5)
  map = new window.kakao.maps.Map(container, { center, level: lat && lng ? 3 : 14 })
  if (lat && lng) {
    if (marker) marker.setMap(null)
    marker = new window.kakao.maps.Marker({ position: center })
    marker.setMap(map)
  }
}

function mergeAddressAndNext() {
  errors.value = {}

  if (!props.hotel.title) errors.value.title = true
  if (!props.hotel.file && !props.hotel.firstimage) errors.value.file = true
  if (!props.hotel.tel) errors.value.tel = true
  if (!addrBase.value) errors.value.addrBase = true
  if (!props.hotel.category) errors.value.category = true
  if (!props.intro.checkintime) errors.value.checkintime = true
  if (!props.intro.checkouttime) errors.value.checkouttime = true

  if (Object.keys(errors.value).length > 0) {
    alert('필수 입력 항목을 모두 입력해주세요.')
    return
  }

  props.hotel.addr1 = `${addrBase.value} ${addrDetail.value || ''}`.trim()
  emits('next')
}

onMounted(async () => {
  await loadKakaoSdk()
  initMap()
})
</script>

<style scoped>
.required { color: red; margin-left: 4px; }
input.error { border: 2px solid red; }
.card {
  max-width: 900px; margin: 40px auto; border: 1px solid #e5e7eb;
  border-radius: 10px; background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 24px; animation: fadeInUp 0.5s ease;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.section-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #111827; }
.form-table { border-top: 1px solid #e5e7eb; border-left: 1px solid #e5e7eb; }
.form-row { display: flex; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; }
.form-label {
  width: 180px; background: #f9fafb; padding: 16px 12px;
  font-size: 14px; font-weight: 600; color: #374151;
  border-right: 1px solid #e5e7eb; display: flex; align-items: center;
}
.form-input { flex: 1; padding: 12px; display: flex; flex-direction: column; justify-content: center; }
.form-input input, .form-input select {
  max-width: 100%; box-sizing: border-box; padding: 12px 14px;
  border: 1px solid #d1d5db; border-radius: 6px; font-size: 15px; background: #fff;
}
.form-input input:focus, .form-input select:focus {
  border-color: #2563eb; outline: none; box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
}
.readonly { background: #f3f4f6; color: #6b7280; }
.addr-box { display: flex; gap: 8px; }
.addr-box input { flex: 1; }
.preview {
  margin-top: 12px; width: 320px; height: 220px;
  border: 1px dashed #d1d5db; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; background: #fafafa;
}
.preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
.preview .placeholder { font-size: 13px; color: #9ca3af; }
.map-box { width: 100%; height: 300px; border: 1px solid #d1d5db; border-radius: 6px; }
.actions { margin-top: 20px; text-align: right; }
.btn-primary {
  background: #2563eb; color: #fff; padding: 12px 22px;
  border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer;
}
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary {
  background: #6b7280; color: #fff; padding: 0 14px;
  border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn-secondary:hover { background: #4b5563; }
.options-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.option-item { display: flex; align-items: center; gap: 4px; font-size: 14px; }
</style>

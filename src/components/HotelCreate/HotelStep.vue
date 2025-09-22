<template>
  <div class="card">
    <!-- 기본 정보 -->
    <h2 class="section-title">호텔 기본 정보</h2>

    <div class="form-table">
      <!-- 호텔명 -->
      <div class="form-row">
        <div class="form-label">호텔명</div>
        <div class="form-input">
          <input v-model="hotel.title" placeholder="예: 호텔 블라블라" />
        </div>
      </div>

      <!-- 대표 이미지 -->
      <div class="form-row">
        <div class="form-label">대표 이미지</div>
        <div class="form-input">
          <input type="file" accept="image/*" @change="onFileChange" />
          <div class="preview">
            <img v-if="previewUrl" :src="previewUrl" alt="대표 이미지 미리보기" />
            <span v-else class="placeholder">이미지 미리보기 없음</span>
          </div>
        </div>
      </div>

      <!-- 전화번호 -->
      <div class="form-row">
        <div class="form-label">전화번호</div>
        <div class="form-input">
          <input v-model="hotel.tel" placeholder="02-123-4567" />
        </div>
      </div>

      <!-- 사업자번호 (📌 전화번호 다음으로 이동) -->
      <div class="form-row">
        <div class="form-label">사업자번호</div>
        <div class="form-input">
          <input v-model="hotel.businessRegistrationNumber" readonly class="readonly" />
        </div>
      </div>

      <!-- 주소 -->
      <div class="form-row">
        <div class="form-label">주소</div>
        <div class="form-input">
          <div class="addr-box">
            <input v-model="addrBase" placeholder="주소를 선택하세요" readonly />
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

      <!-- 경도/위도 -->
      <div class="form-row">
        <div class="form-label">경도 / 위도</div>
        <div class="form-input coord-box">
          <input v-model="hotel.mapx" readonly placeholder="경도" />
          <input v-model="hotel.mapy" readonly placeholder="위도" />
        </div>
      </div>

      <!-- 지도 -->
      <div class="form-row">
        <div class="form-label">지도</div>
        <div class="form-input">
          <div class="map-wrapper">
            <div id="map" class="map"></div>
          </div>
        </div>
      </div>

      <!-- 체크인/체크아웃 -->
      <div class="form-row">
        <div class="form-label">체크인</div>
        <div class="form-input"><input v-model="intro.checkintime" placeholder="15:00" /></div>
      </div>
      <div class="form-row">
        <div class="form-label">체크아웃</div>
        <div class="form-input"><input v-model="intro.checkouttime" placeholder="11:00" /></div>
      </div>

      <!-- 객실 수 / 수용 인원 -->
      <div class="form-row">
        <div class="form-label">객실 수</div>
        <div class="form-input"><input type="number" v-model="intro.roomcount" min="0" /></div>
      </div>
      <div class="form-row">
        <div class="form-label">수용 인원</div>
        <div class="form-input"><input type="number" v-model="intro.accomcountlodging" min="0" /></div>
      </div>

      <!-- 기타 -->
      <div class="form-row">
        <div class="form-label">객실 유형</div>
        <div class="form-input"><input v-model="intro.roomtype" placeholder="디럭스, 스탠다드…" /></div>
      </div>
      <div class="form-row">
        <div class="form-label">규모</div>
        <div class="form-input"><input v-model="intro.scalelodging" placeholder="층/면적" /></div>
      </div>
      <div class="form-row">
        <div class="form-label">부대시설</div>
        <div class="form-input"><input v-model="intro.subfacility" placeholder="피트니스, 사우나…" /></div>
      </div>
      <div class="form-row">
        <div class="form-label">주차</div>
        <div class="form-input"><input v-model="intro.parkinglodging" placeholder="가능 / 불가 / 유료" /></div>
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
import { loadKakaoSdk } from '@/utils/loadkakao'
import api from '@/api/axios'

const props = defineProps({ hotel: Object, intro: Object })
const emits = defineEmits(['next'])

const addrBase = ref('')
const addrDetail = ref('')
let map = null
let marker = null

const previewUrl = ref('')
const selectedFile = ref(null)

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

async function uploadToS3(file) {
  const { data } = await api.get('/business/s3/presign', {
    params: { filename: file.name, contentType: file.type },
  })
  await fetch(data.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  return data.publicUrl
}

async function saveHotel() {
  if (selectedFile.value) {
    const uploadedUrl = await uploadToS3(selectedFile.value)
    props.hotel.firstimage = uploadedUrl
  }
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
    marker = new window.kakao.maps.Marker({ position: center })
    marker.setMap(map)
  }
}

function mergeAddressAndNext() {
  props.hotel.addr1 = `${addrBase.value} ${addrDetail.value || ''}`.trim()
  saveHotel().then(() => emits('next'))
}

onMounted(async () => {
  await loadKakaoSdk()
  initMap()
})
</script>

<style scoped>
.card {
  max-width: 900px;
  margin: 40px auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 24px;

  /* 애니메이션 추가 */
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #111827;
}
.form-table {
  border-top: 1px solid #e5e7eb;
  border-left: 1px solid #e5e7eb;
}
.form-row {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}
.form-label {
  width: 180px;
  background: #f9fafb;
  padding: 16px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
}
.form-input {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.form-input input {
  max-width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
  background: #fff;
}
.form-input input:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
}
.readonly {
  background: #f3f4f6;
  color: #6b7280;
}
.addr-box {
  display: flex;
  gap: 8px;
}
.addr-box input {
  flex: 1;
}
.coord-box {
  display: flex;
  gap: 8px;
}
.preview {
  margin-top: 12px;
  width: 320px;
  height: 220px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}
.preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.preview .placeholder {
  font-size: 13px;
  color: #9ca3af;
}
.map-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
.map {
  width: 100%;
  height: 250px;
}
.actions {
  margin-top: 20px;
  text-align: right;
}
.btn-primary {
  background: #2563eb;
  color: #fff;
  padding: 12px 22px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:hover {
  background: #1d4ed8;
}
.btn-secondary {
  background: #6b7280;
  color: #fff;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #4b5563;
}
</style>

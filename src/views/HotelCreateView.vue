<!-- src/views/HotelCreateView.vue -->
<template>
  <div class="page">
    <h1>호텔 추가</h1>

    <!-- 기본 정보 -->
    <div class="card">
      <h3>기본 정보</h3>
      <div class="grid2">
        <label>이름<input v-model="basic.title" /></label>
        <label>주소<input v-model="basic.addr1" /></label>
        <label>전화<input v-model="basic.tel" /></label>
        <label>대표 이미지 URL<input v-model="basic.firstimage" /></label>
        <label>경도(mapx)<input v-model="basic.mapx" /></label>
        <label>위도(mapy)<input v-model="basic.mapy" /></label>
      </div>
    </div>

    <!-- 소개/부대시설 -->
    <div class="card">
      <h3>소개 / 부대시설</h3>
      <div class="grid2">
        <label>체크인<input v-model="intro.checkintime" placeholder="15:00 등" /></label>
        <label>체크아웃<input v-model="intro.checkouttime" placeholder="11:00 등" /></label>
        <label>객실 수<input type="number" v-model.number="intro.roomcount" /></label>
        <label>수용 인원<input type="number" v-model.number="intro.accomcountlodging" /></label>

        <label>객실 유형<input v-model="intro.roomtype" placeholder="디럭스, 스탠다드…" /></label>
        <label>규모(층/면적 등)<input v-model="intro.scalelodging" /></label>

        <label>주차<input v-model="intro.parkinglodging" placeholder="가능 / 불가 / 유료 등" /></label>
        <label>부대시설(콤마 구분)<input v-model="intro.subfacility" placeholder="피트니스, 사우나…" /></label>

        <label>사우나<input v-model="intro.sauna" placeholder="보유/없음 등" /></label>
        <label>피트니스<input v-model="intro.fitness" placeholder="보유/없음 등" /></label>
        <label>바비큐<input v-model="intro.barbecue" placeholder="보유/없음 등" /></label>
        <label>음료 시설<input v-model="intro.beverage" placeholder="보유/없음 등" /></label>
        <label>자전거 대여<input v-model="intro.bicycle" placeholder="보유/없음 등" /></label>

        <label>예약 안내<input v-model="intro.reservationlodging" /></label>
        <label>예약 URL<input v-model="intro.reservationurl" /></label>
      </div>
    </div>

    <div class="actions">
      <button class="btn" :disabled="saving" @click="submitCreate">
        {{ saving ? '등록중...' : '등록' }}
      </button>
      <button class="btn ghost" @click="router.back()">취소</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'
// TODO: 실제 생성 API 있으면 import 하세요.
// import { createHotel, upsertHotelIntro } from '@/api/business'

const router = useRouter()
const store = useHotelStore()
const saving = ref(false)

const basic = ref({
  title: '', addr1: '', tel: '', firstimage: '', mapx: '', mapy: ''
})

const intro = ref({
  checkintime: '', checkouttime: '',
  accomcountlodging: 0, roomcount: 0, roomtype: '', scalelodging: '',
  subfacility: '', parkinglodging: '', sauna: '', fitness: '',
  barbecue: '', beverage: '', bicycle: '', reservationlodging: '', reservationurl: '',
})

async function submitCreate () {
  try {
    saving.value = true
    // 1) 실제로는 createHotel 호출 -> contentid 반환
    // const { data } = await createHotel(basic.value)
    // const contentid = data.contentid
    //
    // 2) 소개/부대시설 upsert
    // await upsertHotelIntro(intro.value, contentid)
    //
    // 3) 선택/이동
    // store.setSelected(contentid)
    // router.push({ name: 'settings-edit', params: { contentid } })

    // 임시(백엔드 연결 전): payload 확인
    console.log('[CREATE] basic', basic.value)
    console.log('[CREATE] intro', intro.value)
    alert('등록 API 연결 필요: 콘솔에서 payload를 확인하세요.')
  } catch (e) {
    console.error('호텔 등록 실패', e)
    alert('등록에 실패했어요.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page { max-width: 900px; }
.card { padding:16px; border:1px solid #e5e7eb; border-radius:12px; margin:16px 0; background:#fff; }
.grid2 { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; margin-bottom:12px; }
label { display:flex; flex-direction:column; gap:6px; font-size:14px; color:#6b7280; }
input { padding:10px; border:1px solid #e5e7eb; border-radius:8px; }
.actions { display:flex; gap:12px; align-items:center; margin-top:12px; }
.btn { background:#111827; color:#fff; border:none; padding:10px 16px; border-radius:8px; font-weight:700; }
.btn.ghost { background:#fff; color:#374151; border:1px solid #e5e7eb; }
.btn:hover { opacity:.95; }
h3 { margin-top:0; }
</style>

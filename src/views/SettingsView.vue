<template>
  <div class="page">
    <h1>호텔 설정</h1>

    <div class="card" v-if="!loading.basic">
      <h3>기본 정보</h3>
      <div class="grid2">
        <label>이름<input v-model="basic.title" /></label>
        <label>주소<input v-model="basic.addr1" /></label>
        <label>전화<input v-model="basic.tel" /></label>
        <label>대표 이미지 URL<input v-model="basic.firstimage" /></label>
        <label>경도(mapx)<input v-model="basic.mapx" /></label>
        <label>위도(mapy)<input v-model="basic.mapy" /></label>
      </div>
      <div class="actions">
        <button class="btn" :disabled="saving.basic" @click="saveBasic">
          {{ saving.basic ? '저장중...' : '저장' }}
        </button>
        <span class="dim" v-if="basic.contentid">contentid: {{ basic.contentid }}</span>
      </div>
    </div>
    <div v-else class="card">기본 정보 불러오는 중…</div>

    <div class="card" v-if="!loading.intro">
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
      <div class="actions">
        <button class="btn" :disabled="saving.intro" @click="saveIntro">
          {{ saving.intro ? '저장중...' : '저장' }}
        </button>
        <span class="dim" v-if="intro.contentid">contentid: {{ intro.contentid }}</span>
      </div>
    </div>
    <div v-else class="card">소개/부대시설 불러오는 중…</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getHotel, updateHotel, getHotelIntro, upsertHotelIntro } from '@/api/business'

const loading = ref({ basic: true, intro: true })
const saving = ref({ basic: false, intro: false })

// HotelDTO: { id, contentid, title, addr1, tel, firstimage, mapx, mapy }
const basic = ref({
  id: null,
  contentid: '',
  title: '',
  addr1: '',
  tel: '',
  firstimage: '',
  mapx: '',
  mapy: '',
})

// HotelIntroDTO: { id, contentid, checkintime, checkouttime, accomcountlodging, roomcount, roomtype,
//                  scalelodging, subfacility, parkinglodging, sauna, fitness, barbecue, beverage, bicycle,
//                  reservationlodging, reservationurl }
const intro = ref({
  id: null,
  contentid: '',
  checkintime: '',
  checkouttime: '',
  accomcountlodging: 0,
  roomcount: 0,
  roomtype: '',
  scalelodging: '',
  subfacility: '',
  parkinglodging: '',
  sauna: '',
  fitness: '',
  barbecue: '',
  beverage: '',
  bicycle: '',
  reservationlodging: '',
  reservationurl: '',
})

onMounted(async () => {
  // 기본
  try {
    const { data } = await getHotel()
    basic.value = {
      id: data.id ?? null,
      contentid: data.contentid ?? '',
      title: data.title ?? '',
      addr1: data.addr1 ?? '',
      tel: data.tel ?? '',
      firstimage: data.firstimage ?? '',
      mapx: data.mapx ?? '',
      mapy: data.mapy ?? '',
    }
  } catch (e) {
    console.error('GET /hotel 실패', e)
    alert('호텔 기본 정보를 불러오지 못했어요.')
  } finally {
    loading.value.basic = false
  }

  // 인트로
  try {
    const { data } = await getHotelIntro()
    if (data) {
      intro.value = {
        id: data.id ?? null,
        contentid: data.contentid ?? '',
        checkintime: data.checkintime ?? '',
        checkouttime: data.checkouttime ?? '',
        accomcountlodging: data.accomcountlodging ?? 0,
        roomcount: data.roomcount ?? 0,
        roomtype: data.roomtype ?? '',
        scalelodging: data.scalelodging ?? '',
        subfacility: data.subfacility ?? '',
        parkinglodging: data.parkinglodging ?? '',
        sauna: data.sauna ?? '',
        fitness: data.fitness ?? '',
        barbecue: data.barbecue ?? '',
        beverage: data.beverage ?? '',
        bicycle: data.bicycle ?? '',
        reservationlodging: data.reservationlodging ?? '',
        reservationurl: data.reservationurl ?? '',
      }
    }
  } catch (e) {
    console.error('GET /hotel/intro 실패', e)
    // intro는 없을 수 있으니 alert 생략
  } finally {
    loading.value.intro = false
  }
})

async function saveBasic() {
  try {
    saving.value.basic = true
    const payload = {
      title: basic.value.title,
      addr1: basic.value.addr1,
      tel: basic.value.tel,
      firstimage: basic.value.firstimage,
      mapx: basic.value.mapx,
      mapy: basic.value.mapy,
    }
    const { data } = await updateHotel(payload)
    // 응답으로 최신 값 반영
    basic.value = {
      id: data.id ?? null,
      contentid: data.contentid ?? '',
      title: data.title ?? '',
      addr1: data.addr1 ?? '',
      tel: data.tel ?? '',
      firstimage: data.firstimage ?? '',
      mapx: data.mapx ?? '',
      mapy: data.mapy ?? '',
    }
    alert('기본 정보 저장 완료')
  } catch (e) {
    console.error('PUT /hotel 실패', e)
    alert('기본 정보 저장에 실패했어요.')
  } finally {
    saving.value.basic = false
  }
}

async function saveIntro() {
  try {
    saving.value.intro = true
    const payload = {
      checkintime: intro.value.checkintime,
      checkouttime: intro.value.checkouttime,
      accomcountlodging: intro.value.accomcountlodging,
      roomcount: intro.value.roomcount,
      roomtype: intro.value.roomtype,
      scalelodging: intro.value.scalelodging,
      subfacility: intro.value.subfacility,
      parkinglodging: intro.value.parkinglodging,
      sauna: intro.value.sauna,
      fitness: intro.value.fitness,
      barbecue: intro.value.barbecue,
      beverage: intro.value.beverage,
      bicycle: intro.value.bicycle,
      reservationlodging: intro.value.reservationlodging,
      reservationurl: intro.value.reservationurl,
    }
    const { data } = await upsertHotelIntro(payload)
    if (data) {
      intro.value = {
        id: data.id ?? null,
        contentid: data.contentid ?? '',
        checkintime: data.checkintime ?? '',
        checkouttime: data.checkouttime ?? '',
        accomcountlodging: data.accomcountlodging ?? 0,
        roomcount: data.roomcount ?? 0,
        roomtype: data.roomtype ?? '',
        scalelodging: data.scalelodging ?? '',
        subfacility: data.subfacility ?? '',
        parkinglodging: data.parkinglodging ?? '',
        sauna: data.sauna ?? '',
        fitness: data.fitness ?? '',
        barbecue: data.barbecue ?? '',
        beverage: data.beverage ?? '',
        bicycle: data.bicycle ?? '',
        reservationlodging: data.reservationlodging ?? '',
        reservationurl: data.reservationurl ?? '',
      }
    }
    alert('소개/부대시설 저장 완료')
  } catch (e) {
    console.error('PUT /hotel/intro 실패', e)
    alert('소개/부대시설 저장에 실패했어요.')
  } finally {
    saving.value.intro = false
  }
}
</script>

<style scoped>
.page { max-width: 900px; margin: 0 auto; }
.card { padding:16px; border:1px solid #e5e7eb; border-radius:12px; margin:16px 0; background:#fff; }
.grid2 { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; margin-bottom:12px; }
label { display:flex; flex-direction:column; gap:6px; font-size:14px; color:#6b7280; }
input { padding:10px; border:1px solid #e5e7eb; border-radius:8px; }
.btn { background:#22c55e; color:#fff; border:none; padding:10px 16px; border-radius:8px; }
.actions { display:flex; gap:12px; align-items:center; }
.dim { color:#9ca3af; font-size:12px; }
h3 { margin-top:0; }
</style>

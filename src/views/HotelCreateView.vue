<template>
  <div class="page">
    <h1>호텔 등록</h1>

    <!-- Stepper -->
    <div class="stepper" :data-step="step">
      <div
        v-for="(s, idx) in steps"
        :key="idx"
        :class="['step', { active: step === idx, done: step > idx }]"
      >
        <div class="circle">{{ idx + 1 }}</div>
        <div class="label">{{ s }}</div>
      </div>
    </div>

    <!-- 단계별 컴포넌트 -->
    <component
      :is="currentComponent"
      v-model:hotel="hotel"
      v-model:intro="intro"
      v-model:rooms="rooms"
      @next="nextStep"
      @prev="prevStep"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { listMyHotels } from '@/api/business'
import HotelStep from '@/components/HotelCreate/HotelStep.vue'
import RoomStep from '@/components/HotelCreate/RoomStep.vue'
import CompleteStep from '@/components/HotelCreate/CompleteStep.vue'

const step = ref(0)
const steps = ['호텔 등록', '객실 등록', '완료']

const hotel = ref({
  title: '', addr1: '', tel: '', firstimage: '', mapx: '', mapy: '',
  areaCode: '', category: '', sigunguCode: '', businessRegistrationNumber: ''
})

// ✅ 로그인된 사업자번호 가져오기
onMounted(async () => {
  try {
    const res = await listMyHotels()
    if (res.data && res.data.length > 0) {
      hotel.value.businessRegistrationNumber = res.data[0].businessRegistrationNumber
    }
  } catch (e) {
    console.error('호텔 목록 불러오기 실패', e)
  }
})

const intro = ref({
  checkintime: '', checkouttime: '',
  accomcountlodging: 0, roomcount: 0,
  roomtype: '', scalelodging: '', subfacility: '', parkinglodging: '',
  sauna: '', fitness: '', barbecue: '', beverage: '', bicycle: '',
  reservationlodging: '', reservationurl: ''
})
const rooms = ref([])

const components = [HotelStep, RoomStep, CompleteStep]
const currentComponent = computed(() => components[step.value])

function nextStep() {
  if (step.value < steps.length - 1) step.value++
}
function prevStep() {
  if (step.value > 0) step.value--
}

// 진행 라인 동적 업데이트
watch(step, (val) => {
  const el = document.querySelector('.stepper')
  if (el) {
    el.style.setProperty('--progress-step', val)
    el.style.setProperty('--total-steps', steps.length - 1)
  }
})
</script>

<style scoped>
.page {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.stepper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 40px 0;
  position: relative;
  padding: 0 10px;
}

.stepper::before {
  content: '';
  position: absolute;
  top: 22px;
  left: 10px;
  right: 10px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 4px;
  z-index: 1;
}

.stepper::after {
  content: '';
  position: absolute;
  top: 22px;
  left: 10px;
  height: 4px;
  background: #16a34a; /* ✅ 초록색으로 변경 */
  border-radius: 4px;
  z-index: 2;
  width: calc((100% - 20px) * (var(--progress-step, 0) / var(--total-steps, 1)));
  transition: width 0.4s ease;
}

.step {
  flex: 1;
  text-align: center;
  position: relative;
  z-index: 3;
}

.circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 auto 10px;
  line-height: 40px;
  font-weight: 700;
  border: 3px solid #d1d5db;
  background: #fff;
  color: #6b7280;
  transition: all 0.3s ease;
}

.step.active .circle {
  border-color: #f97316;
  background: #f97316;
  color: #fff;
  transform: scale(1.15);
}

.step.done .circle {
  border-color: #16a34a;
  background: #16a34a;
  color: #fff;
}

.label {
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
}

.step.active .label {
  font-weight: 700;
  color: #111827;
}

.step.done .label {
  color: #16a34a;
  font-weight: 600;
}
</style>

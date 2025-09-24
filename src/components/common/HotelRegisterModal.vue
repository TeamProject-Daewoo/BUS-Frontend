<template>
  <div class="overlay">
    <div class="modal">
      <h2>호텔이 등록되어 있지 않습니다</h2>
      <p>먼저 호텔 등록을 진행해주세요.</p>
      <button @click="goCreate">호텔 등록하기</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'

const router = useRouter()
const hotelStore = useHotelStore()

const goCreate = () => {
  hotelStore.showHotelRegisterModal = false
  router.push({ name: 'settings-create' })
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.modal {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 420px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.modal h2 { margin: 0 0 8px; }
.modal p { margin: 0 0 16px; color: #64748b; }
.modal button {
  padding: 10px 14px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.modal button:hover { background: #1d4ed8; }
</style>

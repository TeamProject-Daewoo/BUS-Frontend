<!-- src/App.vue -->
<script setup>
import { onMounted, computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import Sidebar from './components/common/Sidebar.vue'
import Footer from './components/common/Footer.vue'
import Header from './components/common/Header.vue'

import { useAuthStore } from './api/auth'
import { useHotelStore } from '@/stores/hotel'              // ✅ 추가
import HotelRegisterModal from '@/components/common/HotelRegisterModal.vue' // ✅ 추가

const authStore = useAuthStore()
const hotelStore = useHotelStore()
const route = useRoute()

const layout = computed(() => route.meta.layout || 'DefaultLayout')

onMounted(async () => {
  // Access Token이 스토어에 없는 경우에만 재발급을 시도합니다.
  authStore.initialize()
})
</script>

<template>
  <div v-if="layout === 'DefaultLayout'" class="container">
    <header class="header-container">
      <Header />
    </header>
    <div class="app-layout">
      <Sidebar />
      <main class="main-content">
        <RouterView />
      </main>
    </div>
    <footer class="footer-container">
      <Footer />
    </footer>
  </div>

  <div v-else>
    <RouterView />
  </div>

  <!-- ✅ 전역 강제 모달 -->
  <HotelRegisterModal v-if="hotelStore.showHotelRegisterModal" />
</template>

<style>
@import '@/assets/main.css';

.app-layout {
  display: flex;
  padding-top: 80px;
}
.main-content {
  flex-grow: 1;
  padding: 32px;
  background-color: var(--background-color);
}
.header-container {
  transition: height 0.5s ease-in-out;
}
.footer-container {
  min-height: 300px;
}
</style>

<!-- src/App.vue -->
<script setup>
import { onMounted, computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import Sidebar from './components/common/Sidebar.vue'
import Footer from './components/common/Footer.vue'
import Header from './components/common/Header.vue'
import AlertModal from '@/components/common/AlertModal.vue';

import { storeToRefs } from 'pinia';
import { useUiStore } from './store/commonUiStore';
import { useAuthStore } from './api/auth'
import { useHotelStore } from '@/stores/hotel'              // ✅ 추가
import HotelRegisterModal from '@/components/common/HotelRegisterModal.vue' // ✅ 추가

const authStore = useAuthStore()
const hotelStore = useHotelStore()
const route = useRoute()
const uiStore = useUiStore();

const layout = computed(() => route.meta.layout || 'DefaultLayout')

const { isModalVisible, modalTitle, modalMessage } = storeToRefs(uiStore);
const { closeModal } = uiStore;

const headerStyle = computed(() => ({
  height: route.path === '/' ? '0px' : '80px'
}));

onMounted(async () => {

  if (!authStore.isInitialized) {
    try {
      const response = await api.post('/api/auth/refresh');
      authStore.setToken(response.data.accessToken);

      console.log("토큰 재발급 성공");
    } catch (error) {
      console.log("자동 로그인 실패, 유효한 리프레시 토큰이 없습니다.");
    } finally {
      authStore.setInitialized();
    }
  }
});
</script>

<template>
  <div v-if="layout === 'DefaultLayout'" class="container">
    <header class="header-container" :style="headerStyle">
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
    <AlertModal
      v-if="isModalVisible"
      :title="modalTitle"
      :message="modalMessage"
      @close="closeModal" 
    />
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

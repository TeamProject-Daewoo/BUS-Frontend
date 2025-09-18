<script setup>
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { RouterView } from 'vue-router'
import Sidebar from './components/common/Sidebar.vue'
import Footer from './components/common/Footer.vue';
import Header from './components/common/Header.vue';

import { useAuthStore } from './api/auth';
import api from './api/axios';

const authStore = useAuthStore();
const route = useRoute();

const layout = computed(() => {
  return route.meta.layout || 'DefaultLayout';
});

onMounted(async () => {
  if (!authStore.isInitialized) {
    try {
      const response = await api.post('/api/auth/refresh');
      authStore.setToken(response.data.accessToken);
      console.log("토큰 재발급 성공");
      console.log('현재 Access Token:', authStore.accessToken);
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
  height: 300px;
}
</style>
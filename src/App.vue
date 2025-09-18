<!-- src/App.vue -->
<script setup>
import { onMounted, computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import Sidebar from './components/common/Sidebar.vue'
import Footer from './components/common/Footer.vue'
import Header from './components/common/Header.vue'

import { useAuthStore } from './api/auth'
import api from './api/axios'

const authStore = useAuthStore()
const route = useRoute()

const layout = computed(() => route.meta.layout || 'DefaultLayout')

onMounted(async () => {
  // 1) 로컬스토리지에 있는 accessToken 복원 + roles 파싱
  if (!authStore.isInitialized) {
    authStore.init()
  }

  // 2) accessToken이 없으면 "조용히" 자동 로그인 시도(쿠키 refreshToken 필요)
  if (!authStore.accessToken) {
    try {
      const { data } = await api.post('/api/auth/refresh')
      if (data?.accessToken) {
        authStore.setToken(data.accessToken)
        console.log('[App] 토큰 재발급 성공')
      }
    } catch {
      console.log('[App] 자동 로그인 실패(유효 refreshToken 없음)')
    }
  }
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

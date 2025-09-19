<template>
  <div class="dashboard">
    <h1>대시보드</h1>
    <div class="headline-divider"></div>

    <div v-if="!store.selectedContentId" class="hint">
      사이드바 또는 <RouterLink to="/hotels">호텔 선택</RouterLink>에서 호텔을 먼저 선택하세요.
    </div>

    <DashboardPage v-else />
    
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'
import DashboardPage from '@/components/Dashboard/DashboardPage.vue'

const store = useHotelStore()
</script>

<style scoped>
.dashboard { max-width: 100%; }
.hint { margin: 12px 0; color: #6b7280; }
.headline-divider { height:1px; background:#e5e7eb; margin:8px 0 14px; }
</style>

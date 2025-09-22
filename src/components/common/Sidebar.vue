<!-- src/components/Sidebar.vue -->
<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>호텔 관리</h1>

      <!-- 호텔 선택 드롭다운 -->
      <div class="hotel-select">
        <select v-model="selected" @change="onChange">
          <option value="" disabled>호텔을 선택하세요</option>
          <option v-for="h in store.hotels" :key="h.contentid" :value="h.contentid">
            {{ h.title || h.contentid }}
          </option>
        </select>
      </div>
    </div>

    <nav class="sidebar-nav">
      <RouterLink to="/dashboard" class="nav-item">대시보드</RouterLink>
      <RouterLink to="/reservations" class="nav-item">예약 관리</RouterLink>
      <RouterLink to="/rooms" class="nav-item">객실 관리</RouterLink>
      <RouterLink to="/settings" class="nav-item">호텔 설정</RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'

const store = useHotelStore()
const selected = ref(store.selectedContentId || '')

onMounted(async () => {
  if (!store.hotels.length) {
    await store.loadHotels()
  }
  selected.value = store.selectedContentId
})

watch(() => store.selectedContentId, (v) => {
  selected.value = v
})

function onChange() {
  store.setSelected(selected.value)
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid var(--border-color, #e5e7eb);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  flex: 0 0 270px;
}

.sidebar-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.sidebar-header h1 {
  margin: 0 0 12px;
  font-size: 22px;   /* ✅ 크게 */
  font-weight: 700;
  color: var(--text-primary, #111827);
}

.hotel-select {
  display: flex;
  gap: 8px;
  align-items: center;
}

.hotel-select select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px; /* ✅ 둥글게 */
  background: #fff;
  font-size: 14px;     /* ✅ 크기 키움 */
  font-weight: 500;
  color: #374151;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); /* ✅ 그림자 */
  transition: border-color 0.2s, box-shadow 0.2s;
}

.hotel-select select:focus {
  outline: none;
  border-color: #16a34a; /* ✅ 초록색 강조 */
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.nav-item {
  padding: 10px 12px;
  text-decoration: none;
  color: var(--text-secondary, #374151);
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: var(--background-color, #f9fafb);
  color: var(--primary-color, #16a34a);
}

.nav-item.router-link-exact-active {
  background-color: #e9f7ef;
  color: #16a34a;
  font-weight: 600;
}
</style>

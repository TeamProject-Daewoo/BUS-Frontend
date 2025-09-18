<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>호텔 관리</h1>
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
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.sidebar {
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid var(--border-color);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  flex: 0 0 240px;       /* 부모 flex 영향 차단 */
  writing-mode: horizontal-tb;  /* 글자 수평 강제 */
  text-orientation: mixed;
}
.sidebar .nav-item {
  display: block;                /* a 태그 기본값 덮어쓰기 */
  writing-mode: horizontal-tb;   /* 혹시 모를 전역 writing-mode 차단 */
  white-space: nowrap;           /* 세로 줄바꿈 방지 */
}
.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}
.sidebar-header h1 {
  margin: 0;
  font-size: 22px;
  color: var(--text-primary);
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 16px;
}
.nav-item {
  padding: 12px 16px;
  text-decoration: none;
  color: var(--text-secondary);
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.nav-item:hover {
  background-color: var(--background-color);
  color: var(--primary-color);
}
.nav-item.router-link-exact-active {
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  font-weight: 600;
}
</style>
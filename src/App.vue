<script setup>
import { RouterView } from 'vue-router'
import Sidebar from './components/common/Sidebar.vue'
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
@import '@/assets/main.css';

.app-layout {
  display: flex;
}

.main-content {
  flex-grow: 1;
  padding: 32px;
  background-color: var(--background-color);
}
</style>
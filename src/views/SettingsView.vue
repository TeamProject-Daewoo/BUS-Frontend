<!-- src/views/SettingsView.vue -->
<template>
  <div class="page">
    <h1>호텔 수정</h1>
    <RouterLink to="/settings" class="back">← 목록으로</RouterLink>
    <HotelSettingsForm :contentid="contentid" />
  </div>
</template>

<script setup>
import { useRoute, RouterLink } from 'vue-router'
import HotelSettingsForm from '@/components/Hotel/HotelSettingsForm.vue'

const route = useRoute()
const contentid = route.params.contentid
</script>

<style scoped>
.page { max-width: 900px; }
.back { display:inline-block; margin: 6px 0 12px; color:#2563eb; text-decoration:none; }
.back:hover { text-decoration:underline; }
</style>

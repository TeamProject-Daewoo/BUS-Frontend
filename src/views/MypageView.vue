<template>
  <main class="mypage-container">
    <div class="mypage-layout">
      <div class="content-area">
        <component :is="currentViewComponent"></component>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import ProfileView from '../components/mypage/ProfileView.vue';
import SettingsView from '../components/mypage/SettingsView.vue';

const currentPage = ref('profile');

const views = {
  profile: ProfileView,
  settings: SettingsView,
};

const currentViewComponent = computed(() => views[currentPage.value]);

const handleNavigation = (page) => {
  currentPage.value = page;
};
</script>

<style scoped>
.mypage-container {
  width: 100%;
  max-width: 1280px;
  margin: 2rem auto;
  padding: 0 1rem;
}
.mypage-layout {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}
.content-area {
  flex: 1;
}

@media (max-width: 768px) {
  .mypage-layout {
    flex-direction: column;
  }
}
</style>
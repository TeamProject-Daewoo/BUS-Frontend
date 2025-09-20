// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import MainLandingPage from '@/views/MainLandingPage.vue'
import MypageView from '@/views/MypageView.vue'
import ReservationsView from '@/views/ReservationsView.vue'
import RoomsView from '@/views/RoomsView.vue'
import SettingsView from '@/views/SettingsView.vue'           // 개별 수정
import HotelsSelectView from '@/views/HotelsSelectView.vue'   // 목록
import HotelCreateView from '@/views/HotelCreateView.vue'
import { watch } from 'vue'

import { useAuthStore } from '@/api/auth'
import { useHotelStore } from '@/stores/hotel'

const routes = [
  { path: '/',         name: 'Home',      component: MainLandingPage, meta: { layout: 'EmptyLayout' } },
  { path: '/login',    name: 'login',     component: LoginView,       meta: { layout: 'EmptyLayout' } },
  { path: '/register', name: 'register',  component: RegisterView,    meta: { layout: 'EmptyLayout' } },

  // 과거 호환: /hotels -> /settings(목록)
  { path: '/hotels', redirect: { name: 'settings-list' } },

  { path: '/dashboard',    name: 'dashboard',    component: DashboardView,   meta: { requiresAuth: true } },
  { path: '/reservations', name: 'reservations', component: ReservationsView, meta: { requiresAuth: true, requiresHotel: true } },
  { path: '/rooms',        name: 'rooms',        component: RoomsView,        meta: { requiresAuth: true, requiresHotel: true } },

  // ✅ 호텔 관리: 목록(여기에 HotelsSelectView 내용 배치)
  { path: '/settings', name: 'settings-list', component: HotelsSelectView, meta: { requiresAuth: true } },
  { path: '/settings/new', name: 'settings-create', component: HotelCreateView, meta: { requiresAuth: true } }, // ← 추가 전용
  // ✅ 호텔 관리: 개별 수정(여기에 SettingsView 폼 표시)
  { path: '/settings/:contentid', name: 'settings-edit', component: SettingsView, props: true, meta: { requiresAuth: true } },

  { path: '/mypage', name: 'mypage', component: MypageView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const hotel = useHotelStore()
  const isLoggedIn = !!authStore.accessToken

    if (authStore.isInitialized) {
    handleNavigation(to, from, next)
  } else {
    const unwatch = watch(() => authStore.isInitialized, (isInitialized) => {
      if (isInitialized) {
        handleNavigation(to, from, next)
        unwatch()
      }
    })
  }
  if (!hotel.hotels?.length && !hotel.selectedContentId) hotel.restore()

  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: '/', query: { redirect: to.fullPath } })
  }
  if (to.meta.requiresHotel && !hotel.selectedContentId) {
    // 호텔 선택 필요한 화면(예약/객실 등)은 목록으로 보냄
    return next({ name: 'settings-list' })
  }
  next()
})

function handleNavigation(to, from, next) {
  const authStore = useAuthStore()
  const isLoggedIn = !!authStore.accessToken

  // 이동하려는 페이지가 로그인이 필요한데, 로그인하지 않은 경우
  if (to.meta.requiresAuth && !isLoggedIn) {
    alert('로그인이 필요한 서비스입니다.')
    next('/') // 👈 요청하신 대로 메인 페이지('/')로 이동
  }
  // 이동하려는 페이지가 로그아웃 상태여야 하는데, 로그인한 경우
  else if (to.meta.requiresGuest && isLoggedIn) {
    // 이미 로그인했다면, 대시보드 페이지로 보냅니다.
    next('/dashboard') 
  } 
  // 그 외의 경우는 정상적으로 통과
  else {
    next()
  }
}

export default router

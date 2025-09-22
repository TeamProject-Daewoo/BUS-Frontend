import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import MainLandingPage from '@/views/MainLandingPage.vue'
import MypageView from '@/views/MypageView.vue'
import ReservationsView from '@/views/ReservationsView.vue'
import RoomsView from '@/views/RoomsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import HotelsSelectView from '@/views/HotelsSelectView.vue'
import HotelCreateView from '@/views/HotelCreateView.vue'
import { watch } from 'vue'

import { useAuthStore } from '@/api/auth'
import { useHotelStore } from '@/stores/hotel'

const routes = [
  { path: '/',            name: 'Home',            component: MainLandingPage,  meta: { layout: 'EmptyLayout' } },
  { path: '/login',       name: 'login',           component: LoginView,        meta: { layout: 'EmptyLayout' } },
  { path: '/register',    name: 'register',        component: RegisterView,     meta: { layout: 'EmptyLayout' } },
  { path: '/hotels',      redirect: { name: 'settings-list' } },

  { path: '/dashboard',   name: 'dashboard',       component: DashboardView,    meta: { requiresAuth: true } },
  { path: '/reservations',name: 'reservations',    component: ReservationsView, meta: { requiresAuth: true, requiresHotel: true } },
  { path: '/rooms',       name: 'rooms',           component: RoomsView,        meta: { requiresAuth: true, requiresHotel: true } },

  { path: '/settings',              name: 'settings-list',   component: HotelsSelectView, meta: { requiresAuth: true } },
  { path: '/settings/new',          name: 'settings-create', component: HotelCreateView,  meta: { requiresAuth: true } },
  { path: '/settings/:contentid',   name: 'settings-edit',   component: SettingsView,     props: true, meta: { requiresAuth: true } },

  { path: '/mypage',      name: 'mypage',          component: MypageView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const hotelStore = useHotelStore()
  const isLoggedIn = !!authStore.accessToken

  const proceed = () => {
    if (!hotelStore.hotels?.length && !hotelStore.selectedContentId) {
      hotelStore.restore?.()
    }

    if (to.meta.requiresAuth && !isLoggedIn) {
      // name: '/' ❌ -> name: 'Home' 또는 path:'/'
      return next({ name: 'Home', query: { redirect: to.fullPath } })
    }

    if (to.meta.requiresHotel && !hotelStore.selectedContentId) {
      return next({ name: 'settings-list' })
    }

    return next()
  }

  // auth 초기화가 비동기면 대기
  if (authStore.isInitialized) {
    proceed()
  } else {
    const unwatch = watch(
      () => authStore.isInitialized,
      (ok) => {
        if (ok) { proceed(); unwatch() }
      }
    )
  }
})

export default router

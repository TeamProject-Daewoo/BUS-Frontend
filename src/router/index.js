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
import SpecialPriceEditor from '@/views/SpecialPriceEditor.vue'
import { watch } from 'vue'

import { useAuthStore } from '@/api/auth'
import { useHotelStore } from '@/stores/hotel'

const routes = [
  { path: '/',            name: 'Home',            component: MainLandingPage,  meta: { layout: 'EmptyLayout' } },
  { path: '/login',       name: 'login',           component: LoginView,        meta: { layout: 'EmptyLayout' } },
  { path: '/register',    name: 'register',        component: RegisterView,     meta: { layout: 'EmptyLayout' } },
  { path: '/hotels',      redirect: { name: 'settings-list' } },

  { path: '/dashboard',   name: 'dashboard',       component: DashboardView,    meta: { requiresAuth: true, requiresHotel: true } },
  { path: '/reservations',name: 'reservations',    component: ReservationsView, meta: { requiresAuth: true, requiresHotel: true } },
  { path: '/rooms',       name: 'rooms',           component: RoomsView,        meta: { requiresAuth: true, requiresHotel: true } },

  { path: '/settings',              name: 'settings-list',   component: HotelsSelectView, meta: { requiresAuth: true, requiresHotel: true } },
  { path: '/settings/new',          name: 'settings-create', component: HotelCreateView,  meta: { requiresAuth: true } },
  { path: '/settings/:contentid',   name: 'settings-edit',   component: SettingsView,     props: true, meta: { requiresAuth: true } },
  { path: '/setprice',              name: 'SpecialPriceEditor', component: SpecialPriceEditor, props: true, meta: { requiresAuth: true, requiresHotel: true } },

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

    // 인증 필요한데 로그인 안됨
    if (to.meta.requiresAuth && !isLoggedIn) {
      return next({ name: 'Home', query: { redirect: to.fullPath } })
    }

    // 호텔이 필요한 페이지 접근
    if (to.meta.requiresHotel) {
      if (!hotelStore.hotels?.length) {
        // ✅ 등록된 호텔 자체가 없으면 → 생성 페이지에서는 모달 띄우지 않음
        if (to.name !== 'settings-create') {
          hotelStore.showHotelRegisterModal = true
          return next(false)
        }
      }
      if (!hotelStore.selectedContentId) {
        return next({ name: 'settings-list' })
      }
    }

    return next()
  }

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

// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import MainLandingPage from '@/views/MainLandingPage.vue'
import MypageView from '@/views/MypageView.vue'
const ReservationsView = () => import('@/views/ReservationsView.vue')
const RoomsView        = () => import('@/views/RoomsView.vue')
const SettingsView     = () => import('@/views/SettingsView.vue')
const HotelsSelectView = () => import('@/views/HotelsSelectView.vue')

import { useAuthStore } from '@/api/auth'
import { useHotelStore } from '@/stores/hotel'

const routes = [
  { path: '/',            name: 'Home',         component: MainLandingPage, meta: { layout: 'EmptyLayout' } },
  { path: '/login',       name: 'login',        component: LoginView,       meta: { layout: 'EmptyLayout' } },
  { path: '/register',    name: 'register',     component: RegisterView,    meta: { layout: 'EmptyLayout' } },

  { path: '/hotels',      name: 'hotels',       component: HotelsSelectView, meta: { requiresAuth: true } },

  { path: '/dashboard',   name: 'dashboard',    component: DashboardView,   meta: { requiresAuth: true } },
  { path: '/reservations',name: 'reservations', component: ReservationsView, meta: { requiresAuth: true, requiresHotel: true } },
  { path: '/rooms',       name: 'rooms',        component: RoomsView,        meta: { requiresAuth: true, requiresHotel: true } },
  { path: '/settings',    name: 'settings',     component: SettingsView,     meta: { requiresAuth: true, requiresHotel: true } },

  { path: '/mypage',      name: 'mypage',       component: MypageView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const hotel = useHotelStore()

  if (!auth.isInitialized) auth.init()
  if (!hotel.hotels?.length && !hotel.selectedContentId) {
    hotel.restore()
  }

  if (to.meta.requiresAuth && !auth.accessToken) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }
  if (to.meta.requiresHotel && !hotel.selectedContentId) {
    return next({ name: 'hotels' })
  }
  next()
})

export default router

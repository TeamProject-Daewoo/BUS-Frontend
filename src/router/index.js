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
import { useUiStore } from '@/stores/commonUiStore';
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

  // 앱 초기화(자동 로그인)가 끝날 때까지 기다림
  if (authStore.isInitialized) {
    handleNavigation(to, from, next)
  } else {
    // isInitialized 상태를 감시하여 완료되면 네비게이션 처리
    const unwatch = watch(() => authStore.isInitialized, (isInitialized) => {
      if (isInitialized) {
        handleNavigation(to, from, next)
        unwatch()
      }
    })
  }
})

// 실제 네비게이션 규칙을 처리하는 함수
function handleNavigation(to, from, next) {
  const authStore = useAuthStore()
  const hotelStore = useHotelStore()
  const isLoggedIn = !!authStore.accessToken // 👈 2. 함수 내에서 최신 로그인 상태 확인

  // 로그인 상태일 때만 호텔 정보 복원 시도
  if (isLoggedIn && !hotelStore.hotels?.length) {
    hotelStore.loadHotels() // hotelStore에 호텔 목록을 불러오는 액션
  }
  
  // A. 로그인이 필요한 페이지인데, 로그인하지 않은 경우
  if (to.meta.requiresAuth && !isLoggedIn) {
    const uiStore = useUiStore();
    uiStore.openModal('로그인이 필요한 서비스입니다.')
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }
  
  // B. 비로그인 상태여야 하는 페이지인데, 로그인한 경우
  if (to.meta.requiresGuest && isLoggedIn) {
    return next('/dashboard')
  }

  // C. 호텔 선택이 필요한 페이지인데, 호텔을 선택하지 않은 경우 (로그인 상태임이 보장됨)
  if (to.meta.requiresHotel && !hotelStore.selectedContentId) {
    // 등록된 호텔이 있는지 확인
    if (!hotelStore.hasHotels) { // hasHotels는 호텔 배열 길이를 확인하는 getter
      // 생성 페이지로 가는 경우는 예외
      if (to.name !== 'settings-create') {
        hotelStore.showHotelRegisterModal = true
        return next(false) // 현재 페이지에 머무름
      }
    } else {
      // 호텔은 있지만 선택을 안 한 경우, 선택 페이지로 보냄
      return next({ name: 'settings-list' })
    }
  }
  
  // 모든 조건을 통과하면 정상적으로 이동
  return next()
}


export default router

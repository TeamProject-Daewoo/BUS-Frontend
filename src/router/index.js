import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import MainLandingPage from '../views/MainLandingPage.vue'
import MypageView from '../views/MypageView.vue'

const ReservationsView = () => import('@/views/ReservationsView.vue');
const RoomsView        = () => import('@/views/RoomsView.vue');
const SettingsView     = () => import('@/views/SettingsView.vue');

const routes = [
  { path: '/',            name: 'Home',    component: MainLandingPage, meta: { layout: 'EmptyLayout' } },
  { path: "/login", name: "login", component: LoginView, meta: { layout: 'EmptyLayout' } },
  { path: "/register", name: "register", component: RegisterView, meta: { layout: 'EmptyLayout' } },
  { path: '/dashboard',            name: 'dashboard',    component: DashboardView },
  { path: '/reservations',name: 'reservations', component: ReservationsView },
  { path: '/rooms',       name: 'rooms',        component: RoomsView },
  { path: '/settings',    name: 'settings',     component: SettingsView },
  {path: "/mypage", name: "mypage", component: MypageView},

]

const router = createRouter({ 
    history: createWebHistory(), 
    routes 
}) 

export default router
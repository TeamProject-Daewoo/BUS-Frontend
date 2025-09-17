import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const ReservationsView = () => import('@/views/ReservationsView.vue');
const RoomsView        = () => import('@/views/RoomsView.vue');
const SettingsView     = () => import('@/views/SettingsView.vue');

const routes = [
  { path: '/',            name: 'dashboard',    component: DashboardView },
  { path: '/reservations',name: 'reservations', component: ReservationsView },
  { path: '/rooms',       name: 'rooms',        component: RoomsView },
  { path: '/settings',    name: 'settings',     component: SettingsView }
]

const router = createRouter({ 
    history: createWebHistory(), 
    routes 
}) 

export default router
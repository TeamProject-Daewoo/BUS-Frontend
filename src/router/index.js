import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
const ReservationsView = () => import('@/views/ReservationsView.vue');
const RoomsView        = () => import('@/views/RoomsView.vue');
const SettingsView     = () => import('@/views/SettingsView.vue');

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'dashboard',
            component: DashboardView
        },
        {
            path: '/reservations',
            name: 'reservations',
            component: () => import('../views/ReservationsView.vue') // Lazy loading
        },
        {
            path: '/rooms',
            name: 'rooms',
            component: () => import('../views/RoomsView.vue') // Lazy loading
        },
        {
            path: '/settings',
            name: 'settings',
            component: () => import('../views/SettingsView.vue') // Lazy loading
        }
    ]
})

export default router
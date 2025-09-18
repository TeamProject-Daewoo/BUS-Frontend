// src/api/authApi.js
import api from './axios'
import { useAuthStore } from '@/api/auth'

export async function login(payload) {
  // payload = { username, password }
  const { data } = await api.post('/api/auth/login', payload)
  const store = useAuthStore()
  store.setToken(data.accessToken)
  return data
}

export async function logout() {
  try { await api.post('/api/auth/logout') } catch {}
  const store = useAuthStore()
  store.clearToken()
}

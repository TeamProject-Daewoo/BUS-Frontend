// src/api/axios.js
import axios from 'axios'
import { useAuthStore } from '@/api/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_BACK_ADMIN_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // refreshToken 쿠키 전송
})

// ---- 요청: Bearer 자동 첨부 ----
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    else delete config.headers.Authorization
    return config
  },
  (error) => Promise.reject(error)
)

// ---- 응답: 401(옵션: /business의 403) → refresh → 재시도 ----
let isRefreshing = false
let queue = []

const enqueue = () => new Promise((resolve, reject) => queue.push({ resolve, reject }))
const flushQueue = (error, token) => {
  queue.forEach(p => (error ? p.reject(error) : p.resolve(token)))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { response, config } = err
    const status = response?.status
    const original = config
    if (!original || original._retry) return Promise.reject(err)

    const shouldRefresh =
      status === 401 ||
      (status === 403 && original.url?.startsWith('/business'))

    if (!shouldRefresh) return Promise.reject(err)

    original._retry = true
    const authStore = useAuthStore()

    if (isRefreshing) {
      try {
        const newToken = await enqueue()
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (e) {
        return Promise.reject(e)
      }
    }

    isRefreshing = true
    try {
      const { data } = await api.post('/api/auth/refresh')
      const newToken = data?.accessToken
      if (!newToken) throw new Error('no accessToken from refresh')

      authStore.setToken(newToken)
      flushQueue(null, newToken)

      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (e) {
      flushQueue(e, null)
      authStore.clearToken()
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)

export default api

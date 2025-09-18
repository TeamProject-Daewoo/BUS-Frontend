// src/api/auth.js
import { defineStore } from 'pinia'

const STORAGE_KEY = 'accessToken'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem(STORAGE_KEY) || null,
    loggedInUser: null,
    userName: null,
    roles: [], // ["ROLE_USER", "ROLE_BUSINESS", ...]
    isInitialized: false,
  }),

  getters: {
    isBusiness: (s) => s.roles.includes('ROLE_BUSINESS'),
    isAdmin: (s) => s.roles.includes('ROLE_ADMIN'),
    isUser: (s) => s.roles.includes('ROLE_USER'),
  },

  actions: {
    init() {
      const t = localStorage.getItem(STORAGE_KEY)
      if (t) this.setToken(t)
      this.isInitialized = true

      // 다른 탭과 동기화
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          const next = e.newValue
          if (next) this.setToken(next)
          else this.clearToken()
        }
      })
    },

    setToken(token) {
      this.accessToken = token || null
      if (token) localStorage.setItem(STORAGE_KEY, token)
      else localStorage.removeItem(STORAGE_KEY)

      const payload = this.parseJwt(token)
      this.loggedInUser = payload?.sub || null
      this.userName = payload?.name || null

      const auth = (payload?.auth || '').trim()
      this.roles = auth ? auth.split(',').map(s => s.trim()) : []
    },

    clearToken() {
      this.setToken(null)
      this.loggedInUser = null
      this.userName = null
      this.roles = []
    },

    logout() {
      this.clearToken()
    },

    parseJwt(token) {
      if (!token) return null
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        return JSON.parse(jsonPayload)
      } catch (e) {
        console.error('[auth] Invalid JWT token:', e)
        return null
      }
    },
  },
})

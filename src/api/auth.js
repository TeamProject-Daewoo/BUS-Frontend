import { defineStore } from 'pinia';
import api from '@/api/axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    loggedInUser: null,
    userName: null,
    isInitialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.accessToken,
  },

  actions: {
    setToken(token) {
      this.accessToken = token;
      localStorage.setItem('accessToken', token); // ✅ 저장
      const payload = this.parseJwt(token);

      this.loggedInUser = payload?.sub || null;
      this.userName = payload?.name || null;
    },

    logout() {
      this.accessToken = null;
      this.loggedInUser = null;
      this.userName = null;
      localStorage.removeItem('accessToken'); // ✅ 삭제
    },

    setInitialized() {
      this.isInitialized = true;
    },

    parseJwt(token) {
      if (!token) return null;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          ).join('')
        );
        return JSON.parse(jsonPayload);
      } catch {
        return null;
      }
    },

    async initialize() {
      this.isInitialized = false;

      try {
        // ✅ localStorage 먼저 확인
        const stored = localStorage.getItem('accessToken');
        if (stored) {
          this.setToken(stored);
          console.log('localStorage 토큰 복원 성공');
          this.isInitialized = true;
          return;
        }

        // ✅ 없으면 refresh 시도
        const response = await api.post('/api/auth/refresh');
        this.setToken(response.data.accessToken);
        console.log('refresh 성공, 토큰 재발급');
      } catch (error) {
        console.log('자동 로그인 실패', error);
        this.logout();
      } finally {
        this.isInitialized = true;
      }
    },
  },
});

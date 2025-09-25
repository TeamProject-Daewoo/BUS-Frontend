import { defineStore } from 'pinia';
import api from '@/api/axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    loggedInUser: null, // 사용자 ID (예: 'user123')
    userName: null,     // 사용자 이름 (예: '홍길동')
    loginType: null,    // 로그인 타입 (예: 'KAKAO')
    isInitialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.accessToken,
    isAdmin: (state) => {
      // 역할 정보는 JWT 페이로드에 있다고 가정
      if (!state.accessToken) return false;
      const payload = JSON.parse(atob(state.accessToken.split('.')[1]));
      return payload.auth?.includes('ROLE_ADMIN');
    },
  },
  
  actions: {
    // 토큰을 설정하고, 토큰 내부 정보로 state들을 업데이트하는 액션
    setToken(token) {
      this.accessToken = token;
      const payload = this.parseJwt(token);
      
      this.loggedInUser = payload?.sub || null;
      this.userName = payload?.name || null;
    },

    // 사용자 정보를 받아 state들을 업데이트하는 액션
    setUserInfo(userData) {
      if (userData) {
        this.loggedInUser = userData.username || this.loggedInUser;
        this.userName = userData.name || this.userName;
        this.loginType = userData.loginType || null;
      }
    },

    logout() {
      this.accessToken = null;
      this.loggedInUser = null;
      this.userName = null;
      this.loginType = null;
    },
    
    async initialize() {
      this.isInitialized = false;
      try {
        const refreshResponse = await api.post('/api/auth/refresh');
        const newAccessToken = refreshResponse.data.accessToken;
        
        // 1. 토큰 먼저 설정 (토큰 파싱을 통해 기본 정보 업데이트)
        this.setToken(newAccessToken);

        // 2. 서버에서 최신 사용자 정보 가져와서 덮어쓰기
        const userResponse = await api.get('/api/user/me');
        this.setUserInfo(userResponse.data);
        
        console.log('자동 로그인 및 사용자 정보 동기화 완료');
      } catch (error) {
        console.log('자동 로그인 실패. 유효한 리프레시 토큰이 없습니다.');
        this.logout();
      } finally {
        this.isInitialized = true;
      }
    },

    // JWT 페이로드를 안전하게 디코딩하는 헬퍼 함수
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
      } catch (e) {
        return null;
      }
    },
  },
});
import { defineStore } from 'pinia';
import api from '@/api/axios'; // axios 인스턴스 임포트

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    loggedInUser: null, // 사용자 ID (예: 'user123')
    userName: null,     // 사용자 이름 (예: '홍길동')
    isInitialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.accessToken,
  },
  
  actions: {
    setToken(token) {
      this.accessToken = token;
      const payload = this.parseJwt(token);
      
      // 토큰을 파싱하여 ID와 이름을 각각의 상태에 저장
      this.loggedInUser = payload?.sub || null;
      this.userName = payload?.name || null;
    },

    logout() {
      this.accessToken = null;
      this.loggedInUser = null;
      this.userName = null;
    },

    setInitialized() {
      this.isInitialized = true;
    },

    // JWT 페이로드를 안전하게 디코딩하는 헬퍼 함수
    parseJwt(token) {
      if (!token) { return null; }
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
    
    // 앱 시작 시 실행될 자동 로그인 액션
    async initialize() {
      this.isInitialized = false;
      try {
        const response = await api.post('/api/auth/refresh');
        // 👇 재발급받은 토큰으로 setToken을 호출하여 모든 상태를 한번에 업데이트
        this.setToken(response.data.accessToken);
        console.log(response.data.accessToken)
        console.log('자동 로그인 성공 (토큰 및 사용자 정보 업데이트 완료)');
      } catch (error) {
        console.log('자동 로그인 실패. 유효한 리프레시 토큰이 없습니다.');
        this.logout();
      } finally {
        this.isInitialized = true;
      }
    },
  },
});
<template>
  <div class="auth-wrapper">
    <div class="form-container">
      <div class="form-content">
        <h1>로그인</h1>
        <p class="subtitle">로그인해주세요</p>

        <form @submit.prevent="handleLogin">
          <div class="input-group">
            <label for="user_name">아이디</label>
            <input type="text" id="user_name" v-model="user_name" maxlength="20" required />
          </div>

          <div class="input-group">
            <label for="password">비밀번호</label>
            <div class="password-wrapper">
              <input :type="passwordFieldType" id="password" v-model="password" required />
              <span class="toggle-password" @click="togglePasswordVisibility">
                👁️
              </span>
            </div>
          </div>

          <!-- ✅ reCAPTCHA 추가 -->
          <div class="input-group">
            <div
              ref="recaptchaBox"
              class="g-recaptcha"
              :data-sitekey="siteKey"
              data-callback="onCaptchaSuccess"
              data-expired-callback="onCaptchaExpired">
            </div>
            <p v-if="captchaError" class="captcha-error">reCAPTCHA 인증이 필요합니다.</p>
          </div>
          <!-- ✅ 끝 -->

          <div class="options">
            <div class="remember-me">
              <input type="checkbox" id="remember" v-model="rememberMe" />
              <label for="remember">비밀번호 기억하기</label>
            </div>
            <a href="#" class="forgot-password">비밀번호를 잊으셨나요?</a>
          </div>

          <button type="submit" class="auth-button">로그인</button>
        </form>

        <div class="switch-auth">
          <router-link to="/register">회원가입</router-link>
        </div>
      </div>
    </div>

    <div class="image-container">
      <Sidemenu />
      <div class="dots">
        <span class="dot active"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidemenu from '@/components/sidepage/loginside.vue';
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/axios';
import { useAuthStore } from '@/api/auth';
import { useUiStore } from '@/stores/commonUiStore';

const uiStore = useUiStore();
const user_name = ref('');
const password = ref('');
const rememberMe = ref(false);
const passwordFieldType = ref('password');
const router = useRouter();
const authStore = useAuthStore();

/** ✅ reCAPTCHA 관련 (UI/토큰만 추가) */
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'SITE_KEY_HERE';
const recaptchaBox = ref(null);
const recaptchaToken = ref(null);
const captchaError = ref(false);

function bindCaptchaCallbacks() {
  window.onCaptchaSuccess = (token) => {
    recaptchaToken.value = token;
    captchaError.value = false;
  };
  window.onCaptchaExpired = () => {
    recaptchaToken.value = null;
  };
}
function renderCaptchaIfReady() {
  if (window.grecaptcha?.render && recaptchaBox.value) {
    try {
      if (!recaptchaBox.value.children.length) {
        window.grecaptcha.render(recaptchaBox.value, {
          sitekey: siteKey,
          callback: 'onCaptchaSuccess',
          'expired-callback': 'onCaptchaExpired',
        });
      }
    } catch (e) {
      console.warn('reCAPTCHA render 실패', e);
    }
  }
}
function ensureCaptchaScript() {
  if (document.querySelector('script[src*="recaptcha/api.js"]')) return;
  const s = document.createElement('script');
  s.src = 'https://www.google.com/recaptcha/api.js';
  s.async = true;
  s.defer = true;
  s.onload = () => renderCaptchaIfReady();
  document.head.appendChild(s);
}
onMounted(() => {
  bindCaptchaCallbacks();
  ensureCaptchaScript();
  setTimeout(renderCaptchaIfReady, 0);
});
onBeforeUnmount(() => {
  delete window.onCaptchaSuccess;
  delete window.onCaptchaExpired;
});
/** ✅ reCAPTCHA 끝 */

/** 아이디 특수문자 제거 */
watch(user_name, (newValue) => {
  const regex = /[^a-zA-Z0-9]/g;
  const sanitizedValue = newValue.replace(regex, '');
  if (newValue !== sanitizedValue) {
    user_name.value = sanitizedValue;
  }
});

const handleLogin = async () => {
  // ✅ reCAPTCHA 토큰 없으면 제출 막고 알림
  if (!recaptchaToken.value) {
    captchaError.value = true;
    uiStore.openModal({
      title: 'reCAPTCHA 확인 필요',
      message: 'reCAPTCHA 확인란을 체크해주세요.',
    });
    try {
      recaptchaBox.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const iframe = recaptchaBox.value?.querySelector('iframe');
      iframe?.focus?.();
    } catch {}
    return;
  }

  try {
    const response = await api.post('/api/auth/login', {
      username: user_name.value,
      password: password.value,
      // ✅ 백엔드 검증용으로 토큰만 추가 전송
      recaptchaToken: recaptchaToken.value,
    });

    // Body로 받은 Access Token을 Pinia 스토어에 저장
    authStore.setToken(response.data.accessToken);

    router.push('/dashboard'); // 메인페이지로 이동
  } catch (error) {
    console.error('로그인 실패:', error);
    uiStore.openModal({
      title: '로그인 실패',
      message: '아직 승인되지 않은 사용자거나 아이디 또는 비밀번호가 올바르지 않습니다.',
    });
    // 실패 시 캡차 리셋
    if (window.grecaptcha?.reset) {
      window.grecaptcha.reset();
      recaptchaToken.value = null;
    }
  }
};

const togglePasswordVisibility = () => {
  passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password';
};
</script>

<style scoped>
/* 기본 레이아웃 */
.auth-wrapper {
  display: flex;
  min-height: 100vh;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.form-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background-color: #fff;
}

.form-content {
  width: 100%;
  max-width: 420px;
}

.image-container {
  flex: 1;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
}

.image-container img {
  width: 85%;
  height: 85%;
  object-fit: cover;
  border-radius: 20px;
}

/* 폼 요소 스타일 */
h1 {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.password-wrapper input {
  padding-right: 40px;
}
.toggle-password {
  position: absolute;
  right: 15px;
  cursor: pointer;
  user-select: none;
}

.name-group {
  display: flex;
  gap: 20px;
}
.name-group .input-group {
  flex: 1;
}

/* 옵션 (비밀번호 찾기, 등) */
.options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 25px;
}

.remember-me {
  display: flex;
  align-items: center;
}
.remember-me input {
  margin-right: 8px;
}
.remember-me label, .forgot-password {
  color: #555;
  text-decoration: none;
}
.forgot-password:hover {
  text-decoration: underline;
}

/* 버튼 및 링크 */
.auth-button {
  width: 100%;
  padding: 15px;
  background-color: #68C9B4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.auth-button:hover {
  background-color: #57b3a0;
}

.switch-auth {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}
.switch-auth a {
  color: #68C9B4;
  font-weight: bold;
  text-decoration: none;
}
.switch-auth a:hover {
  text-decoration: underline;
}

/* 이미지 아래 점 */
.dots {
  position: absolute;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}
.dot {
  width: 8px;
  height: 8px;
  background-color: #ccc;
  border-radius: 50%;
}
.dot.active {
  background-color: #fff;
}

.captcha-error {
  margin-top: 8px;
  color: #c0392b;
  font-size: 13px;
}
</style>

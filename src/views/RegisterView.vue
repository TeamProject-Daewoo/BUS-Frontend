<template>
  <div class="auth-wrapper reverse">
    <div class="form-container">
      <div class="form-content">
        <h1>회원가입</h1>
        <p class="subtitle"></p>

        <form @submit.prevent="handleRegister">
          <div class="input-group">
            <label for="user_name">아이디</label>
            <p class="input-help-text">
    숫자, 영어 대소문자만을 사용하여 5~20자 사이로 입력해주세요.
  </p>
            <div class="input-with-button">
              <input 
                type="text" 
                id="user_name" 
                v-model="formData.user_name" 
                placeholder="아이디 입력"
                required />
              <button 
                type="button" 
                @click="checkUsername" 
                :disabled="isUsernameChecked || !formData.user_name" 
                class="check-button">
                  {{ isUsernameChecked ? '확인완료' : '중복확인' }}
              </button>
            </div>
            <p v-if="usernameMessage" :class="usernameMessageClass">{{ usernameMessage }}</p>
          </div>

          <div class="input-group">
            <label for="password">비밀번호</label>
            <input type="password" id="password" v-model="formData.password" required />
          </div>

          <div class="input-group">
            <label for="confirmPassword">비밀번호 확인</label>
            <input type="password" id="confirmPassword" v-model="formData.confirmPassword" required />
            <p v-if="formData.confirmPassword" :class="passwordsMatch ? 'success-text' : 'error-text'">
              {{ passwordsMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.' }}
            </p>
          </div>

          <div class="input-group">
            <label for="name">사업자 이름</label>
            <input type="text" id="name" v-model="formData.name" required />
          </div>

          <div class="input-group">
            <label for="phone">휴대폰 번호</label>
            <input type="tel" id="phone" v-model="formData.phone" required />
          </div>

          <div class="input-group">
            <label for="bizNum1">사업자 번호</label>
            <div class="biz-num-inputs">
              <input type="tel" id="bizNum1" ref="bizNumInput1" v-model="bizNum1" @input="handleInput1" maxlength="3" placeholder="000" required />
              <span>-</span>
              <input type="tel" id="bizNum2" ref="bizNumInput2" v-model="bizNum2" @input="handleInput2" maxlength="2" placeholder="00" required />
              <span>-</span>
              <input type="tel" id="bizNum3" ref="bizNumInput3" v-model="bizNum3" maxlength="5" placeholder="00000" required />
            </div>
          </div>

          <div class="options">
            <div class="remember-me">
              <input type="checkbox" id="agree" v-model="formData.agree" />
              <label for="agree">
                <a href="#" @click.prevent="openTermsModal" class="terms-link">이용약관</a>에 동의합니다.
              </label>
            </div>
          </div>

          <button type="submit" class="auth-button" :disabled="!isFormValid" :class="{ 'disabled-button': !isFormValid }">
            계정 생성
          </button>
        </form>
        <TermsModal :isOpen="isTermsModalOpen" @close="closeTermsModal" />
      </div>
    </div>
    <div class="image-container">
       <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1925&q=80" alt="Hotel pool view" />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/axios';
import TermsModal from '@/components/mypage/TermsModal.vue';
import { useUiStore } from '@/stores/commonUiStore';

const uiStore = useUiStore();
const router = useRouter();

const formData = reactive({
  user_name: '',
  name: '',
  phone: '',
  business_registration_number: '',
  password: '',
  confirmPassword: '',
  agree: false,
  role: 'BUSINESS',
});

// 아이디 중복확인 관련 상태
const isUsernameChecked = ref(false);
const usernameMessage = ref('');
const usernameMessageClass = ref('');

// 사업자 번호 UI 제어용
const bizNum1 = ref('');
const bizNum2 = ref('');
const bizNum3 = ref('');
const bizNumInput2 = ref(null);
const bizNumInput3 = ref(null);

// 약관 모달 제어용
const isTermsModalOpen = ref(false);

const openTermsModal = () => isTermsModalOpen.value = true;
const closeTermsModal = () => isTermsModalOpen.value = false;


// --- 아이디 중복 확인 ---
const checkUsername = async () => {
  if (!formData.user_name) {
    uiStore.openModal('아이디 입력 필요', '아이디를 입력해주세요.');
    return;
  }
  if (formData.user_name.length < 5 || formData.user_name.length > 20) {
    uiStore.openModal('아이디 길이 오류', '아이디는 5자 이상, 20자 이하로 입력해주세요.');
    console.log(uiStore.isModalVisible);
    return;
  }
  try {
    await api.post('/api/auth/check-username', { username: formData.user_name });
    usernameMessage.value = '사용 가능한 아이디입니다.';
    usernameMessageClass.value = 'success-text';
    isUsernameChecked.value = true;
  } catch (error) {
    usernameMessage.value = '이미 사용 중인 아이디입니다.';
    usernameMessageClass.value = 'error-text';
    isUsernameChecked.value = false;
  }
};

// 사용자가 아이디를 다시 수정하면, 중복확인 상태와 메시지를 초기화
watch(() => formData.user_name, () => {
    isUsernameChecked.value = false;
    usernameMessage.value = '';
    usernameMessageClass.value = '';
});


// --- 사업자 번호 자동 포커스 이동 ---
watch([bizNum1, bizNum2, bizNum3], () => {
  formData.business_registration_number = `${bizNum1.value}${bizNum2.value}${bizNum3.value}`;
});
const handleInput1 = () => { if (bizNum1.value.length === 3) bizNumInput2.value.focus(); };
const handleInput2 = () => { if (bizNum2.value.length === 2) bizNumInput3.value.focus(); };


// --- 최종 유효성 검사 ---
const passwordsMatch = computed(() => formData.password && formData.password === formData.confirmPassword);

const isFormValid = computed(() => {
  const requiredFields = [
    formData.user_name,
    formData.password,
    formData.confirmPassword,
    formData.name,
    formData.phone,
    formData.business_registration_number
  ];
  const allFieldsFilled = requiredFields.every(field => field && field.trim() !== '');
  return allFieldsFilled && isUsernameChecked.value && passwordsMatch.value && formData.agree;
});


// --- 회원가입 제출 ---
const handleRegister = async () => {
  if (!isFormValid.value) {
    alert('모든 입력 항목을 올바르게 채우고 약관에 동의해주세요.');
    return;
  }
  
  try {
    await api.post('/api/auth/sign-up', {
        username: formData.user_name,
        password: formData.password,
        name: formData.name,
        phoneNumber: formData.phone,
        business_registration_number: formData.business_registration_number,
        role: formData.role
    });

    alert('회원가입이 완료되었습니다. 관리자의 승인을 기다려주세요.');
    router.push('/login-choice');
  } catch (error) {
    console.error('회원가입 실패:', error);
    alert(error.response?.data || '회원가입 중 오류가 발생했습니다.');
  }
};
</script>

<style scoped>
/* RegisterView에서만 순서를 바꾸기 위해 reverse 클래스 사용 */
.auth-wrapper.reverse {
  flex-direction: row-reverse;
}

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
  font-weight: 500;
  color: #333;
  margin-bottom: 5px; /* label과 안내 텍스트 사이 간격 */
}

/* 안내 텍스트 스타일 */
.input-help-text {
  font-size: 12px;
  color: #777;
  margin-bottom: 8px; /* 안내 텍스트와 입력창 사이 간격 */
}

/* 입력창과 버튼을 감싸는 div */
.input-with-button {
  display: flex;
  gap: 10px;
  align-items: center;
}
.input-with-button input {
  flex-grow: 1; /* 입력창이 남는 공간을 모두 차지하도록 설정 */
}

/* 중복확인 버튼 스타일 */
.check-button {
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid #6c757d;
  background-color: #6c757d;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap; /* 텍스트 줄바꿈 방지 */
  transition: background-color 0.2s;
}
.check-button:hover:not(:disabled) {
  background-color: #5a6268;
}
.check-button:disabled {
  background-color: #e9ecef;
  border-color: #e9ecef;
  color: #adb5bd;
  cursor: not-allowed;
}

/* 비밀번호 일치/불일치 메시지 */
.success-text, .error-text {
  font-size: 13px;
  margin-top: 6px;
  font-weight: 500;
}
.success-text {
  color: #28a745;
}
.error-text {
  color: #dc3545;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}

.input-group label {
  /* ... */
  margin-bottom: 5px; /* label과 안내 텍스트 사이 간격 */
}

.input-help-text {
  font-size: 12px;
  color: #777;
  margin-top: 0; /* label과의 간격을 margin-bottom으로만 제어 */
  margin-bottom: 8px; /* 안내 텍스트와 입력창 사이 간격 */
  text-align: left; /* 왼쪽 정렬 */
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
  justify-content: flex-start; /* '동의하기'만 있으므로 왼쪽 정렬 */
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
.remember-me label {
  color: #555;
  text-decoration: none;
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

.auth-button.disabled-button {
  background-color: #a0aec0; /* 회색톤으로 변경 */
  cursor: not-allowed; /* 마우스 커서 변경 */
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

.biz-num-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.biz-num-inputs input {
  width: 100%;
  text-align: center;
}

.biz-num-inputs span {
  font-size: 1.2rem;
  color: #888;
}
.terms-link {
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
}
</style>
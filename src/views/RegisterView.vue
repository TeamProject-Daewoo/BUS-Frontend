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
    숫자, 영어 대소문자를 사용하여 5~20자 사이로 입력해주세요.
  </p>
            <div class="input-with-button">
              <input 
                type="text" 
                id="user_name" 
                v-model="formData.user_name" 
                placeholder="아이디 입력"
                maxlength="20"
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
      <Sidemenu />
    </div>
  </div>
</template>

<script setup>
import Sidemenu from '@/components/sidepage/registerside.vue';
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
  rawPhone: '',
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
  const username = formData.user_name;

  if (!username) {
    uiStore.openModal('아이디 입력 필요', '아이디를 입력해주세요.');
    return;
  }

  // 👇 [수정] 아이디 형식 및 규칙 검사
  const regex = /^[a-zA-Z0-9]{5,20}$/; // 1. 영어/숫자만, 5~20자 길이
  const hasLetter = /[a-zA-Z]/.test(username); // 2. 영어가 포함되었는가
  const hasNumber = /[0-9]/.test(username);  // 3. 숫자가 포함되었는가

  if (!regex.test(username)) {
    uiStore.openModal('아이디 형식 오류', '아이디는 5~20자의 영어와 숫자로 구성되어야 합니다.');
    return;
  }

  if (!hasLetter) {
    uiStore.openModal('아이디 규칙 오류', '아이디는 영어를 반드시 포함해야 합니다.');
    return;
  }
  
  // 모든 검사를 통과하면 중복 확인 API 호출
  try {
    await api.post('/api/auth/check-username', { username: username });
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

watch(
  () => formData.name,
  (newValue) => {
    // 정규식: 한글(ㄱ-ㅎ,ㅏ-ㅣ,가-힣)이 아닌 모든 문자를 찾음
    const regex = /[^ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g;
    // 한글이 아닌 문자를 빈 문자열로 대체하여 제거
    const koreanOnly = newValue.replace(regex, '');

    // 변경된 값이 원래 값과 다를 경우에만 업데이트 (무한 루프 방지)
    if (newValue !== koreanOnly) {
      formData.name = koreanOnly;
    }
  }
);

watch(
  () => formData.phone,
  (newValue) => {
    // 1. 숫자 이외의 문자를 모두 제거합니다.
    const rawNumber = newValue.replace(/\D/g, '');
    
    // 2. 하이픈이 제거된 순수 숫자 값을 별도로 저장합니다.
    formData.rawPhone = rawNumber;

    // 3. 길이에 따라 하이픈을 추가합니다.
    let formattedNumber = '';
    if (rawNumber.length < 4) { // 010
      formattedNumber = rawNumber;
    } else if (rawNumber.length < 8) { // 010-1234
      formattedNumber = `${rawNumber.slice(0, 3)}-${rawNumber.slice(3)}`;
    } else { // 010-1234-5678
      formattedNumber = `${rawNumber.slice(0, 3)}-${rawNumber.slice(3, 7)}-${rawNumber.slice(7, 11)}`;
    }
    
    // 4. 무한 루프를 방지하기 위해, 변경된 경우에만 값을 업데이트합니다.
    if (newValue !== formattedNumber) {
      formData.phone = formattedNumber;
    }
  }
);



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

// 👇 [추가] 휴대폰 번호가 '010'으로 시작하고 11자리인지 검사하는 함수
const isValidPhoneNumber = (phone) => {
  const regex = /^010\d{8}$/; // '010'으로 시작하는 11자리 숫자
  return regex.test(phone);
};

// 👇 [추가] 이름에 완성되지 않은 한글(자음/모음)이 있는지 검사하는 함수
const hasIncompleteKorean = (name) => {
  const regex = /[ㄱ-ㅎ|ㅏ-ㅣ]/; // 단일 자음 또는 모음
  return regex.test(name);
};


// --- 회원가입 제출 ---
const handleRegister = async () => {
  if (!isFormValid.value) {
    uiStore.openModal('모든 입력 항목을 올바르게 채우고 약관에 동의해주세요.');
    return;
  }

   // 👇 [추가] 사업자 이름 검사
   if (hasIncompleteKorean(formData.name)) {
    uiStore.openModal('입력 오류', '사업자 이름에 완성되지 않은 한글(자음/모음)을 사용할 수 없습니다.');
    return;
  }

  // 👇 [추가] 휴대폰 번호 검사 (하이픈 없는 rawPhone으로 검사)
  if (!isValidPhoneNumber(formData.rawPhone)) {
    uiStore.openModal('입력 오류', "휴대폰 번호는 '010'으로 시작하는 11자리 숫자여야 합니다.");
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

    uiStore.openModal('승인 요청 완료','승인 요청이 완료되었습니다. 관리자의 승인을 기다려주세요.');
  } catch (error) {
    console.error('회원가입 실패:', error);
    uiStore.openModal(error.response?.data || '회원가입 중 오류가 발생했습니다.');
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

.image-container {
  flex: 1;
  display: flex; /* 자식 요소를 정렬하기 위해 flex 사용 */
  padding: 0; /* 내부 여백 제거 */
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
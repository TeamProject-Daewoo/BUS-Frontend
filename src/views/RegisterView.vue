<template>
  <div class="auth-wrapper reverse">
    <div class="form-container">
      <div class="form-content">
        <h1>Sign up</h1>
        <p class="subtitle">회원가입</p>

        <form @submit.prevent="handleRegister">
            <div class="input-group">
              <label for="lastName">이메일</label>
              <input type="text" id="user_name" v-model="formData.user_name" required />
            </div>

          <div class="input-group">
            <label for="password">비밀번호</label>
            <input type="password" id="password" v-model="formData.password" required />
          </div>

          <div class="input-group">
            <label for="confirmPassword">비밀번호 확인</label>
            <input type="password" id="confirmPassword" v-model="formData.confirmPassword" required />
          </div>

          <div class="input-group">
              <label for="firstName">사용자 이름</label>
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
              <label for="agree">동의하기</label>
            </div>
          </div>

          <button type="submit" class="auth-button">계정 생성</button>
        </form>

         <div class="switch-auth">
           <p>이미 계정이 있으신가요? <router-link to="/login">로그인</router-link></p>
        </div>
      </div>
    </div>

    <div class="image-container">
      <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1925&q=80" alt="Hotel pool view" />
      <div class="dots">
        <span class="dot active"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/axios';

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
const router = useRouter();

// 사업자 번호 입력을 위한 ref 변수들 (UI 제어용)
const bizNum1 = ref('');
const bizNum2 = ref('');
const bizNum3 = ref('');

// input 요소에 접근하기 위한 template ref
const bizNumInput2 = ref(null);
const bizNumInput3 = ref(null);

// 3개의 입력값을 하나로 합치는 watch 함수
watch([bizNum1, bizNum2, bizNum3], () => {
  // 👈 합쳐진 값을 business_registration_number에 저장
  formData.business_registration_number = `${bizNum1.value}${bizNum2.value}${bizNum3.value}`;
});

// 자동 포커스 이동을 위한 핸들러 함수
const handleInput1 = () => {
  if (bizNum1.value.length === 3) {
    bizNumInput2.value.focus();
  }
};
const handleInput2 = () => {
  if (bizNum2.value.length === 2) {
    bizNumInput3.value.focus();
  }
};

const handleRegister = async () => {
  if (formData.password !== formData.confirmPassword) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }
  if (!formData.agree) {
    alert('약관에 동의해주세요.');
    return;
  }

  console.log(formData);
  
  try {
    const response = await api.post('/api/auth/sign-up', {
        username: formData.user_name,
        password: formData.password,
        name: formData.name,
        phoneNumber: formData.phone,
        business_registration_number: formData.business_registration_number,
        role: formData.role
    });

    

    alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
    router.push('/login'); // 회원가입 성공 후 로그인 페이지로 이동

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
</style>
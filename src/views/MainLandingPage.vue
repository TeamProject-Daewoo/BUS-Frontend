<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// 로그인 페이지로 이동
function goToLogin() {
  router.push('/login');
}

// 회원가입 페이지로 이동
function goToRegister() {
  router.push('/register');
}
</script>

<template>
  <div class="landing-container">
    <div class="content-box">
      <h1 class="main-title">
        숙박 시설 판매 파트너를 위한<br>
        <strong>HotelHub 파트너센터</strong>
      </h1>
      <p class="sub-title">
        사장님, HotelHub 파트너센터를 방문해주셔서 감사합니다.<br>
        로그인하시면 제휴점 파트너에게 특화된 서비스를 이용하실 수 있습니다.
      </p>
      <div class="button-container">
        <button class="btn btn-secondary" @click="goToLogin">
          로그인하기
        </button>
        <button class="btn btn-primary" @click="goToRegister">
          비즈니스 회원가입
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 전체 페이지 컨테이너 */
.landing-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  /* 배경은 부드러운 회색톤으로 유지하여 초록색이 돋보이게 합니다. */
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
  text-align: center;
  font-family: 'Pretendard', sans-serif;
  color: #333;
}

/* 콘텐츠를 담는 중앙 박스 */
.content-box {
  max-width: 800px;
  padding: 40px;
}

/* 메인 타이틀 */
.main-title {
  font-size: 48px;
  font-weight: 300;
  color: #343a40; /* 기존보다 살짝 부드러운 검은색 */
  line-height: 1.4;
  margin-bottom: 20px;
}

.main-title strong {
  font-weight: 700;
  color: #2E8B57; /* 포인트 컬러: SeaGreen (바다 초록) */
}

/* 서브 타이틀 */
.sub-title {
  font-size: 18px;
  color: #6c757d; /* 부드러운 회색 */
  line-height: 1.6;
  margin-bottom: 40px;
}

/* 버튼들을 감싸는 컨테이너 */
.button-container {
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* 기본 버튼 스타일 */
.btn {
  padding: 15px 35px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

/* 주요 버튼 (회원가입) */
.btn-primary {
  background-color: #2E8B57; /* 포인트 컬러: SeaGreen */
  color: white;
}

.btn-primary:hover {
  background-color: #257247; /* 호버 시 더 어두운 초록 */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 139, 87, 0.2);
}

/* 보조 버튼 (로그인) */
.btn-secondary {
  background-color: #ffffff;
  color: #2E8B57; /* 포인트 컬러: SeaGreen */
  border: 1px solid #2E8B57;
}

.btn-secondary:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
</style>
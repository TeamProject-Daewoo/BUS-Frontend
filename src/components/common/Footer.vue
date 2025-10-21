<script setup>
</script>

<template>
  <footer class="footer-container">
    <div class="footer-content">
      <div class="footer-column brand-section">
        <img src="https://i.ibb.co/ccn2vLPb/hotel-logo.png" alt="Hotel Hub Logo" class="footer-logo">
        <p class="brand-description">
          잊지 못할 여행의 모든 순간, HotelHub와 함께하세요.
        </p>
      </div>

      <div class="footer-column links-section">
        <h4 class="footer-heading">회사 소개</h4>
        <a href="#">About HotelHub</a>
        <a href="#">채용</a>
        <a href="#">공지사항</a>
      </div>

      <div class="footer-column links-section">
        <h4 class="footer-heading">고객 지원</h4>
        <a href="#">문의하기</a>
        <a href="#">이용 약관</a>
        <a href="#">개인정보 처리방침</a>
      </div>

      <div class="footer-column social-section">
        <h4 class="footer-heading">Follow Us</h4>
        <div class="social-icons">
          <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="#" aria-label="Youtube"><i class="fa-brands fa-youtube"></i></a>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="business-info">
        <span>(주)호텔허브</span>
        <span>대표: 홍길동</span>
        <span>사업자등록번호: 123-45-67890</span>
        <br>
        <span>주소: 서울특별시 강남구 테헤란로 123, 45층</span>
        <span>통신판매업신고번호: 제2025-서울강남-12345호</span>
        <br>
        <span>고객센터: 1588-0000 (09:00 - 18:00)</span>
        <span>이메일: support@hotelhub.com</span>
      </div>
      <p class="copyright">© 2025 HotelHub Inc. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
/* ========== 핵심: 부모 max-width 무시하고 배경을 화면 양끝까지 확장 ========== */
/* box-shadow로 거대한 외곽을 칠하고, clip-path로 좌우 클리핑을 해제 */
.footer-container {
  --bg: #1a1a1a;
  background-color: var(--bg);
  color: #a8a8a8;

  /* 화면 끝까지 시각적으로 배경 확장 */
  box-shadow: 0 0 0 100vmax var(--bg);
  clip-path: inset(0 -100vmax);

  /* 기존 패딩/폰트 */
  padding: 50px clamp(16px, 8vw, 96px);
  font-family: 'Pretendard', sans-serif;
}

/* 내부 컨텐츠는 중앙 정렬 + 최대 폭 */
.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 30px;
  padding-bottom: 40px;
  margin-bottom: 30px;
  border-bottom: 1px solid #333;
}

.footer-column {
  flex: 1 1 220px;
  min-width: 200px;
}

.footer-heading {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}

.brand-section .footer-logo {
  height: 40px;
  filter: brightness(0) invert(1);
  margin-bottom: 15px;
  max-width: 100%;
  object-fit: contain;
}

.brand-description { font-size: 14px; line-height: 1.6; }

.links-section a {
  display: block;
  color: #a8a8a8;
  text-decoration: none;
  margin-bottom: 12px;
  font-size: 14px;
  transition: color 0.2s ease-in-out;
}
.links-section a:hover { color: #ffffff; }

.social-icons { display: flex; gap: 15px; }
.social-icons a {
  color: #a8a8a8;
  font-size: 18px;
  transition: color 0.2s ease-in-out;
}
.social-icons a:hover { color: #ffffff; }

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.business-info {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1.8;
  margin-bottom: 20px;
  color: #777;
}
.business-info span { white-space: normal; }

.copyright { font-size: 12px; color: #555; }

@media (max-width: 768px) {
  .footer-content { flex-direction: column; text-align: center; }
  .brand-section .footer-logo { margin-left: auto; margin-right: auto; }
  .social-icons { justify-content: center; }
}
</style>

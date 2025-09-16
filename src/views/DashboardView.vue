<template>
  <div class="dashboard">
    <h1>대시보드</h1>
    <div class="stats-grid">
      <div class="card">
        <h3>오늘의 체크인</h3>
        <p class="stat-number">12</p>
      </div>
      <div class="card">
        <h3>오늘의 체크아웃</h3>
        <p class="stat-number">8</p>
      </div>
      <div class="card">
        <h3>객실 점유율</h3>
        <p class="stat-number">85%</p>
      </div>
      <div class="card">
        <h3>총 예약 건수</h3>
        <p class="stat-number">124</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 24px;
}
.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 8px 0 0;
}
</style>
<template>
  <div class="card success-card">
    <!-- 상단 아이콘 + 타이틀 -->
    <div class="header">
      <div class="icon-circle">✅</div>
      <h2 class="title">등록 완료</h2>
      <p class="subtitle">
        호텔과 객실 정보가 성공적으로 입력되었습니다. <br />
        이제 예약 서비스를 시작할 수 있습니다.
      </p>
    </div>

    <!-- 요약 박스 -->
    <div class="summary">
      <ul>
        <li><strong>호텔명:</strong> {{ hotel.title }}</li>
        <li><strong>주소:</strong> {{ hotel.addr1 }}</li>
        <li><strong>객실 수:</strong> {{ rooms.length }} 개</li>
      </ul>
    </div>

    <!-- 버튼 -->
    <div class="actions">
      <button class="btn ghost" @click="$emit('prev')" :disabled="submitting">이전</button>
      <button class="btn" @click="submitAll" :disabled="submitting">
        {{ submitting ? '등록 중...' : '등록하기' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uploadToS3 } from '@/utils/s3Uploader'
import { registerHotel } from '@/api/business'
import { useUiStore } from '@/stores/commonUiStore';
import router from '@/router';

const uiStore = useUiStore();

const props = defineProps({ hotel: Object, intro: Object, rooms: Array })
const emits = defineEmits(['prev'])

const submitting = ref(false)

async function submitAll() {
  if (submitting.value) return
  submitting.value = true

  try {
    const hotel = { ...props.hotel }
    const intro = { ...props.intro }
    const rooms = props.rooms.map(room => ({ ...room }))

    // ✅ 호텔 대표 이미지 업로드
    if (hotel.file instanceof File) {
      hotel.firstimage = await uploadToS3(hotel.file)
    }
    delete hotel.file
    delete hotel.previewUrl

    // ✅ 객실 이미지 업로드
    for (const room of rooms) {
      if (Array.isArray(room.files) && room.files.length > 0) {
        const uploadedUrls = await Promise.all(
          room.files.slice(0, 5).map(file => uploadToS3(file))
        )
        uploadedUrls.forEach((url, i) => {
          room[`roomimg${i + 1}`] = url
        })
      }
      delete room.files
      delete room.previewImages
      delete room.images
    }

    // ✅ 최종 payload
    const payload = { hotel, intro, rooms }
    console.log('[REGISTER PAYLOAD]', payload)

    const res = await registerHotel(payload)
    console.log('[REGISTER SUCCESS]', res.data)

    uiStore.openModal('등록이 완료되었습니다!')
  } catch (err) {
    console.error('[REGISTER FAIL]', err)
    const msg = err.response?.data || err.message || '알 수 없는 오류'
    uiStore.openModal(`등록 중 오류 발생: ${msg}`)
  } finally {
    submitting.value = false
  }
  router.push('/dashboard');
}
</script>

<style scoped>
.success-card {
  max-width: 700px;
  margin: 60px auto;
  padding: 40px 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  text-align: center;
  animation: fadeInUp 0.5s ease;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
}
.icon-circle {
  width: 90px;
  height: 90px;
  background: #dbeafe;
  color: #2563eb;
  font-size: 42px;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 10px;
}
.subtitle {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
}
.summary {
  text-align: left;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 32px;
}
.summary li {
  margin-bottom: 10px;
  font-size: 15px;
  color: #374151;
}
.summary strong {
  color: #111827;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.btn {
  background: #2563eb;
  color: #fff;
  padding: 12px 26px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn:hover { background: #1d4ed8; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn.ghost {
  background: #f3f4f6;
  color: #374151;
}
.btn.ghost:hover { background: #e5e7eb; }
</style>

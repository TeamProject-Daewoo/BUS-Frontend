<template>
  <div class="price-editor-layout">
    <div class="price-editor-container">
      <h1>기간별 특별가 설정</h1>
      <p>기간, 이벤트 이름, 객실별 특별가를 입력하고 저장하세요.</p>

      <div class="editor-form">
        <div class="form-group">
          <label for="title">이벤트 이름</label>
          <input type="text" id="title" v-model="overrideData.title" placeholder="예: 여름 성수기 특가">
        </div>

        <div class="form-group">
          <label>적용 기간</label>
          <DateRangePicker 
            v-model:checkIn="overrideData.startDate"
            v-model:checkOut="overrideData.endDate"
          />
        </div>

        <div class="form-group">
          <label>객실 및 가격 설정</label>
          <ul class="room-list-editor">
            <li v-for="room in rooms" :key="room.id" class="room-item">
              <span class="room-title">{{ room.roomtitle }}</span>
              <input 
                type="number" 
                v-model.number="overrideData.prices[room.id]" 
                placeholder="특별가 입력" 
                step="10000"
              >
            </li>
          </ul>
        </div>

        <button @click="savePriceOverrides" class="save-button" :disabled="!isFormValid">
          특별가 저장하기
        </button>
      </div>
    </div>

    <div class="list-container">
      <h2>설정된 특별가 목록</h2>
      <div v-if="priceOverridesList.length === 0" class="no-data">
        ✅ 설정된 특별가가 없습니다.
      </div>
      <ul v-else class="overrides-list-box">
  <li v-for="override in priceOverridesList" :key="override.id" class="override-item">
    <div class="item-header">
      <h3>{{ override.title }}</h3>
      <button @click="deleteOverride(override)" class="delete-button">삭제</button>
    </div>
    <p class="date-range">🗓️ {{ override.startDate }} ~ {{ override.endDate }}</p>
    <ul class="price-details">
      <li v-for="priceInfo in override.roomPrices" :key="priceInfo.roomId">
        <span>{{ priceInfo.roomTitle }}</span>
        <strong>{{ priceInfo.price.toLocaleString() }}원</strong>
      </li>
    </ul>
  </li>
</ul>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { useHotelStore } from '@/stores/hotel';
import DateRangePicker from '@/components/common/DateRangePicker.vue';
import { getRooms, getPriceOverrides } from '@/api/business';
import { useUiStore } from '@/store/commonUiStore';

const uiStore = useUiStore();

const hotelStore = useHotelStore();
const rooms = ref([]);
const priceOverridesList = ref([]); // 오른쪽 목록을 담을 ref

const overrideData = reactive({
  title: '',
  startDate: '',
  endDate: '',
  prices: {},
});

const isFormValid = computed(() => {
  return overrideData.title && 
         overrideData.startDate && 
         overrideData.endDate && 
         Object.keys(overrideData.prices).length > 0 &&
         Object.values(overrideData.prices).every(price => price > 0 && price !== null);
});

async function fetchPriceOverrides() {
  try {
    // API 모듈에 정의된 getPriceOverrides 함수를 사용
    const { data } = await getPriceOverrides(hotelStore.selectedContentId);
    priceOverridesList.value = data || [];
  } catch (error) {
    console.error("특별가 목록 로딩 실패:", error);
    priceOverridesList.value = [];
  }
}

onMounted(async () => {
  if (!hotelStore.selectedContentId) {
    console.log("선택된 호텔이 없습니다.");
    return;
  }
  // 페이지 로딩 시 객실 목록과 특별가 목록을 동시에 불러옵니다.
  await Promise.all([
    (async () => {
      try {
        const { data } = await getRooms(hotelStore.selectedContentId);
        rooms.value = data ?? [];
        rooms.value.forEach(room => {
          overrideData.prices[room.id] = room.roomoffseasonminfee1 || null;
        });
      } catch (error) {
        console.error("객실 목록 로딩 실패:", error);
      }
    })(),
    fetchPriceOverrides()
  ]);
});

// 특별가 저장 함수
async function savePriceOverrides() {
  if (!isFormValid.value) {
    uiStore.openModal('모든 정보를 올바르게 입력해주세요.');
    return;
  }
  try {
    await api.post('/business/prices/override', {
      title: overrideData.title,
      startDate: overrideData.startDate,
      endDate: overrideData.endDate,
      priceOverrides: overrideData.prices,
      hotelContentId: hotelStore.selectedContentId
    });
    uiStore.openModal('특별가 설정이 저장되었습니다.');
    
    // 저장 후 목록을 새로고침합니다.
    await fetchPriceOverrides();

    // 입력 폼 초기화
    overrideData.title = '';
    overrideData.startDate = '';
    overrideData.endDate = '';
    rooms.value.forEach(room => {
      overrideData.prices[room.id] = room.roomoffseasonminfee1 || null;
    });

  } catch (error) {
    console.error('특별가 저장 실패:', error);

    // Axios 에러에 서버 응답(response)이 있는지 확인
    if (error.response) {
      // 서버가 보낸 에러 메시지(예: "선택하신 기간에 이미...")를 modal 표시
      uiStore.openModal("선택하신 기간에 이미 다른 특별가가 설정되어 있습니다"); 
    } else {
      // 서버 응답 없이 네트워크 에러 등이 발생한 경우
      uiStore.openModal('저장 중 오류가 발생했습니다.');
    }
  }
};

async function deleteOverride(overrideToDelete) {
  // 사용자에게 다시 한번 확인 받기
  const confirmed = confirm(`'${overrideToDelete.title}' 특별가 설정을 정말 삭제하시겠습니까?`);
  if (!confirmed) {
    return;
  }

  try {
    // 백엔드에 삭제 API를 호출합니다.
    // id만 보내는 것보다 그룹을 식별할 수 있는 정보를 보내는 것이 더 안전합니다.
    await api.delete('/business/prices/delete', {
      data: {
        title: overrideToDelete.title,
        startDate: overrideToDelete.startDate,
        endDate: overrideToDelete.endDate,
        hotelContentId: hotelStore.selectedContentId
      }
    });
    
    uiStore.openModal('삭제되었습니다.');
    
    // 목록을 새로고침하여 UI에 반영
    await fetchPriceOverrides();

  } catch (error) {
    console.error('특별가 삭제 실패:', error);
    uiStore.openModal('삭제 중 오류가 발생했습니다.');
  }
}
</script>

<style scoped>
.price-editor-layout {
  display: grid;
  /* 왼쪽 에디터를 5, 오른쪽 목록을 4 비율로 설정 */
  grid-template-columns: 5fr 4fr;
  gap: 24px;
  align-items: flex-start;
}

.price-editor-container, .list-container {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  background-color: #fff;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.list-container h2, .price-editor-container h1 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 600;
}
.price-editor-container p {
  margin-top: 0;
  margin-bottom: 24px;
  color: #64748b;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
}
.form-group input[type="text"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.room-list-editor {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.room-item .room-title {
  font-size: 14px;
}
.room-item input[type="number"] {
  width: 120px;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  text-align: right;
}

.save-button {
  width: 100%;
  padding: 12px;
  border: none;
  background-color: #2563eb;
  color: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}
.save-button:hover {
  background-color: #1d4ed8;
}
.save-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

/* 오른쪽 목록 스타일 */
.overrides-list-box {
  list-style: none;
  padding: 0;
  margin: 0;
  /* 목록이 길어지면 스크롤 생성 */
  max-height: 600px;
  overflow-y: auto;
  border-top: 1px solid #e2e8f0;
}

.override-item {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
  position: relative;
}
.override-item:hover {
  background-color: #f8fafc;
}

.override-item h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}
.override-item .date-range {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 12px 0;
}

.price-details {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.price-details li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
.price-details li span {
  color: #475569;
}
.price-details li strong {
  font-weight: 600;
  color: #1e293b;
}

.no-data {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 16px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-header h3 {
  margin: 0;
}

.delete-button {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-button:hover {
  background-color: #dc2626;
}
</style>
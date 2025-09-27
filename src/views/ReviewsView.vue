<template>
  <div class="admin-container">
    <h1>리뷰 관리</h1>
    <header class="admin-header">
      <div>
        <span class="btn btn-report" @click="reportAll">선택한 항목 모두 신고</span>
      </div>
      <div>
        <input class="review-input" type="text" @input="handleInput" :value="searchTerm" placeholder="리뷰 내용을 입력하세요">
        <span class="review-count">총 {{ reviewList.length }}개의 리뷰
        </span>
      </div>      
    </header>

    <div class="table-wrapper">
      <table class="review-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
            </th>
            <th>작성자</th>
            <th>이메일</th>
            <th>평점</th>
            <th class="text-cell">리뷰 내용</th>
            <th>작성일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="reviewList.length === 0">
            <td :colspan="7" class="no-data">리뷰가 없습니다.</td>
          </tr>
          <tr v-for="review in reviewList" :key="review.reviewId">
            <td>
              <input type="checkbox" :value="review.reviewId" v-model="selectedReviews" />
            </td>
            <td>{{ review.nickName }}</td>
            <td>{{ review.email }}</td>
            <td class="rating-cell">⭐ {{ review.rating }}</td>
            <td class="text-cell">
              <span :title="review.reviewText">{{ review.reviewText }}</span>
            </td>
            <td>{{ formatDate(review.reviewDate) }}</td>
            <td class="actions-cell">
              <button v-if="!review.reported" class="btn btn-report" @click="report(review.reviewId)">신고</button>
              <p v-else class="report-success">신고 완료</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import api from "@/api/axios";
import { useHotelStore } from "@/stores/hotel";
import { debounce } from "lodash";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";

const deletedList = ref(false);
const reviewList = ref([]);
const searchTerm = ref('');
const hotelStore = useHotelStore();
const { selectedContentId } = storeToRefs(hotelStore);

watch(selectedContentId, (newValue) => {
  fetchReviews();
});
onMounted(() => {
  fetchReviews();
})

const isAllSelected = computed(() => {
    if (reviewList.value.length === 0) {
        return false;
    }
    return selectedReviews.value.length === reviewList.value.length;
});

const toggleDeletedList = () => {
  deletedList.value = !deletedList.value;
  selectedReviews.value = [];
  fetchReviews()
};

const buttonClass = computed(() => {
  return deletedList.value 
    ? 'btn-toggle active-not-deleted' 
    : 'btn-toggle active-deleted';
});

function handleInput(event) {
    searchTerm.value = event.target.value;
    debouncedSearch(); 
}
const debouncedSearch = debounce(() => {
    fetchReviews();
}, 100);


async function fetchReviews () {
    const review = await api.get(`/api/reviews/viewByHotelId`, {
      params: {
        hotelId: hotelStore.selectedContentId,
        searchTerm: searchTerm.value
      }
    });
    reviewList.value = review.data;
}

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const report = async (id) => {
  if (confirm(`정말로 ID: ${id} 리뷰를 신고 하시겠습니까?`)) {
    alert(`ID: ${id} 리뷰를 신고 하었습니다.`);
    await api.get(`/api/reviews/report/${id}`, {
        params: {
          isReport: true
        }
      }
    );
    fetchReviews();
   }
};
const reportAll = async () => {
  if (selectedReviews.value.length === 0) {
      alert("하나 이상의 신고할 항목을 선택해주세요.");
      return; 
  }
  if (confirm(`정말로 선택한 항목들을 신고하시겠습니까?`)) {
    alert(`선택한 모든 리뷰가 신고되었습니다.`);
    await api.get(`/api/reviews/reportAll`, {
      params: {
        reviews: selectedReviews.value,
        isReport: true
      }
    });
    fetchReviews();
    selectedReviews.value = [];
  } 
}

const selectedReviews = ref([]);
const toggleSelectAll = (event) => {
  if (event.target.checked) {
    selectedReviews.value = reviewList.value.map(r => r.reviewId);
  } else {
    selectedReviews.value = [];
  }
};
</script>

<style scoped>
.admin-container {
  font-family: Pretendard, -apple-system, sans-serif;
  padding: 2rem;
  background-color: #f9fafb;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.admin-header h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #111827;
}

.review-input {
    width: 250px; 
    height: 38px;
    line-height: 38px;
    padding: 0 10px; 
    border: 1px solid #ccc; 
    border-radius: 4px;
    /* 글꼴 및 색상 */
    font-size: 14px;
    color: #333;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    margin-right: 10px;
}

.review-input:focus {
    border-color: #007bff; 
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25); 
    outline: none; 
}
.review-count {
  display: inline-block;
  font-size: 1rem;
  color: #6b7280;
  background-color: #e5e7eb;
  padding: 0.3rem 0.8rem;
  border-radius: 99px;
}
.review-count-container {
  text-align: right;
}

.table-wrapper {
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow-x: auto; /* 화면이 작을 경우 스크롤 가능 */
}

.review-table {
    width: 100%; 
    table-layout: fixed;
    border-collapse: collapse; 
}

.review-table th, .review-table td {
  padding: 12px 16px;
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid #e5e7eb;

}

.review-table thead {
  background-color: #f3f4f6;
  color: #374151;
  font-weight: 600;
}

.review-table tbody tr:hover {
  background-color: #f9fafb;
}

.review-table th, 
.review-table td {
    padding: 10px;
    border: 1px solid #ddd;
    overflow: hidden; 
    white-space: nowrap;
    text-overflow: ellipsis; 
}


/* 체크박스 (1번째 컬럼) */
.review-table th:nth-child(1),
.review-table td:nth-child(1) {
    width: 40px; 
}

/* 관리/액션 버튼 (8번째 컬럼) */
.review-table th:nth-child(8),
.review-table td:nth-child(8) {
    width: 8%; 
    text-align: center;
}


.side-container {
  display: flex;
  flex-direction: column;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.hotel-info {
  display: flex;
  flex-direction: column;
}

.hotel-id {
  font-size: 0.8rem;
  color: #6b7280;
}

.rating-cell {
  font-weight: bold;
  color: #f59e0b;
}

.text-cell {
  max-width: 250px; /* 긴 텍스트 자르기 */
}

.text-cell span {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions-cell {
  white-space: nowrap; /* 버튼 줄바꿈 방지 */
}

.btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: #ffffff;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
  margin-right: 6px;
}

.btn:hover {
  background-color: #f3f4f6;
}

.btn-report {
  color: #dc2626;
}

.btn-report:hover {
  background-color: #fee2e2;
  border-color: #fca5a5;
}

.report-success {
  color: #44c953;
  display: inline;
  font-weight: bold;
  padding: 6px 12px;
  background-color: #ffffff;
  font-size: 0.99rem;
  transition: background-color 0.2s;
  margin-right: 6px;
}

.btn-toggle {
  padding: 6px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}


.active-deleted {
  background-color: #f44336; /* 빨간색 계열 */
  color: white;
}
.btn-toggle.active-deleted:hover { 
    background-color: #be2f2f; 
}

.active-not-deleted {
  background-color: #4CAF50; /* 초록색 계열 */
  color: white;
}
.btn-toggle.active-not-deleted:hover { 
    background-color: #3b863d; 
}

.review-table th,
.review-table td {
    transition: width 0.3s ease-in-out, 
                opacity 0.3s ease-in-out, 
                padding 0.3s ease-in-out;
    overflow: hidden;
}

.hidden-column {
    width: 0 !important; 
    min-width: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    opacity: 0;
}
</style>
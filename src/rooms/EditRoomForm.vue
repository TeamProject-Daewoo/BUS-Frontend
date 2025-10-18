<template>
  <div class="card">
    <h2 class="section-title">객실 정보 수정</h2>
      <!-- 객실명 -->
      <div class="form-row">
        <div class="form-label">객실명</div>
        <div class="form-input">
          <input v-model="room.roomtitle" placeholder="예: 디럭스룸" />
        </div>
      </div>

      <!-- 객실 수 -->
      <div class="form-row">
        <div class="form-label">객실 수</div>
        <div class="form-input">
          <input type="number" v-model="room.roomcount" min="1" placeholder="예: 10" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label">기준 인원</div>
        <div class="form-input">
          <input type="number" v-model="room.roombasecount" />
        </div>
      </div>

      <!-- 최대인원 -->
      <div class="form-row">
        <div class="form-label">최대 인원</div>
        <div class="form-input">
          <input type="number" v-model="room.roommaxcount" />
        </div>
      </div>

      <!-- 크기 -->
      <div class="form-row">
        <div class="form-label">크기</div>
        <div class="form-input">
          <input v-model="room.roomsize1" placeholder="예: 30㎡" />
        </div>
      </div>

      <!-- 가격 -->
      <div class="form-row">
        <div class="form-label">가격 (비수기1)</div>
        <div class="form-input">
          <input type="number" v-model="room.roomoffseasonminfee1" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label">가격 (비수기2)</div>
        <div class="form-input">
          <input type="number" v-model="room.roomoffseasonminfee2" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label">가격 (성수기1)</div>
        <div class="form-input">
          <input type="number" v-model="room.roompeakseasonminfee1" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label">가격 (성수기2)</div>
        <div class="form-input">
          <input type="number" v-model="room.roompeakseasonminfee2" />
        </div>
      </div>

      <!-- 소개 -->
      <div class="form-row">
        <div class="form-label">소개</div>
        <div class="form-input">
          <input v-model="room.roomintro" placeholder="객실 설명을 입력하세요" />
        </div>
      </div>

      <!-- 옵션들 -->
      <div class="form-row">
        <div class="form-label">옵션</div>
        <div class="form-input options">
          <label><input type="checkbox" v-model="room.roomaircondition" true-value="Y" false-value="N" /> 에어컨</label>
          <label><input type="checkbox" v-model="room.roombath" true-value="Y" false-value="N" /> 욕조</label>
          <label><input type="checkbox" v-model="room.roomtv" true-value="Y" false-value="N" /> TV</label>
          <label><input type="checkbox" v-model="room.roominternet" true-value="Y" false-value="N" /> 인터넷</label>
          <label><input type="checkbox" v-model="room.roomrefrigerator" true-value="Y" false-value="N" /> 냉장고</label>
          <label><input type="checkbox" v-model="room.roomsofa" true-value="Y" false-value="N" /> 소파</label>
          <label><input type="checkbox" v-model="room.roomtable" true-value="Y" false-value="N" /> 테이블</label>
        </div>
      </div>

      <!-- 이미지 업로드 (최대 5장) -->
      <div class="form-row">
        <div class="form-label">객실 이미지</div>
        <div class="form-input">
          <input type="file" accept="image/*" multiple @change="onFilesChange($event, room)" />

          <!-- 미리보기 -->
          <div class="preview-list">
            <div
              v-for="(img, idx) in room.previewImages"
              :key="idx"
              class="preview-box"
            >
              <img :src="img" alt="이미지 미리보기" />
            </div>

            <!-- 이미지가 없을 때 -->
            <div v-if="!room.previewImages || room.previewImages.length === 0" class="placeholder big">
              아직 업로드된 이미지가 없습니다.
            </div>
          </div>
          <!-- 파일명 리스트 -->
          <ul class="file-names">
            <li v-for="(file, idx) in room.files" :key="idx">{{ file.name }}</li>
          </ul>
        </div>
      </div>

    <!-- 객실 추가 버튼 -->
    <div class="add-room" @click="editRoom">
      <span>수정</span>
    </div>
  </div>
</template>

<script setup>
import { createRoom, getRooms, isValidFile, updateRoomApi } from '@/api/business';
import router from '@/router';
import { useUiStore } from '@/stores/commonUiStore';
import { uploadToS3 } from '@/utils/s3Uploader';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const uiStore = useUiStore();
const route = useRoute();
const createNewRoomSchema = (room) => ({
  // 주요 정보
  roomtitle: room.roomtitle, 
  roomcount: room.roomcount, 
  roombasecount: room.roombasecount,
  roommaxcount: room.roommaxcount, 
  roomsize1: room.roomsize1, 
  
  // 가격 정보
  roomoffseasonminfee1: room.roomoffseasonminfee1, 
  roomoffseasonminfee2: room.roomoffseasonminfee2, 
  roompeakseasonminfee1: room.roompeakseasonminfee1, 
  roompeakseasonminfee2: room.roompeakseasonminfee2, 
  
  // 소개 및 옵션
  roomintro: room.roomintro,
  roomaircondition: room.roomaircondition,
  roombath: room.roombath,
  roomtv: room.roomtv,
  roominternet: room.roominternet,
  roomrefrigerator: room.roomrefrigerator,
  roomsofa: room.roomsofa,
  roomtable: room.roomtable,

  // 이미지 및 임시 데이터
  files: [],
  previewImages: [], 
  roomimg1: room.roomimg1,
  roomimg2: room.roomimg2,
  roomimg3: room.roomimg3,
  roomimg4: room.roomimg4,
  roomimg5: room.roomimg5
});

const contentid = route.query.contentid;
const id = route.query.id
const room = ref({})

onMounted(async () => {
  const result = await getRooms(contentid);
  const filteredRooms = result.data.filter(room => room.id == id);
  const data = room.value = createNewRoomSchema(filteredRooms[0]);
  //다시 파일형태로 변환
  const imageUrls = [data.roomimg1, data.roomimg2, data.roomimg3, data.roomimg4, data.roomimg5]
      .filter(url => url && url.startsWith('http'));

  const filePromises = imageUrls.map(url => urlToFile(url));
  const fileObjects = await Promise.all(filePromises);
  room.value.files = fileObjects;

  room.value.previewImages = fileObjects.map(file => {    
      return URL.createObjectURL(file); 
  });
});


async function urlToFile(url, filename) {
  const response = await fetch(url);
  
  const blob = await response.blob();
  if (!filename) {
    const urlParts = url.split('/');
    filename = urlParts[urlParts.length - 1]; 
  }
  const mimeType = blob.type;

  return new File([blob], filename, { type: mimeType });
}
// 객실 추가
async function editRoom() {
 
  if(!room.value.files) return;
  const uploadedUrls = await Promise.all(
    room.value.files.slice(0, 5).map(file => uploadToS3(file))
  )
  uploadedUrls.forEach((url, i) => {
    room.value[`roomimg${i + 1}`] = url
  })
  delete room.value.files
  delete room.value.previewImages

  updateRoomApi(id, room.value ,contentid);
  router.push({path: '/rooms'})
  window.scrollTo({top: 0, behavior: 'smooth'})
}

// 여러 파일 선택
async function onFilesChange(e, room) {
  const files = Array.from(e.target.files)
  if (!files.length) return

  // 최대 5장 제한
  const selected = files.slice(0, 5 - room.files.length)

  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  let flag = false, imageSizeFlag = false;
  let modalMessage = '';
  for (const file of selected) {
    //파일 용량 제한
    if (file.size > 8 * 1024 * 1024) {
      imageSizeFlag = true;
      modalMessage = '8MB 이하 파일만 가능합니다.'
      continue;
    }
    //tika 유효성 검증
    const formData = new FormData();
    formData.append('fileObject', file);
    const isValid = await isValidFile(formData);
    if(!isValid.data || !allowedImageTypes.includes(file.type)) {
      flag = true;
      continue;
    }

    room.files.push(file)

    // 미리보기용 blob URL
    const blobUrl = URL.createObjectURL(file)
    room.previewImages.push(blobUrl)
  }
  if(flag || imageSizeFlag) {
    uiStore.openModal({
      title: '파일 형식 오류',
      message: modalMessage
    });
  }

  e.target.value = '' // 같은 파일 다시 선택 가능하게 초기화
}
</script>


<style scoped>
.card {
  max-width: 900px;
  margin: 40px auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 24px;
  animation: fadeInUp 0.5s ease;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #111827;
}
.form-table {
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
  border-radius: 6px;
  overflow: hidden;
}
.form-row {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}
.form-label {
  width: 180px;
  background: #f9fafb;
  padding: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
}
.form-input {
  flex: 1;
  padding: 12px;
}
.form-input input[type="file"] {
  margin-bottom: 8px;
}
.form-input input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* 이미지 미리보기 리스트 */
.preview-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.preview-box {
  width: 120px;
  height: 90px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}
.preview-box img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.placeholder.big {
  width: 100%;
  padding: 30px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  text-align: center;
  color: #9ca3af;
}

/* ✨ 객실 추가 버튼 스타일 */
.add-room {
  margin: 24px 0;
  padding: 20px;
  border: 2px dashed #33be7b;
  border-radius: 10px;
  background: #f9fbff;
  color: #33be7b;
  font-weight: 600;
  font-size: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.add-room:hover {
  background: #33be7b;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
}
.plus-icon {
  font-size: 22px;
  font-weight: bold;
  line-height: 1;
}

.actions {
  margin-top: 20px;
  text-align: right;
}
.btn {
  background: #2563eb;
  color: #fff;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 8px;
  transition: background 0.2s;
}
.btn:hover {
  background: #1d4ed8;
}
.btn.ghost {
  background: #f3f4f6;
  color: #374151;
}
.btn.ghost:hover {
  background: #e5e7eb;
}
.file-names {
  margin-top: 8px;
  font-size: 13px;
  color: #374151;
}
.file-names li {
  list-style: disc;
  margin-left: 20px;
}

</style>

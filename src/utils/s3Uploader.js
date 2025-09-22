// src/utils/s3Uploader.js
import axios from 'axios'

export async function uploadToS3(file) {
  // 1) 백엔드에서 presigned URL 발급
  const { data } = await axios.get(`/api/s3/presign`, {
    params: { filename: file.name, contentType: file.type }
  })

  // 2) 발급받은 presigned URL로 S3 업로드
  await axios.put(data.url, file, {
    headers: { 'Content-Type': file.type }
  })

  // 3) 최종 접근 가능한 public URL 반환
  return data.publicUrl
}

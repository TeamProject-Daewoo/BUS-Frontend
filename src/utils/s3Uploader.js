// src/utils/s3Uploader.js
import api from '@/api/axios'   // ✅ 백엔드로 가는 axios (baseURL/JWT 세팅)
import axios from 'axios'       // ✅ S3 업로드용만 쓸 기본 axios

// 🔑 Authorization 없는 클린 클라이언트 (S3 전용)
const s3Client = axios.create()

// Presign → Upload → Public URL 반환
export async function uploadToS3(file) {
  // 1) presigned URL 요청: 백엔드 인스턴스(api) 사용! (프록시 없어도 OK)
  const { data } = await api.get('/api/business/s3/presign', {
    params: { filename: file.name, contentType: file.type, fileObject: file }
  })

  // 2) presigned URL로 S3에 직접 업로드 (JWT/Authorization 헤더 없이)
  await s3Client.put(data.url, file, {
    headers: { 'Content-Type': file.type },
  })

  // 3) 최종 접근 가능한 public URL 반환
  return data.publicUrl
}
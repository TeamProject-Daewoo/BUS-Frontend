// src/api/business.js
import api from './axios'   // ✅ JWT 붙는 axios 인스턴스

const BASE_URL = 'api/business';
const q = (contentid) =>
  contentid ? `?contentid=${encodeURIComponent(contentid)}` : ''

// ====================== 예약/결제 ======================

// 예약 상태 업데이트
export function updateReservationStatus(id, status) {
  return api.put(`${BASE_URL}/reservations/${id}/status`, null, {
    params: { status },
  })
}

// 결제 상태 업데이트
export function updatePaymentStatus(id, status) {
  return api.put(`${BASE_URL}/payments/${id}/status`, null, {
    params: { status },
  })
}

// ✅ 예약 전체 업데이트
export const updateReservation = (payload) =>
  api.put(`${BASE_URL}/reservations/${payload.reservationId}`, payload)

// 예약 삭제
export function deleteReservationApi(id) {
  return api.delete(`${BASE_URL}/reservations/${id}`)
}

// 예약 목록
export const getReservations = (contentid) =>
  api.get(`${BASE_URL}/reservations${q(contentid)}`)

// 결제 목록
export const getPayments = (contentid) =>
  api.get(`${BASE_URL}/payments${q(contentid)}`)

// ✅ 예약 일괄 작업
export const bulkReservations = (contentid, ids, action) =>
  api.post(`${BASE_URL}/reservations/bulk${q(contentid)}`, { ids, action })

// ====================== 호텔 ======================

// 내 호텔 목록
export const listMyHotels = () => api.get(`${BASE_URL}/hotels`)

// 호텔 기본 정보
export const getHotel = (contentid) =>
  api.get(`${BASE_URL}/hotel${q(contentid)}`)
export const updateHotel = (payload, contentid) =>
  api.put(`${BASE_URL}/hotel${q(contentid)}`, payload)

// 호텔 인트로
export const getHotelIntro = (contentid) =>
  api.get(`${BASE_URL}/hotel/intro${q(contentid)}`)
export const upsertHotelIntro = (payload, contentid) =>
  api.put(`${BASE_URL}/hotel/intro${q(contentid)}`, payload)

// 객실
export const getRooms = (contentid) =>
  api.get(`${BASE_URL}/rooms${q(contentid)}`)
export const createRoom = (room, contentid) =>
  api.post(`${BASE_URL}/rooms${q(contentid)}`, room)
export const updateRoomApi = (id, room, contentid) =>
  api.put(`${BASE_URL}/rooms/${id}${q(contentid)}`, room)
export const deleteRoomApi = (id, contentid) =>
  api.delete(`${BASE_URL}/rooms/${id}${q(contentid)}`)

// 호텔 등록 (호텔 + 인트로 + 객실 한번에)
export const registerHotel = (payload) =>
  api.post(`${BASE_URL}/hotel/register`, payload)

// 특별가 목록 가져오기
export const getPriceOverrides = (contentid) =>
  api.get(`${BASE_URL}/prices/list${q(contentid)}`)

//tika 유효성 검증 요청
export const isValidFile = (formData) =>
  api.post(`${BASE_URL}/checkVaild`, formData, {
      headers: {
          'Content-Type': 'multipart/form-data',
      }
  });
// src/api/business.js
import api from './axios'

const q = (contentid) =>
  contentid ? `?contentid=${encodeURIComponent(contentid)}` : ''

// 예약 상태 업데이트
export function updateReservationStatus(id, status) {
  return api.put(`/business/reservations/${id}/status`, null, {
    params: { status }
  })
}

// 결제 상태 업데이트
export function updatePaymentStatus(id, status) {
  return api.put(`/business/payments/${id}/status`, null, {
    params: { status }
  })
}

// ✅ 통합 업데이트 (체크인/아웃, 인원, 예약상태, 결제상태 한 번에)
export const updateReservation = (payload) =>
  api.put(`/business/reservations/${payload.reservationId}`, payload)

// 예약 삭제
export function deleteReservationApi(id) {
  return api.delete(`/business/reservations/${id}`)
}

// 호텔 목록(내가 운영하는 호텔들)
export const listMyHotels = () => api.get('/business/hotels')

// 호텔 기본
export const getHotel = (contentid) =>
  api.get(`/business/hotel${q(contentid)}`)
export const updateHotel = (payload, contentid) =>
  api.put(`/business/hotel${q(contentid)}`, payload)

// 호텔 인트로
export const getHotelIntro = (contentid) =>
  api.get(`/business/hotel/intro${q(contentid)}`)
export const upsertHotelIntro = (payload, contentid) =>
  api.put(`/business/hotel/intro${q(contentid)}`, payload)

// 객실
export const getRooms = (contentid) =>
  api.get(`/business/rooms${q(contentid)}`)
export const createRoom = (room, contentid) =>
  api.post(`/business/rooms${q(contentid)}`, room)
export const updateRoomApi = (id, room, contentid) =>
  api.put(`/business/rooms/${id}${q(contentid)}`, room)
export const deleteRoomApi = (id, contentid) =>
  api.delete(`/business/rooms/${id}${q(contentid)}`)

// 예약/결제
export const getReservations = (contentid) =>
  api.get(`/business/reservations${q(contentid)}`)
export const getPayments = (contentid) =>
  api.get(`/business/payments${q(contentid)}`)

// ✅ 예약 일괄 작업
export const bulkReservations = (contentid, ids, action) =>
  api.post(`/business/reservations/bulk${q(contentid)}`, { ids, action })


// src/api/business.js
import api from './axios'

const q = (contentid) => (contentid ? `?contentid=${encodeURIComponent(contentid)}` : '')

// 호텔 목록(내가 운영하는 호텔들)
export const listMyHotels = () => api.get('/business/hotels')

// 호텔 기본
export const getHotel = (contentid) => api.get(`/business/hotel${q(contentid)}`)
export const updateHotel = (payload, contentid) => api.put(`/business/hotel${q(contentid)}`, payload)

// 호텔 인트로
export const getHotelIntro = (contentid) => api.get(`/business/hotel/intro${q(contentid)}`)
export const upsertHotelIntro = (payload, contentid) => api.put(`/business/hotel/intro${q(contentid)}`, payload)

// 객실
export const getRooms = (contentid) => api.get(`/business/rooms${q(contentid)}`)
export const createRoom = (room, contentid) => api.post(`/business/rooms${q(contentid)}`, room)
export const updateRoomApi = (id, room, contentid) => api.put(`/business/rooms/${id}${q(contentid)}`, room)
export const deleteRoomApi = (id, contentid) => api.delete(`/business/rooms/${id}${q(contentid)}`)

// 예약/결제
export const getReservations = (contentid) => api.get(`/business/reservations${q(contentid)}`)
export const getPayments = (contentid) => api.get(`/business/payments${q(contentid)}`)

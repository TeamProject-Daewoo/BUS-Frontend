import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:8888',
  timeout: 10000,
});

// 호텔 기본
export const getHotel = () => http.get('/api/business/hotel');
export const updateHotel = (payload) => http.put('/api/business/hotel', payload);

// 호텔 인트로
export const getHotelIntro = () => http.get('/api/business/hotel/intro');
export const upsertHotelIntro = (payload) => http.put('/api/business/hotel/intro', payload);

// 객실
export const getRooms = () => http.get('/api/business/rooms');
export const createRoom = (room) => http.post('/api/business/rooms', room);
export const updateRoomApi = (id, room) => http.put(`/api/business/rooms/${id}`, room);
export const deleteRoomApi = (id) => http.delete(`/api/business/rooms/${id}`);

// 예약/결제
export const getReservations = () => http.get('/api/business/reservations');
export const getPayments = () => http.get('/api/business/payments');

export default http;

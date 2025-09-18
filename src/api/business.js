import http from './axios'; 

// 호텔 기본
export const getHotel = () => http.get('/business/hotel');
export const updateHotel = (payload) => http.put('/business/hotel', payload);

// 호텔 인트로
export const getHotelIntro = () => http.get('/business/hotel/intro');
export const upsertHotelIntro = (payload) => http.put('/business/hotel/intro', payload);

// 객실
export const getRooms = () => http.get('/business/rooms');
export const createRoom = (room) => http.post('/business/rooms', room);
export const updateRoomApi = (id, room) => http.put(`/business/rooms/${id}`, room);
export const deleteRoomApi = (id) => http.delete(`/business/rooms/${id}`);

// 예약/결제
export const getReservations = () => http.get('/business/reservations');
export const getPayments = () => http.get('/business/payments');

export default http;

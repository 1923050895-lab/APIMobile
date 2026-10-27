import apiClient from './apiClient';

export const counterApi = {
    createBooking: (data) => {
        // data: { MaChuyen, DanhSachGhe: [...], TenHanhKhach, SoDienThoai, Email, PhuongThucThanhToan: 'TienMat' | 'ChuyenKhoan' }
        return apiClient.post('/counter/create-booking', data);
    },

    confirmPayment: (bookingId, paymentMethod = 'TienMat') => {
        return apiClient.post('/counter/confirm-payment', {
            MaDatVe: Number(bookingId),
            PhuongThucThanhToan: paymentMethod
        });
    },

    printTicket: (ticketId) => {
        return apiClient.post(`/counter/print-ticket/${ticketId}`);
    }
};

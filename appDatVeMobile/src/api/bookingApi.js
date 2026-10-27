import apiClient from './apiClient';

export const bookingApi = {
    bookOnline: (data) => {
        // data: { MaChuyen, DanhSachGhe: [MaGhe1, MaGhe2], GhiChu }
        return apiClient.post('/bookings/book', data);
    },

    getMyTickets: () => {
        return apiClient.get('/tickets/my-tickets');
    },

    getTicketDetail: (ticketId) => {
        return apiClient.get(`/tickets/${ticketId}`);
    },

    printTicketOnline: (ticketId) => {
        return apiClient.post(`/tickets/${ticketId}/print`);
    },

    cancelTicket: (ticketId) => {
        return apiClient.post(`/tickets/${ticketId}/cancel`);
    }
};

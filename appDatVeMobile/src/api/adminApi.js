import apiClient from './apiClient';

export const adminApi = {
    // 1. Quản lý Tuyến xe
    getRoutes: () => {
        return apiClient.get('/admin/routes');
    },

    // Thêm tuyến xe mới bằng cách chọn điểm đi và điểm đến
    createRoute: (data) => {
        return apiClient.post('/admin/routes', {
            TenTuyen: data.TenTuyen || '',
            MaDiemDi: Number(data.MaDiemDi),
            MaDiemDen: Number(data.MaDiemDen),
            KhoangCachKm: data.KhoangCachKm ? Number(data.KhoangCachKm) : null,
            ThoiGianDuKienPhut: data.ThoiGianDuKienPhut ? Number(data.ThoiGianDuKienPhut) : null
        });
    },

    // 2. Quản lý Chuyến xe
    getTrips: () => {
        return apiClient.get('/admin/trips');
    },

    createTrip: (data) => {
        return apiClient.post('/admin/trips', {
            MaTuyenXe: Number(data.MaTuyenXe),
            MaXe: Number(data.MaXe),
            ThoiGianDi: data.ThoiGianDi,
            ThoiGianDen: data.ThoiGianDen,
            GiaVe: Number(data.GiaVe)
        });
    },

    updateTrip: (tripId, data) => {
        return apiClient.put(`/admin/trips/${tripId}`, data);
    },

    // 3. Quản lý Xe & Ghế
    getBuses: () => {
        return apiClient.get('/admin/buses');
    },

    getBusSeats: (busId) => {
        return apiClient.get(`/admin/buses/${busId}/seats`);
    },

    createBus: (data) => {
        return apiClient.post('/admin/buses', data);
    },

    // 4. Địa điểm
    getLocations: () => {
        return apiClient.get('/admin/locations');
    },

    createLocation: (data) => {
        return apiClient.post('/admin/locations', data);
    },

    // 5. Duyệt nạp tiền VietQR
    getDepositRequests: () => {
        return apiClient.get('/admin/deposit-requests');
    },

    approveDepositRequest: (requestId) => {
        return apiClient.post(`/admin/deposit-requests/${requestId}/approve`);
    },

    rejectDepositRequest: (requestId, reason = '') => {
        return apiClient.post(`/admin/deposit-requests/${requestId}/reject`, {
            LyDo: reason
        });
    },

    // 6. Quản lý người dùng
    getUsers: () => {
        return apiClient.get('/admin/users');
    },

    createUser: (data) => {
        return apiClient.post('/admin/users', data);
    },

    updateUserStatus: (userId, status) => {
        return apiClient.put(`/admin/users/${userId}`, { TrangThai: status });
    }
};

import apiClient from './apiClient';

export const authApi = {
    login: (username, password) => {
        return apiClient.post('/auth/login', {
            TenDangNhap: username,
            MatKhau: password
        });
    },

    register: (userData) => {
        return apiClient.post('/auth/register', userData);
    },

    getProfile: () => {
        return apiClient.get('/auth/profile');
    },

    updateProfile: (userData) => {
        return apiClient.post('/auth/update-profile', userData);
    }
};

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Mặc định địa chỉ IP máy chủ API
// - Máy thật: 192.168.1.87 (IP WiFi máy tính chạy XAMPP)
// - Android Emulator: 10.0.2.2
// - Web / iOS Simulator: localhost
export const DEFAULT_BASE_URL = Platform.select({
    android: 'http://192.168.1.87:8001/apiAppdatvexekhach',
    default: 'http://localhost:8001/apiAppdatvexekhach'
});

const apiClient = axios.create({
    baseURL: 'http://nhom50.itimit.id.vn/apiAppdatvexekhach/',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Khởi tạo Base URL từ AsyncStorage nếu người dùng đã tùy chỉnh
export const initApiBaseUrl = async () => {
    try {
        const savedUrl = await AsyncStorage.getItem('custom_api_base_url');
        if (savedUrl) {
            apiClient.defaults.baseURL = savedUrl;
            return savedUrl;
        }
    } catch (e) {
        console.warn('Lỗi đọc custom_api_base_url:', e);
    }
    return DEFAULT_BASE_URL;
};

// Cập nhật Base URL mới
export const updateApiBaseUrl = async (newUrl) => {
    let formatted = (newUrl || '').trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
        formatted = 'http://' + formatted;
    }
    if (!formatted.includes('apiAppdatvexekhach')) {
        formatted = formatted.replace(/\/+$/, '') + '/apiAppdatvexekhach';
    }
    apiClient.defaults.baseURL = formatted;
    await AsyncStorage.setItem('custom_api_base_url', formatted);
    return formatted;
};

// Request Interceptor: Tự động gắn Bearer Token
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Lỗi gắn token vào request:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Chuẩn hóa dữ liệu trả về từ API PHP
apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        let errorMsg = 'Có lỗi xảy ra khi kết nối máy chủ';
        if (error.response && error.response.data) {
            errorMsg = error.response.data.message || error.response.data.error || errorMsg;
        } else if (error.message) {
            if (error.message.includes('Network Error')) {
                errorMsg = 'Không thể kết nối tới máy chủ API. Vui lòng kiểm tra Apache XAMPP và địa chỉ IP kết nối.';
            } else {
                errorMsg = error.message;
            }
        }
        return Promise.reject(new Error(errorMsg));
    }
);

export default apiClient;

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/authApi';
import { initApiBaseUrl } from '../api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
    const [savedUsername, setSavedUsername] = useState('');

    // Khởi tạo trạng thái đăng nhập và nạp tên đăng nhập đã lưu từ AsyncStorage
    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                await initApiBaseUrl();

                // Lấy tên người dùng đã lưu trước đó (nếu có)
                const storedUsername = await AsyncStorage.getItem('saved_username');
                if (storedUsername) {
                    setSavedUsername(storedUsername);
                }

                // Kiểm tra token phiên đăng nhập
                const storedToken = await AsyncStorage.getItem('auth_token');
                const storedUser = await AsyncStorage.getItem('user_info');

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));

                    // Lấy profile mới nhất để đồng bộ số dư ví / trạng thái
                    try {
                        const profileRes = await authApi.getProfile();
                        if (profileRes && profileRes.data) {
                            setUser(profileRes.data);
                            await AsyncStorage.setItem('user_info', JSON.stringify(profileRes.data));
                        }
                    } catch (e) {
                        console.log('Không thể lấy profile ngầm, sử dụng cache:', e.message);
                    }
                } else {
                    // Chưa đăng nhập -> Gọi Modal đăng nhập/đăng ký lên LIỀN khi vào hệ thống
                    setIsAuthModalVisible(true);
                }
            } catch (e) {
                console.error('Lỗi bootstrap auth:', e);
                setIsAuthModalVisible(true);
            } finally {
                setLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    // Đăng nhập
    const login = async (username, password) => {
        try {
            const res = await authApi.login(username, password);
            if (res && res.data) {
                const { token: receivedToken, user: receivedUser } = res.data;

                // 1. Lưu lại tên đăng nhập vào AsyncStorage để lần sau không cần nhập lại
                await AsyncStorage.setItem('saved_username', username.trim());
                setSavedUsername(username.trim());

                // 2. Lưu token và thông tin người dùng
                await AsyncStorage.setItem('auth_token', receivedToken);
                await AsyncStorage.setItem('user_info', JSON.stringify(receivedUser));

                setToken(receivedToken);
                setUser(receivedUser);
                setIsAuthModalVisible(false);

                return { success: true, user: receivedUser };
            }
            throw new Error(res.message || 'Đăng nhập thất bại');
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    // Đăng ký tài khoản mới
    const register = async (userData) => {
        try {
            const res = await authApi.register(userData);
            if (res && res.data) {
                const { token: receivedToken, user: receivedUser } = res.data;

                // Lưu tên người dùng đăng ký vào AsyncStorage
                if (userData.TenDangNhap) {
                    await AsyncStorage.setItem('saved_username', userData.TenDangNhap.trim());
                    setSavedUsername(userData.TenDangNhap.trim());
                }

                await AsyncStorage.setItem('auth_token', receivedToken);
                await AsyncStorage.setItem('user_info', JSON.stringify(receivedUser));

                setToken(receivedToken);
                setUser(receivedUser);
                setIsAuthModalVisible(false);

                return { success: true, user: receivedUser };
            }
            throw new Error(res.message || 'Đăng ký thất bại');
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    // Đăng xuất (Vẫn giữ saved_username để lần sau người dùng không cần gõ lại)
    const logout = async () => {
        try {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user_info');
            setToken(null);
            setUser(null);
            // Hiện lại modal đăng nhập liền
            setIsAuthModalVisible(true);
        } catch (e) {
            console.error('Lỗi khi logout:', e);
        }
    };

    // Làm mới thông tin người dùng (ví dụ sau khi nạp tiền, đặt vé, hủy vé)
    const refreshProfile = async () => {
        try {
            const res = await authApi.getProfile();
            if (res && res.data) {
                setUser(res.data);
                await AsyncStorage.setItem('user_info', JSON.stringify(res.data));
            }
        } catch (e) {
            console.warn('Lỗi làm mới profile:', e.message);
        }
    };

    // Cập nhật thông tin cá nhân (Họ tên, SĐT, Email)
    const updateProfile = async (profileData) => {
        try {
            const res = await authApi.updateProfile(profileData);
            if (res && res.data) {
                setUser(res.data);
                await AsyncStorage.setItem('user_info', JSON.stringify(res.data));
                return { success: true, user: res.data };
            }
            throw new Error(res.message || 'Cập nhật thông tin thất bại');
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthModalVisible,
                savedUsername,
                openAuthModal: () => setIsAuthModalVisible(true),
                closeAuthModal: () => setIsAuthModalVisible(false),
                login,
                register,
                logout,
                refreshProfile,
                updateProfile
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
    isDark: false,
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#3b82f6',
    primarySoft: '#eff6ff',
    secondary: '#0f172a',
    accent: '#f59e0b',
    success: '#10b981',
    successSoft: '#ecfdf5',
    warning: '#f59e0b',
    danger: '#ef4444',
    dangerSoft: '#fef2f2',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    divider: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    textLight: '#94a3b8',
    white: '#ffffff',
    headerBg: '#ffffff',
    headerText: '#0f172a',
    headerBorder: '#e2e8f0',
    tabBarBg: '#ffffff',
    tabBarBorder: '#e2e8f0',
    tabBarActive: '#2563eb',
    tabBarInactive: '#64748b',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    inputText: '#0f172a',
    placeholder: '#94a3b8',
    seatAvailable: '#f1f5f9',
    seatSelected: '#2563eb',
    seatBooked: '#cbd5e1',
    floorTabActive: '#2563eb',
    floorTabInactive: '#e2e8f0'
};

export const darkTheme = {
    isDark: true,
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    primarySoft: '#1e293b',
    secondary: '#f8fafc',
    accent: '#fbbf24',
    success: '#10b981',
    successSoft: '#064e3b33',
    warning: '#f59e0b',
    danger: '#f87171',
    dangerSoft: '#ef444420',
    background: '#090d16',
    card: '#131b2e',
    border: '#222f4c',
    divider: '#1c263c',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textLight: '#64748b',
    white: '#ffffff',
    headerBg: '#101726',
    headerText: '#f8fafc',
    headerBorder: '#1e293b',
    tabBarBg: '#0d1322',
    tabBarBorder: '#1c263c',
    tabBarActive: '#60a5fa',
    tabBarInactive: '#64748b',
    inputBg: '#0b1120',
    inputBorder: '#334155',
    inputText: '#ffffff',
    placeholder: '#64748b',
    seatAvailable: '#1e293b',
    seatSelected: '#2563eb',
    seatBooked: '#334155',
    floorTabActive: '#3b82f6',
    floorTabInactive: '#1e293b'
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Mặc định có thể là true (giao diện tối sang trọng) hoặc load từ AsyncStorage
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [themeLoaded, setThemeLoaded] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const saved = await AsyncStorage.getItem('@app_dark_mode');
                if (saved !== null) {
                    setIsDarkMode(saved === 'true');
                }
            } catch (e) {
                console.log('Lỗi đọc theme:', e);
            } finally {
                setThemeLoaded(true);
            }
        };
        loadTheme();
    }, []);

    const toggleDarkMode = async (value) => {
        const newValue = typeof value === 'boolean' ? value : !isDarkMode;
        setIsDarkMode(newValue);
        try {
            await AsyncStorage.setItem('@app_dark_mode', String(newValue));
        } catch (e) {
            console.log('Lỗi lưu theme:', e);
        }
    };

    const theme = isDarkMode ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme, themeLoaded }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

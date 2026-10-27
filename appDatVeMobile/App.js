import './src/utils/format';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { colors } from './src/theme/colors';

// Modals
import AuthModal from './src/components/AuthModal';

// Screens - Khách hàng
import SearchTripsScreen from './src/screens/customer/SearchTripsScreen';
import SeatSelectionScreen from './src/screens/customer/SeatSelectionScreen';
import WalletScreen from './src/screens/customer/WalletScreen';
import MyTicketsScreen from './src/screens/customer/MyTicketsScreen';

// Screens - Nhân viên quầy
import CounterDashboardScreen from './src/screens/counter/CounterDashboardScreen';

// Screens - Admin
import AdminAddRouteScreen from './src/screens/admin/AdminAddRouteScreen';
import AdminTripsScreen from './src/screens/admin/AdminTripsScreen';
import AdminDepositRequestsScreen from './src/screens/admin/AdminDepositRequestsScreen';
import AdminUsersScreen from './src/screens/admin/AdminUsersScreen';

// Screen - Chung
import ProfileScreen from './src/screens/common/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack dành cho luồng tìm chuyến & chọn ghế khách hàng
function CustomerTripStack() {
    const { theme } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: theme.headerBg },
                headerTintColor: theme.headerText,
                headerTitleStyle: { fontWeight: 'bold', color: theme.headerText }
            }}
        >
            <Stack.Screen
                name="SearchTrips"
                component={SearchTripsScreen}
                options={{ title: '🚌 Tìm & Đặt Vé Xe' }}
            />
            <Stack.Screen
                name="SeatSelection"
                component={SeatSelectionScreen}
                options={{ title: '💺 Sơ Đồ 2 Hàng Ghế' }}
            />
        </Stack.Navigator>
    );
}

// Stack dành cho Admin quản lý chuyến & thêm tuyến
function AdminTripStack() {
    const { theme } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: theme.headerBg },
                headerTintColor: theme.headerText,
                headerTitleStyle: { fontWeight: 'bold', color: theme.headerText }
            }}
        >
            <Stack.Screen
                name="AdminTrips"
                component={AdminTripsScreen}
                options={{ title: '🚌 Quản Lý Chuyến Xe' }}
            />
            <Stack.Screen
                name="AdminAddRoute"
                component={AdminAddRouteScreen}
                options={{ title: '🛣️ Thêm Tuyến Xe Mới' }}
            />
        </Stack.Navigator>
    );
}

function MainNavigator() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const role = user?.VaiTro || 'KhachHang';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerStyle: {
                    backgroundColor: theme.headerBg,
                    borderBottomColor: theme.headerBorder,
                    elevation: 1,
                    shadowOpacity: 0.1
                },
                headerTintColor: theme.headerText,
                headerTitleStyle: { fontWeight: 'bold', fontSize: 17, color: theme.headerText },
                tabBarStyle: {
                    backgroundColor: theme.tabBarBg,
                    borderTopColor: theme.tabBarBorder,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8
                },
                tabBarActiveTintColor: theme.tabBarActive,
                tabBarInactiveTintColor: theme.tabBarInactive,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600'
                }
            })}
        >
            {/* VAI TRÒ 1: ADMIN */}
            {role === 'Admin' ? (
                <>
                    <Tab.Screen
                        name="AdminAddRouteTab"
                        component={AdminAddRouteScreen}
                        options={{
                            title: 'Thêm Tuyến',
                            tabBarLabel: 'Thêm Tuyến',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🛣️</Text>
                        }}
                    />
                    <Tab.Screen
                        name="AdminTripsTab"
                        component={AdminTripStack}
                        options={{
                            headerShown: false,
                            title: 'Chuyến Xe',
                            tabBarLabel: 'Chuyến Xe',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🚌</Text>
                        }}
                    />
                    <Tab.Screen
                        name="AdminDepositTab"
                        component={AdminDepositRequestsScreen}
                        options={{
                            title: 'Duyệt Nạp',
                            tabBarLabel: 'Duyệt Nạp',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💳</Text>
                        }}
                    />
                    <Tab.Screen
                        name="AdminUsersTab"
                        component={AdminUsersScreen}
                        options={{
                            title: 'Người Dùng',
                            tabBarLabel: 'Người Dùng',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👥</Text>
                        }}
                    />
                    <Tab.Screen
                        name="AdminProfileTab"
                        component={ProfileScreen}
                        options={{
                            title: 'Hồ Sơ Admin',
                            tabBarLabel: 'Hồ Sơ',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>
                        }}
                    />
                </>
            ) : (role === 'NhanVien' || role === 'NhanVienQuay') ? (
                /* VAI TRÒ 2: NHÂN VIÊN QUẦY */
                <>
                    <Tab.Screen
                        name="CounterTab"
                        component={CounterDashboardScreen}
                        options={{
                            title: 'Bán Vé Quầy',
                            tabBarLabel: 'Bán Vé Quầy',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏢</Text>
                        }}
                    />
                    <Tab.Screen
                        name="CounterTicketsTab"
                        component={MyTicketsScreen}
                        options={{
                            title: 'Vé Đã Bán',
                            tabBarLabel: 'Vé Đã Bán',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎫</Text>
                        }}
                    />
                    <Tab.Screen
                        name="CounterProfileTab"
                        component={ProfileScreen}
                        options={{
                            title: 'Hồ Sơ Nhân Viên',
                            tabBarLabel: 'Hồ Sơ',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>
                        }}
                    />
                </>
            ) : (
                /* VAI TRÒ 3: KHÁCH HÀNG (KhachHang / Mặc định) */
                <>
                    <Tab.Screen
                        name="TripsTab"
                        component={CustomerTripStack}
                        options={{
                            headerShown: false,
                            title: 'Chuyến Xe',
                            tabBarLabel: 'Chuyến Xe',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🚌</Text>
                        }}
                    />
                    <Tab.Screen
                        name="WalletTab"
                        component={WalletScreen}
                        options={{
                            title: 'Ví & Nạp VietQR',
                            tabBarLabel: 'Nạp Tiền',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💳</Text>
                        }}
                    />
                    <Tab.Screen
                        name="TicketsTab"
                        component={MyTicketsScreen}
                        options={{
                            title: 'Vé Của Tôi',
                            tabBarLabel: 'Vé Của Tôi',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎫</Text>
                        }}
                    />
                    <Tab.Screen
                        name="ProfileTab"
                        component={ProfileScreen}
                        options={{
                            title: 'Tài Khoản',
                            tabBarLabel: 'Tài Khoản',
                            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>
                        }}
                    />
                </>
            )}
        </Tab.Navigator>
    );
}

function RootApp() {
    const { isAuthModalVisible, closeAuthModal } = useAuth();
    const { isDarkMode, theme } = useTheme();

    const navTheme = isDarkMode
        ? {
            ...DarkTheme,
            colors: {
                ...DarkTheme.colors,
                background: theme.background,
                card: theme.headerBg,
                text: theme.text,
                border: theme.border,
                primary: theme.primary
            }
        }
        : {
            ...DefaultTheme,
            colors: {
                ...DefaultTheme.colors,
                background: theme.background,
                card: theme.headerBg,
                text: theme.text,
                border: theme.border,
                primary: theme.primary
            }
        };

    return (
        <View style={[styles.root, { backgroundColor: theme.background }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <NavigationContainer theme={navTheme}>
                <MainNavigator />
            </NavigationContainer>

            {/* Modal Đăng nhập / Đăng ký bật LIỀN khi vào hệ thống */}
            <AuthModal
                visible={isAuthModalVisible}
                onClose={closeAuthModal}
            />
        </View>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <RootApp />
            </AuthProvider>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1
    }
});

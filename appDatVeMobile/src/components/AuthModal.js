import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function AuthModal({ visible, onClose }) {
    const { login, register, savedUsername, user } = useAuth();
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    // Form fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Khi Modal mở lên hoặc savedUsername thay đổi -> Tự động nạp tên đăng nhập đã lưu từ AsyncStorage!
    useEffect(() => {
        if (savedUsername) {
            setUsername(savedUsername);
        }
    }, [savedUsername, visible]);

    const handleLogin = async () => {
        if (!username.trim() || !password) {
            Alert.alert('Thông báo', 'Vui lòng nhập tên đăng nhập và mật khẩu');
            return;
        }

        setLoading(true);
        const result = await login(username.trim(), password);
        setLoading(false);

        if (result.success) {
            Alert.alert('Thành công', `Xin chào ${result.user.HoTen || result.user.TenDangNhap} (${result.user.VaiTro})`);
            setPassword('');
        } else {
            Alert.alert('Đăng nhập thất bại', result.message || 'Sai tên đăng nhập hoặc mật khẩu');
        }
    };

    const handleRegister = async () => {
        if (!username.trim() || !password || !fullName.trim() || !phone.trim()) {
            Alert.alert('Thông báo', 'Vui lòng điền đầy đủ họ tên, tên đăng nhập, số điện thoại và mật khẩu');
            return;
        }

        setLoading(true);
        const result = await register({
            TenDangNhap: username.trim(),
            MatKhau: password,
            HoTen: fullName.trim(),
            SoDienThoai: phone.trim(),
            Email: email.trim() || null
        });
        setLoading(false);

        if (result.success) {
            Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
            setPassword('');
        } else {
            Alert.alert('Đăng ký thất bại', result.message);
        }
    };


    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={user ? onClose : () => {}}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>🚌 Vé Xe Khách Online</Text>
                            <Text style={styles.headerSubtitle}>
                                {isRegisterMode ? 'Tạo tài khoản thành viên mới' : 'Đăng nhập vào hệ thống đặt vé'}
                            </Text>
                        </View>
                        {user && (
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Tabs chuyển đổi Đăng Nhập / Đăng Ký */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, !isRegisterMode && styles.activeTab]}
                            onPress={() => setIsRegisterMode(false)}
                        >
                            <Text style={[styles.tabText, !isRegisterMode && styles.activeTabText]}>
                                Đăng Nhập
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, isRegisterMode && styles.activeTab]}
                            onPress={() => setIsRegisterMode(true)}
                        >
                            <Text style={[styles.tabText, isRegisterMode && styles.activeTabText]}>
                                Đăng Ký
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>


                        {isRegisterMode && (
                            <>
                                <Text style={styles.label}>Họ và tên *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />

                                <Text style={styles.label}>Số điện thoại *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ví dụ: 0912345678"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                />

                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ví dụ: nguyen@gmail.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </>
                        )}

                        <Text style={styles.label}>Tên đăng nhập *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập tên đăng nhập"
                            autoCapitalize="none"
                            value={username}
                            onChangeText={setUsername}
                        />

                        <Text style={styles.label}>Mật khẩu *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập mật khẩu"
                            secureTextEntry={true}
                            value={password}
                            onChangeText={setPassword}
                        />

                        {/* Nút hành động chính */}
                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.buttonDisabled]}
                            onPress={isRegisterMode ? handleRegister : handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {isRegisterMode ? 'ĐĂNG KÝ NGAY' : 'ĐĂNG NHẬP'}
                                </Text>
                            )}
                        </TouchableOpacity>



                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 20,
        width: '100%',
        maxWidth: 440,
        maxHeight: '90%',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary
    },
    headerSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 4
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center'
    },
    closeText: {
        fontSize: 16,
        color: colors.textMuted,
        fontWeight: 'bold'
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 4,
        marginBottom: 16
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10
    },
    activeTab: {
        backgroundColor: colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted
    },
    activeTabText: {
        color: colors.primary,
        fontWeight: '700'
    },
    formContainer: {
        paddingBottom: 10
    },
    rememberBanner: {
        backgroundColor: colors.primarySoft,
        borderColor: '#bfdbfe',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 12
    },
    rememberText: {
        fontSize: 12,
        color: colors.primaryDark,
        lineHeight: 18
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 6,
        marginTop: 8
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: colors.text
    },
    primaryButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    buttonDisabled: {
        opacity: 0.7
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 0.5
    },
    configServerBtn: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 8
    },
    configServerText: {
        fontSize: 12,
        color: colors.primary,
        textDecorationLine: 'underline'
    }
});

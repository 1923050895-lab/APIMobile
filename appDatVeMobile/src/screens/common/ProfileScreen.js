import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Switch
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatVND } from '../../utils/format';

export default function ProfileScreen() {
    const { user, logout, openAuthModal, refreshProfile, updateProfile } = useAuth();
    const { isDarkMode, toggleDarkMode, theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);

    // Modal Chỉnh sửa thông tin cá nhân
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editFullName, setEditFullName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [saving, setSaving] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        if (refreshProfile) {
            await refreshProfile();
        }
        setRefreshing(false);
    };

    const handleOpenEditModal = () => {
        if (!user) {
            openAuthModal();
            return;
        }
        setEditFullName(user?.HoTen || '');
        setEditPhone(user?.SoDienThoai || '');
        setEditEmail(user?.Email || '');
        setEditModalVisible(true);
    };

    const handleSaveProfile = async () => {
        if (!editFullName.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập Họ và tên');
            return;
        }
        if (!editPhone.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập Số điện thoại');
            return;
        }

        setSaving(true);
        try {
            const result = await updateProfile({
                HoTen: editFullName.trim(),
                SoDienThoai: editPhone.trim(),
                Email: editEmail.trim()
            });

            if (result.success) {
                Alert.alert('Thành công 🎉', 'Thông tin cá nhân của bạn đã được cập nhật!');
                setEditModalVisible(false);
            } else {
                Alert.alert('Lỗi cập nhật', result.message || 'Không thể cập nhật thông tin');
            }
        } catch (error) {
            Alert.alert('Lỗi hệ thống', error.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Xác nhận đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: logout
                }
            ]
        );
    };

    const userBalance = Number(user?.SoDu ?? user?.SoDuVi ?? user?.balance ?? 0);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
            {/* Thẻ đại diện người dùng */}
            <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(user?.HoTen || user?.TenDangNhap || 'U').charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={[styles.userName, { color: theme.text }]}>
                    {user?.HoTen || user?.TenDangNhap || 'Chưa đăng nhập'}
                </Text>
                {user && (
                    <Text style={[styles.balanceText, { color: theme.textMuted }]}>
                        Số dư ví: <Text style={{ fontWeight: '800', color: colors.primary }}>{formatVND(userBalance)} đ</Text>
                    </Text>
                )}
            </View>

            {/* Thẻ Chế Độ Giao Diện Tối */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.themeToggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 2 }]}>
                            {isDarkMode ? '🌙 Giao Diện Tối (Dark Mode)' : '☀️ Giao Diện Sáng'}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>
                            {isDarkMode ? 'Đang bật nền tối sang trọng, êm mắt' : 'Đang bật nền sáng mặc định'}
                        </Text>
                    </View>
                    <Switch
                        value={isDarkMode}
                        onValueChange={toggleDarkMode}
                        trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                        thumbColor={isDarkMode ? '#ffffff' : '#f8fafc'}
                    />
                </View>
            </View>

            {/* Chi tiết thông tin cá nhân */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                        Thông Tin Cá Nhân
                    </Text>
                    {user && (
                        <TouchableOpacity style={styles.editBtnSmall} onPress={handleOpenEditModal}>
                            <Text style={styles.editBtnSmallText}>Sửa thông tin</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.row, { borderBottomColor: theme.divider }]}>
                    <Text style={[styles.rowLabel, { color: theme.textMuted }]}>Tên đăng nhập:</Text>
                    <Text style={[styles.rowValue, { color: theme.text }]}>{user?.TenDangNhap || '—'}</Text>
                </View>

                <View style={[styles.row, { borderBottomColor: theme.divider }]}>
                    <Text style={[styles.rowLabel, { color: theme.textMuted }]}>Họ và tên:</Text>
                    <Text style={[styles.rowValue, { color: theme.text, fontWeight: '700' }]}>
                        {user?.HoTen || 'Chưa cập nhật'}
                    </Text>
                </View>

                <View style={[styles.row, { borderBottomColor: theme.divider }]}>
                    <Text style={[styles.rowLabel, { color: theme.textMuted }]}>Số điện thoại:</Text>
                    <Text style={[styles.rowValue, { color: theme.text }]}>
                        {user?.SoDienThoai || 'Chưa cập nhật'}
                    </Text>
                </View>

                <View style={[styles.row, { borderBottomColor: theme.divider }]}>
                    <Text style={[styles.rowLabel, { color: theme.textMuted }]}>Email:</Text>
                    <Text style={[styles.rowValue, { color: theme.text }]}>
                        {user?.Email || 'Chưa cập nhật'}
                    </Text>
                </View>

                <View style={[styles.row, { borderBottomColor: theme.divider }]}>
                    <Text style={[styles.rowLabel, { color: theme.textMuted }]}>Trạng thái:</Text>
                    <Text style={[styles.rowValue, { color: colors.success, fontWeight: '700' }]}>
                        {user?.TrangThai === 'HoatDong' ? 'Đang hoạt động' : '—'}
                    </Text>
                </View>

                {/* Nút chỉnh sửa to rõ bên dưới */}
                {user && (
                    <TouchableOpacity
                        style={[styles.editProfileBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#eff6ff', borderColor: isDarkMode ? '#3b82f6' : '#bfdbfe' }]}
                        onPress={handleOpenEditModal}
                    >
                        <Text style={[styles.editProfileBtnText, { color: isDarkMode ? '#60a5fa' : colors.primary }]}>
                            CHỈNH SỬA HỌ TÊN, SĐT, EMAIL
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Nút hành động */}
            {user ? (
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={[styles.switchAccountBtn, { backgroundColor: isDarkMode ? '#1e293b' : colors.white, borderColor: colors.primary }]}
                        onPress={openAuthModal}
                    >
                        <Text style={styles.switchAccountText}>Đổi tài khoản khác</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.loginBtn} onPress={openAuthModal}>
                    <Text style={styles.loginBtnText}>ĐĂNG NHẬP NGAY</Text>
                </TouchableOpacity>
            )}

            {/* Modal Chỉnh Sửa Thông Tin Cá Nhân */}
            <Modal visible={editModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}> Chỉnh Sửa Thông Tin</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                            Cập nhật họ tên, số điện thoại và email cá nhân
                        </Text>

                        {/* Form nhập liệu */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.formLabel, { color: theme.text }]}>Họ và tên *</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                                placeholder="Nhập họ và tên của bạn"
                                placeholderTextColor="#64748b"
                                value={editFullName}
                                onChangeText={setEditFullName}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.formLabel, { color: theme.text }]}>Số điện thoại *</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor="#64748b"
                                keyboardType="phone-pad"
                                value={editPhone}
                                onChangeText={setEditPhone}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.formLabel, { color: theme.text }]}>Email</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                                placeholder="Nhập địa chỉ email (không bắt buộc)"
                                placeholderTextColor="#64748b"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={editEmail}
                                onChangeText={setEditEmail}
                            />
                        </View>

                        {/* Nút hành động trong modal */}
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                style={[styles.modalCancelBtn, { borderColor: theme.inputBorder }]}
                                onPress={() => setEditModalVisible(false)}
                                disabled={saving}
                            >
                                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalSaveBtn, saving && { opacity: 0.7 }]}
                                onPress={handleSaveProfile}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color={colors.white} size="small" />
                                ) : (
                                    <Text style={styles.modalSaveText}>LƯU THAY ĐỔI</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 40
    },
    profileCard: {
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1
    },
    avatar: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        elevation: 3,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6
    },
    avatarText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: colors.white
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
        borderWidth: 1
    },
    roleText: {
        fontSize: 12,
        fontWeight: '700'
    },
    balanceText: {
        fontSize: 14,
        marginTop: 10
    },
    sectionCard: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1
    },
    themeToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold'
    },
    editBtnSmall: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#2563eb18',
        borderRadius: 8
    },
    editBtnSmallText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '700'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1
    },
    rowLabel: {
        fontSize: 13
    },
    rowValue: {
        fontSize: 13,
        fontWeight: '600'
    },
    editProfileBtn: {
        borderWidth: 1,
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 14
    },
    editProfileBtnText: {
        fontSize: 12.5,
        fontWeight: '800'
    },
    actionSection: {
        gap: 10,
        marginTop: 10
    },
    switchAccountBtn: {
        borderWidth: 1,
        paddingVertical: 13,
        borderRadius: 10,
        alignItems: 'center'
    },
    switchAccountText: {
        color: colors.primary,
        fontSize: 13.5,
        fontWeight: '700'
    },
    logoutBtn: {
        backgroundColor: '#ef444415',
        borderWidth: 1,
        borderColor: '#ef444440',
        paddingVertical: 13,
        borderRadius: 10,
        alignItems: 'center'
    },
    logoutText: {
        color: colors.danger,
        fontSize: 13.5,
        fontWeight: 'bold'
    },
    loginBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    loginBtnText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalBox: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    modalSubtitle: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 16
    },
    formGroup: {
        marginBottom: 12
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14
    },
    modalActionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16
    },
    modalCancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center'
    },
    modalCancelText: {
        fontSize: 13.5,
        fontWeight: 'bold'
    },
    modalSaveBtn: {
        flex: 2,
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center'
    },
    modalSaveText: {
        color: colors.white,
        fontSize: 13.5,
        fontWeight: 'bold'
    }
});

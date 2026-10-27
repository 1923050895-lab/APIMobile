import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    RefreshControl
} from 'react-native';
import { adminApi } from '../../api/adminApi';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatVND } from '../../utils/format';

export default function AdminUsersScreen() {
    const { isDarkMode, theme } = useTheme();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal tạo nhân viên
    const [modalVisible, setModalVisible] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('123456');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('NhanVienQuay');
    const [submitting, setSubmitting] = useState(false);

    const loadUsers = async () => {
        try {
            const res = await adminApi.getUsers();
            if (res && res.data) {
                setUsers(res.data);
            }
        } catch (e) {
            console.warn('Lỗi tải danh sách người dùng:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadUsers();
    };

    const handleToggleStatus = (u) => {
        const nextStatus = u.TrangThai === 'HoatDong' ? 'Khoa' : 'HoatDong';
        Alert.alert(
            'Đổi trạng thái tài khoản',
            `Bạn có chắc muốn ${nextStatus === 'Khoa' ? 'KHÓA' : 'MỞ KHÓA'} tài khoản "${u.TenDangNhap}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: nextStatus === 'Khoa' ? 'Khóa' : 'Mở khóa',
                    style: nextStatus === 'Khoa' ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            const userId = u.MaTaiKhoan ?? u.MaNguoiDung;
                            await adminApi.updateUserStatus(userId, nextStatus);
                            Alert.alert('Thành công', 'Đã cập nhật trạng thái tài khoản.');
                            loadUsers();
                        } catch (e) {
                            Alert.alert('Lỗi', e.message);
                        }
                    }
                }
            ]
        );
    };

    const handleCreateStaff = async () => {
        if (!username.trim() || !password || !fullName.trim() || !phone.trim()) {
            Alert.alert('Chưa đủ thông tin', 'Vui lòng nhập tên đăng nhập, họ tên và số điện thoại');
            return;
        }

        setSubmitting(true);
        try {
            await adminApi.createUser({
                TenDangNhap: username.trim(),
                MatKhau: password,
                HoTen: fullName.trim(),
                SoDienThoai: phone.trim(),
                VaiTro: role
            });
            Alert.alert('Thành công', 'Đã tạo tài khoản nhân viên mới thành công!');
            setModalVisible(false);
            setUsername('');
            setFullName('');
            setPhone('');
            loadUsers();
        } catch (e) {
            Alert.alert('Tạo tài khoản thất bại', e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const renderUser = ({ item }) => {
        const isActive = item.TrangThai === 'HoatDong';

        return (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.cardHeader, { borderBottomColor: theme.divider }]}>
                    <Text style={[styles.userName, { color: theme.text }]}>{item.HoTen} ({item.TenDangNhap})</Text>
                    <View style={[styles.roleBadge, item.VaiTro === 'Admin' ? styles.badgeAdmin : styles.badgeRole]}>
                        <Text style={styles.roleText}>{item.VaiTro}</Text>
                    </View>
                </View>

                <Text style={[styles.infoText, { color: theme.textMuted }]}>SĐT: {item.SoDienThoai || 'Chưa có'}</Text>
                <Text style={[styles.infoText, { color: theme.textMuted }]}>Số dư ví: {formatVND(item.SoDu ?? item.SoDuVi)} đ</Text>

                <View style={styles.actionRow}>
                    <View style={[styles.statusTag, isActive ? styles.tagActive : styles.tagLocked]}>
                        <Text style={styles.statusTagText}>
                            {isActive ? '● Đang hoạt động' : '✕ Đang bị khóa'}
                        </Text>
                    </View>

                    {item.VaiTro !== 'Admin' && (
                        <TouchableOpacity
                            style={[styles.toggleBtn, isActive ? styles.btnLock : styles.btnUnlock]}
                            onPress={() => handleToggleStatus(item)}
                        >
                            <Text style={styles.toggleBtnText}>
                                {isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View>
                    <Text style={[styles.title, { color: theme.text }]}>👥 Quản Lý Người Dùng</Text>
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>Tổng số tài khoản: {users.length}</Text>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.addBtnText}>➕ THÊM NHÂN VIÊN</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item, index) => {
                        const id = item.MaTaiKhoan ?? item.MaNguoiDung ?? item.id;
                        return id != null ? String(id) : `user-${index}`;
                    }}
                    renderItem={renderUser}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                />
            )}

            {/* Modal Thêm Nhân Viên */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={styles.modalTitle}>Tạo Tài Khoản Nhân Viên</Text>

                        <Text style={styles.label}>Họ và tên *</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Nguyễn Văn Nhân Viên"
                        />

                        <Text style={styles.label}>Tên đăng nhập *</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            placeholder="nv_benxe"
                        />

                        <Text style={styles.label}>Mật khẩu khởi tạo</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="123456"
                        />

                        <Text style={styles.label}>Số điện thoại *</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="0911223344"
                        />

                        <Text style={styles.label}>Vai trò</Text>
                        <View style={styles.roleChoiceRow}>
                            <TouchableOpacity
                                style={[styles.roleChoice, role === 'NhanVienQuay' && styles.roleChoiceActive]}
                                onPress={() => setRole('NhanVienQuay')}
                            >
                                <Text style={[styles.roleChoiceText, role === 'NhanVienQuay' && styles.roleChoiceTextActive]}>
                                    Nhân Viên Quầy
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleChoice, role === 'Admin' && styles.roleChoiceActive]}
                                onPress={() => setRole('Admin')}
                            >
                                <Text style={[styles.roleChoiceText, role === 'Admin' && styles.roleChoiceTextActive]}>
                                    Admin Quản Trị
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveBtn, submitting && styles.btnDisabled]}
                                onPress={handleCreateStaff}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <Text style={styles.saveText}>TẠO TÀI KHOẢN</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    header: {
        backgroundColor: colors.white,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text
    },
    subtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2
    },
    addBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8
    },
    addBtnText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold'
    },
    listContent: {
        padding: 16
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    badgeAdmin: {
        backgroundColor: '#fee2e2'
    },
    badgeRole: {
        backgroundColor: colors.primarySoft
    },
    roleText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primaryDark
    },
    infoText: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    tagActive: {
        backgroundColor: '#d1fae5'
    },
    tagLocked: {
        backgroundColor: '#fee2e2'
    },
    statusTagText: {
        fontSize: 11,
        fontWeight: '600'
    },
    toggleBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6
    },
    btnLock: {
        backgroundColor: colors.dangerSoft
    },
    btnUnlock: {
        backgroundColor: colors.primarySoft
    },
    toggleBtnText: {
        fontSize: 11,
        fontWeight: '700'
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 14
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
        marginTop: 6
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 14
    },
    roleChoiceRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
        marginBottom: 10
    },
    roleChoice: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center'
    },
    roleChoiceActive: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primary
    },
    roleChoiceText: {
        fontSize: 12,
        color: colors.textMuted
    },
    roleChoiceTextActive: {
        color: colors.primaryDark,
        fontWeight: '700'
    },
    modalBtnRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 16
    },
    cancelBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: colors.border
    },
    cancelText: {
        color: colors.textMuted,
        fontWeight: 'bold'
    },
    saveBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: colors.primary
    },
    saveText: {
        color: colors.white,
        fontWeight: 'bold'
    },
    btnDisabled: {
        opacity: 0.6
    }
});

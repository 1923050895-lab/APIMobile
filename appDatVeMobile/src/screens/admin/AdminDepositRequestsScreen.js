import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { adminApi } from '../../api/adminApi';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatVND } from '../../utils/format';

export default function AdminDepositRequestsScreen() {
    const { isDarkMode, theme } = useTheme();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const loadRequests = async () => {
        try {
            const res = await adminApi.getDepositRequests();
            if (res && res.data) {
                setRequests(res.data);
            }
        } catch (e) {
            console.warn('Lỗi tải yêu cầu nạp tiền:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadRequests();
    };

    const handleApprove = (req) => {
        Alert.alert(
            'Xác nhận duyệt nạp tiền',
            `Duyệt cộng ${formatVND(req.SoTien)} đ vào ví của khách hàng "${req.HoTen || req.TenDangNhap}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Duyệt & Cộng tiền ngay',
                    onPress: async () => {
                        setProcessingId(req.MaYeuCau);
                        try {
                            await adminApi.approveDepositRequest(req.MaYeuCau);
                            Alert.alert('Thành công', 'Đã duyệt yêu cầu và cộng tiền vào ví người dùng thành công.');
                            loadRequests();
                        } catch (e) {
                            Alert.alert('Lỗi duyệt nạp tiền', e.message);
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = (req) => {
        Alert.alert(
            'Từ chối yêu cầu',
            `Bạn có chắc chắn muốn từ chối yêu cầu nạp tiền #${req.MaYeuCau}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Từ chối',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessingId(req.MaYeuCau);
                        try {
                            await adminApi.rejectDepositRequest(req.MaYeuCau, 'Thông tin chuyển khoản không khớp');
                            Alert.alert('Đã từ chối', 'Đã từ chối yêu cầu nạp tiền.');
                            loadRequests();
                        } catch (e) {
                            Alert.alert('Lỗi', e.message);
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {
        const isPending = item.TrangThai === 'ChoDuyet';
        const isApproved = item.TrangThai === 'DaDuyet';
        const isProcessing = processingId === item.MaYeuCau;

        return (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.reqId, { color: theme.text }]}>Yêu cầu #{item.MaYeuCau}</Text>
                    <View style={[
                        styles.badge,
                        isApproved ? styles.badgeSuccess : isPending ? styles.badgePending : styles.badgeDanger
                    ]}>
                        <Text style={styles.badgeText}>
                            {isApproved ? 'Đã duyệt' : isPending ? 'Chờ duyệt' : 'Từ chối'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.amount}>
                    +{formatVND(item.SoTien)} đ
                </Text>

                <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#0b1120' : '#f8fafc', borderColor: theme.border }]}>
                    <Text style={[styles.infoRow, { color: theme.textMuted }]}>Khách hàng: <Text style={[styles.bold, { color: theme.text }]}>{item.HoTen} ({item.TenDangNhap})</Text></Text>
                    <Text style={[styles.infoRow, { color: theme.textMuted }]}>SĐT: <Text style={[styles.bold, { color: theme.text }]}>{item.SoDienThoai || 'Chưa có'}</Text></Text>
                    <Text style={[styles.infoRow, { color: theme.textMuted }]}>Nội dung CK: <Text style={[styles.bold, { color: theme.text }]}>{item.NoiDungChuyenKhoan || 'NAP'}</Text></Text>
                    <Text style={[styles.infoRow, { color: theme.textMuted }]}>Thời gian: <Text style={[styles.bold, { color: theme.text }]}>{item.ThoiGianTao || item.NgayTao}</Text></Text>
                </View>

                {isPending && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.approveBtn, isProcessing && styles.btnDisabled]}
                            onPress={() => handleApprove(item)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.approveText}>✓ DUYỆT CỘNG TIỀN</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.rejectBtn, isProcessing && styles.btnDisabled]}
                            onPress={() => handleReject(item)}
                            disabled={isProcessing}
                        >
                            <Text style={styles.rejectText}>✕ Từ chối</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.text }]}>💳 Duyệt Nạp Tiền VietQR</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>Kiểm tra biến động ngân hàng và duyệt cộng tiền vào ví</Text>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item, index) => {
                        const id = item.MaYeuCau ?? item.id;
                        return id != null ? String(id) : `req-${index}`;
                    }}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Không có yêu cầu nạp tiền nào.</Text>
                        </View>
                    }
                />
            )}
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
    listContent: {
        padding: 16
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    reqId: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: 'bold'
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    badgePending: {
        backgroundColor: '#fef3c7'
    },
    badgeSuccess: {
        backgroundColor: '#d1fae5'
    },
    badgeDanger: {
        backgroundColor: '#fee2e2'
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700'
    },
    amount: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.success,
        marginBottom: 8
    },
    infoBox: {
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 8,
        gap: 4,
        marginBottom: 12
    },
    infoRow: {
        fontSize: 12,
        color: colors.textMuted
    },
    bold: {
        color: colors.text,
        fontWeight: '600'
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10
    },
    approveBtn: {
        flex: 1,
        backgroundColor: colors.success,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center'
    },
    approveText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold'
    },
    rejectBtn: {
        backgroundColor: colors.dangerSoft,
        borderWidth: 1,
        borderColor: '#fecaca',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center'
    },
    rejectText: {
        color: colors.danger,
        fontSize: 12,
        fontWeight: 'bold'
    },
    btnDisabled: {
        opacity: 0.6
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyBox: {
        padding: 40,
        alignItems: 'center'
    },
    emptyText: {
        color: colors.textMuted
    }
});

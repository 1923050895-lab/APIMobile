import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { walletApi } from '../../api/walletApi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatVND } from '../../utils/format';

const BANK_ID = '970415'; // VietinBank bin code
const BANK_ACCOUNT = '1041002875';
const ACCOUNT_NAME = 'NGUYEN MANH CUONG';

export default function WalletScreen({ route }) {
    const { user, refreshProfile } = useAuth();
    const { isDarkMode, theme } = useTheme();
    const initialAmount = route?.params?.depositAmount ? String(route.params.depositAmount) : '100000';

    const [depositAmount, setDepositAmount] = useState(initialAmount);
    const [showQr, setShowQr] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [history, setHistory] = useState([]);
    const [requests, setRequests] = useState([]);
    const [walletBalance, setWalletBalance] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const numericAmount = Math.max(0, parseInt(depositAmount.replace(/[^0-9]/g, '') || '0', 10));
    const transferContent = `NAP ${user?.TenDangNhap || 'USER'} ${numericAmount}`;
    const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-compact.png?amount=${numericAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

    const loadData = async () => {
        try {
            await refreshProfile();
            const [balRes, histRes, reqRes] = await Promise.all([
                walletApi.getBalance().catch(() => null),
                walletApi.getTransactions().catch(() => ({ data: [] })),
                walletApi.getMyDepositRequests().catch(() => ({ data: [] }))
            ]);

            // Cập nhật số dư ví trực tiếp từ API
            if (balRes && balRes.data) {
                const b = balRes.data.balance ?? balRes.data.SoDu ?? balRes.data.SoDuVi;
                if (b !== undefined && b !== null) {
                    setWalletBalance(Number(b));
                }
            }

            // Chuẩn hóa danh sách biến động số dư
            let histList = [];
            if (Array.isArray(histRes)) {
                histList = histRes;
            } else if (Array.isArray(histRes?.data)) {
                histList = histRes.data;
            } else if (Array.isArray(histRes?.data?.transactions)) {
                histList = histRes.data.transactions;
            } else if (Array.isArray(histRes?.transactions)) {
                histList = histRes.transactions;
            }
            setHistory(histList);

            // Chuẩn hóa danh sách yêu cầu nạp tiền
            let reqList = [];
            if (Array.isArray(reqRes)) {
                reqList = reqRes;
            } else if (Array.isArray(reqRes?.data)) {
                reqList = reqRes.data;
            } else if (Array.isArray(reqRes?.data?.requests)) {
                reqList = reqRes.data.requests;
            } else if (Array.isArray(reqRes?.requests)) {
                reqList = reqRes.requests;
            }
            setRequests(reqList);
        } catch (e) {
            console.warn('Lỗi tải dữ liệu ví:', e.message);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleCreateDepositRequest = async () => {
        if (numericAmount < 10000) {
            Alert.alert('Số tiền không hợp lệ', 'Số tiền nạp tối thiểu là 10.000 đ');
            return;
        }

        setSubmitting(true);
        try {
            const res = await walletApi.createDepositRequest(numericAmount, transferContent, 'VietinBank');
            Alert.alert(
                'Gửi yêu cầu thành công!',
                `Yêu cầu nạp ${formatVND(numericAmount)} đ đã được gửi đến ban quản trị (Admin).\nSau khi admin xác nhận biến động tài khoản, tiền sẽ được cộng trực tiếp vào ví của bạn.`
            );
            setShowQr(false);
            loadData();
        } catch (e) {
            Alert.alert('Gửi yêu cầu thất bại', e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const userBalance = walletBalance !== null
        ? walletBalance
        : Number(user?.SoDu ?? user?.SoDuVi ?? user?.balance ?? 0);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
            {/* Thẻ số dư ví */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Số Dư Ví Của Bạn</Text>
                <Text style={styles.balanceValue}>
                    {formatVND(userBalance)} <Text style={{ fontSize: 18 }}>đ</Text>
                </Text>
                <Text style={styles.balanceUser}>Chủ tài khoản: {user?.HoTen || user?.TenDangNhap}</Text>
            </View>

            {/* Phần nạp tiền VietQR */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>💳 Nạp Tiền Vào Ví Bằng VietQR</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                    Quét mã QR chuyển khoản ngân hàng tự động, admin sẽ duyệt và cộng tiền ngay
                </Text>

                <Text style={[styles.inputLabel, { color: theme.text }]}>Nhập số tiền muốn nạp (VNĐ):</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                    keyboardType="numeric"
                    value={numericAmount > 0 ? formatVND(numericAmount) : ''}
                    onChangeText={(val) => setDepositAmount(val.replace(/[^0-9]/g, ''))}
                    placeholder="Ví dụ: 200,000"
                    placeholderTextColor={theme.placeholder}
                />

                {/* Gợi ý các mức tiền */}
                <View style={styles.presetRow}>
                    {[50000, 100000, 200000, 500000].map((amt) => (
                        <TouchableOpacity
                            key={`amt-${amt}`}
                            style={[
                                styles.presetBtn,
                                { backgroundColor: isDarkMode ? '#0b1120' : '#f8fafc', borderColor: theme.border },
                                numericAmount === amt && styles.presetBtnActive
                            ]}
                            onPress={() => setDepositAmount(String(amt))}
                        >
                            <Text style={[
                                styles.presetText,
                                { color: theme.textMuted },
                                numericAmount === amt && styles.presetTextActive
                            ]}>
                                {amt / 1000}k
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {!showQr ? (
                    <TouchableOpacity
                        style={styles.showQrBtn}
                        onPress={() => setShowQr(true)}
                    >
                        <Text style={styles.showQrBtnText}>TẠO MÃ VIETQR CHUYỂN KHOẢN</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.qrSection}>
                        <Text style={styles.qrHeader}>Quét mã QR qua ứng dụng Ngân hàng:</Text>

                        <View style={styles.qrImageWrapper}>
                            <Image
                                source={{ uri: qrUrl }}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                        </View>

                        <View style={styles.bankDetailBox}>
                            <Text style={styles.bankRow}>Ngân hàng: <Text style={styles.bankHighlight}>VietinBank</Text></Text>
                            <Text style={styles.bankRow}>Số tài khoản: <Text style={styles.bankHighlight}>{BANK_ACCOUNT}</Text></Text>
                            <Text style={styles.bankRow}>Chủ tài khoản: <Text style={styles.bankHighlight}>{ACCOUNT_NAME}</Text></Text>
                            <Text style={styles.bankRow}>Số tiền: <Text style={styles.bankHighlight}>{formatVND(numericAmount)} đ</Text></Text>
                            <Text style={styles.bankRow}>Nội dung CK: <Text style={styles.bankHighlight}>{transferContent}</Text></Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitRequestBtn, submitting && styles.btnDisabled]}
                            onPress={handleCreateDepositRequest}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.submitRequestText}>
                                    ĐÃ CHUYỂN KHOẢN - GỬI ADMIN DUYỆT NGAY
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.hideQrBtn}
                            onPress={() => setShowQr(false)}
                        >
                            <Text style={styles.hideQrText}>Thu gọn mã QR</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Danh sách yêu cầu nạp tiền */}
            {Array.isArray(requests) && requests.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Yêu Cầu Nạp Tiền Chờ Duyệt ({requests.length})</Text>
                    {requests.map((r, idx) => {
                        const reqId = r.MaYeuCau ?? r.id ?? idx;
                        return (
                            <View key={`req-${reqId}`} style={styles.historyItem}>
                                <View>
                                    <Text style={styles.historyAmount}>
                                        +{formatVND(r.SoTien)} đ
                                    </Text>
                                    <Text style={styles.historyDate}>{r.ThoiGianTao || r.NgayTao}</Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    r.TrangThai === 'DaDuyet' ? styles.statusSuccess :
                                        r.TrangThai === 'TuChoi' ? styles.statusDanger : styles.statusPending
                                ]}>
                                    <Text style={styles.statusText}>
                                        {r.TrangThai === 'DaDuyet' ? 'Đã duyệt' :
                                            r.TrangThai === 'TuChoi' ? 'Bị từ chối' : 'Chờ duyệt'}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Lịch sử biến động số dư */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 30 }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Lịch Sử Biến Động Số Dư</Text>
                {!Array.isArray(history) || history.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>Chưa có giao dịch nào được ghi nhận</Text>
                ) : (
                    history.map((h, idx) => {
                        const isPlus = h.LoaiGiaoDich === 'NapTien' || h.LoaiGiaoDich === 'HoanTien';
                        const histId = h.MaGiaoDich ?? h.id ?? idx;
                        return (
                            <View key={`hist-${histId}`} style={[styles.historyItem, { borderBottomColor: theme.divider }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.historyDesc, { color: theme.text }]}>{h.GhiChu || h.MoTa || h.LoaiGiaoDich}</Text>
                                    <Text style={[styles.historyDate, { color: theme.textMuted }]}>{h.ThoiGian || h.ThoiGianGiaoDich || h.NgayTao}</Text>
                                </View>
                                <Text style={[styles.historyAmount, { color: isPlus ? colors.success : colors.danger }]}>
                                    {isPlus ? '+' : '-'}{formatVND(h.SoTien)} đ
                                </Text>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16
    },
    balanceCard: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    balanceLabel: {
        fontSize: 13,
        color: '#dbeafe',
        fontWeight: '600'
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.white,
        marginVertical: 6
    },
    balanceUser: {
        fontSize: 12,
        color: '#bfdbfe'
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text
    },
    cardSubtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
        marginBottom: 12
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 6
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        fontWeight: '700',
        color: colors.text
    },
    presetRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
        marginBottom: 14
    },
    presetBtn: {
        flex: 1,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center'
    },
    presetBtnActive: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primary
    },
    presetText: {
        fontSize: 12,
        color: colors.text,
        fontWeight: '600'
    },
    presetTextActive: {
        color: colors.primary,
        fontWeight: '700'
    },
    showQrBtn: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center'
    },
    showQrBtnText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: 'bold'
    },
    qrSection: {
        alignItems: 'center',
        paddingTop: 10
    },
    qrHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 10
    },
    qrImageWrapper: {
        backgroundColor: colors.white,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border
    },
    qrImage: {
        width: 240,
        height: 240
    },
    bankDetailBox: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 4
    },
    bankRow: {
        fontSize: 12,
        color: colors.textMuted
    },
    bankHighlight: {
        fontWeight: '700',
        color: colors.text
    },
    submitRequestBtn: {
        backgroundColor: colors.success,
        width: '100%',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 14
    },
    submitRequestText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: 'bold'
    },
    hideQrBtn: {
        marginTop: 10,
        paddingVertical: 6
    },
    hideQrText: {
        fontSize: 12,
        color: colors.textMuted,
        textDecorationLine: 'underline'
    },
    btnDisabled: {
        opacity: 0.6
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    historyDesc: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text
    },
    historyDate: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2
    },
    historyAmount: {
        fontSize: 14,
        fontWeight: '700'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    statusPending: {
        backgroundColor: '#fef3c7'
    },
    statusSuccess: {
        backgroundColor: '#d1fae5'
    },
    statusDanger: {
        backgroundColor: '#fee2e2'
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600'
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 13,
        textAlign: 'center',
        marginTop: 10
    }
});

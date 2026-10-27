import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { tripApi } from '../../api/tripApi';
import { bookingApi } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatVND } from '../../utils/format';

export default function SeatSelectionScreen({ route, navigation }) {
    const { trip } = route.params;
    const { user, refreshProfile } = useAuth();
    const { isDarkMode, theme } = useTheme();

    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFloor, setCurrentFloor] = useState(1);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Tải sơ đồ ghế của chuyến xe
    const fetchSeats = async () => {
        setLoading(true);
        try {
            const res = await tripApi.getTripSeats(trip.MaChuyen);
            if (res && res.data) {
                setSeats(res.data.seats || []);
            }
        } catch (e) {
            Alert.alert('Lỗi tải sơ đồ ghế', e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeats();
        refreshProfile();
    }, [trip.MaChuyen]);

    // Helper kiểm tra ghế đã đặt
    const checkIsBooked = (s) => {
        return s.TrangThai === 'DaDat' || s.TrangThaiDat === 'DaDat' || s.TrangThaiGheVatLy === 'Hong';
    };

    // Chọn / Bỏ chọn ghế
    const toggleSeat = (seat) => {
        if (checkIsBooked(seat)) {
            Alert.alert('Ghế đã được đặt', `Ghế ${seat.SoGhe} đã có người đặt trước hoặc không thể chọn.`);
            return;
        }

        const isSelected = selectedSeats.some(s => s.MaGhe === seat.MaGhe);
        if (isSelected) {
            setSelectedSeats(selectedSeats.filter(s => s.MaGhe !== seat.MaGhe));
        } else {
            setSelectedSeats([...selectedSeats, seat]);
        }
    };

    // Tính toán tiền
    const pricePerSeat = Number(trip.GiaVe || 0);
    const totalPrice = selectedSeats.length * pricePerSeat;
    const userBalance = Number(user?.SoDu ?? user?.SoDuVi ?? user?.balance ?? 0);

    // Xử lý đặt vé
    const handleConfirmBooking = async () => {
        if (selectedSeats.length === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 ghế để tiếp tục');
            return;
        }

        if (userBalance < totalPrice) {
            const diff = totalPrice - userBalance;
            Alert.alert(
                'Số dư ví không đủ',
                `Tổng tiền vé: ${formatVND(totalPrice)} đ\nSố dư ví hiện tại: ${formatVND(userBalance)} đ\nBạn còn thiếu: ${formatVND(diff)} đ.\n\nBạn có muốn nạp tiền qua VietQR ngay không?`,
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Nạp Tiền VietQR',
                        onPress: () => navigation.navigate('WalletTab', {
                            screen: 'Wallet',
                            params: { depositAmount: diff }
                        })
                    }
                ]
            );
            return;
        }

        Alert.alert(
            'Xác nhận đặt vé',
            `Bạn có chắc chắn muốn đặt ${selectedSeats.length} vé (${selectedSeats.map(s => s.SoGhe).join(', ')}) với tổng tiền ${formatVND(totalPrice)} đ từ số dư ví?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Thanh Toán & Đặt Vé',
                    onPress: async () => {
                        setBookingLoading(true);
                        try {
                            const seatIds = selectedSeats.map(s => Number(s.MaGhe));
                            const payload = {
                                MaChuyen: Number(trip.MaChuyen),
                                DanhSachMaGhe: seatIds,
                                DanhSachGhe: seatIds
                            };
                            const res = await bookingApi.bookOnline(payload);
                            await refreshProfile();

                            Alert.alert(
                                'Đặt vé thành công! 🎉',
                                `Mã đặt vé: #${res.data?.MaDatVe || ''}\nSố vé: ${selectedSeats.length}\nSố dư ví đã được khấu trừ.`,
                                [
                                    {
                                        text: 'Xem vé của tôi',
                                        onPress: () => navigation.navigate('TicketsTab')
                                    }
                                ]
                            );
                            fetchSeats();
                            setSelectedSeats([]);
                        } catch (err) {
                            Alert.alert('Đặt vé thất bại', err.message);
                        } finally {
                            setBookingLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Số chỗ còn trống thực tế
    const totalCount = seats.length;
    const availableCount = seats.filter(s => !checkIsBooked(s)).length;

    // Ghế theo tầng hiện tại
    const floorSeats = seats.filter(s => Number(s.Tang) === Number(currentFloor));
    // SẮP XẾP LUÔN THÀNH 2 HÀNG (TRÁI + PHẢI) VỚI LỐI ĐI Ở GIỮA
    const half = Math.ceil(floorSeats.length / 2);
    const leftSeats = floorSeats.slice(0, half);
    const rightSeats = floorSeats.slice(half);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header thông tin chuyến: thông tin xe xong xuống hàng hiển thị còn bao nhiêu chỗ trống */}
            <View style={[styles.tripSummaryHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <Text style={[styles.routeText, { color: theme.text }]}>{trip.TenTuyen}</Text>
                <Text style={[styles.timeText, { color: theme.textMuted }]}>
                    Khởi hành: {trip.ThoiGianDi}
                </Text>

                {/* Thông tin xe */}
                <Text style={[styles.busMetaInfo, { color: theme.textMuted }]}>
                    Xe: <Text style={[styles.busMetaBold, { color: theme.text }]}>{trip.TenXe || 'Xe Khách Tuyến'}</Text> (BS: <Text style={[styles.busMetaBold, { color: theme.text }]}>{trip.BienSo}</Text>) • {trip.LoaiXe || '2 Tầng'}
                </Text>

                {/* XUỐNG HÀNG: Hiển thị còn bao nhiêu chỗ trống */}
                <View style={styles.headerVacancyRow}>
                    <Text style={[styles.headerVacancyLabel, { color: theme.textMuted }]}>💺 Tình trạng chỗ:</Text>
                    <View style={[
                        styles.headerVacancyBadge,
                        availableCount <= 0 ? styles.headerVacancyBadgeEmpty : styles.headerVacancyBadgeAvailable
                    ]}>
                        <Text style={[
                            styles.headerVacancyBadgeText,
                            availableCount <= 0 ? styles.headerVacancyBadgeTextEmpty : styles.headerVacancyBadgeTextAvailable
                        ]}>
                            {availableCount > 0 ? `Còn ${availableCount} chỗ trống / ${totalCount} ghế` : 'Đã hết chỗ trống'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Chuyển đổi Tầng 1 / Tầng 2 */}
            <View style={[styles.floorTabRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.floorTab, currentFloor === 1 && styles.floorTabActive]}
                    onPress={() => setCurrentFloor(1)}
                >
                    <Text style={[styles.floorTabText, currentFloor === 1 && styles.floorTabTextActive]}>
                        TẦNG 1 (DƯỚI)
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.floorTab, currentFloor === 2 && styles.floorTabActive]}
                    onPress={() => setCurrentFloor(2)}
                >
                    <Text style={[styles.floorTabText, currentFloor === 2 && styles.floorTabTextActive]}>
                        TẦNG 2 (TRÊN)
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Chú thích màu sắc */}
            <View style={[styles.legendRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: isDarkMode ? '#1e293b' : colors.seatAvailable, borderColor: theme.border }]} />
                    <Text style={[styles.legendText, { color: theme.textMuted }]}>Trống</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: colors.primary, borderColor: colors.primaryDark }]} />
                    <Text style={[styles.legendText, { color: theme.textMuted }]}>Đang chọn</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', borderColor: isDarkMode ? '#475569' : '#94a3b8' }]} />
                    <Text style={[styles.legendText, { color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '700' }]}>🔒 Đã đặt</Text>
                </View>
            </View>

            {/* SƠ ĐỒ GHẾ 2 HÀNG */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Đang tải sơ đồ 2 hàng ghế...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.busLayout}>
                    <View style={styles.driverSection}>
                        <Text style={styles.driverText}>🚗 KHU VỰC BÁC TÀI / ĐẦU XE</Text>
                    </View>

                    <View style={styles.twoRowsContainer}>
                        {/* HÀNG TRÁI */}
                        <View style={styles.seatColumn}>
                            <View style={styles.columnHeader}>
                                <Text style={styles.columnHeaderText}>⬅️ HÀNG TRÁI ({leftSeats.length})</Text>
                            </View>
                            {leftSeats.map((seat) => {
                                const isBooked = checkIsBooked(seat);
                                const isSelected = selectedSeats.some(s => s.MaGhe === seat.MaGhe);

                                return (
                                    <TouchableOpacity
                                        key={`seat-${seat.MaGhe}`}
                                        style={[
                                            styles.seatBox,
                                            isBooked && styles.seatBooked,
                                            isSelected && styles.seatSelected
                                        ]}
                                        onPress={() => toggleSeat(seat)}
                                        disabled={isBooked}
                                        activeOpacity={isBooked ? 1 : 0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.seatName,
                                                isSelected && styles.seatNameSelected,
                                                isBooked && styles.seatNameBooked
                                            ]}
                                        >
                                            {isBooked ? `🔒 ${seat.SoGhe}` : seat.SoGhe}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.seatPriceTag,
                                                isSelected && styles.seatNameSelected,
                                                isBooked && styles.seatPriceBooked
                                            ]}
                                        >
                                            {isBooked ? 'ĐÃ ĐẶT' : isSelected ? 'ĐANG CHỌN' : `${(Number(seat.GiaVe || trip.GiaVe) / 1000).toFixed(0)}k`}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* LỐI ĐI Ở GIỮA */}
                        <View style={styles.aisle}>
                            <Text style={styles.aisleText}>L</Text>
                            <Text style={styles.aisleText}>Ố</Text>
                            <Text style={styles.aisleText}>I</Text>
                            <Text style={styles.aisleText}> </Text>
                            <Text style={styles.aisleText}>Đ</Text>
                            <Text style={styles.aisleText}>I</Text>
                        </View>

                        {/* HÀNG PHẢI */}
                        <View style={styles.seatColumn}>
                            <View style={styles.columnHeader}>
                                <Text style={styles.columnHeaderText}>HÀNG PHẢI ➡️ ({rightSeats.length})</Text>
                            </View>
                            {rightSeats.map((seat) => {
                                const isBooked = checkIsBooked(seat);
                                const isSelected = selectedSeats.some(s => s.MaGhe === seat.MaGhe);

                                return (
                                    <TouchableOpacity
                                        key={`seat-${seat.MaGhe}`}
                                        style={[
                                            styles.seatBox,
                                            isBooked && styles.seatBooked,
                                            isSelected && styles.seatSelected
                                        ]}
                                        onPress={() => toggleSeat(seat)}
                                        disabled={isBooked}
                                        activeOpacity={isBooked ? 1 : 0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.seatName,
                                                isSelected && styles.seatNameSelected,
                                                isBooked && styles.seatNameBooked
                                            ]}
                                        >
                                            {isBooked ? `🔒 ${seat.SoGhe}` : seat.SoGhe}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.seatPriceTag,
                                                isSelected && styles.seatNameSelected,
                                                isBooked && styles.seatPriceBooked
                                            ]}
                                        >
                                            {isBooked ? 'ĐÃ ĐẶT' : isSelected ? 'ĐANG CHỌN' : `${(Number(seat.GiaVe || trip.GiaVe) / 1000).toFixed(0)}k`}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            )}

            {/* Thanh thanh toán cố định ở dưới */}
            <View style={[styles.checkoutBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                <View style={styles.checkoutInfo}>
                    <Text style={[styles.checkoutSelectedSeats, { color: theme.text }]}>
                        Ghế: {selectedSeats.length > 0 ? selectedSeats.map(s => s.SoGhe).join(', ') : 'Chưa chọn'}
                    </Text>
                    <Text style={[styles.checkoutTotal, { color: theme.text }]}>
                        Tổng: <Text style={{ color: colors.primary, fontWeight: '800' }}>{formatVND(totalPrice)} đ</Text>
                    </Text>
                    <Text style={[styles.walletBalanceText, { color: theme.textMuted }]}>
                        Số dư ví: {formatVND(userBalance)} đ
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.checkoutBtn,
                        (selectedSeats.length === 0 || bookingLoading) && styles.checkoutBtnDisabled
                    ]}
                    onPress={handleConfirmBooking}
                    disabled={selectedSeats.length === 0 || bookingLoading}
                >
                    {bookingLoading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.checkoutBtnText}>ĐẶT VÉ NGAY</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    tripSummaryHeader: {
        backgroundColor: colors.white,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    routeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text
    },
    timeText: {
        fontSize: 12.5,
        color: colors.textMuted,
        marginTop: 4
    },
    busMetaInfo: {
        fontSize: 12.5,
        color: '#475569',
        marginTop: 6
    },
    busMetaBold: {
        fontWeight: '700',
        color: colors.text
    },
    headerVacancyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
    },
    headerVacancyLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b'
    },
    headerVacancyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6
    },
    headerVacancyBadgeAvailable: {
        backgroundColor: '#dcfce7',
        borderWidth: 1,
        borderColor: '#86efac'
    },
    headerVacancyBadgeEmpty: {
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fca5a5'
    },
    headerVacancyBadgeText: {
        fontSize: 12,
        fontWeight: '700'
    },
    headerVacancyBadgeTextAvailable: {
        color: '#15803d'
    },
    headerVacancyBadgeTextEmpty: {
        color: '#b91c1c'
    },
    floorTabRow: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingBottom: 10,
        gap: 10
    },
    floorTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border
    },
    floorTabActive: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primary
    },
    floorTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted
    },
    floorTabTextActive: {
        color: colors.primary,
        fontWeight: '700'
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        paddingVertical: 8,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    legendBox: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1
    },
    legendText: {
        fontSize: 12,
        color: colors.textMuted
    },
    busLayout: {
        padding: 16,
        alignItems: 'center'
    },
    driverSection: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#e2e8f0',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16
    },
    driverText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMuted
    },
    twoRowsContainer: {
        flexDirection: 'row',
        width: '100%',
        maxWidth: 380,
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    seatColumn: {
        flex: 1,
        gap: 8
    },
    columnHeader: {
        backgroundColor: colors.primarySoft,
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#bfdbfe'
    },
    columnHeaderText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primaryDark
    },
    aisle: {
        width: 32,
        alignItems: 'center',
        paddingVertical: 20
    },
    aisleText: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '700',
        marginVertical: 2
    },
    seatBox: {
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: '#93c5fd',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    seatSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primaryDark
    },
    seatBooked: {
        backgroundColor: '#e2e8f0',
        borderColor: '#94a3b8',
        borderStyle: 'dashed'
    },
    seatName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text
    },
    seatNameSelected: {
        color: colors.white
    },
    seatNameBooked: {
        color: '#64748b'
    },
    seatPriceTag: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: '700',
        marginTop: 2
    },
    seatPriceBooked: {
        color: '#b91c1c',
        fontWeight: '800'
    },
    checkoutBar: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 10
    },
    checkoutInfo: {
        flex: 1
    },
    checkoutSelectedSeats: {
        fontSize: 12,
        color: colors.textMuted
    },
    checkoutTotal: {
        fontSize: 15,
        color: colors.text,
        marginTop: 2
    },
    walletBalanceText: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2
    },
    checkoutBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center'
    },
    checkoutBtnDisabled: {
        backgroundColor: '#cbd5e1'
    },
    checkoutBtnText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold'
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 10,
        color: colors.textMuted
    }
});

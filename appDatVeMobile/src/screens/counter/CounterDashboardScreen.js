import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl
} from 'react-native';
import { tripApi } from '../../api/tripApi';
import { counterApi } from '../../api/counterApi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatVND } from '../../utils/format';

export default function CounterDashboardScreen() {
    const { user } = useAuth();
    const { isDarkMode, theme } = useTheme();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal đặt vé tại quầy
    const [modalVisible, setModalVisible] = useState(false);
    const [activeTrip, setActiveTrip] = useState(null);
    const [tripSeats, setTripSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('TienMat');
    const [submitting, setSubmitting] = useState(false);

    const loadTrips = async () => {
        try {
            const res = await tripApi.searchTrips();
            let data = [];
            if (Array.isArray(res)) data = res;
            else if (Array.isArray(res?.data)) data = res.data;
            else if (Array.isArray(res?.data?.trips)) data = res.data.trips;
            else if (Array.isArray(res?.data?.data)) data = res.data.data;
            else if (Array.isArray(res?.trips)) data = res.trips;
            setTrips(data);
        } catch (e) {
            console.warn('Lỗi tải chuyến xe:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTrips();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadTrips();
    };

    const handleOpenBookingModal = async (trip) => {
        setActiveTrip(trip);
        setSelectedSeats([]);
        setCustomerName('');
        setCustomerPhone('');
        setModalVisible(true);

        try {
            const res = await tripApi.getTripSeats(trip.MaChuyen);
            let seats = [];
            if (Array.isArray(res)) seats = res;
            else if (Array.isArray(res?.data?.seats)) seats = res.data.seats;
            else if (Array.isArray(res?.data)) seats = res.data;
            else if (Array.isArray(res?.seats)) seats = res.seats;
            setTripSeats(seats);
        } catch (e) {
            Alert.alert('Lỗi tải ghế', e.message);
        }
    };

    const checkIsBooked = (s) => {
        return s.TrangThai === 'DaDat' || s.TrangThaiDat === 'DaDat' || s.TrangThaiGheVatLy === 'Hong';
    };

    const toggleSeat = (seat) => {
        if (checkIsBooked(seat)) {
            Alert.alert('Ghế đã đặt', `Ghế ${seat.SoGhe} đã được bán, không thể chọn.`);
            return;
        }
        const exists = selectedSeats.some(s => s.MaGhe === seat.MaGhe);
        if (exists) {
            setSelectedSeats(selectedSeats.filter(s => s.MaGhe !== seat.MaGhe));
        } else {
            setSelectedSeats([...selectedSeats, seat]);
        }
    };

    const handleCounterSubmit = async () => {
        if (!customerName.trim() || !customerPhone.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên hành khách và số điện thoại');
            return;
        }

        if (selectedSeats.length === 0) {
            Alert.alert('Chưa chọn ghế', 'Vui lòng chọn ít nhất 1 ghế trống');
            return;
        }

        setSubmitting(true);
        try {
            const seatIds = selectedSeats.map(s => Number(s.MaGhe));
            const payload = {
                MaChuyen: Number(activeTrip.MaChuyen),
                DanhSachMaGhe: seatIds,
                DanhSachGhe: seatIds,
                TenKhachHang: customerName.trim(),
                TenHanhKhach: customerName.trim(),
                SoDienThoaiKhach: customerPhone.trim(),
                SoDienThoai: customerPhone.trim(),
                PhuongThucThanhToan: paymentMethod
            };

            const res = await counterApi.createBooking(payload);
            const bookingId = res.data?.MaDatVe;

            // In vé ngay tại quầy
            if (res.data?.DanhSachVe && res.data.DanhSachVe.length > 0) {
                for (const ticket of res.data.DanhSachVe) {
                    await counterApi.printTicket(ticket.MaVe).catch(() => { });
                }
            }

            Alert.alert(
                'Đặt & In vé thành công! 🎟️',
                `Mã đặt vé: #${bookingId}\nKhách: ${customerName}\nSố ghế: ${selectedSeats.map(s => s.SoGhe).join(', ')}\nPhương thức: ${paymentMethod === 'TienMat' ? 'Tiền mặt' : 'Chuyển khoản'}\nVé đã được chuyển sang trạng thái "Đã In" sẵn sàng trao cho khách.`
            );

            setModalVisible(false);
            loadTrips();
        } catch (e) {
            Alert.alert('Lỗi đặt vé tại quầy', e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const totalPrice = selectedSeats.length * Number(activeTrip?.GiaVe || 0);

    const renderTrip = ({ item }) => {
        const seatsLeft = item.SoGheConTrong !== undefined ? item.SoGheConTrong : item.SoLuongGhe;
        return (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.cardHeader, { borderBottomColor: theme.divider }]}>
                    <Text style={[styles.routeTitle, { color: theme.text }]}>{item.TenTuyen}</Text>
                    <Text style={styles.priceTag}>{formatVND(item.GiaVe)} đ</Text>
                </View>

                <Text style={[styles.timeInfo, { color: theme.textMuted }]}>
                    Khởi hành: <Text style={{ fontWeight: '700', color: theme.text }}>{item.ThoiGianDi}</Text>
                </Text>

                {/* Thông tin xe */}
                <View style={[styles.busInfoBox, { backgroundColor: isDarkMode ? '#0b1120' : '#f8fafc' }]}>
                    <Text style={[styles.busMeta, { color: theme.textMuted }]}>
                        Xe: <Text style={{ fontWeight: '700', color: theme.text }}>{item.TenXe || 'Limousine'}</Text> (BS: <Text style={{ fontWeight: '700', color: theme.text }}>{item.BienSo}</Text>) • {item.LoaiXe || '2 Tầng'}
                    </Text>

                    {/* XUỐNG HÀNG: Hiển thị còn bao nhiêu chỗ trống */}
                    <View style={styles.seatVacancyRow}>
                        <Text style={[styles.seatVacancyLabel, { color: theme.textMuted }]}>💺 Tình trạng chỗ:</Text>
                        <View style={[
                            styles.seatBadge,
                            seatsLeft <= 0 ? styles.seatBadgeEmpty : styles.seatBadgeAvailable
                        ]}>
                            <Text style={[
                                styles.seatBadgeText,
                                seatsLeft <= 0 ? styles.seatBadgeTextEmpty : styles.seatBadgeTextAvailable
                            ]}>
                                {seatsLeft > 0 ? `Còn ${seatsLeft} chỗ trống` : 'Hết chỗ trống'}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.bookAtCounterBtn,
                        seatsLeft <= 0 && { backgroundColor: '#94a3b8' }
                    ]}
                    onPress={() => handleOpenBookingModal(item)}
                    disabled={seatsLeft <= 0}
                >
                    <Text style={styles.bookAtCounterText}>
                        {seatsLeft > 0 ? ' XUẤT VÉ TẠI QUẦY CHO KHÁCH' : 'ĐÃ HẾT CHỖ TRỐNG'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    // Chia ghế 2 hàng
    const half = Math.ceil(tripSeats.length / 2);
    const leftSeats = tripSeats.slice(0, half);
    const rightSeats = tripSeats.slice(half);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>🏢 Quầy Bán Vé Xe Trực Tiếp</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                    Nhân viên trực: <Text style={{ fontWeight: '700', color: theme.text }}>{user?.HoTen || user?.TenDangNhap}</Text>
                </Text>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={trips}
                    keyExtractor={(item, index) => {
                        const id = item.MaChuyen ?? item.id;
                        return id != null ? String(id) : `counter-trip-${index}`;
                    }}
                    renderItem={renderTrip}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                />
            )}

            {/* Modal Bán Vé Tại Quầy */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Xuất Vé Tại Quầy</Text>
                            <Text style={[styles.modalTripRoute, { color: theme.primary }]}>{activeTrip?.TenTuyen}</Text>
                            <Text style={[styles.modalTripTime, { color: theme.textMuted }]}>Khởi hành: {activeTrip?.ThoiGianDi}</Text>

                            {/* Thông tin xe */}
                            <Text style={styles.modalTripBus}>
                                🚌 Xe: <Text style={{ fontWeight: '700', color: colors.text }}>{activeTrip?.TenXe || 'Limousine'}</Text> ({activeTrip?.BienSo}) • {activeTrip?.LoaiXe || '2 Tầng'}
                            </Text>

                            {/* XUỐNG HÀNG: Hiển thị còn bao nhiêu chỗ trống */}
                            <Text style={styles.modalTripVacancy}>
                                💺 Tình trạng chỗ: <Text style={{ color: colors.success, fontWeight: '700' }}>Còn {tripSeats.filter(s => !checkIsBooked(s)).length} chỗ trống</Text> / {tripSeats.length} ghế
                            </Text>

                            <View style={[styles.sectionDivider, { backgroundColor: theme.divider }]} />

                            <Text style={[styles.label, { color: theme.text }]}>1. Thông tin hành khách vãng lai</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                                placeholder="Tên hành khách *"
                                placeholderTextColor={theme.placeholder}
                                value={customerName}
                                onChangeText={setCustomerName}
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                                placeholder="Số điện thoại liên hệ *"
                                placeholderTextColor={theme.placeholder}
                                keyboardType="phone-pad"
                                value={customerPhone}
                                onChangeText={setCustomerPhone}
                            />

                            <Text style={[styles.label, { marginTop: 10, color: theme.text }]}>2. Phương thức thu tiền</Text>
                            <View style={styles.methodRow}>
                                <TouchableOpacity
                                    style={[styles.methodBtn, { backgroundColor: theme.card, borderColor: theme.border }, paymentMethod === 'TienMat' && styles.methodBtnActive]}
                                    onPress={() => setPaymentMethod('TienMat')}
                                >
                                    <Text style={[styles.methodText, { color: theme.text }, paymentMethod === 'TienMat' && styles.methodTextActive]}>
                                        Tiền Mặt
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.methodBtn, { backgroundColor: theme.card, borderColor: theme.border }, paymentMethod === 'ChuyenKhoan' && styles.methodBtnActive]}
                                    onPress={() => setPaymentMethod('ChuyenKhoan')}
                                >
                                    <Text style={[styles.methodText, { color: theme.text }, paymentMethod === 'ChuyenKhoan' && styles.methodTextActive]}>
                                        Chuyển Khoản
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { marginTop: 14, color: theme.text }]}>
                                3. Sơ đồ 2 hàng ghế (Chọn ghế trống)
                            </Text>

                            {/* Chú thích màu sắc */}
                            <View style={styles.cLegendRow}>
                                <View style={styles.cLegendItem}>
                                    <View style={[styles.cLegendBox, { backgroundColor: colors.background, borderColor: '#93c5fd' }]} />
                                    <Text style={styles.cLegendText}>Trống</Text>
                                </View>
                                <View style={styles.cLegendItem}>
                                    <View style={[styles.cLegendBox, { backgroundColor: colors.primary, borderColor: colors.primaryDark }]} />
                                    <Text style={styles.cLegendText}>Đang chọn</Text>
                                </View>
                                <View style={styles.cLegendItem}>
                                    <View style={[styles.cLegendBox, { backgroundColor: '#e2e8f0', borderColor: '#94a3b8' }]} />
                                    <Text style={[styles.cLegendText, { color: '#64748b', fontWeight: '700' }]}>🔒 Đã bán</Text>
                                </View>
                            </View>

                            <View style={styles.counterSeatGrid}>
                                <View style={styles.counterSeatCol}>
                                    <Text style={styles.counterColTitle}>HÀNG TRÁI</Text>
                                    {leftSeats.map((s) => {
                                        const booked = checkIsBooked(s);
                                        const selected = selectedSeats.some(x => x.MaGhe === s.MaGhe);
                                        return (
                                            <TouchableOpacity
                                                key={`c-s-${s.MaGhe}`}
                                                style={[
                                                    styles.cSeatBox,
                                                    booked && styles.cSeatBooked,
                                                    selected && styles.cSeatSelected
                                                ]}
                                                onPress={() => toggleSeat(s)}
                                                disabled={booked}
                                                activeOpacity={booked ? 1 : 0.7}
                                            >
                                                <Text style={[
                                                    styles.cSeatText,
                                                    selected && { color: colors.white },
                                                    booked && { color: '#64748b' }
                                                ]}>
                                                    {booked ? `🔒 ${s.SoGhe}` : s.SoGhe}
                                                </Text>
                                                {booked && (
                                                    <Text style={{ fontSize: 9, color: '#b91c1c', fontWeight: '800', marginTop: 1 }}>
                                                        ĐÃ BÁN
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <View style={styles.counterSeatCol}>
                                    <Text style={styles.counterColTitle}>HÀNG PHẢI </Text>
                                    {rightSeats.map((s) => {
                                        const booked = checkIsBooked(s);
                                        const selected = selectedSeats.some(x => x.MaGhe === s.MaGhe);
                                        return (
                                            <TouchableOpacity
                                                key={`c-s-${s.MaGhe}`}
                                                style={[
                                                    styles.cSeatBox,
                                                    booked && styles.cSeatBooked,
                                                    selected && styles.cSeatSelected
                                                ]}
                                                onPress={() => toggleSeat(s)}
                                                disabled={booked}
                                                activeOpacity={booked ? 1 : 0.7}
                                            >
                                                <Text style={[
                                                    styles.cSeatText,
                                                    selected && { color: colors.white },
                                                    booked && { color: '#64748b' }
                                                ]}>
                                                    {booked ? `🔒 ${s.SoGhe}` : s.SoGhe}
                                                </Text>
                                                {booked && (
                                                    <Text style={{ fontSize: 9, color: '#b91c1c', fontWeight: '800', marginTop: 1 }}>
                                                        ĐÃ BÁN
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryText}>
                                    Ghế chọn: <Text style={{ fontWeight: '700' }}>{selectedSeats.map(s => s.SoGhe).join(', ') || 'Chưa chọn'}</Text>
                                </Text>
                                <Text style={styles.summaryTotal}>
                                    Tổng thu: <Text style={{ color: colors.primary, fontWeight: '800' }}>{formatVND(totalPrice)} đ</Text>
                                </Text>
                            </View>

                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelText}>Đóng</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.saveBtn, (submitting || selectedSeats.length === 0) && styles.btnDisabled]}
                                    onPress={handleCounterSubmit}
                                    disabled={submitting || selectedSeats.length === 0}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color={colors.white} />
                                    ) : (
                                        <Text style={styles.saveText}>IN VÉ QUẦY</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
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
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text
    },
    headerSubtitle: {
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
    routeTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
        flex: 1
    },
    priceTag: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary
    },
    timeInfo: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: 8
    },
    busInfoBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 8,
        marginTop: 6,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    busMeta: {
        fontSize: 12.5,
        color: '#475569',
        marginBottom: 6
    },
    seatVacancyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0'
    },
    seatVacancyLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b'
    },
    seatBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6
    },
    seatBadgeAvailable: {
        backgroundColor: '#dcfce7',
        borderWidth: 1,
        borderColor: '#86efac'
    },
    seatBadgeEmpty: {
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fca5a5'
    },
    seatBadgeText: {
        fontSize: 12,
        fontWeight: '700'
    },
    seatBadgeTextAvailable: {
        color: '#15803d'
    },
    seatBadgeTextEmpty: {
        color: '#b91c1c'
    },
    modalTripBus: {
        fontSize: 12,
        color: '#475569',
        marginTop: 2
    },
    modalTripVacancy: {
        fontSize: 12,
        color: '#475569',
        marginTop: 4
    },
    cLegendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        marginVertical: 8
    },
    cLegendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    cLegendBox: {
        width: 14,
        height: 14,
        borderRadius: 3,
        borderWidth: 1
    },
    cLegendText: {
        fontSize: 11,
        color: colors.textMuted
    },
    bookAtCounterBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center'
    },
    bookAtCounterText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold'
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
        maxWidth: 440,
        maxHeight: '90%'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text
    },
    modalTripRoute: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginTop: 2
    },
    modalTripTime: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2
    },
    sectionDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        marginBottom: 8
    },
    methodRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8
    },
    methodBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center'
    },
    methodBtnActive: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primary
    },
    methodText: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '600'
    },
    methodTextActive: {
        color: colors.primary,
        fontWeight: '700'
    },
    counterSeatGrid: {
        flexDirection: 'row',
        gap: 16,
        marginVertical: 10
    },
    counterSeatCol: {
        flex: 1,
        gap: 6
    },
    counterColTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: 4
    },
    cSeatBox: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: '#93c5fd',
        borderRadius: 6,
        paddingVertical: 8,
        alignItems: 'center'
    },
    cSeatSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primaryDark
    },
    cSeatBooked: {
        backgroundColor: '#e2e8f0',
        borderColor: '#94a3b8',
        borderStyle: 'dashed'
    },
    cSeatText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.text
    },
    summaryBox: {
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 8,
        marginVertical: 12
    },
    summaryText: {
        fontSize: 12,
        color: colors.textMuted
    },
    summaryTotal: {
        fontSize: 14,
        color: colors.text,
        marginTop: 4
    },
    modalBtnRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: colors.primary
    },
    saveText: {
        color: colors.white,
        fontWeight: 'bold'
    },
    btnDisabled: {
        opacity: 0.5
    }
});

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { tripApi } from '../../api/tripApi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatVND } from '../../utils/format';

export default function SearchTripsScreen({ navigation }) {
    const { user, openAuthModal, refreshProfile } = useAuth();
    const { isDarkMode, theme } = useTheme();
    const [locations, setLocations] = useState([]);
    const [selectedDep, setSelectedDep] = useState(null);
    const [selectedDest, setSelectedDest] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null); // 'sang', 'chieu', 'toi'
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Tạo danh sách 7 ngày tới
    const upcomingDays = React.useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const label = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `${dd}/${mm}`;
            const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            days.push({ dateStr, label, dayOfWeek: dayNames[d.getDay()] });
        }
        return days;
    }, []);

    // Tải danh sách địa điểm
    const loadLocations = async () => {
        try {
            const res = await tripApi.getLocations();
            if (res && res.data) {
                setLocations(res.data);
            }
        } catch (e) {
            console.warn('Lỗi lấy địa điểm:', e.message);
        }
    };

    // Tìm kiếm chuyến xe
    const fetchTrips = async (customDep, customDest, customDate, customSlot) => {
        setLoading(true);

        const dep = customDep !== undefined ? customDep : selectedDep;
        const dest = customDest !== undefined ? customDest : selectedDest;
        const date = customDate !== undefined ? customDate : selectedDate;
        const slot = customSlot !== undefined ? customSlot : selectedTimeSlot;

        try {
            const res = await tripApi.searchTrips({
                diem_di: dep ? (dep.MaDiaDiem ?? dep.id) : null,
                diem_den: dest ? (dest.MaDiaDiem ?? dest.id) : null,
                ngay_di: date || null,
                khung_gio: slot || null
            });

            console.log('Kết quả API tìm chuyến:', JSON.stringify(res));

            // Hỗ trợ các dạng phản hồi API phổ biến
            let data = [];

            if (Array.isArray(res)) {
                data = res;
            } else if (Array.isArray(res?.data)) {
                data = res.data;
            } else if (Array.isArray(res?.data?.trips)) {
                data = res.data.trips;
            } else if (Array.isArray(res?.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res?.trips)) {
                data = res.trips;
            }

            // Lọc bỏ hoàn toàn các chuyến xe đã khởi hành so với thời gian thực tế
            const now = Date.now();
            const validTrips = (data || []).filter((item) => {
                if (!item?.ThoiGianDi) return false;
                try {
                    const depTime = new Date(item.ThoiGianDi.replace(' ', 'T')).getTime();
                    return !isNaN(depTime) && depTime > now;
                } catch {
                    return false;
                }
            });

            setTrips(validTrips);
        } catch (e) {
            console.error('Lỗi tìm chuyến xe:', e);
            Alert.alert('Lỗi tìm chuyến', e.message || 'Không thể tải danh sách chuyến xe.');
            setTrips([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleResetFilters = () => {
        setSelectedDep(null);
        setSelectedDest(null);
        setSelectedDate(null);
        setSelectedTimeSlot(null);
        fetchTrips(null, null, null, null);
    };

    useEffect(() => {
        loadLocations();
        fetchTrips();
        if (refreshProfile) {
            refreshProfile();
        }
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        if (refreshProfile) {
            refreshProfile();
        }
        fetchTrips();
    };

    const handleSelectTrip = (trip) => {
        if (!user) {
            Alert.alert(
                'Yêu cầu đăng nhập',
                'Bạn cần đăng nhập để chọn ghế và đặt vé.',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Đăng nhập ngay', onPress: openAuthModal }
                ]
            );
            return;
        }
        navigation.navigate('SeatSelection', { trip });
    };

    const userBalance = Number(user?.SoDu ?? user?.SoDuVi ?? user?.balance ?? 0);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header chào mừng */}
            <View style={[styles.topHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.welcomeText, { color: theme.textMuted }]}>
                        Xin chào, <Text style={[styles.userName, { color: theme.text }]}>{user ? (user.HoTen || user.TenDangNhap) : 'Quý khách'}</Text> 👋
                    </Text>
                    <Text style={[styles.subWelcome, { color: theme.textMuted }]}>Đặt vé xe trực tuyến nhanh chóng & an toàn</Text>
                </View>
                {!user ? (
                    <TouchableOpacity style={styles.loginBadge} onPress={openAuthModal}>
                        <Text style={styles.loginBadgeText}>Đăng nhập</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.walletHeaderBadge}
                        onPress={() => navigation.navigate('WalletTab')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.walletHeaderLabel}>Ví tiền</Text>
                        <Text style={styles.walletHeaderAmount}>{formatVND(userBalance)} đ</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Bộ lọc điểm đi / điểm đến */}
                <View style={[styles.filterCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.filterTitle, { color: theme.text }]}> Tìm Chuyến Xe</Text>

                    <Text style={[styles.fieldLabel, { color: theme.text }]}>Điểm khởi hành:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                        <TouchableOpacity
                            style={[styles.pill, !selectedDep && styles.pillActive]}
                            onPress={() => setSelectedDep(null)}
                        >
                            <Text style={[styles.pillText, !selectedDep && styles.pillTextActive]}>Tất cả</Text>
                        </TouchableOpacity>
                        {locations.map((loc, idx) => {
                            const id = loc.MaDiaDiem ?? loc.id ?? idx;
                            const active = selectedDep && (selectedDep.MaDiaDiem ?? selectedDep.id) === id;
                            return (
                                <TouchableOpacity
                                    key={`dep-${id}`}
                                    style={[styles.pill, active && styles.pillActive]}
                                    onPress={() => setSelectedDep(active ? null : loc)}
                                >
                                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                        {loc.TenDiaDiem}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Điểm đến:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                        <TouchableOpacity
                            style={[styles.pill, !selectedDest && styles.pillActive]}
                            onPress={() => setSelectedDest(null)}
                        >
                            <Text style={[styles.pillText, !selectedDest && styles.pillTextActive]}>Tất cả</Text>
                        </TouchableOpacity>
                        {locations.map((loc, idx) => {
                            const id = loc.MaDiaDiem ?? loc.id ?? idx;
                            const active = selectedDest && (selectedDest.MaDiaDiem ?? selectedDest.id) === id;
                            return (
                                <TouchableOpacity
                                    key={`dest-${id}`}
                                    style={[styles.pill, active && styles.pillActive]}
                                    onPress={() => setSelectedDest(active ? null : loc)}
                                >
                                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                        {loc.TenDiaDiem}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* BƯỚC 3: CHỌN NGÀY KHỞI HÀNH */}
                    <Text style={[styles.fieldLabel, { marginTop: 12 }]}>📅 Ngày xuất phát:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                        <TouchableOpacity
                            style={[styles.pill, !selectedDate && styles.pillActive]}
                            onPress={() => setSelectedDate(null)}
                        >
                            <Text style={[styles.pillText, !selectedDate && styles.pillTextActive]}>Tất cả ngày</Text>
                        </TouchableOpacity>
                        {upcomingDays.map((item) => {
                            const active = selectedDate === item.dateStr;
                            return (
                                <TouchableOpacity
                                    key={`date-${item.dateStr}`}
                                    style={[styles.pill, active && styles.pillActive]}
                                    onPress={() => setSelectedDate(active ? null : item.dateStr)}
                                >
                                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                        {item.dayOfWeek} - {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* BƯỚC 4: KHUNG GIỜ KHỞI HÀNH */}
                    <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Khung giờ khởi hành:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                        {[
                            { id: null, label: 'Tất cả giờ' },
                            { id: 'sang', label: 'Sáng (0h - 12h)' },
                            { id: 'chieu', label: 'Chiều (12h - 18h)' },
                            { id: 'toi', label: 'Tối (18h - 24h)' }
                        ].map((slot) => {
                            const active = selectedTimeSlot === slot.id;
                            return (
                                <TouchableOpacity
                                    key={`slot-${slot.id || 'all'}`}
                                    style={[styles.pill, active && styles.pillActive]}
                                    onPress={() => setSelectedTimeSlot(active ? null : slot.id)}
                                >
                                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                        {slot.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                        <TouchableOpacity style={[styles.searchBtn, { flex: 1, marginTop: 0 }]} onPress={() => fetchTrips()}>
                            <Text style={styles.searchBtnText}>LỌC CHUYẾN XE</Text>
                        </TouchableOpacity>

                        {(selectedDep || selectedDest || selectedDate || selectedTimeSlot) && (
                            <TouchableOpacity
                                style={[styles.searchBtn, { backgroundColor: '#f1f5f9', paddingHorizontal: 16, marginTop: 0 }]}
                                onPress={handleResetFilters}
                            >
                                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>✕ Đặt lại</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Danh sách chuyến xe */}

                {/* Danh sách chuyến xe */}
                <View style={styles.listSection}>
                    <Text style={styles.listTitle}>
                        Danh Sách Chuyến Xe ({Array.isArray(trips) ? trips.length : 0})
                    </Text>

                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                            style={{ marginTop: 30 }}
                        />
                    ) : !Array.isArray(trips) || trips.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>
                                Không tìm thấy chuyến xe nào phù hợp.
                            </Text>
                        </View>
                    ) : (
                        trips.map((item, index) => {
                            const priceFormatted = formatVND(item.GiaVe);

                            const seatsAvailable =
                                item.SoGheConTrong !== undefined
                                    ? item.SoGheConTrong
                                    : item.SoLuongGhe;

                            const tripId =
                                item.MaChuyen ??
                                item.MaChuyenXe ??
                                item.maChuyen ??
                                item.maChuyenXe;

                            return (
                                <View
                                    key={tripId != null ? `trip-${tripId}` : `trip-index-${index}`}
                                    style={[styles.tripCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                                >
                                    <View style={[styles.tripHeader, { borderBottomColor: theme.divider }]}>
                                        <Text style={[styles.tripRoute, { color: theme.text }]}>
                                            {item.TenTuyen}
                                        </Text>
                                        <Text style={styles.tripPrice}>
                                            {priceFormatted} đ
                                        </Text>
                                    </View>

                                    <View style={styles.tripInfoRow}>
                                        <View style={styles.timeBox}>
                                            <Text style={[styles.timeLabel, { color: theme.textMuted }]}>Khởi hành</Text>
                                            <Text style={[styles.timeValue, { color: theme.text }]}>
                                                {String(item.ThoiGianDi ?? '')}
                                            </Text>
                                            <Text style={[styles.locName, { color: theme.textMuted }]}>
                                                {String(item.TenDiemDi ?? '')}
                                            </Text>
                                        </View>

                                        <Text style={[styles.arrowIcon, { color: theme.textMuted }]}>➔</Text>

                                        <View style={styles.timeBox}>
                                            <Text style={[styles.timeLabel, { color: theme.textMuted }]}>Dự kiến đến</Text>
                                            <Text style={[styles.timeValue, { color: theme.text }]}>
                                                {String(item.ThoiGianDen ?? '')}
                                            </Text>
                                            <Text style={[styles.locName, { color: theme.textMuted }]}>
                                                {String(item.TenDiemDen ?? '')}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.busInfoBox, { backgroundColor: isDarkMode ? '#0b1120' : '#f8fafc' }]}>
                                        <View style={styles.busDetailRow}>
                                            <Text style={[styles.busDetailText, { color: theme.textMuted }]}>
                                                {`🚌 Xe: `}<Text style={[styles.busBold, { color: theme.text }]}>{String(item.TenXe || 'Xe Khách Tuyến')}</Text>{` (BS: `}<Text style={[styles.busBold, { color: theme.text }]}>{String(item.BienSo || '')}</Text>{`) • ${String(item.LoaiXe || '2 Tầng')}`}
                                            </Text>
                                        </View>

                                        {/* XUỐNG HÀNG: Hiển thị số chỗ trống */}
                                        <View style={styles.seatVacancyRow}>
                                            <Text style={styles.seatVacancyLabel}>💺 Tình trạng chỗ:</Text>
                                            <View style={[
                                                styles.seatBadge,
                                                seatsAvailable <= 0 ? styles.seatBadgeEmpty : styles.seatBadgeAvailable
                                            ]}>
                                                <Text style={[
                                                    styles.seatBadgeText,
                                                    seatsAvailable <= 0 ? styles.seatBadgeTextEmpty : styles.seatBadgeTextAvailable
                                                ]}>
                                                    {String(seatsAvailable > 0 ? `Còn ${seatsAvailable} chỗ trống` : 'Hết chỗ trống')}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.bookBtn,
                                            seatsAvailable <= 0 && { backgroundColor: '#94a3b8' }
                                        ]}
                                        onPress={() => handleSelectTrip(item)}
                                        disabled={seatsAvailable <= 0}
                                    >
                                        <Text style={styles.bookBtnText}>
                                            {seatsAvailable > 0 ? 'CHỌN GHẾ & ĐẶT VÉ' : 'ĐÃ HẾT CHỖ'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    topHeader: {
        backgroundColor: colors.white,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    welcomeText: {
        fontSize: 16,
        color: colors.text
    },
    userName: {
        fontWeight: 'bold',
        color: colors.primary
    },
    subWelcome: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2
    },
    loginBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    loginBadgeText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700'
    },
    roleBadge: {
        backgroundColor: colors.primarySoft,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bfdbfe'
    },
    roleBadgeText: {
        color: colors.primaryDark,
        fontSize: 12,
        fontWeight: '700'
    },
    walletHeaderBadge: {
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#a7f3d0',
        alignItems: 'flex-end'
    },
    walletHeaderLabel: {
        fontSize: 10,
        color: '#059669',
        fontWeight: '600'
    },
    walletHeaderAmount: {
        fontSize: 13,
        fontWeight: '800',
        color: '#047857'
    },
    filterCard: {
        backgroundColor: colors.white,
        margin: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 10
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
        marginBottom: 6
    },
    pillRow: {
        flexDirection: 'row',
        marginBottom: 4
    },
    pill: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8
    },
    pillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    pillText: {
        fontSize: 12,
        color: colors.text,
        fontWeight: '500'
    },
    pillTextActive: {
        color: colors.white,
        fontWeight: '700'
    },
    searchBtn: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 14
    },
    searchBtnText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold'
    },
    listSection: {
        paddingHorizontal: 16,
        paddingBottom: 30
    },
    listTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12
    },
    tripCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 5,
        elevation: 2
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 10,
        marginBottom: 10
    },
    tripRoute: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
        flex: 1
    },
    tripPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary
    },
    tripInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 6
    },
    timeBox: {
        flex: 1
    },
    timeLabel: {
        fontSize: 11,
        color: colors.textMuted
    },
    timeValue: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        marginTop: 2
    },
    locName: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2
    },
    arrowIcon: {
        fontSize: 18,
        color: colors.primary,
        marginHorizontal: 10
    },
    busInfoBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    busDetailRow: {
        marginBottom: 6
    },
    busDetailText: {
        fontSize: 12.5,
        color: '#475569'
    },
    busBold: {
        fontWeight: '700',
        color: colors.text
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
    bookBtn: {
        backgroundColor: colors.secondary,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center'
    },
    bookBtnText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '700'
    },
    emptyBox: {
        padding: 30,
        alignItems: 'center'
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 14
    }
});

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
    RefreshControl,
    ScrollView
} from 'react-native';
import { adminApi } from '../../api/adminApi';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatVND } from '../../utils/format';

export default function AdminTripsScreen({ route, navigation }) {
    const { isDarkMode, theme } = useTheme();
    const defaultRouteId = route?.params?.defaultRouteId || null;

    const [trips, setTrips] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal tạo chuyến xe
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRouteId, setSelectedRouteId] = useState(defaultRouteId);
    const [selectedBusId, setSelectedBusId] = useState(null);
    const [depTime, setDepTime] = useState('');
    const [arrTime, setArrTime] = useState('');
    const [price, setPrice] = useState('250000');
    const [submitting, setSubmitting] = useState(false);

    // Modal tạo tuyến xe mới
    const [routeModalVisible, setRouteModalVisible] = useState(false);
    const [routeDeparture, setRouteDeparture] = useState(null);
    const [routeDestination, setRouteDestination] = useState(null);
    const [newRouteName, setNewRouteName] = useState('');
    const [routeDistance, setRouteDistance] = useState('');
    const [routeEstMinutes, setRouteEstMinutes] = useState('');
    const [submittingRoute, setSubmittingRoute] = useState(false);

    const loadData = async () => {
        try {
            const [tripsRes, routesRes, busesRes, locsRes] = await Promise.all([
                adminApi.getTrips().catch(() => ({ data: [] })),
                adminApi.getRoutes().catch(() => ({ data: [] })),
                adminApi.getBuses().catch(() => ({ data: [] })),
                adminApi.getLocations().catch(() => ({ data: [] }))
            ]);
            if (tripsRes?.data) setTrips(tripsRes.data);
            if (routesRes?.data) setRoutes(routesRes.data);
            if (busesRes?.data) setBuses(busesRes.data);
            if (locsRes?.data) setLocations(locsRes.data);

            if (defaultRouteId) {
                setSelectedRouteId(defaultRouteId);
                setModalVisible(true);
            }
        } catch (e) {
            console.warn('Lỗi tải dữ liệu chuyến xe:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [defaultRouteId]);

    // Tự động gợi ý tên tuyến khi chọn điểm đi và điểm đến
    useEffect(() => {
        if (routeDeparture && routeDestination) {
            setNewRouteName(`${routeDeparture.TenDiaDiem} - ${routeDestination.TenDiaDiem}`);
        }
    }, [routeDeparture, routeDestination]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleCreateRoute = async () => {
        if (!routeDeparture || !routeDestination) {
            Alert.alert('Chưa đủ thông tin', 'Vui lòng chọn Điểm Khởi Hành và Điểm Đến');
            return;
        }

        if (routeDeparture.MaDiaDiem === routeDestination.MaDiaDiem) {
            Alert.alert('Lỗi', 'Điểm khởi hành và điểm đến không được trùng nhau');
            return;
        }

        setSubmittingRoute(true);
        try {
            const payload = {
                TenTuyen: (newRouteName || `${routeDeparture.TenDiaDiem} - ${routeDestination.TenDiaDiem}`).trim(),
                MaDiemDi: routeDeparture.MaDiaDiem,
                MaDiemDen: routeDestination.MaDiaDiem,
                KhoangCachKm: routeDistance ? parseFloat(routeDistance) : null,
                ThoiGianDuKienPhut: routeEstMinutes ? parseInt(routeEstMinutes, 10) : null
            };

            const res = await adminApi.createRoute(payload);
            const createdRoute = res?.data;

            Alert.alert('Thành công 🎉', `Đã thêm tuyến xe "${payload.TenTuyen}" thành công!`);
            setRouteModalVisible(false);

            // Reset form tuyến
            setRouteDeparture(null);
            setRouteDestination(null);
            setNewRouteName('');
            setRouteDistance('');
            setRouteEstMinutes('');

            // Tải lại danh sách tuyến
            const routesRes = await adminApi.getRoutes().catch(() => ({ data: [] }));
            if (routesRes?.data) {
                setRoutes(routesRes.data);
            }
            if (createdRoute?.MaTuyenXe) {
                setSelectedRouteId(createdRoute.MaTuyenXe);
            }
        } catch (e) {
            Alert.alert('Tạo tuyến xe thất bại', e.message);
        } finally {
            setSubmittingRoute(false);
        }
    };

    // Kiểm tra xe có bị trùng lịch trong khung giờ dự kiến hay không
    const getBusConflict = (busId, depStr, arrStr) => {
        if (!busId || !depStr || !arrStr) return null;
        const newDep = new Date(depStr.trim().replace(' ', 'T')).getTime();
        const newArr = new Date(arrStr.trim().replace(' ', 'T')).getTime();
        if (isNaN(newDep) || isNaN(newArr) || newArr <= newDep) return null;

        for (const t of trips) {
            const tripBusId = t.MaXe ?? t.maXe;
            if (tripBusId === busId && t.TrangThai !== 'DaHuy' && t.TrangThai !== 'HuyChuyen') {
                const tripDep = new Date((t.ThoiGianDi || '').replace(' ', 'T')).getTime();
                const tripArr = new Date((t.ThoiGianDen || '').replace(' ', 'T')).getTime();
                if (!isNaN(tripDep) && !isNaN(tripArr)) {
                    if (newDep < tripArr && newArr > tripDep) {
                        return t;
                    }
                }
            }
        }
        return null;
    };

    const handleCreateTrip = async () => {
        if (!selectedRouteId || !selectedBusId || !depTime.trim() || !arrTime.trim() || !price) {
            Alert.alert('Chưa đủ thông tin', 'Vui lòng chọn tuyến, nhập ngày giờ và chọn xe trống');
            return;
        }

        const depTimestamp = new Date(depTime.trim().replace(' ', 'T')).getTime();
        const arrTimestamp = new Date(arrTime.trim().replace(' ', 'T')).getTime();

        if (isNaN(depTimestamp) || isNaN(arrTimestamp)) {
            Alert.alert('Lỗi định dạng', 'Vui lòng nhập ngày giờ theo định dạng YYYY-MM-DD HH:MM:SS');
            return;
        }

        if (arrTimestamp <= depTimestamp) {
            Alert.alert('Lỗi thời gian', 'Thời gian đến dự kiến phải sau thời gian xuất phát');
            return;
        }

        if (depTimestamp <= Date.now()) {
            Alert.alert('Lỗi thời gian', 'Thời gian xuất phát phải lớn hơn thời gian thực tế hiện tại');
            return;
        }

        const conflict = getBusConflict(selectedBusId, depTime, arrTime);
        if (conflict) {
            Alert.alert(
                'Xe bị trùng lịch!',
                `Xe này đã được xếp cho chuyến #${conflict.MaChuyen} ("${conflict.TenTuyen}") từ ${conflict.ThoiGianDi} đến ${conflict.ThoiGianDen}.\n\nVui lòng chọn xe khác hoặc thay đổi khung giờ!`
            );
            return;
        }

        setSubmitting(true);
        try {
            await adminApi.createTrip({
                MaTuyenXe: selectedRouteId,
                MaXe: selectedBusId,
                ThoiGianDi: depTime.trim(),
                ThoiGianDen: arrTime.trim(),
                GiaVe: parseFloat(price)
            });

            Alert.alert('Thành công', 'Đã tạo chuyến xe mới thành công!');
            setModalVisible(false);
            setDepTime('');
            setArrTime('');
            setSelectedBusId(null);
            loadData();
        } catch (e) {
            Alert.alert('Tạo chuyến xe thất bại', e.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Danh sách chuyến xe chưa khởi hành so với thời gian thực tế
    const activeTrips = trips.filter((item) => {
        if (!item?.ThoiGianDi) return false;
        try {
            const tripDep = new Date(item.ThoiGianDi.replace(' ', 'T')).getTime();
            return !isNaN(tripDep) && tripDep > Date.now();
        } catch {
            return false;
        }
    });

    const renderTrip = ({ item }) => {
        const tripCode = String(item.MaChuyen ?? item.MaChuyenXe ?? '');
        const priceStr = `${formatVND(item.GiaVe)} đ`;
        const routeNameStr = String(item.TenTuyen ?? 'Chuyến xe');
        const depTimeStr = String(item.ThoiGianDi ?? '');
        const arrTimeStr = String(item.ThoiGianDen ?? '');
        const busNameStr = String(item.TenXe ?? 'Xe khách');
        const plateStr = String(item.BienSo ?? '');
        const emptySeats = String(item.SoGheConTrong ?? item.SoLuongGhe ?? 0);
        const totalSeats = String(item.SoLuongGhe ?? 0);

        return (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.cardHeader, { borderBottomColor: theme.divider }]}>
                    <Text style={[styles.tripId, { color: theme.textMuted }]}>
                        {`Mã chuyến: #${tripCode}`}
                    </Text>
                    <Text style={styles.price}>{priceStr}</Text>
                </View>

                <Text style={[styles.routeName, { color: theme.text }]}>{routeNameStr}</Text>

                <View style={styles.timeRow}>
                    <Text style={[styles.timeText, { color: theme.textMuted }]}>
                        {`🕒 Đi: `}<Text style={[styles.bold, { color: theme.text }]}>{depTimeStr}</Text>
                    </Text>
                    <Text style={[styles.timeText, { color: theme.textMuted }]}>
                        {`🏁 Đến: `}<Text style={[styles.bold, { color: theme.text }]}>{arrTimeStr}</Text>
                    </Text>
                </View>

                <View style={styles.footerRow}>
                    <Text style={[styles.busMeta, { color: theme.textMuted }]}>
                        {`Xe: ${busNameStr} (${plateStr})`}
                    </Text>
                    <Text style={[styles.seatMeta, { color: theme.text }]}>
                        {`Ghế trống: `}
                        <Text style={{ color: colors.success, fontWeight: '700' }}>{emptySeats}</Text>
                        {`/${totalSeats}`}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Top Bar hành động */}
            <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={styles.addRouteBtn}
                    onPress={() => setRouteModalVisible(true)}
                >
                    <Text style={styles.addRouteText}>➕ THÊM TUYẾN XE MỚI</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.addTripBtn}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.addTripText}>➕ THÊM CHUYẾN XE</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={activeTrips}
                    keyExtractor={(item, index) => {
                        const id = item.MaChuyen ?? item.MaChuyenXe ?? item.id;
                        return id != null ? String(id) : `trip-${index}`;
                    }}
                    renderItem={renderTrip}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Không có chuyến xe nào chưa khởi hành.</Text>
                        </View>
                    }
                />
            )}

            {/* Modal Thêm Tuyến Xe Mới */}
            <Modal visible={routeModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>🛣️ Thêm Tuyến Xe Mới</Text>

                            {/* Chọn Điểm Đi */}
                            <Text style={[styles.label, { color: theme.text }]}>1. Chọn Điểm Đi (Khởi hành) *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                                {locations.map((loc) => {
                                    const id = loc.MaDiaDiem;
                                    const isSelected = routeDeparture?.MaDiaDiem === id;
                                    return (
                                        <TouchableOpacity
                                            key={`dep-${id}`}
                                            style={[styles.pill, isSelected && styles.pillActive]}
                                            onPress={() => setRouteDeparture(loc)}
                                        >
                                            <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                                                {String(loc.TenDiaDiem ?? '')}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Chọn Điểm Đến */}
                            <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>2. Chọn Điểm Đến (Nơi tới) *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                                {locations.map((loc) => {
                                    const id = loc.MaDiaDiem;
                                    const isSelected = routeDestination?.MaDiaDiem === id;
                                    const isSame = routeDeparture?.MaDiaDiem === id;
                                    return (
                                        <TouchableOpacity
                                            key={`dest-${id}`}
                                            style={[
                                                styles.pill,
                                                isSelected && styles.pillActive,
                                                isSame && styles.pillDisabled
                                            ]}
                                            onPress={() => {
                                                if (isSame) {
                                                    Alert.alert('Chú ý', 'Điểm đến không được trùng với điểm đi');
                                                    return;
                                                }
                                                setRouteDestination(loc);
                                            }}
                                        >
                                            <Text style={[styles.pillText, isSelected && styles.pillTextActive, isSame && { color: theme.textMuted }]}>
                                                {String(loc.TenDiaDiem ?? '')}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Tên tuyến xe */}
                            <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>3. Tên Tuyến Xe *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', color: theme.text, borderColor: theme.border }]}
                                value={newRouteName}
                                onChangeText={setNewRouteName}
                                placeholder="Ví dụ: TP.Hồ Chí Minh - Cần Thơ"
                                placeholderTextColor={theme.textMuted}
                            />

                            {/* Khoảng cách (km) */}
                            <Text style={[styles.label, { color: theme.text }]}>4. Khoảng cách (km)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', color: theme.text, borderColor: theme.border }]}
                                value={routeDistance}
                                onChangeText={setRouteDistance}
                                keyboardType="numeric"
                                placeholder="Ví dụ: 165"
                                placeholderTextColor={theme.textMuted}
                            />

                            {/* Thời gian dự kiến (phút) */}
                            <Text style={[styles.label, { color: theme.text }]}>5. Thời gian dự kiến (phút)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', color: theme.text, borderColor: theme.border }]}
                                value={routeEstMinutes}
                                onChangeText={setRouteEstMinutes}
                                keyboardType="numeric"
                                placeholder="Ví dụ: 210 (3.5 giờ)"
                                placeholderTextColor={theme.textMuted}
                            />

                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity
                                    style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#334155' : colors.border }]}
                                    onPress={() => setRouteModalVisible(false)}
                                >
                                    <Text style={[styles.cancelText, { color: theme.text }]}>Hủy</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.saveBtn, submittingRoute && styles.btnDisabled]}
                                    onPress={handleCreateRoute}
                                    disabled={submittingRoute}
                                >
                                    {submittingRoute ? (
                                        <ActivityIndicator color={colors.white} />
                                    ) : (
                                        <Text style={styles.saveText}>TẠO TUYẾN XE</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal Thêm Chuyến Xe */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>🚌 Thêm Chuyến Xe Mới</Text>

                            {/* Chọn Tuyến */}
                            <Text style={[styles.label, { color: theme.text }]}>1. Chọn Tuyến Xe *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                                {routes.map((r, index) => {
                                    const id = r.MaTuyenXe ?? r.id ?? index;
                                    const active = selectedRouteId === (r.MaTuyenXe ?? r.id);
                                    return (
                                        <TouchableOpacity
                                            key={`route-${id}`}
                                            style={[styles.pill, active && styles.pillActive]}
                                            onPress={() => setSelectedRouteId(r.MaTuyenXe ?? r.id)}
                                        >
                                            <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                                {String(r.TenTuyen ?? '')}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Thời gian đi */}
                            <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>2. Thời gian đi (YYYY-MM-DD HH:MM:SS) *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', color: theme.text, borderColor: theme.border }]}
                                value={depTime}
                                onChangeText={setDepTime}
                                placeholder="2026-10-25 08:00:00"
                                placeholderTextColor={theme.textMuted}
                            />

                            {/* Thời gian đến */}
                            <Text style={[styles.label, { color: theme.text }]}>3. Thời gian đến dự kiến *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', color: theme.text, borderColor: theme.border }]}
                                value={arrTime}
                                onChangeText={setArrTime}
                                placeholder="2026-10-25 14:00:00"
                                placeholderTextColor={theme.textMuted}
                            />

                            {/* Chọn Xe */}
                            <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                                4. Chọn Xe * {depTime && arrTime ? '(Xe trùng lịch sẽ bị khóa cảnh báo)' : ''}
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                                {buses.map((b, index) => {
                                    const id = b.MaXe ?? b.id ?? index;
                                    const active = selectedBusId === (b.MaXe ?? b.id);
                                    const conflict = getBusConflict(id, depTime, arrTime);
                                    const isBusy = !!conflict;

                                    return (
                                        <TouchableOpacity
                                            key={`bus-${id}`}
                                            style={[
                                                styles.pill,
                                                active && styles.pillActive,
                                                isBusy && { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }
                                            ]}
                                            onPress={() => {
                                                if (isBusy) {
                                                    Alert.alert(
                                                        'Xe đang bận!',
                                                        `Xe ${b.TenXe} (${b.BienSo}) đã được xếp cho chuyến #${conflict.MaChuyen} (${conflict.TenTuyen}) từ ${conflict.ThoiGianDi} đến ${conflict.ThoiGianDen}.\n\nKhông thể chọn xe này trong khung giờ đã nhập!`
                                                    );
                                                    return;
                                                }
                                                setSelectedBusId(b.MaXe ?? b.id);
                                            }}
                                        >
                                            <Text style={[
                                                styles.pillText,
                                                active && styles.pillTextActive,
                                                isBusy && { color: colors.danger, fontWeight: '700' }
                                            ]}>
                                                {`${b.TenXe ?? ''} (${b.BienSo ?? ''}) - ${b.SoLuongGhe ?? 0} chỗ`}
                                            </Text>
                                            {isBusy && (
                                                <Text style={{ fontSize: 10, color: colors.danger, fontWeight: '700', marginTop: 2 }}>
                                                    ⚠️ Bận: {String(conflict.ThoiGianDi || '').slice(11, 16)} - {String(conflict.ThoiGianDen || '').slice(11, 16)}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Giá vé */}
                            <Text style={[styles.label, { color: theme.text }]}>5. Giá vé cơ bản (VNĐ) *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', color: theme.text, borderColor: theme.border }]}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                                placeholder="250000"
                                placeholderTextColor={theme.textMuted}
                            />

                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity
                                    style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#334155' : colors.border }]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={[styles.cancelText, { color: theme.text }]}>Hủy</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.saveBtn, submitting && styles.btnDisabled]}
                                    onPress={handleCreateTrip}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color={colors.white} />
                                    ) : (
                                        <Text style={styles.saveText}>TẠO CHUYẾN</Text>
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
    topBar: {
        backgroundColor: colors.white,
        padding: 12,
        flexDirection: 'row',
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    addRouteBtn: {
        flex: 1,
        backgroundColor: colors.primarySoft,
        borderWidth: 1,
        borderColor: colors.primary,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center'
    },
    addRouteText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: 'bold'
    },
    addTripBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center'
    },
    addTripText: {
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
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    tripId: {
        fontSize: 12,
        color: colors.textMuted
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary
    },
    routeName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8
    },
    timeRow: {
        gap: 4,
        marginBottom: 10
    },
    timeText: {
        fontSize: 12,
        color: colors.textMuted
    },
    bold: {
        color: colors.text,
        fontWeight: '600'
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
    },
    busMeta: {
        fontSize: 12,
        color: colors.textMuted
    },
    seatMeta: {
        fontSize: 12,
        color: colors.text
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
        color: colors.text,
        marginBottom: 14
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6
    },
    pillScroll: {
        flexDirection: 'row',
        marginBottom: 6
    },
    pill: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8
    },
    pillActive: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primary
    },
    pillText: {
        fontSize: 12,
        color: colors.text
    },
    pillTextActive: {
        color: colors.primary,
        fontWeight: '700'
    },
    pillSub: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 2
    },
    pillSubActive: {
        color: colors.primary,
        fontWeight: '600'
    },
    pillDisabled: {
        opacity: 0.4
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: colors.text,
        marginBottom: 10
    },
    modalBtnRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 16
    },
    cancelBtn: {
        paddingHorizontal: 16,
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
        opacity: 0.6
    }
});

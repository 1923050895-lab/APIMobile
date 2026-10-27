import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { adminApi } from '../../api/adminApi';
import { colors } from '../../theme/colors';

export default function AdminAddRouteScreen({ navigation }) {
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    const [departure, setDeparture] = useState(null);
    const [destination, setDestination] = useState(null);
    const [routeName, setRouteName] = useState('');
    const [distance, setDistance] = useState('');
    const [estMinutes, setEstMinutes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Tải danh sách địa điểm
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await adminApi.getLocations();
                if (res && res.data) {
                    setLocations(res.data);
                }
            } catch (e) {
                Alert.alert('Lỗi tải danh mục địa điểm', e.message);
            } finally {
                setLoadingLocations(false);
            }
        };
        fetchLocations();
    }, []);

    // Tự động tạo tên tuyến khi người dùng chọn điểm đi và điểm đến
    useEffect(() => {
        if (departure && destination) {
            setRouteName(`${departure.TenDiaDiem} - ${destination.TenDiaDiem}`);
        }
    }, [departure, destination]);

    // Xử lý tạo tuyến xe
    const handleCreateRoute = async () => {
        if (!departure || !destination) {
            Alert.alert('Chưa đủ thông tin', 'Vui lòng chọn cả Điểm Khởi Hành và Điểm Đến');
            return;
        }

        if (departure.MaDiaDiem === destination.MaDiaDiem) {
            Alert.alert('Lỗi', 'Điểm khởi hành và điểm đến không được trùng nhau');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                TenTuyen: routeName.trim(),
                MaDiemDi: departure.MaDiaDiem,
                MaDiemDen: destination.MaDiaDiem,
                KhoangCachKm: distance ? parseFloat(distance) : null,
                ThoiGianDuKienPhut: estMinutes ? parseInt(estMinutes, 10) : null
            };

            const res = await adminApi.createRoute(payload);
            const createdRoute = res.data;

            Alert.alert(
                'Thêm tuyến thành công! 🎉',
                `Đã tạo tuyến xe: "${createdRoute.TenTuyen || routeName}".\nBạn có muốn tạo Chuyến xe cho tuyến này ngay bây giờ không?`,
                [
                    {
                        text: 'Để sau',
                        onPress: () => navigation.goBack()
                    },
                    {
                        text: 'Thêm Chuyến Xe Ngay',
                        onPress: () => {
                            navigation.navigate('AdminTrips', {
                                defaultRouteId: createdRoute.MaTuyenXe
                            });
                        }
                    }
                ]
            );

            // Reset form
            setDeparture(null);
            setDestination(null);
            setRouteName('');
            setDistance('');
            setEstMinutes('');
        } catch (e) {
            Alert.alert('Thêm tuyến xe thất bại', e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.headerBox}>
                <Text style={styles.title}>Thêm Tuyến Xe Mới</Text>
                <Text style={styles.subtitle}>
                    Chọn Điểm Đi và Điểm Đến để tạo hành trình cho các chuyến xe
                </Text>
            </View>

            {loadingLocations ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Đang tải danh sách địa điểm...</Text>
                </View>
            ) : (
                <View style={styles.formCard}>
                    {/* BƯỚC 1: CHỌN ĐIỂM ĐI */}
                    <Text style={styles.sectionTitle}>1. Chọn Điểm Đi (Khởi hành) *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
                        {locations.map((loc) => {
                            const isSelected = departure?.MaDiaDiem === loc.MaDiaDiem;
                            return (
                                <TouchableOpacity
                                    key={`dep-${loc.MaDiaDiem}`}
                                    style={[styles.pill, isSelected && styles.pillActive]}
                                    onPress={() => setDeparture(loc)}
                                >
                                    <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                                        {loc.TenDiaDiem}
                                    </Text>
                                    <Text style={[styles.pillCity, isSelected && styles.pillCityActive]}>
                                        {loc.TinhThanh}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* BƯỚC 2: CHỌN ĐIỂM ĐẾN */}
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>2. Chọn Điểm Đến (Nơi tới) *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
                        {locations.map((loc) => {
                            const isSelected = destination?.MaDiaDiem === loc.MaDiaDiem;
                            const isSameAsDep = departure?.MaDiaDiem === loc.MaDiaDiem;

                            return (
                                <TouchableOpacity
                                    key={`dest-${loc.MaDiaDiem}`}
                                    style={[
                                        styles.pill,
                                        isSelected && styles.pillActive,
                                        isSameAsDep && styles.pillDisabled
                                    ]}
                                    onPress={() => !isSameAsDep && setDestination(loc)}
                                    disabled={isSameAsDep}
                                >
                                    <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                                        {loc.TenDiaDiem}
                                    </Text>
                                    <Text style={[styles.pillCity, isSelected && styles.pillCityActive]}>
                                        {loc.TinhThanh}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* BƯỚC 3: THÔNG TIN CHI TIẾT TUYẾN */}
                    <View style={styles.metaSection}>
                        <Text style={styles.label}>Tên Tuyến Xe (Tự động hoặc sửa tùy ý):</Text>
                        <TextInput
                            style={styles.input}
                            value={routeName}
                            onChangeText={setRouteName}
                            placeholder="Ví dụ: TP.Hồ Chí Minh - TP.Đà Lạt"
                        />

                        <View style={styles.inputRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Khoảng cách (Km):</Text>
                                <TextInput
                                    style={styles.input}
                                    value={distance}
                                    onChangeText={setDistance}
                                    keyboardType="numeric"
                                    placeholder="300"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Thời gian dự kiến (phút):</Text>
                                <TextInput
                                    style={styles.input}
                                    value={estMinutes}
                                    onChangeText={setEstMinutes}
                                    keyboardType="numeric"
                                    placeholder="360"
                                />
                            </View>
                        </View>
                    </View>

                    {/* TÓM TẮT HÀNH TRÌNH */}
                    {departure && destination && (
                        <View style={styles.previewBox}>
                            <Text style={styles.previewTitle}>✨ Xem trước hành trình tuyến:</Text>
                            <Text style={styles.previewRoute}>
                                🟢 {departure.TenDiaDiem} ➔ 🏁 {destination.TenDiaDiem}
                            </Text>
                            {distance ? <Text style={styles.previewDetail}>📏 Khoảng cách: {distance} km</Text> : null}
                            {estMinutes ? (
                                <Text style={styles.previewDetail}>
                                    ⏱️ Thời gian chạy dự kiến: ~{(Number(estMinutes) / 60).toFixed(1)} tiếng ({estMinutes} phút)
                                </Text>
                            ) : null}
                        </View>
                    )}

                    {/* NÚT TẠO TUYẾN XE */}
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.btnDisabled]}
                        onPress={handleCreateRoute}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.submitBtnText}>TẠO TUYẾN XE & SẴN SÀNG THÊM CHUYẾN</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    content: {
        padding: 16,
        paddingBottom: 40
    },
    headerBox: {
        marginBottom: 16
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text
    },
    subtitle: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 4
    },
    loadingBox: {
        padding: 40,
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 10,
        color: colors.textMuted
    },
    formCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8
    },
    pillList: {
        flexDirection: 'row',
        marginBottom: 8
    },
    pill: {
        backgroundColor: colors.background,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginRight: 10,
        minWidth: 130
    },
    pillActive: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primary
    },
    pillDisabled: {
        opacity: 0.4
    },
    pillText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.text
    },
    pillTextActive: {
        color: colors.primaryDark
    },
    pillCity: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2
    },
    pillCityActive: {
        color: colors.primary
    },
    metaSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border
    },
    label: {
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
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: colors.text,
        marginBottom: 12
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12
    },
    previewBox: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        borderRadius: 12,
        padding: 12,
        marginVertical: 14
    },
    previewTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#166534',
        marginBottom: 4
    },
    previewRoute: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#14532d',
        marginVertical: 2
    },
    previewDetail: {
        fontSize: 12,
        color: '#15803d',
        marginTop: 2
    },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10
    },
    submitBtnText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: 'bold'
    },
    btnDisabled: {
        opacity: 0.6
    }
});

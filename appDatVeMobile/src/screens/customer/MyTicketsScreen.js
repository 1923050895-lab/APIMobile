import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    RefreshControl
} from 'react-native';
import { bookingApi } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatVND } from '../../utils/format';

export default function MyTicketsScreen() {
    const { user, refreshProfile } = useAuth();
    const { isDarkMode, theme } = useTheme();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTicket, setActiveTicket] = useState(null);
    const [ticketModalVisible, setTicketModalVisible] = useState(false);
    const [printingTicketId, setPrintingTicketId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ChuaIn', 'DaIn', 'DaHuy'
    const [searchQuery, setSearchQuery] = useState('');

    const isStaffOrAdmin = user?.VaiTro === 'Admin' || user?.VaiTro === 'NhanVien' || user?.VaiTro === 'NhanVienQuay';

    const loadTickets = async () => {
        try {
            const res = await bookingApi.getMyTickets();
            let data = [];
            if (Array.isArray(res)) {
                data = res;
            } else if (Array.isArray(res?.data)) {
                data = res.data;
            } else if (Array.isArray(res?.data?.tickets)) {
                data = res.data.tickets;
            } else if (Array.isArray(res?.tickets)) {
                data = res.tickets;
            }
            setTickets(data);
        } catch (e) {
            console.warn('Lỗi lấy danh sách vé:', e.message);
            Alert.alert('Lỗi tải danh sách vé', e.message || 'Không thể lấy dữ liệu đơn đặt vé.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadTickets();
    };

    // Lọc vé theo trạng thái và từ khóa tìm kiếm
    const filteredTickets = useMemo(() => {
        return tickets.filter(item => {
            const status = item.TrangThaiVe || item.TrangThai;
            // 1. Lọc theo tab trạng thái
            if (statusFilter !== 'ALL' && status !== statusFilter) {
                return false;
            }
            // 2. Tìm kiếm theo từ khóa
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTicket = (item.MaVeHienThi || '').toLowerCase().includes(q) || String(item.MaVe || '').includes(q);
                const matchOrder = (item.MaDonHienThi || '').toLowerCase().includes(q) || String(item.MaDon || '').includes(q);
                const matchName = (item.TenKhachHang || '').toLowerCase().includes(q);
                const matchPhone = (item.SoDienThoaiKhach || '').includes(q);
                const matchRoute = (item.TenTuyen || '').toLowerCase().includes(q);
                const matchSeat = (item.DanhSachGhe || '').toLowerCase().includes(q);
                return matchTicket || matchOrder || matchName || matchPhone || matchRoute || matchSeat;
            }
            return true;
        });
    }, [tickets, statusFilter, searchQuery]);

    // Thao tác in vé online / xem vé in
    const handlePrintTicket = async (ticket) => {
        const isPrinted = (ticket.TrangThaiVe || ticket.TrangThai) === 'DaIn';

        // Nếu vé đã in -> Mở trực tiếp Thẻ vé xe mà không cần gọi API in lại
        if (isPrinted) {
            setActiveTicket(ticket);
            setTicketModalVisible(true);
            return;
        }

        // Nếu vé chưa in -> Gọi API in vé
        setPrintingTicketId(ticket.MaVe);
        try {
            const res = await bookingApi.printTicketOnline(ticket.MaVe);
            const ticketData = res.data || {};
            setActiveTicket({
                ...ticket,
                ...ticketData,
                TrangThaiVe: 'DaIn',
                TrangThai: 'DaIn'
            });
            setTicketModalVisible(true);
            loadTickets();
        } catch (e) {
            Alert.alert('Không thể in vé', e.message || 'Lỗi xử lý in vé');
        } finally {
            setPrintingTicketId(null);
        }
    };

    // Kiểm tra xem chuyến xe đã xuất phát hay chưa
    const isTripDeparted = (ticket) => {
        if (!ticket?.ThoiGianDi) return false;
        try {
            const depTimestamp = new Date(ticket.ThoiGianDi.replace(' ', 'T')).getTime();
            return !isNaN(depTimestamp) && Date.now() >= depTimestamp;
        } catch {
            return false;
        }
    };

    // Hủy vé (hoàn 50% vào ví theo quy tắc BR-04)
    const handleCancelTicket = (ticket) => {
        if (isTripDeparted(ticket)) {
            Alert.alert(
                'Không thể hủy vé',
                `Chuyến xe đã khởi hành vào lúc ${ticket.ThoiGianDi}.\n\nTheo quy định của nhà xe, hành khách không thể hủy vé sau khi xe đã xuất phát.`
            );
            return;
        }

        Alert.alert(
            'Xác nhận hủy vé',
            `Bạn có chắc chắn muốn hủy đơn vé #${ticket.MaVe} (Ghế: ${ticket.DanhSachGhe || 'Đã chọn'})?\n\nTheo quy định chính sách hoàn vé (BR-04), bạn sẽ được hoàn 50% số tiền vào số dư ví.`,
            [
                { text: 'Không', style: 'cancel' },
                {
                    text: 'Hủy Vé & Nhận Hoàn Tiền',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await bookingApi.cancelTicket(ticket.MaVe);
                            await refreshProfile();
                            Alert.alert('Hủy vé thành công! 🎉', res.message || 'Đã hoàn 50% số tiền vào ví của bạn.');
                            loadTickets();
                        } catch (e) {
                            Alert.alert('Hủy vé thất bại', e.message);
                        }
                    }
                }
            ]
        );
    };

    const renderTicket = ({ item }) => {
        const status = item.TrangThaiVe || item.TrangThai;
        const isCancelled = status === 'DaHuy';
        const isPrinted = status === 'DaIn';
        const hasDeparted = isTripDeparted(item);
        const ticketCode = item.MaVeHienThi || `#${item.MaVe}`;
        const orderCode = item.MaDonHienThi || `Đơn #${item.MaDon}`;
        const seatText = item.DanhSachGhe || (item.SoGhe ? `${item.SoGhe}` : 'Chưa xếp ghế');
        const price = item.TongTien || item.GiaVe;
        const isPrintingThis = printingTicketId === item.MaVe;

        return (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, isCancelled && styles.cardCancelled]}>
                {/* Header đơn vé */}
                <View style={[styles.cardHeader, { borderBottomColor: theme.divider }]}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.ticketId, { color: theme.text }]}>🎫 Vé: <Text style={[styles.boldText, { color: theme.text }]}>{ticketCode}</Text></Text>
                        <Text style={[styles.orderIdSub, { color: theme.textMuted }]}>📋 {orderCode} • {item.LoaiDat === 'Quay' ? '🏢 Đặt tại quầy' : '🌐 Đặt trực tuyến'}</Text>
                    </View>
                    <View style={[
                        styles.badge,
                        isCancelled ? styles.badgeDanger : isPrinted ? styles.badgeSuccess : styles.badgeWarning
                    ]}>
                        <Text style={[
                            styles.badgeText,
                            isCancelled ? styles.badgeTextDanger : isPrinted ? styles.badgeTextSuccess : styles.badgeTextWarning
                        ]}>
                            {isCancelled ? ' ĐÃ HỦY' : isPrinted ? ' ĐÃ IN VÉ' : 'CHƯA IN'}
                        </Text>
                    </View>
                </View>

                {/* Tuyến xe */}
                <Text style={[styles.routeText, { color: theme.text }]}>{item.TenTuyen || 'Chuyến xe khách'}</Text>

                {/* Thông tin hành khách */}
                {item.TenKhachHang ? (
                    <View style={[styles.custInfoBox, { backgroundColor: isDarkMode ? '#0b1120' : '#f8fafc', borderColor: theme.border }]}>
                        <Text style={[styles.custInfoText, { color: theme.text }]}>
                            👤 Khách: <Text style={[styles.boldText, { color: theme.text }]}>{item.TenKhachHang}</Text> {item.SoDienThoaiKhach ? `(📞 ${item.SoDienThoaiKhach})` : ''}
                        </Text>
                    </View>
                ) : null}

                {/* Lưới thông tin: Ghế, Tiền, Giờ xuất phát */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                        <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Ghế ngồi</Text>
                        <Text style={styles.seatBadge}>{seatText}</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Tổng tiền</Text>
                        <Text style={styles.priceText}>{formatVND(price)} đ</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Khởi hành</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{item.ThoiGianDi}</Text>
                    </View>
                </View>

                {/* Thông tin xe */}
                <View style={[styles.busMetaBox, { backgroundColor: isDarkMode ? '#0b1120' : '#f1f5f9' }]}>
                    <Text style={[styles.busInfo, { color: theme.textMuted }]}>
                        🚌 Xe: <Text style={[styles.boldText, { color: theme.text }]}>{item.TenXe || 'VIP Limousine'}</Text> (BS: <Text style={[styles.boldText, { color: theme.text }]}>{item.BienSo || '—'}</Text>) • {item.LoaiXe || '2 Tầng'}
                    </Text>
                </View>

                {/* Các nút hành động */}
                {!isCancelled ? (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[
                                styles.printBtn,
                                isPrinted ? styles.printBtnPrinted : styles.printBtnUnprinted
                            ]}
                            onPress={() => handlePrintTicket(item)}
                            disabled={isPrintingThis}
                            activeOpacity={0.8}
                        >
                            {isPrintingThis ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={styles.printBtnText}>
                                    {isPrinted ? '🎫 XEM VÉ IN' : 'IN VÉ ĐIỆN TỬ'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {!isPrinted && (
                            hasDeparted ? (
                                <View style={styles.departedBadge}>
                                    <Text style={styles.departedBadgeText}>Xe đã xuất phát</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => handleCancelTicket(item)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.cancelBtnText}>HỦY VÉ (HOÀN 50%)</Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                ) : (
                    <View style={styles.cancelledBanner}>
                        <Text style={styles.cancelledBannerText}>
                            Đơn vé này đã hủy. Tiền hoàn đã được cộng vào ví của hành khách.
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header thông tin màn hình */}
            <View style={[styles.topHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <Text style={[styles.topHeaderTitle, { color: theme.text }]}>
                    {isStaffOrAdmin ? 'Danh Sách Đơn & Vé Đã Bán' : 'Vé & Đơn Đặt Của Tôi'}
                </Text>
                <Text style={[styles.topHeaderSubtitle, { color: theme.textMuted }]}>
                    Tổng số: {tickets.length} đơn vé • Bấm "In / Xem vé" để xem chi tiết vé xe
                </Text>

                {/* Ô tìm kiếm nhanh */}
                <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={[styles.searchInput, { color: theme.inputText }]}
                        placeholder="Tìm theo mã vé, mã đơn, tên khách, SĐT..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={theme.placeholder}
                        clearButtonMode="while-editing"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                            <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bộ lọc trạng thái */}
                <View style={styles.filterTabsRow}>
                    {[
                        { key: 'ALL', label: `Tất cả (${tickets.length})` },
                        { key: 'ChuaIn', label: 'Chưa in' },
                        { key: 'DaIn', label: 'Đã in vé' },
                        { key: 'DaHuy', label: 'Đã hủy' }
                    ].map(tab => {
                        const active = statusFilter === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[
                                    styles.filterTab,
                                    { backgroundColor: theme.card, borderColor: theme.border },
                                    active && { backgroundColor: isDarkMode ? '#1e293b' : colors.primarySoft, borderColor: theme.primary }
                                ]}
                                onPress={() => setStatusFilter(tab.key)}
                            >
                                <Text style={[
                                    styles.filterTabText,
                                    { color: theme.textMuted },
                                    active && { color: isDarkMode ? '#60a5fa' : colors.primaryDark, fontWeight: '700' }
                                ]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.textMuted }]}>Đang tải danh sách đơn vé...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTickets}
                    keyExtractor={(item, index) => {
                        const id = item.MaVe ?? item.MaDon ?? index;
                        return `ticket-${id}-${index}`;
                    }}
                    renderItem={renderTicket}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyIcon}>🎫</Text>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Không tìm thấy vé nào phù hợp</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                                {searchQuery ? 'Thử tìm kiếm với từ khóa khác hoặc chuyển bộ lọc trạng thái.' : 'Bạn chưa có đơn đặt vé nào trong hệ thống.'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Modal Chi Tiết Vé Đã In (Không dùng QR) */}
            <Modal visible={ticketModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {/* Header Vé Xe */}
                        <View style={styles.ticketCardHeader}>
                            <Text style={[styles.ticketCardLogo, { color: theme.primary }]}>🚌 PHIẾU VÉ XE ĐIỆN TỬ</Text>
                            <Text style={[styles.ticketCardNotice, { color: theme.textMuted }]}>Vé hợp lệ dùng khi lên xe khách</Text>
                        </View>

                        {/* Mã vé in nổi bật */}
                        <View style={[styles.ticketCodeBox, { backgroundColor: isDarkMode ? '#064e3b33' : '#f0fdf4', borderColor: isDarkMode ? '#059669' : '#86efac' }]}>
                            <Text style={[styles.ticketCodeLabel, { color: isDarkMode ? '#34d399' : '#166534' }]}>MÃ VÉ LÊN XE</Text>
                            <Text style={[styles.ticketCodeValue, { color: isDarkMode ? '#6ee7b7' : '#15803d' }]}>
                                {activeTicket?.MaVeHienThi || `VE-${activeTicket?.MaVe}`}
                            </Text>
                            <View style={styles.printedBadge}>
                                <Text style={styles.printedBadgeText}> VÉ HỢP LỆ - ĐÃ IN THÀNH CÔNG</Text>
                            </View>
                        </View>

                        {/* Thông tin chi tiết vé */}
                        <View style={[styles.modalDetails, { backgroundColor: isDarkMode ? '#0b1120' : '#f8fafc', borderColor: theme.border }]}>
                            <View style={styles.modalDetailRow}>
                                <Text style={[styles.modalDetailLabel, { color: theme.textMuted }]}>Tuyến hành trình:</Text>
                                <Text style={[styles.modalDetailValueBold, { color: theme.text }]}>{activeTicket?.TenTuyen}</Text>
                            </View>

                            <View style={styles.modalDetailRow}>
                                <Text style={[styles.modalDetailLabel, { color: theme.textMuted }]}>Số ghế ngồi:</Text>
                                <Text style={[styles.modalDetailValueBold, { color: theme.primary, fontSize: 16 }]}>
                                    {activeTicket?.DanhSachGhe || activeTicket?.SoGhe || 'Chưa chọn'}
                                </Text>
                            </View>

                            <View style={styles.modalDetailRow}>
                                <Text style={[styles.modalDetailLabel, { color: theme.textMuted }]}>Giờ khởi hành:</Text>
                                <Text style={[styles.modalDetailValueBold, { color: '#38bdf8' }]}>
                                    {activeTicket?.ThoiGianDi}
                                </Text>
                            </View>

                            <View style={styles.modalDetailRow}>
                                <Text style={[styles.modalDetailLabel, { color: theme.textMuted }]}>Hành khách:</Text>
                                <Text style={[styles.modalDetailValue, { color: theme.text }]}>
                                    {activeTicket?.TenKhachHang || activeTicket?.TenHanhKhach || activeTicket?.HoTen || 'Quý khách'} {activeTicket?.SoDienThoaiKhach ? `(${activeTicket.SoDienThoaiKhach})` : ''}
                                </Text>
                            </View>

                            <View style={styles.modalDetailRow}>
                                <Text style={[styles.modalDetailLabel, { color: theme.textMuted }]}>Xe & Biển số:</Text>
                                <Text style={[styles.modalDetailValue, { color: theme.text }]}>
                                    {activeTicket?.TenXe || 'Limousine'} (BS: {activeTicket?.BienSo || '—'}) • {activeTicket?.LoaiXe || '2 Tầng'}
                                </Text>
                            </View>

                            <View style={styles.modalDetailRow}>
                                <Text style={[styles.modalDetailLabel, { color: theme.textMuted }]}>Mã đơn đặt:</Text>
                                <Text style={[styles.modalDetailValue, { color: theme.text }]}>
                                    {activeTicket?.MaDonHienThi || `#${activeTicket?.MaDon}`}
                                </Text>
                            </View>

                            <View style={[styles.modalDetailRow, { borderTopWidth: 1, borderTopColor: theme.divider, paddingTop: 8, marginTop: 4 }]}>
                                <Text style={[styles.modalDetailLabel, { fontWeight: '700', color: theme.text }]}>Tổng tiền vé:</Text>
                                <Text style={[styles.modalDetailValueBold, { color: colors.success, fontSize: 16 }]}>
                                    {formatVND(activeTicket?.TongTien || activeTicket?.GiaVe)} đ
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={() => setTicketModalVisible(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.closeModalText}>ĐÓNG PHIẾU VÉ</Text>
                        </TouchableOpacity>
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
    topHeader: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    topHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text
    },
    topHeaderSubtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
        marginBottom: 10
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    searchIcon: {
        fontSize: 14,
        marginRight: 8
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: colors.text,
        padding: 0
    },
    filterTabsRow: {
        flexDirection: 'row',
        gap: 8
    },
    filterTab: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: colors.border
    },
    filterTabActive: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primary
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted
    },
    filterTabTextActive: {
        color: colors.primaryDark,
        fontWeight: '700'
    },
    listContent: {
        padding: 16
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30
    },
    loadingText: {
        marginTop: 10,
        fontSize: 13,
        color: colors.textMuted
    },
    card: {
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
    cardCancelled: {
        opacity: 0.65,
        backgroundColor: '#f8fafc'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 8
    },
    ticketId: {
        fontSize: 14,
        color: colors.text
    },
    orderIdSub: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2
    },
    boldText: {
        fontWeight: '700',
        color: colors.text
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    badgeWarning: {
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#fde68a'
    },
    badgeSuccess: {
        backgroundColor: '#dcfce7',
        borderWidth: 1,
        borderColor: '#86efac'
    },
    badgeDanger: {
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fca5a5'
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800'
    },
    badgeTextWarning: {
        color: '#b45309'
    },
    badgeTextSuccess: {
        color: '#15803d'
    },
    badgeTextDanger: {
        color: '#b91c1c'
    },
    routeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8
    },
    custInfoBox: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 10
    },
    custInfoText: {
        fontSize: 12.5,
        color: '#475569'
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 10,
        marginBottom: 8
    },
    infoCol: {
        flex: 1
    },
    infoLabel: {
        fontSize: 11,
        color: colors.textMuted
    },
    seatBadge: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 2
    },
    priceText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        marginTop: 2
    },
    infoValue: {
        fontSize: 11,
        color: colors.text,
        fontWeight: '600',
        marginTop: 2
    },
    busMetaBox: {
        marginBottom: 12
    },
    busInfo: {
        fontSize: 12,
        color: colors.textMuted
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10
    },
    printBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    printBtnUnprinted: {
        backgroundColor: colors.primary
    },
    printBtnPrinted: {
        backgroundColor: '#15803d'
    },
    printBtnText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold'
    },
    cancelBtn: {
        backgroundColor: colors.dangerSoft,
        borderWidth: 1,
        borderColor: '#fecaca',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelBtnText: {
        color: colors.danger,
        fontSize: 11.5,
        fontWeight: '700'
    },
    departedBadge: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    departedBadgeText: {
        color: '#64748b',
        fontSize: 11.5,
        fontWeight: '700'
    },
    cancelledBanner: {
        backgroundColor: '#fee2e2',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fca5a5'
    },
    cancelledBannerText: {
        fontSize: 11.5,
        color: '#991b1b',
        fontWeight: '600',
        textAlign: 'center'
    },
    emptyBox: {
        padding: 40,
        alignItems: 'center'
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 10
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text
    },
    emptySubtitle: {
        color: colors.textMuted,
        fontSize: 12.5,
        marginTop: 4,
        textAlign: 'center'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalBox: {
        backgroundColor: colors.white,
        borderRadius: 20,
        width: '100%',
        maxWidth: 380,
        padding: 20,
        alignItems: 'center'
    },
    ticketCardHeader: {
        alignItems: 'center',
        marginBottom: 12
    },
    ticketCardLogo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary
    },
    ticketCardNotice: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2
    },
    ticketCodeBox: {
        width: '100%',
        backgroundColor: '#f0fdf4',
        borderWidth: 1.5,
        borderColor: '#86efac',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 4
    },
    ticketCodeLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#166534',
        letterSpacing: 1
    },
    ticketCodeValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#15803d',
        marginVertical: 4,
        letterSpacing: 1.5
    },
    printedBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#86efac'
    },
    printedBadgeText: {
        color: '#15803d',
        fontSize: 11,
        fontWeight: '800'
    },
    modalDetails: {
        width: '100%',
        marginVertical: 14,
        gap: 6,
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    modalDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalDetailLabel: {
        fontSize: 12,
        color: '#64748b'
    },
    modalDetailValue: {
        fontSize: 12.5,
        color: colors.text
    },
    modalDetailValueBold: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text
    },
    closeModalBtn: {
        backgroundColor: colors.primary,
        width: '100%',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center'
    },
    closeModalText: {
        color: colors.white,
        fontSize: 13.5,
        fontWeight: 'bold'
    }
});

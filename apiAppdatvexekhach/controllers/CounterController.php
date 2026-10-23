<?php
/**
 * CounterController - Xử lý nghiệp vụ bán vé tại quầy dành cho Nhân viên (UC-07, UC-08, UC-09)
 * Tuân thủ quy tắc: BR-06, BR-07, BR-08
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

class CounterController {
    /**
     * UC-07: Tạo đơn bán vé tại quầy cho khách vãng lai (BR-07, BR-08)
     */
    public static function createBooking(array $data): void {
        // Chỉ Nhân viên hoặc Admin mới có quyền bán vé tại quầy
        $staff = Auth::requireRole(['NhanVien', 'Admin']);
        $staffId = $staff['MaTaiKhoan'];

        $tripId   = (int)($data['MaChuyen'] ?? 0);
        $seatIds  = $data['DanhSachMaGhe'] ?? $data['DanhSachGhe'] ?? [];
        if (!is_array($seatIds)) {
            $seatIds = is_numeric($seatIds) ? [(int)$seatIds] : [];
        }
        $custName = trim($data['TenKhachHang'] ?? $data['TenHanhKhach'] ?? 'Khách vãng lai');
        $custPhone= trim($data['SoDienThoaiKhach'] ?? $data['SoDienThoai'] ?? '0999999999');
        $paymentMethod = $data['PhuongThucThanhToan'] ?? 'TienMat'; // 'TienMat' hoặc 'ChuyenKhoan'

        if ($tripId <= 0 || empty($seatIds)) {
            Response::error('Vui lòng chọn chuyến xe và danh sách ghế');
        }

        if (!in_array($paymentMethod, ['TienMat', 'ChuyenKhoan'], true)) {
            Response::error('Phương thức thanh toán tại quầy chỉ hỗ trợ Tiền mặt (TienMat) hoặc Chuyển khoản (ChuyenKhoan)');
        }

        $seatIds = array_values(array_unique(array_map('intval', $seatIds)));
        $seatCount = count($seatIds);

        $db = Database::getConnection();

        try {
            $db->beginTransaction();

            // 1. Lấy thông tin tài khoản guest (BR-08)
            $stmtGuest = $db->query("SELECT MaTaiKhoan FROM taikhoan WHERE VaiTro = 'Guest' LIMIT 1");
            $guest = $stmtGuest->fetch();
            $guestId = $guest ? (int)$guest['MaTaiKhoan'] : $staffId;

            // 2. Kiểm tra chuyến xe
            $stmtTrip = $db->prepare("
                SELECT c.MaChuyen, c.MaXe, c.GiaVe, c.TrangThai, c.ThoiGianDi, t.TenTuyen, x.BienSo
                FROM chuyen_xe c
                JOIN tuyen_xe t ON c.MaTuyenXe = t.MaTuyenXe
                JOIN xe x ON c.MaXe = x.MaXe
                WHERE c.MaChuyen = :tripId
                FOR UPDATE
            ");
            $stmtTrip->execute(['tripId' => $tripId]);
            $trip = $stmtTrip->fetch();

            if (!$trip || $trip['TrangThai'] !== 'SapChay') {
                $db->rollBack();
                Response::error('Chuyến xe không tồn tại hoặc không còn khả dụng để bán vé');
            }

            // 3. Kiểm tra ghế trống trên chuyến
            $placeholders = implode(',', array_fill(0, count($seatIds), '?'));
            $stmtCheckSeats = $db->prepare("
                SELECT MaGhe, SoGhe, TrangThai 
                FROM ghe 
                WHERE MaXe = ? AND MaGhe IN ($placeholders)
            ");
            $stmtCheckSeats->execute(array_merge([$trip['MaXe']], $seatIds));
            $validSeats = $stmtCheckSeats->fetchAll();

            if (count($validSeats) !== $seatCount) {
                $db->rollBack();
                Response::error('Một số ghế không thuộc xe của chuyến này');
            }

            $stmtBooked = $db->prepare("
                SELECT ct.MaGhe, g.SoGhe 
                FROM chi_tiet_dat_ve ct
                JOIN ghe g ON ct.MaGhe = g.MaGhe
                WHERE ct.MaChuyen = ? AND ct.MaGhe IN ($placeholders) AND ct.TrangThaiChiTiet = 'DaDat'
                FOR UPDATE
            ");
            $stmtBooked->execute(array_merge([$tripId], $seatIds));
            $conflictSeats = $stmtBooked->fetchAll();

            if (!empty($conflictSeats)) {
                $conflictNumbers = array_column($conflictSeats, 'SoGhe');
                $db->rollBack();
                Response::error('Các ghế sau đã được người khác đặt: ' . implode(', ', $conflictNumbers), 409);
            }

            // 4. Tính tiền
            $unitPrice = (float)$trip['GiaVe'];
            $totalAmount = $unitPrice * $seatCount;

            // 5. Xác định trạng thái thanh toán theo quy tắc BR-07:
            // Tiền mặt: tự động ghi nhận đã thanh toán
            // Chuyển khoản: chờ nhân viên kiểm tra và xác nhận ở bước sau
            $paymentStatus = ($paymentMethod === 'TienMat') ? 'DaThanhToan' : 'ChuaThanhToan';
            $orderStatus   = ($paymentMethod === 'TienMat') ? 'ThanhCong' : 'ChoXacNhan';
            $confirmedBy   = ($paymentMethod === 'TienMat') ? $staffId : null;
            $confirmedAt   = ($paymentMethod === 'TienMat') ? date('Y-m-d H:i:s') : null;

            $bookingCode = 'QUAY-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
            $stmtBooking = $db->prepare("
                INSERT INTO don_dat_ve (
                    MaDonHienThi, MaTaiKhoan, MaChuyen, TenKhachHang, SoDienThoaiKhach, EmailKhach,
                    NgayDat, SoLuongGhe, TongTien, PhuongThucThanhToan, TrangThaiThanhToan, TrangThaiDon,
                    LoaiDat, MaNhanVienXacNhan, ThoiGianXacNhan
                ) VALUES (
                    :code, :guestId, :tripId, :custName, :custPhone, NULL,
                    NOW(), :seatCount, :total, :method, :payStatus, :orderStatus,
                    'Quay', :staffId, :confirmTime
                )
            ");
            $stmtBooking->execute([
                'code'        => $bookingCode,
                'guestId'     => $guestId,
                'tripId'      => $tripId,
                'custName'    => $custName,
                'custPhone'   => $custPhone,
                'seatCount'   => $seatCount,
                'total'       => $totalAmount,
                'method'      => $paymentMethod,
                'payStatus'   => $paymentStatus,
                'orderStatus' => $orderStatus,
                'staffId'     => $confirmedBy,
                'confirmTime' => $confirmedAt
            ]);
            $bookingId = (int)$db->lastInsertId();

            // 6. Ghi chi tiết ghế (khóa ghế tạm thời hoặc vĩnh viễn)
            $stmtDetail = $db->prepare("
                INSERT INTO chi_tiet_dat_ve (MaDon, MaChuyen, MaGhe, DonGia, TrangThaiChiTiet)
                VALUES (:bookingId, :tripId, :seatId, :price, 'DaDat')
            ");
            foreach ($seatIds as $seatId) {
                $stmtDetail->execute([
                    'bookingId' => $bookingId,
                    'tripId'    => $tripId,
                    'seatId'    => $seatId,
                    'price'     => $unitPrice
                ]);
            }

            // 7. Tạo vé nếu đã thanh toán tiền mặt (hoặc tạo sẵn mã vé)
            $ticketCode = 'VE-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
            $stmtTicket = $db->prepare("
                INSERT INTO ve (MaDon, MaVeHienThi, TrangThaiVe)
                VALUES (:bookingId, :ticketCode, 'ChuaIn')
            ");
            $stmtTicket->execute([
                'bookingId'  => $bookingId,
                'ticketCode' => $ticketCode
            ]);
            $ticketId = (int)$db->lastInsertId();

            $db->commit();

            Response::success('Tạo đơn bán vé tại quầy thành công', [
                'booking_id'        => $bookingId,
                'booking_code'      => $bookingCode,
                'ticket_id'         => $ticketId,
                'ticket_code'       => $ticketCode,
                'customer_name'     => $custName,
                'customer_phone'    => $custPhone,
                'trip'              => $trip['TenTuyen'],
                'seats'             => array_column($validSeats, 'SoGhe'),
                'total_amount'      => $totalAmount,
                'payment_method'    => $paymentMethod,
                'payment_status'    => $paymentStatus,
                'order_status'      => $orderStatus
            ], 201);

        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi khi tạo đơn tại quầy: ' . $e->getMessage(), 500);
        }
    }

    /**
     * UC-08: Nhân viên xác nhận thanh toán chuyển khoản tại quầy (BR-06, BR-07)
     */
    public static function confirmPayment(array $data): void {
        $staff = Auth::requireRole(['NhanVien', 'Admin']);
        $staffId = $staff['MaTaiKhoan'];

        $bookingId = (int)($data['MaDon'] ?? 0);
        if ($bookingId <= 0) {
            Response::error('Vui lòng cung cấp mã đơn đặt vé cần xác nhận');
        }

        $db = Database::getConnection();

        try {
            $db->beginTransaction();

            $stmt = $db->prepare("
                SELECT MaDon, MaDonHienThi, LoaiDat, TrangThaiThanhToan, TrangThaiDon, TongTien
                FROM don_dat_ve
                WHERE MaDon = :id
                FOR UPDATE
            ");
            $stmt->execute(['id' => $bookingId]);
            $order = $stmt->fetch();

            if (!$order) {
                $db->rollBack();
                Response::notFound('Không tìm thấy đơn đặt vé');
            }

            // Kiểm tra chỉ xác nhận cho đơn bán tại quầy
            if ($order['LoaiDat'] !== 'Quay') {
                $db->rollBack();
                Response::error('Quy tắc BR-06: Nhân viên chỉ xác nhận đơn quầy, không can thiệp đơn online của khách');
            }

            if ($order['TrangThaiThanhToan'] === 'DaThanhToan') {
                $db->rollBack();
                Response::error('Đơn hàng này đã được xác nhận thanh toán trước đó');
            }

            if ($order['TrangThaiDon'] === 'DaHuy') {
                $db->rollBack();
                Response::error('Đơn hàng đã bị hủy, không thể xác nhận thanh toán');
            }

            // Cập nhật trạng thái thanh toán và nhân viên xác nhận (BR-07)
            $stmtUpdate = $db->prepare("
                UPDATE don_dat_ve 
                SET TrangThaiThanhToan = 'DaThanhToan',
                    TrangThaiDon = 'ThanhCong',
                    MaNhanVienXacNhan = :staffId,
                    ThoiGianXacNhan = NOW()
                WHERE MaDon = :id
            ");
            $stmtUpdate->execute([
                'staffId' => $staffId,
                'id'      => $bookingId
            ]);

            $db->commit();

            Response::success('Nhân viên đã xác nhận thanh toán chuyển khoản thành công', [
                'booking_id'    => $bookingId,
                'booking_code'  => $order['MaDonHienThi'],
                'confirmed_by'  => $staff['HoTen'],
                'confirmed_at'  => date('Y-m-d H:i:s'),
                'payment_status'=> 'DaThanhToan'
            ]);

        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi khi xác nhận thanh toán: ' . $e->getMessage(), 500);
        }
    }

    /**
     * UC-09: Nhân viên in vé tại quầy (BR-03, BR-05, BR-06)
     */
    public static function printCounterTicket(int $ticketId): void {
        $staff = Auth::requireRole(['NhanVien', 'Admin']);
        $staffId = $staff['MaTaiKhoan'];

        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT v.MaVe, v.MaVeHienThi, v.TrangThaiVe,
                   d.MaDon, d.MaDonHienThi, d.TenKhachHang, d.SoDienThoaiKhach, d.TrangThaiThanhToan, d.TongTien,
                   c.MaChuyen, c.ThoiGianDi, c.ThoiGianDen,
                   t.TenTuyen, x.BienSo, x.TenXe
            FROM ve v
            JOIN don_dat_ve d ON v.MaDon = d.MaDon
            JOIN chuyen_xe c ON d.MaChuyen = c.MaChuyen
            JOIN tuyen_xe t ON c.MaTuyenXe = t.MaTuyenXe
            JOIN xe x ON c.MaXe = x.MaXe
            WHERE v.MaVe = :ticketId
        ");
        $stmt->execute(['ticketId' => $ticketId]);
        $ticket = $stmt->fetch();

        if (!$ticket) {
            Response::notFound('Không tìm thấy vé cần in');
        }

        if ($ticket['TrangThaiThanhToan'] !== 'DaThanhToan') {
            Response::error('Đơn chưa thanh toán! Vui lòng xác nhận thanh toán trước khi in vé cứng');
        }

        try {
            $db->beginTransaction();

            $stmtCount = $db->prepare("SELECT COUNT(*) FROM lich_su_in_ve WHERE MaVe = :ticketId");
            $stmtCount->execute(['ticketId' => $ticketId]);
            $printCount = (int)$stmtCount->fetchColumn() + 1;

            $stmtUpdate = $db->prepare("
                UPDATE ve 
                SET TrangThaiVe = 'DaIn',
                    ThoiGianInDauTien = IFNULL(ThoiGianInDauTien, NOW())
                WHERE MaVe = :ticketId
            ");
            $stmtUpdate->execute(['ticketId' => $ticketId]);

            $stmtLog = $db->prepare("
                INSERT INTO lich_su_in_ve (MaVe, MaTaiKhoanThaoTac, ThoiGianIn, SoLanIn, GhiChu)
                VALUES (:ticketId, :staffId, NOW(), :count, 'Nhân viên in vé tại quầy cho khách')
            ");
            $stmtLog->execute([
                'ticketId' => $ticketId,
                'staffId'  => $staffId,
                'count'    => $printCount
            ]);

            $db->commit();

            // Lấy danh sách ghế
            $stmtSeats = $db->prepare("
                SELECT g.SoGhe 
                FROM chi_tiet_dat_ve ct
                JOIN ghe g ON ct.MaGhe = g.MaGhe
                WHERE ct.MaDon = :orderId
            ");
            $stmtSeats->execute(['orderId' => $ticket['MaDon']]);
            $seats = $stmtSeats->fetchAll(PDO::FETCH_COLUMN);

            Response::success('In vé cứng tại quầy thành công', [
                'ticket_code'   => $ticket['MaVeHienThi'],
                'customer_name' => $ticket['TenKhachHang'],
                'customer_phone'=> $ticket['SoDienThoaiKhach'],
                'trip'          => $ticket['TenTuyen'],
                'bus_number'    => $ticket['BienSo'],
                'departure'     => $ticket['ThoiGianDi'],
                'seats'         => $seats,
                'total_seats'   => count($seats),
                'total_amount'  => $ticket['TongTien'],
                'printed_by'    => $staff['HoTen'],
                'print_count'   => $printCount
            ]);

        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi khi in vé: ' . $e->getMessage(), 500);
        }
    }
}

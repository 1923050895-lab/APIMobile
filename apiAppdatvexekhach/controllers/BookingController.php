<?php
/**
 * BookingController - Xử lý đặt vé và thanh toán online bằng số dư ví nội bộ (UC-03)
 * Tuân thủ các quy tắc nghiệp vụ: BR-01, BR-02, BR-05
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

class BookingController {
    /**
     * UC-03: Đặt vé & thanh toán online bằng ví nội bộ
     */
    public static function bookOnline(array $data): void {
        $user = Auth::requireAuth();
        $userId = $user['MaTaiKhoan'];

        $tripId  = (int)($data['MaChuyen'] ?? 0);
        $seatIds = $data['DanhSachMaGhe'] ?? $data['DanhSachGhe'] ?? [];
        if (!is_array($seatIds)) {
            $seatIds = is_numeric($seatIds) ? [(int)$seatIds] : [];
        }

        if ($tripId <= 0 || empty($seatIds)) {
            Response::error('Vui lòng chọn chuyến xe và ít nhất 1 ghế');
        }

        // Loại bỏ ghế trùng lặp nếu người dùng gửi trùng ID
        $seatIds = array_values(array_unique(array_map('intval', $seatIds)));
        $seatCount = count($seatIds);

        $db = Database::getConnection();

        try {
            $db->beginTransaction();

            // 1. Kiểm tra chuyến xe và lấy giá vé (BR-09)
            $stmtTrip = $db->prepare("
                SELECT c.MaChuyen, c.MaXe, c.GiaVe, c.TrangThai, c.ThoiGianDi,
                       t.TenTuyen, x.BienSo, x.TenXe
                FROM chuyen_xe c
                JOIN tuyen_xe t ON c.MaTuyenXe = t.MaTuyenXe
                JOIN xe x ON c.MaXe = x.MaXe
                WHERE c.MaChuyen = :tripId
                FOR UPDATE
            ");
            $stmtTrip->execute(['tripId' => $tripId]);
            $trip = $stmtTrip->fetch();

            if (!$trip) {
                $db->rollBack();
                Response::notFound('Chuyến xe không tồn tại');
            }

            if ($trip['TrangThai'] !== 'SapChay') {
                $db->rollBack();
                Response::error('Chuyến xe đã khởi hành hoặc đã hủy, không thể đặt vé');
            }

            // 2. Kiểm tra tính hợp lệ của từng ghế và tình trạng trống (BR-02)
            $placeholders = implode(',', array_fill(0, count($seatIds), '?'));

            // Kiểm tra ghế có thuộc đúng xe này không
            $stmtCheckSeats = $db->prepare("
                SELECT MaGhe, SoGhe, TrangThai 
                FROM ghe 
                WHERE MaXe = ? AND MaGhe IN ($placeholders)
            ");
            $stmtCheckSeats->execute(array_merge([$trip['MaXe']], $seatIds));
            $validSeats = $stmtCheckSeats->fetchAll();

            if (count($validSeats) !== $seatCount) {
                $db->rollBack();
                Response::error('Một số ghế đã chọn không hợp lệ hoặc không thuộc xe của chuyến này');
            }

            foreach ($validSeats as $seat) {
                if ($seat['TrangThai'] === 'Hong') {
                    $db->rollBack();
                    Response::error("Ghế {$seat['SoGhe']} hiện đang bảo trì/hỏng, vui lòng chọn ghế khác");
                }
            }

            // Kiểm tra ghế đã bị người khác đặt chưa trên chuyến này
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
                Response::error('Rất tiếc! Các ghế sau đã vừa được người khác đặt: ' . implode(', ', $conflictNumbers), 409);
            }

            // 3. Tính tổng tiền (BR-09: Giá vé cố định nhân số ghế)
            $unitPrice = (float)$trip['GiaVe'];
            $totalAmount = $unitPrice * $seatCount;

            // 4. Kiểm tra số dư ví nội bộ và khóa ví (BR-01)
            $stmtWallet = $db->prepare("SELECT MaVi, SoDu FROM vi_noi_bo WHERE MaTaiKhoan = :userId FOR UPDATE");
            $stmtWallet->execute(['userId' => $userId]);
            $wallet = $stmtWallet->fetch();

            if (!$wallet) {
                $db->rollBack();
                Response::error('Không tìm thấy ví nội bộ của tài khoản này');
            }

            $currentBalance = (float)$wallet['SoDu'];
            if ($currentBalance < $totalAmount) {
                $db->rollBack();
                $missing = number_format($totalAmount - $currentBalance, 0, ',', '.');
                Response::error("Số dư ví không đủ để thanh toán. Cần thêm {$missing} đ để hoàn tất đơn", 400, [
                    'current_balance' => $currentBalance,
                    'total_required'  => $totalAmount,
                    'missing'         => $totalAmount - $currentBalance
                ]);
            }

            $newBalance = $currentBalance - $totalAmount;

            // 5. Trừ tiền ví nội bộ (BR-01)
            $stmtUpdateWallet = $db->prepare("UPDATE vi_noi_bo SET SoDu = :newBalance WHERE MaVi = :walletId");
            $stmtUpdateWallet->execute([
                'newBalance' => $newBalance,
                'walletId'   => $wallet['MaVi']
            ]);

            // 6. Tạo đơn đặt vé (don_dat_ve)
            $bookingCode = 'DON-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
            $stmtBooking = $db->prepare("
                INSERT INTO don_dat_ve (
                    MaDonHienThi, MaTaiKhoan, MaChuyen, TenKhachHang, SoDienThoaiKhach, EmailKhach,
                    NgayDat, SoLuongGhe, TongTien, PhuongThucThanhToan, TrangThaiThanhToan, TrangThaiDon, LoaiDat
                ) VALUES (
                    :code, :userId, :tripId, :custName, :custPhone, :custEmail,
                    NOW(), :seatCount, :total, 'ViNoiBo', 'DaThanhToan', 'ThanhCong', 'Online'
                )
            ");
            $stmtBooking->execute([
                'code'      => $bookingCode,
                'userId'    => $userId,
                'tripId'    => $tripId,
                'custName'  => $user['HoTen'],
                'custPhone' => $user['SoDienThoai'] ?? '',
                'custEmail' => $user['Email'] ?? '',
                'seatCount' => $seatCount,
                'total'     => $totalAmount
            ]);
            $bookingId = (int)$db->lastInsertId();

            // 7. Ghi chi tiết đặt từng ghế (chi_tiet_dat_ve) - khóa ghế (BR-02)
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

            // 8. Tạo DUY NHẤT 1 mã vé đại diện cho toàn bộ đơn (BR-05)
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

            // 9. Ghi nhận giao dịch trừ tiền ví (giao_dich_vi)
            $seatListStr = implode(', ', array_column($validSeats, 'SoGhe'));
            $stmtTransaction = $db->prepare("
                INSERT INTO giao_dich_vi (MaVi, LoaiGiaoDich, SoTien, SoDuTruoc, SoDuSau, MaDon, GhiChu)
                VALUES (:walletId, 'ThanhToanVe', :amount, :before, :after, :bookingId, :note)
            ");
            $stmtTransaction->execute([
                'walletId'  => $wallet['MaVi'],
                'amount'    => $totalAmount,
                'before'    => $currentBalance,
                'after'     => $newBalance,
                'bookingId' => $bookingId,
                'note'      => "Thanh toán vé {$ticketCode} ({$seatCount} ghế: {$seatListStr}) cho chuyến {$trip['TenTuyen']}"
            ]);

            $db->commit();

            Response::success('Đặt vé và thanh toán bằng ví nội bộ thành công!', [
                'booking_id'    => $bookingId,
                'booking_code'  => $bookingCode,
                'ticket_id'     => $ticketId,
                'ticket_code'   => $ticketCode,
                'trip'          => $trip['TenTuyen'],
                'departure'     => $trip['ThoiGianDi'],
                'seats'         => array_column($validSeats, 'SoGhe'),
                'total_amount'  => $totalAmount,
                'new_balance'   => $newBalance
            ], 201);

        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi giao dịch đặt vé: ' . $e->getMessage(), 500);
        }
    }
}

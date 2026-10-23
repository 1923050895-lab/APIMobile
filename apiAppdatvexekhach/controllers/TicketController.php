<?php
/**
 * TicketController - Xử lý Xem vé (UC-04), In vé online (UC-05), Hủy vé & Hoàn tiền 50% (UC-06)
 * Tuân thủ nghiêm ngặt các quy tắc: BR-03, BR-04, BR-05
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

class TicketController {
    /**
     * UC-04: Xem danh sách vé và lịch sử in của khách hàng
     */
    public static function myTickets(): void {
        $user = Auth::requireAuth();
        $userId = $user['MaTaiKhoan'];
        $userRole = $user['VaiTro'] ?? 'KhachHang';

        $db = Database::getConnection();

        $isAdminOrStaff = ($userRole === 'Admin' || $userRole === 'NhanVien' || $userRole === 'NhanVienQuay');
        $whereClause = $isAdminOrStaff
            ? "1=1"
            : "d.MaTaiKhoan = :userId";

        $stmt = $db->prepare("
            SELECT 
                v.MaVe, v.MaVeHienThi, v.TrangThaiVe, v.ThoiGianInDauTien, v.ThoiGianHuy, v.SoTienHoan,
                d.MaDon, d.MaDonHienThi, d.NgayDat, d.SoLuongGhe, d.TongTien,
                d.TenKhachHang, d.SoDienThoaiKhach,
                d.PhuongThucThanhToan, d.TrangThaiThanhToan, d.TrangThaiDon, d.LoaiDat,
                c.MaChuyen, c.ThoiGianDi, c.ThoiGianDen, c.GiaVe,
                t.TenTuyen, ddDi.TenDiaDiem AS TenDiemDi, ddDen.TenDiaDiem AS TenDiemDen,
                x.BienSo, x.TenXe, x.LoaiXe,
                (
                    SELECT GROUP_CONCAT(g.SoGhe ORDER BY g.SoGhe SEPARATOR ', ')
                    FROM chi_tiet_dat_ve ct
                    JOIN ghe g ON ct.MaGhe = g.MaGhe
                    WHERE ct.MaDon = d.MaDon
                ) AS DanhSachGhe
            FROM ve v
            JOIN don_dat_ve d ON v.MaDon = d.MaDon
            JOIN chuyen_xe c ON d.MaChuyen = c.MaChuyen
            JOIN tuyen_xe t ON c.MaTuyenXe = t.MaTuyenXe
            JOIN dia_diem ddDi ON t.MaDiemDi = ddDi.MaDiaDiem
            JOIN dia_diem ddDen ON t.MaDiemDen = ddDen.MaDiaDiem
            JOIN xe x ON c.MaXe = x.MaXe
            WHERE {$whereClause}
            ORDER BY d.NgayDat DESC
        ");
        $params = $isAdminOrStaff ? [] : ['userId' => $userId];
        $stmt->execute($params);
        $tickets = $stmt->fetchAll();

        Response::success('Lấy danh sách vé thành công', [
            'total'   => count($tickets),
            'tickets' => $tickets
        ]);
    }

    /**
     * Chi tiết một vé cụ thể kèm lịch sử in
     */
    public static function detail(int $ticketId): void {
        $user = Auth::requireAuth();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT 
                v.MaVe, v.MaVeHienThi, v.TrangThaiVe, v.ThoiGianInDauTien, v.ThoiGianHuy, v.SoTienHoan,
                d.MaDon, d.MaDonHienThi, d.MaTaiKhoan, d.TenKhachHang, d.SoDienThoaiKhach, d.EmailKhach,
                d.NgayDat, d.SoLuongGhe, d.TongTien, d.PhuongThucThanhToan, d.TrangThaiThanhToan, d.TrangThaiDon,
                c.MaChuyen, c.ThoiGianDi, c.ThoiGianDen, c.GiaVe,
                t.TenTuyen, ddDi.TenDiaDiem AS TenDiemDi, ddDi.DiaChi AS DiaChiDiemDi,
                ddDen.TenDiaDiem AS TenDiemDen, ddDen.DiaChi AS DiaChiDiemDen,
                x.BienSo, x.TenXe, x.LoaiXe
            FROM ve v
            JOIN don_dat_ve d ON v.MaDon = d.MaDon
            JOIN chuyen_xe c ON d.MaChuyen = c.MaChuyen
            JOIN tuyen_xe t ON c.MaTuyenXe = t.MaTuyenXe
            JOIN dia_diem ddDi ON t.MaDiemDi = ddDi.MaDiaDiem
            JOIN dia_diem ddDen ON t.MaDiemDen = ddDen.MaDiaDiem
            JOIN xe x ON c.MaXe = x.MaXe
            WHERE v.MaVe = :ticketId
        ");
        $stmt->execute(['ticketId' => $ticketId]);
        $ticket = $stmt->fetch();

        if (!$ticket) {
            Response::notFound('Không tìm thấy thông tin vé');
        }

        // Quyền xem: Chỉ chủ vé hoặc Nhân viên / Admin
        if ($user['VaiTro'] === 'KhachHang' && (int)$ticket['MaTaiKhoan'] !== (int)$user['MaTaiKhoan']) {
            Response::forbidden('Bạn không có quyền truy cập vé này');
        }

        // Lấy danh sách chi tiết các ghế
        $stmtSeats = $db->prepare("
            SELECT ct.MaChiTiet, ct.MaGhe, g.SoGhe, g.Tang, ct.DonGia, ct.TrangThaiChiTiet
            FROM chi_tiet_dat_ve ct
            JOIN ghe g ON ct.MaGhe = g.MaGhe
            WHERE ct.MaDon = :orderId
        ");
        $stmtSeats->execute(['orderId' => $ticket['MaDon']]);
        $seats = $stmtSeats->fetchAll();

        // Lấy lịch sử in
        $stmtHistory = $db->prepare("
            SELECT l.MaLichSuIn, l.ThoiGianIn, l.SoLanIn, l.GhiChu, t.HoTen AS NguoiThaoTac, t.VaiTro
            FROM lich_su_in_ve l
            JOIN taikhoan t ON l.MaTaiKhoanThaoTac = t.MaTaiKhoan
            WHERE l.MaVe = :ticketId
            ORDER BY l.ThoiGianIn DESC
        ");
        $stmtHistory->execute(['ticketId' => $ticketId]);
        $printHistory = $stmtHistory->fetchAll();

        $ticket['DanhSachGhe'] = $seats;
        $ticket['LichSuIn'] = $printHistory;

        Response::success('Lấy chi tiết vé thành công', $ticket);
    }

    /**
     * UC-05: In vé online (BR-03, BR-05)
     * Đánh dấu trạng thái Đã In -> Kể từ thời điểm này, vé KHÔNG THỂ HỦY
     */
    public static function printOnline(int $ticketId): void {
        $user = Auth::requireAuth();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT v.MaVe, v.MaVeHienThi, v.TrangThaiVe, v.ThoiGianInDauTien,
                   d.MaDon, d.MaDonHienThi, d.TenKhachHang, d.SoDienThoaiKhach, d.MaTaiKhoan, d.TrangThaiThanhToan, d.TongTien,
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

        if ($user['VaiTro'] === 'KhachHang' && (int)$ticket['MaTaiKhoan'] !== (int)$user['MaTaiKhoan']) {
            Response::forbidden('Bạn không có quyền in vé của người khác');
        }

        if ($ticket['TrangThaiThanhToan'] !== 'DaThanhToan') {
            Response::error('Vé chưa được thanh toán thành công, không thể in');
        }

        if ($ticket['TrangThaiVe'] === 'DaHuy') {
            Response::error('Vé này đã bị hủy, không thể in');
        }

        try {
            $db->beginTransaction();

            // Đếm số lần in trước đó
            $stmtCount = $db->prepare("SELECT COUNT(*) FROM lich_su_in_ve WHERE MaVe = :ticketId");
            $stmtCount->execute(['ticketId' => $ticketId]);
            $printCount = (int)$stmtCount->fetchColumn() + 1;

            // Cập nhật trạng thái vé thành 'DaIn' (BR-03)
            $stmtUpdate = $db->prepare("
                UPDATE ve 
                SET TrangThaiVe = 'DaIn',
                    ThoiGianInDauTien = IFNULL(ThoiGianInDauTien, NOW())
                WHERE MaVe = :ticketId
            ");
            $stmtUpdate->execute(['ticketId' => $ticketId]);

            // Ghi nhận lịch sử in (lich_su_in_ve)
            $stmtLog = $db->prepare("
                INSERT INTO lich_su_in_ve (MaVe, MaTaiKhoanThaoTac, ThoiGianIn, SoLanIn, GhiChu)
                VALUES (:ticketId, :userId, NOW(), :count, 'Khách hàng in vé trực tuyến')
            ");
            $stmtLog->execute([
                'ticketId' => $ticketId,
                'userId'   => $user['MaTaiKhoan'],
                'count'    => $printCount
            ]);

            $db->commit();

            // Lấy danh sách toàn bộ ghế trên vé (BR-05: 1 vé chứa tất cả ghế)
            $stmtSeats = $db->prepare("
                SELECT g.SoGhe 
                FROM chi_tiet_dat_ve ct
                JOIN ghe g ON ct.MaGhe = g.MaGhe
                WHERE ct.MaDon = :orderId
            ");
            $stmtSeats->execute(['orderId' => $ticket['MaDon']]);
            $seats = $stmtSeats->fetchAll(PDO::FETCH_COLUMN);

            Response::success('In vé thành công! (Lưu ý: Vé đã in sẽ không thể hủy hoặc hoàn tiền theo quy định)', [
                'ticket_id'        => $ticket['MaVe'],
                'ticket_code'      => $ticket['MaVeHienThi'],
                'MaVe'             => $ticket['MaVe'],
                'MaVeHienThi'      => $ticket['MaVeHienThi'],
                'MaQR'             => $ticket['MaVeHienThi'],
                'trip'             => $ticket['TenTuyen'],
                'TenTuyen'         => $ticket['TenTuyen'],
                'bus_number'       => $ticket['BienSo'],
                'BienSo'           => $ticket['BienSo'],
                'TenXe'            => $ticket['TenXe'],
                'departure'        => $ticket['ThoiGianDi'],
                'ThoiGianDi'       => $ticket['ThoiGianDi'],
                'seats'            => $seats,
                'DanhSachGhe'      => implode(', ', $seats),
                'total_seats'      => count($seats),
                'total_amount'     => $ticket['TongTien'],
                'TongTien'         => $ticket['TongTien'],
                'customer_name'    => $ticket['TenKhachHang'],
                'TenKhachHang'     => $ticket['TenKhachHang'],
                'customer_phone'   => $ticket['SoDienThoaiKhach'],
                'SoDienThoaiKhach' => $ticket['SoDienThoaiKhach'],
                'print_count'      => $printCount,
                'status'           => 'DaIn',
                'TrangThaiVe'      => 'DaIn',
                'cancellable'      => false
            ]);

        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi khi thao tác in vé: ' . $e->getMessage(), 500);
        }
    }

    /**
     * UC-06: Hủy vé và hoàn lại 50% giá trị vé vào ví nội bộ (BR-03, BR-04)
     */
    public static function cancel(int $ticketId): void {
        $user = Auth::requireAuth();
        $db = Database::getConnection();

        try {
            $db->beginTransaction();

            // Khóa bản ghi vé và đơn để kiểm tra đồng thời
            $stmt = $db->prepare("
                SELECT v.MaVe, v.MaVeHienThi, v.TrangThaiVe, v.ThoiGianInDauTien,
                       d.MaDon, d.MaDonHienThi, d.MaTaiKhoan, d.TongTien, d.TrangThaiDon, d.MaChuyen,
                       c.ThoiGianDi,
                       w.MaVi, w.SoDu
                FROM ve v
                JOIN don_dat_ve d ON v.MaDon = d.MaDon
                JOIN chuyen_xe c ON d.MaChuyen = c.MaChuyen
                JOIN vi_noi_bo w ON d.MaTaiKhoan = w.MaTaiKhoan
                WHERE v.MaVe = :ticketId
                FOR UPDATE
            ");
            $stmt->execute(['ticketId' => $ticketId]);
            $ticket = $stmt->fetch();

            if (!$ticket) {
                $db->rollBack();
                Response::notFound('Không tìm thấy vé cần hủy');
            }

            // Quyền: Chỉ chủ vé mới được hủy
            if ($user['VaiTro'] === 'KhachHang' && (int)$ticket['MaTaiKhoan'] !== (int)$user['MaTaiKhoan']) {
                $db->rollBack();
                Response::forbidden('Bạn không thể hủy vé của tài khoản khác');
            }

            // [BR-03]: Vé đã in TUYỆT ĐỐI KHÔNG THỂ HỦY HOÀN TIỀN
            if ($ticket['TrangThaiVe'] === 'DaIn' || !empty($ticket['ThoiGianInDauTien'])) {
                $db->rollBack();
                Response::error('Theo quy định (BR-03), vé đã in không thể hủy hoặc hoàn tiền dưới bất kỳ hình thức nào!', 400, [
                    'ticket_status'   => 'DaIn',
                    'first_printed_at'=> $ticket['ThoiGianInDauTien']
                ]);
            }

            // Kiểm tra thời gian khởi hành: Đã quá giờ xuất phát thì KHÔNG THỂ HỦY VÉ
            if (!empty($ticket['ThoiGianDi'])) {
                $departureTimestamp = strtotime($ticket['ThoiGianDi']);
                if ($departureTimestamp !== false && time() >= $departureTimestamp) {
                    $db->rollBack();
                    Response::error('Chuyến xe đã khởi hành vào lúc ' . $ticket['ThoiGianDi'] . '. Bạn không thể hủy vé sau khi xe đã xuất phát!', 400, [
                        'departure_time' => $ticket['ThoiGianDi'],
                        'current_time'   => date('Y-m-d H:i:s')
                    ]);
                }
            }

            // Chống hủy lần 2
            if ($ticket['TrangThaiVe'] === 'DaHuy' || $ticket['TrangThaiDon'] === 'DaHuy') {
                $db->rollBack();
                Response::error('Vé này đã được hủy trước đó, không thể thực hiện hoàn tiền lần hai', 400);
            }

            // [BR-04]: Hủy vé hợp lệ hoàn lại đúng 50% giá trị vé vào ví
            $totalAmount = (float)$ticket['TongTien'];
            $refundAmount = round($totalAmount * 0.5, 2);
            $currentWalletBalance = (float)$ticket['SoDu'];
            $newWalletBalance = $currentWalletBalance + $refundAmount;

            // 1. Cập nhật trạng thái vé
            $stmtCancelTicket = $db->prepare("
                UPDATE ve 
                SET TrangThaiVe = 'DaHuy',
                    ThoiGianHuy = NOW(),
                    SoTienHoan = :refund
                WHERE MaVe = :ticketId
            ");
            $stmtCancelTicket->execute([
                'refund'   => $refundAmount,
                'ticketId' => $ticketId
            ]);

            // 2. Cập nhật trạng thái đơn đặt vé
            $stmtCancelOrder = $db->prepare("UPDATE don_dat_ve SET TrangThaiDon = 'DaHuy' WHERE MaDon = :orderId");
            $stmtCancelOrder->execute(['orderId' => $ticket['MaDon']]);

            // 3. Giải phóng toàn bộ ghế (cập nhật chi_tiet_dat_ve thành 'DaHuy')
            $stmtReleaseSeats = $db->prepare("UPDATE chi_tiet_dat_ve SET TrangThaiChiTiet = 'DaHuy' WHERE MaDon = :orderId");
            $stmtReleaseSeats->execute(['orderId' => $ticket['MaDon']]);

            // 4. Cộng 50% tiền vào ví nội bộ của khách hàng (BR-04)
            $stmtRefundWallet = $db->prepare("UPDATE vi_noi_bo SET SoDu = :newBalance WHERE MaVi = :walletId");
            $stmtRefundWallet->execute([
                'newBalance' => $newWalletBalance,
                'walletId'   => $ticket['MaVi']
            ]);

            // 5. Ghi nhận giao dịch hoàn tiền trong lịch sử ví
            $stmtLogWallet = $db->prepare("
                INSERT INTO giao_dich_vi (MaVi, LoaiGiaoDich, SoTien, SoDuTruoc, SoDuSau, MaDon, GhiChu)
                VALUES (:walletId, 'HoanTien', :amount, :before, :after, :orderId, :note)
            ");
            $stmtLogWallet->execute([
                'walletId' => $ticket['MaVi'],
                'amount'   => $refundAmount,
                'before'   => $currentWalletBalance,
                'after'    => $newWalletBalance,
                'orderId'  => $ticket['MaDon'],
                'note'     => "Hoàn 50% tiền vé {$ticket['MaVeHienThi']} do hủy vé trước khi in (Giá trị đơn: " . number_format($totalAmount, 0, ',', '.') . "đ)"
            ]);

            $db->commit();

            Response::success('Hủy vé thành công! Đã hoàn lại 50% giá trị vé vào ví nội bộ của bạn', [
                'ticket_code'     => $ticket['MaVeHienThi'],
                'total_amount'    => $totalAmount,
                'refund_amount'   => $refundAmount,
                'refund_percent'  => '50%',
                'new_wallet_balance' => $newWalletBalance,
                'seats_released'  => true
            ]);

        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi khi hủy vé: ' . $e->getMessage(), 500);
        }
    }
}

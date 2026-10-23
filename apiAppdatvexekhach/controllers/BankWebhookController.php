<?php
/**
 * BankWebhookController - Xử lý nạp tiền tự động vào ví nội bộ qua biến động số dư ngân hàng (UC-14)
 * Tuân thủ quy tắc: BR-10 (Chống xử lý lặp, bảo đảm tính idempotent)
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

class BankWebhookController {
    /**
     * UC-14: Webhook nạp tiền tự động từ dữ liệu chuyển khoản ngân hàng
     */
    public static function processDeposit(array $data): void {
        $bankRef = trim($data['MaThamChieuNganHang'] ?? '');
        $content = trim($data['NoiDungChuyenKhoan'] ?? '');
        $amount  = (float)($data['SoTien'] ?? 0);

        if (empty($bankRef) || empty($content) || $amount <= 0) {
            Response::error('Dữ liệu giao dịch ngân hàng không hợp lệ (thiếu mã tham chiếu, nội dung hoặc số tiền <= 0)');
        }

        $db = Database::getConnection();

        // 1. Kiểm tra idempotent: Giao dịch này đã từng được quét/ghi nhận chưa? (BR-10, TC-09)
        $stmtCheck = $db->prepare("SELECT MaGiaoDichNH, TrangThaiXuLy FROM giao_dich_ngan_hang WHERE MaThamChieuNganHang = :ref");
        $stmtCheck->execute(['ref' => $bankRef]);
        $existing = $stmtCheck->fetch();

        if ($existing) {
            if ($existing['TrangThaiXuLy'] === 'ThanhCong') {
                Response::error("Giao dịch tham chiếu {$bankRef} đã được xử lý và cộng tiền trước đó. Bỏ qua chống lặp!", 409, [
                    'idempotent' => true,
                    'bank_ref'   => $bankRef
                ]);
            } else {
                Response::error("Giao dịch tham chiếu {$bankRef} đã tồn tại nhưng ở trạng thái: {$existing['TrangThaiXuLy']}", 400);
            }
        }

        // 2. Phân tích nội dung chuyển khoản để tìm tài khoản người nhận
        // Cú pháp hỗ trợ: "NAPVI <MaTaiKhoan>" hoặc "NAPVI <TenDangNhap>" hoặc "NAP <ID>"
        $targetUser = null;
        if (preg_match('/NAP(?:VI)?\s*([a-zA-Z0-9_]+)/i', $content, $matches)) {
            $identifier = trim($matches[1]);

            // Thử tìm theo ID số hoặc theo Tên đăng nhập / Số điện thoại
            $stmtFind = $db->prepare("
                SELECT t.MaTaiKhoan, t.TenDangNhap, t.HoTen, v.MaVi, v.SoDu
                FROM taikhoan t
                JOIN vi_noi_bo v ON t.MaTaiKhoan = v.MaTaiKhoan
                WHERE t.MaTaiKhoan = :idVal OR t.TenDangNhap = :idStr1 OR t.SoDienThoai = :idStr2
                LIMIT 1
            ");
            $stmtFind->execute([
                'idVal'  => is_numeric($identifier) ? (int)$identifier : 0,
                'idStr1' => $identifier,
                'idStr2' => $identifier
            ]);
            $targetUser = $stmtFind->fetch();
        }

        // Nếu cú pháp không đúng hoặc không tìm thấy tài khoản
        if (!$targetUser) {
            $stmtLogFail = $db->prepare("
                INSERT INTO giao_dich_ngan_hang (
                    MaThamChieuNganHang, NoiDungChuyenKhoan, SoTien, ThoiGianGiaoDich,
                    MaTaiKhoanDuKien, TrangThaiXuLy, ThoiGianXuLy, GhiChu
                ) VALUES (
                    :ref, :content, :amount, NOW(), NULL, 'SaiCuPhap', NOW(), 'Không phân tích được tài khoản hợp lệ từ nội dung'
                )
            ");
            $stmtLogFail->execute([
                'ref'     => $bankRef,
                'content' => $content,
                'amount'  => $amount
            ]);

            Response::error('Nội dung chuyển khoản sai cú pháp hoặc không tìm thấy tài khoản để cộng tiền', 422, [
                'syntax_expected' => 'NAPVI <MaTaiKhoan>',
                'content_received'=> $content
            ]);
        }

        // 3. Tiến hành cộng tiền vào ví trong Transaction
        try {
            $db->beginTransaction();

            // Khóa ví của tài khoản
            $stmtLockWallet = $db->prepare("SELECT MaVi, SoDu FROM vi_noi_bo WHERE MaVi = :walletId FOR UPDATE");
            $stmtLockWallet->execute(['walletId' => $targetUser['MaVi']]);
            $wallet = $stmtLockWallet->fetch();

            $currentBalance = (float)$wallet['SoDu'];
            $newBalance = $currentBalance + $amount;

            // Cộng tiền vào ví
            $stmtUpdateWallet = $db->prepare("UPDATE vi_noi_bo SET SoDu = :newBalance WHERE MaVi = :walletId");
            $stmtUpdateWallet->execute([
                'newBalance' => $newBalance,
                'walletId'   => $wallet['MaVi']
            ]);

            // Ghi nhận biến động số dư ví (giao_dich_vi)
            $stmtLogWallet = $db->prepare("
                INSERT INTO giao_dich_vi (MaVi, LoaiGiaoDich, SoTien, SoDuTruoc, SoDuSau, MaDon, GhiChu)
                VALUES (:walletId, 'NapTien', :amount, :before, :after, NULL, :note)
            ");
            $stmtLogWallet->execute([
                'walletId' => $wallet['MaVi'],
                'amount'   => $amount,
                'before'   => $currentBalance,
                'after'    => $newBalance,
                'note'     => "Nạp tiền tự động qua ngân hàng. Mã GD: {$bankRef} (Nội dung: {$content})"
            ]);

            // Ghi nhận bảng giao dịch ngân hàng ở trạng thái 'ThanhCong'
            $stmtLogBank = $db->prepare("
                INSERT INTO giao_dich_ngan_hang (
                    MaThamChieuNganHang, NoiDungChuyenKhoan, SoTien, ThoiGianGiaoDich,
                    MaTaiKhoanDuKien, TrangThaiXuLy, ThoiGianXuLy, GhiChu
                ) VALUES (
                    :ref, :content, :amount, NOW(), :userId, 'ThanhCong', NOW(), 'Đã cộng tiền vào ví nội bộ thành công'
                )
            ");
            $stmtLogBank->execute([
                'ref'     => $bankRef,
                'content' => $content,
                'amount'  => $amount,
                'userId'  => $targetUser['MaTaiKhoan']
            ]);

            $db->commit();

            Response::success('Xử lý nạp tiền tự động thành công!', [
                'bank_ref'        => $bankRef,
                'account_id'      => $targetUser['MaTaiKhoan'],
                'customer_name'   => $targetUser['HoTen'],
                'amount_added'    => $amount,
                'new_balance'     => $newBalance,
                'status'          => 'ThanhCong'
            ]);

        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi khi xử lý nạp tiền ngân hàng: ' . $e->getMessage(), 500);
        }
    }
}

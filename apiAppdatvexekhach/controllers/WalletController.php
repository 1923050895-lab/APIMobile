<?php
/**
 * WalletController - Quản lý số dư và lịch sử giao dịch ví nội bộ (BR-01, BR-04)
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

class WalletController {
    /**
     * Lấy số dư ví hiện tại và tóm tắt giao dịch gần đây
     */
    public static function getBalance(): void {
        $user = Auth::requireAuth();
        $userId = $user['MaTaiKhoan'];

        $db = Database::getConnection();

        $stmtWallet = $db->prepare("SELECT MaVi, SoDu, NgayCapNhat FROM vi_noi_bo WHERE MaTaiKhoan = :userId");
        $stmtWallet->execute(['userId' => $userId]);
        $wallet = $stmtWallet->fetch();

        if (!$wallet) {
            $stmtInit = $db->prepare("INSERT INTO vi_noi_bo (MaTaiKhoan, SoDu) VALUES (:userId, 0.00)");
            $stmtInit->execute(['userId' => $userId]);
            $wallet = [
                'MaVi'        => (int)$db->lastInsertId(),
                'SoDu'        => 0.00,
                'NgayCapNhat' => date('Y-m-d H:i:s')
            ];
        }

        // Lấy 5 giao dịch gần nhất
        $stmtRecent = $db->prepare("
            SELECT MaGiaoDich, LoaiGiaoDich, SoTien, SoDuTruoc, SoDuSau, ThoiGian, GhiChu
            FROM giao_dich_vi
            WHERE MaVi = :walletId
            ORDER BY ThoiGian DESC
            LIMIT 5
        ");
        $stmtRecent->execute(['walletId' => $wallet['MaVi']]);
        $recentTransactions = $stmtRecent->fetchAll();

        Response::success('Lấy số dư ví thành công', [
            'wallet_id'           => (int)$wallet['MaVi'],
            'balance'             => (float)$wallet['SoDu'],
            'SoDu'                => (float)$wallet['SoDu'],
            'SoDuVi'              => (float)$wallet['SoDu'],
            'formatted_balance'   => number_format((float)$wallet['SoDu'], 0, ',', '.') . ' đ',
            'updated_at'          => $wallet['NgayCapNhat'],
            'deposit_syntax'      => "NAPVI {$userId}", // Cú pháp chuyển khoản nạp tiền tự động
            'recent_transactions' => $recentTransactions
        ]);
    }

    /**
     * Xem toàn bộ lịch sử biến động số dư ví
     */
    public static function getTransactions(): void {
        $user = Auth::requireAuth();
        $userId = $user['MaTaiKhoan'];

        $db = Database::getConnection();

        $stmtWallet = $db->prepare("SELECT MaVi FROM vi_noi_bo WHERE MaTaiKhoan = :userId");
        $stmtWallet->execute(['userId' => $userId]);
        $wallet = $stmtWallet->fetch();

        if (!$wallet) {
            Response::notFound('Không tìm thấy ví nội bộ');
        }

        $stmt = $db->prepare("
            SELECT g.MaGiaoDich, g.LoaiGiaoDich, g.SoTien, g.SoDuTruoc, g.SoDuSau, g.ThoiGian, g.GhiChu,
                   d.MaDonHienThi
            FROM giao_dich_vi g
            LEFT JOIN don_dat_ve d ON g.MaDon = d.MaDon
            WHERE g.MaVi = :walletId
            ORDER BY g.ThoiGian DESC
        ");
        $stmt->execute(['walletId' => $wallet['MaVi']]);
        $transactions = $stmt->fetchAll();

        Response::success('Lấy lịch sử giao dịch ví thành công', [
            'total'        => count($transactions),
            'transactions' => $transactions
        ]);
    }

    /**
     * Tạo yêu cầu nạp tiền VietQR (Chờ Admin duyệt)
     * Thông tin thụ hưởng: NGUYEN MANH CUONG - STK: 1041002875 - Vietcombank
     */
    public static function createDepositRequest(array $data): void {
        $user = Auth::requireAuth();
        $userId = $user['MaTaiKhoan'];

        $amount = (float)($data['SoTien'] ?? 0);
        if ($amount < 10000) {
            Response::error('Số tiền nạp tối thiểu là 10.000 đ');
        }

        $db = Database::getConnection();

        $requestCode = 'NAP-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        $content = "NAPVI {$userId} {$requestCode}";
        $bankName = 'Vietcombank';
        $accountNo = '1041002875';
        $accountName = 'NGUYEN MANH CUONG';

        $stmt = $db->prepare("
            INSERT INTO yeu_cau_nap_tien (
                MaYeuCauHienThi, MaTaiKhoan, SoTien, NoiDungChuyenKhoan,
                NganHang, SoTaiKhoanNhan, TenTaiKhoanNhan, TrangThai, NgayTao
            ) VALUES (
                :code, :userId, :amount, :content,
                :bank, :accNo, :accName, 'ChoDuyet', NOW()
            )
        ");
        $stmt->execute([
            'code'    => $requestCode,
            'userId'  => $userId,
            'amount'  => $amount,
            'content' => $content,
            'bank'    => $bankName,
            'accNo'   => $accountNo,
            'accName' => $accountName
        ]);
        $requestId = (int)$db->lastInsertId();

        // Tạo link VietQR chuẩn động
        $encodedName = rawurlencode($accountName);
        $encodedContent = rawurlencode($content);
        $vietQrUrl = "https://img.vietqr.io/image/vietcombank-{$accountNo}-compact2.png?amount={$amount}&addInfo={$encodedContent}&accountName={$encodedName}";

        Response::success('Tạo yêu cầu nạp tiền thành công! Vui lòng quét mã QR để chuyển khoản. Admin sẽ duyệt và cộng tiền vào ví của bạn.', [
            'request_id'     => $requestId,
            'request_code'   => $requestCode,
            'amount'         => $amount,
            'amount_formatted'=> number_format($amount, 0, ',', '.') . ' đ',
            'bank_name'      => $bankName,
            'account_no'     => $accountNo,
            'account_name'   => $accountName,
            'transfer_content'=> $content,
            'vietqr_url'     => $vietQrUrl,
            'status'         => 'ChoDuyet',
            'note'           => 'Sau khi chuyển khoản thành công, vui lòng giữ màn hình hoặc theo dõi trạng thái. Tiền sẽ được cộng vào ví ngay sau khi Admin duyệt.'
        ], 201);
    }

    /**
     * Xem danh sách các yêu cầu nạp tiền của người dùng hiện tại
     */
    public static function myDepositRequests(): void {
        $user = Auth::requireAuth();
        $userId = $user['MaTaiKhoan'];

        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT y.*, adm.HoTen AS TenAdminDuyet
            FROM yeu_cau_nap_tien y
            LEFT JOIN taikhoan adm ON y.MaAdminDuyet = adm.MaTaiKhoan
            WHERE y.MaTaiKhoan = :userId
            ORDER BY y.NgayTao DESC
        ");
        $stmt->execute(['userId' => $userId]);
        $requests = $stmt->fetchAll();

        Response::success('Lấy danh sách yêu cầu nạp tiền thành công', [
            'total'    => count($requests),
            'requests' => $requests
        ]);
    }
}


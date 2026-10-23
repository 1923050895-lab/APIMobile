<?php
/**
 * AuthController - Xử lý đăng ký, đăng nhập và thông tin tài khoản
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

class AuthController {
    public static function register(array $data): void {
        $username = trim($data['TenDangNhap'] ?? '');
        $password = trim($data['MatKhau'] ?? '');
        $fullName = trim($data['HoTen'] ?? '');
        $phone    = trim($data['SoDienThoai'] ?? '');
        $email    = trim($data['Email'] ?? '');

        if (empty($username) || empty($password) || empty($fullName)) {
            Response::error('Vui lòng cung cấp Tên đăng nhập, Mật khẩu và Họ tên');
        }

        if (strlen($password) < 6) {
            Response::error('Mật khẩu phải có ít nhất 6 ký tự');
        }

        $db = Database::getConnection();

        // Kiểm tra xem tên đăng nhập đã tồn tại chưa
        $stmt = $db->prepare("SELECT MaTaiKhoan FROM taikhoan WHERE TenDangNhap = :username");
        $stmt->execute(['username' => $username]);
        if ($stmt->fetch()) {
            Response::error('Tên đăng nhập đã tồn tại trên hệ thống');
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        try {
            $db->beginTransaction();

            // Tạo tài khoản (mặc định vai trò KhachHang)
            $stmt = $db->prepare("
                INSERT INTO taikhoan (TenDangNhap, MatKhau, HoTen, SoDienThoai, Email, VaiTro, TrangThai)
                VALUES (:u, :p, :name, :phone, :email, 'KhachHang', 'HoatDong')
            ");
            $stmt->execute([
                'u'     => $username,
                'p'     => $passwordHash,
                'name'  => $fullName,
                'phone' => $phone,
                'email' => $email
            ]);
            $userId = (int)$db->lastInsertId();

            // Khởi tạo ví nội bộ tương ứng (BR-01)
            $stmtWallet = $db->prepare("INSERT INTO vi_noi_bo (MaTaiKhoan, SoDu) VALUES (:userId, 0.00)");
            $stmtWallet->execute(['userId' => $userId]);
            $walletId = (int)$db->lastInsertId();

            $db->commit();

            $userData = [
                'MaTaiKhoan'  => $userId,
                'TenDangNhap' => $username,
                'HoTen'       => $fullName,
                'VaiTro'      => 'KhachHang',
                'MaVi'        => $walletId,
                'SoDu'        => 0.00,
                'SoDuVi'      => 0.00,
                'balance'     => 0.00
            ];
            $token = Auth::generateToken($userData);

            Response::success('Đăng ký tài khoản thành công', [
                'token' => $token,
                'user'  => $userData
            ], 201);
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi khi đăng ký tài khoản: ' . $e->getMessage(), 500);
        }
    }

    public static function login(array $data): void {
        $username = trim($data['TenDangNhap'] ?? '');
        $password = trim($data['MatKhau'] ?? '');

        if (empty($username) || empty($password)) {
            Response::error('Vui lòng nhập Tên đăng nhập và Mật khẩu');
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT t.MaTaiKhoan, t.TenDangNhap, t.MatKhau, t.HoTen, t.SoDienThoai, t.Email, t.VaiTro, t.TrangThai,
                   v.MaVi, IFNULL(v.SoDu, 0.00) AS SoDu
            FROM taikhoan t
            LEFT JOIN vi_noi_bo v ON t.MaTaiKhoan = v.MaTaiKhoan
            WHERE t.TenDangNhap = :u
        ");
        $stmt->execute(['u' => $username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['MatKhau'])) {
            Response::error('Tên đăng nhập hoặc mật khẩu không chính xác', 401);
        }

        if ($user['TrangThai'] !== 'HoatDong') {
            Response::error('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động', 403);
        }

        // Tự khởi tạo ví nếu tài khoản chưa có
        $walletId = (int)($user['MaVi'] ?? 0);
        $balance = (float)($user['SoDu'] ?? 0.00);
        if (empty($walletId)) {
            $stmtWallet = $db->prepare("INSERT INTO vi_noi_bo (MaTaiKhoan, SoDu) VALUES (:userId, 0.00)");
            $stmtWallet->execute(['userId' => $user['MaTaiKhoan']]);
            $walletId = (int)$db->lastInsertId();
            $balance = 0.00;
        }

        $userData = [
            'MaTaiKhoan'  => (int)$user['MaTaiKhoan'],
            'TenDangNhap' => $user['TenDangNhap'],
            'HoTen'       => $user['HoTen'],
            'SoDienThoai' => $user['SoDienThoai'],
            'Email'       => $user['Email'],
            'VaiTro'      => $user['VaiTro'],
            'MaVi'        => $walletId,
            'SoDu'        => $balance,
            'SoDuVi'      => $balance,
            'balance'     => $balance
        ];

        $token = Auth::generateToken($userData);

        Response::success('Đăng nhập thành công', [
            'token' => $token,
            'user'  => $userData
        ]);
    }

    public static function profile(): void {
        $user = Auth::requireAuth();
        unset($user['MatKhau']);
        $user['SoDu']    = (float)($user['SoDu'] ?? 0);
        $user['SoDuVi']  = (float)($user['SoDu'] ?? 0);
        $user['balance'] = (float)($user['SoDu'] ?? 0);
        Response::success('Lấy thông tin tài khoản thành công', $user);
    }

    public static function updateProfile(array $body): void {
        $currentUser = Auth::requireAuth();
        $userId = (int)$currentUser['MaTaiKhoan'];

        $hoTen = trim($body['HoTen'] ?? '');
        $sdt   = trim($body['SoDienThoai'] ?? '');
        $email = trim($body['Email'] ?? '');

        if (empty($hoTen)) {
            Response::error('Họ và tên không được để trống');
        }
        if (empty($sdt)) {
            Response::error('Số điện thoại không được để trống');
        }

        $db = Database::getConnection();

        // Kiểm tra xem số điện thoại có bị trùng với tài khoản khác không
        $stmtCheck = $db->prepare("SELECT MaTaiKhoan FROM taikhoan WHERE SoDienThoai = :sdt AND MaTaiKhoan != :userId");
        $stmtCheck->execute(['sdt' => $sdt, 'userId' => $userId]);
        if ($stmtCheck->fetch()) {
            Response::error('Số điện thoại này đã được sử dụng bởi tài khoản khác');
        }

        // Kiểm tra email nếu có
        if (!empty($email)) {
            $stmtCheckEmail = $db->prepare("SELECT MaTaiKhoan FROM taikhoan WHERE Email = :email AND MaTaiKhoan != :userId");
            $stmtCheckEmail->execute(['email' => $email, 'userId' => $userId]);
            if ($stmtCheckEmail->fetch()) {
                Response::error('Email này đã được sử dụng bởi tài khoản khác');
            }
        }

        // Cập nhật thông tin vào DB
        $stmtUpdate = $db->prepare("
            UPDATE taikhoan 
            SET HoTen = :hoTen, SoDienThoai = :sdt, Email = :email 
            WHERE MaTaiKhoan = :userId
        ");
        $stmtUpdate->execute([
            'hoTen'  => $hoTen,
            'sdt'    => $sdt,
            'email'  => !empty($email) ? $email : null,
            'userId' => $userId
        ]);

        // Lấy lại thông tin mới nhất
        $stmt = $db->prepare("
            SELECT t.MaTaiKhoan, t.TenDangNhap, t.HoTen, t.SoDienThoai, t.Email, t.VaiTro, t.TrangThai,
                   v.MaVi, IFNULL(v.SoDu, 0.00) AS SoDu
            FROM taikhoan t
            LEFT JOIN vi_noi_bo v ON t.MaTaiKhoan = v.MaTaiKhoan
            WHERE t.MaTaiKhoan = :userId
        ");
        $stmt->execute(['userId' => $userId]);
        $updated = $stmt->fetch();

        $balance = (float)($updated['SoDu'] ?? 0.00);
        $userData = [
            'MaTaiKhoan'  => (int)$updated['MaTaiKhoan'],
            'TenDangNhap' => $updated['TenDangNhap'],
            'HoTen'       => $updated['HoTen'],
            'SoDienThoai' => $updated['SoDienThoai'],
            'Email'       => $updated['Email'],
            'VaiTro'      => $updated['VaiTro'],
            'TrangThai'   => $updated['TrangThai'],
            'MaVi'        => (int)($updated['MaVi'] ?? 0),
            'SoDu'        => $balance,
            'SoDuVi'      => $balance,
            'balance'     => $balance
        ];

        Response::success('Cập nhật thông tin cá nhân thành công', $userData);
    }
}

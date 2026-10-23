<?php
/**
 * Auth Helper - Quản lý Token & Phân quyền người dùng (Role-Based Access Control)
 */

require_once __DIR__ . '/response.php';
require_once __DIR__ . '/../config/database.php';

class Auth {
    private static string $secretKey = 've_xe_khach_secure_jwt_token_secret_2026_xyz';
    private static ?array $currentUser = null;

    /**
     * Tạo Token HMAC-SHA256 đơn giản và an toàn (không cần cài thêm thư viện JWT ngoài)
     */
    public static function generateToken(array $userData, int $ttlSeconds = 86400 * 7): string {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $payload = [
            'id'       => $userData['MaTaiKhoan'],
            'username' => $userData['TenDangNhap'],
            'role'     => $userData['VaiTro'],
            'exp'      => time() + $ttlSeconds
        ];

        $base64Header = self::base64UrlEncode(json_encode($header));
        $base64Payload = self::base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', "$base64Header.$base64Payload", self::$secretKey, true);
        $base64Signature = self::base64UrlEncode($signature);

        return "$base64Header.$base64Payload.$base64Signature";
    }

    /**
     * Xác thực Token từ header Authorization
     */
    public static function user(): ?array {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }

        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        } else {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        }

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return null;
        }

        $jwt = $matches[1];
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) !== 3) {
            return null;
        }

        [$base64Header, $base64Payload, $base64Signature] = $tokenParts;

        $signature = hash_hmac('sha256', "$base64Header.$base64Payload", self::$secretKey, true);
        $expectedSignature = self::base64UrlEncode($signature);

        if (!hash_equals($expectedSignature, $base64Signature)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($base64Payload), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        // Lấy thông tin tài khoản tươi mới nhất từ Database
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT t.MaTaiKhoan, t.TenDangNhap, t.HoTen, t.SoDienThoai, t.Email, t.VaiTro, t.TrangThai,
                   v.MaVi, IFNULL(v.SoDu, 0.00) AS SoDu, IFNULL(v.SoDu, 0.00) AS SoDuVi
            FROM taikhoan t
            LEFT JOIN vi_noi_bo v ON t.MaTaiKhoan = v.MaTaiKhoan
            WHERE t.MaTaiKhoan = :id
        ");
        $stmt->execute(['id' => $payload['id']]);
        $user = $stmt->fetch();

        if (!$user || $user['TrangThai'] !== 'HoatDong') {
            return null;
        }

        // Tự động khởi tạo ví nếu tài khoản chưa có ví
        if (empty($user['MaVi'])) {
            $stmtInit = $db->prepare("INSERT INTO vi_noi_bo (MaTaiKhoan, SoDu) VALUES (:uid, 0.00)");
            $stmtInit->execute(['uid' => $user['MaTaiKhoan']]);
            $user['MaVi'] = (int)$db->lastInsertId();
            $user['SoDu'] = 0.00;
            $user['SoDuVi'] = 0.00;
        }

        $user['SoDu'] = (float)$user['SoDu'];
        $user['SoDuVi'] = (float)$user['SoDuVi'];

        self::$currentUser = $user;
        return self::$currentUser;
    }

    /**
     * Yêu cầu người dùng bắt buộc phải đăng nhập
     */
    public static function requireAuth(): array {
        $user = self::user();
        if (!$user) {
            Response::unauthorized('Yêu cầu đăng nhập hoặc token không hợp lệ / hết hạn');
        }
        return $user;
    }

    /**
     * Yêu cầu vai trò cụ thể (VD: ['Admin'], ['NhanVien', 'Admin'])
     */
    public static function requireRole(array $allowedRoles): array {
        $user = self::requireAuth();
        if (!in_array($user['VaiTro'], $allowedRoles, true)) {
            Response::forbidden('Quyền hạn của bạn (' . $user['VaiTro'] . ') không thể thực hiện chức năng này');
        }
        return $user;
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

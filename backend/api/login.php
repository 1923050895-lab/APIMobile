<?php

session_set_cookie_params([
    'httponly' => true,
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Lax'
]);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

function respond($success, $message, $data = [], $status = 200) {
    http_response_code($status);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Chi chap nhan POST', [], 405);
}

require_once __DIR__ . '/../config/db.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input) || json_last_error() !== JSON_ERROR_NONE) {
        respond(false, 'JSON khong hop le', [], 400);
    }

    $tenDangNhap = trim($input['tenDangNhap'] ?? '');
    $matKhau = $input['matKhau'] ?? '';

    if ($tenDangNhap === '' || !is_string($matKhau) || $matKhau === '') {
        respond(false, 'Vui long nhap ten dang nhap va mat khau', [], 400);
    }

    $database = new Database();
    $conn = $database->getConnection();

    $stmt = $conn->prepare("
        SELECT MaTaiKhoan, TenDangNhap, MatKhau, HoTen,
               Email, SoDienThoai, VaiTro, TrangThai
        FROM taikhoan
        WHERE TenDangNhap = :username
        LIMIT 1
    ");

    $stmt->execute(['username' => $tenDangNhap]);
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$account) {
        respond(false, 'Ten dang nhap hoac mat khau khong dung', [], 401);
    }

    if ((int)$account['TrangThai'] !== 1) {
        respond(false, 'Tai khoan da bi khoa', [], 403);
    }

    $storedPassword = $account['MatKhau'];
    $passwordInfo = password_get_info($storedPassword);

    $passwordCorrect = password_verify(
        $matKhau,
        $storedPassword
    );

    if (!$passwordCorrect) {
        respond(false, 'Ten dang nhap hoac mat khau khong dung', [], 401);
    }

    // Neu hash cu khong con la thuat toan hien tai, rehash
    if (
        $isHashed &&
        password_needs_rehash($storedPassword, PASSWORD_DEFAULT)
    ) {
        $newHash = password_hash($matKhau, PASSWORD_DEFAULT);

        $update = $conn->prepare("
            UPDATE taikhoan
            SET MatKhau = :password
            WHERE MaTaiKhoan = :id
        ");

        $update->execute([
            'password' => $newHash,
            'id' => $account['MaTaiKhoan']
        ]);
    }

    session_regenerate_id(true);


    $_SESSION['maTaiKhoan'] = (int)$account['MaTaiKhoan'];
    $_SESSION['tenDangNhap'] = $account['TenDangNhap'];
    $_SESSION['hoTen'] = $account['HoTen']; 
    $_SESSION['email'] = $account['Email']; 
    $_SESSION['vaiTro'] = $account['VaiTro'];
   
    if ($account['VaiTro'] === 'Admin') {
        $redirectUrl = '/admin.html';
    } else {
        $redirectUrl = '/index.html';
    }

    unset($account['MatKhau'], $account['TrangThai']);

    respond(true, 'Đăng nhập thành công', [
        'taiKhoan' => $account,
        'redirectUrl' => $redirectUrl
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());
    respond(false, 'Loi may chu khi dang nhap', [], 500);
}
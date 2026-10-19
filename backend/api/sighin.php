
<?php

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
    $hoTen = trim($input['hoTen'] ?? '');
    $email = trim($input['email'] ?? '');
    $soDienThoai = trim($input['soDienThoai'] ?? '');

    if (
        $tenDangNhap === '' ||
        !is_string($matKhau) ||
        $matKhau === '' ||
        $hoTen === ''
    ) {
        respond(false, 'Vui long nhap ten dang nhap, mat khau va ho ten', [], 400);
    }

    if (strlen($tenDangNhap) < 4 || strlen($tenDangNhap) > 50) {
        respond(false, 'Ten dang nhap phai co tu 4 den 50 ky tu', [], 400);
    }

    if (strlen($matKhau) < 8) {
        respond(false, 'Mat khau phai co it nhat 8 ky tu', [], 400);
    }

    if (
        strlen($hoTen) > 100 ||
        strlen($email) > 150 ||
        strlen($soDienThoai) > 15
    ) {
        respond(false, 'Thong tin vuot qua do dai cho phep', [], 400);
    }

    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(false, 'Email khong hop le', [], 400);
    }

    $database = new Database();
    $conn = $database->getConnection();

    // Kiem tra ten dang nhap
    $stmt = $conn->prepare(
        'SELECT MaTaiKhoan FROM taikhoan
         WHERE TenDangNhap = :value LIMIT 1'
    );
    $stmt->execute(['value' => $tenDangNhap]);

    if ($stmt->fetch()) {
        respond(false, 'Ten dang nhap da ton tai', [], 409);
    }

    // Kiem tra email neu co nhap
    if ($email !== '') {
        $stmt = $conn->prepare(
            'SELECT MaTaiKhoan FROM taikhoan
             WHERE Email = :value LIMIT 1'
        );
        $stmt->execute(['value' => $email]);

        if ($stmt->fetch()) {
            respond(false, 'Email da duoc su dung', [], 409);
        }
    }

    // Kiem tra so dien thoai neu co nhap
    if ($soDienThoai !== '') {
        $stmt = $conn->prepare(
            'SELECT MaTaiKhoan FROM taikhoan
             WHERE SoDienThoai = :value LIMIT 1'
        );
        $stmt->execute(['value' => $soDienThoai]);

        if ($stmt->fetch()) {
            respond(false, 'So dien thoai da duoc su dung', [], 409);
        }
    }

    // Ma hoa mat khau truoc khi luu
    $matKhauHash = password_hash($matKhau, PASSWORD_DEFAULT);

    $sql = "
        INSERT INTO taikhoan
            (TenDangNhap, MatKhau, HoTen, Email,
             SoDienThoai, VaiTro, TrangThai)
        VALUES
            (:username, :password, :fullname, :email,
             :phone, 'User', 1)
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        'username' => $tenDangNhap,
        'password' => $matKhauHash,
        'fullname' => $hoTen,
        'email' => $email !== '' ? $email : null,
        'phone' => $soDienThoai !== '' ? $soDienThoai : null
    ]);

    respond(true, 'Dang ky tai khoan thanh cong', [
        'maTaiKhoan' => (int)$conn->lastInsertId(),
        'tenDangNhap' => $tenDangNhap,
        'hoTen' => $hoTen,
        'vaiTro' => 'User'
    ], 201);

} catch (Throwable $e) {
    error_log($e->getMessage());
    respond(false, 'Loi may chu khi dang ky tai khoan', [], 500);
}

<?php
// BẮT BUỘC CÓ: Để báo cho PHP biết hãy lấy thông tin session cũ ra dùng
session_start();

// Cấu hình Header
header("Access-Control-Allow-Origin: http://localhost:8001"); // Đảm bảo khớp với port frontend
header("Access-Control-Allow-Credentials: true"); // Bắt buộc true để nhận Cookie/Session
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Chỉ hỗ trợ POST"], JSON_UNESCAPED_UNICODE);
    exit();
}

// BƯỚC 1: KIỂM TRA ĐĂNG NHẬP VÀ QUYỀN TỪ SESSION
// Kiểm tra biến 'maTaiKhoan' giống hệt như cách bạn đã set trong file login
if (!isset($_SESSION['maTaiKhoan'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập"], JSON_UNESCAPED_UNICODE);
    exit();
}

// Kiểm tra quyền (chỉ Admin mới được dùng API này)
if (!isset($_SESSION['vaiTro']) || $_SESSION['vaiTro'] !== 'Admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Từ chối truy cập! Chỉ Admin mới có quyền thực hiện"], JSON_UNESCAPED_UNICODE);
    exit();
}

$maAdmin = $_SESSION['maTaiKhoan']; // Lưu lại ID của Admin đang thao tác

// BƯỚC 2: KẾT NỐI DB VÀ XỬ LÝ
require_once __DIR__ . '/../config/db.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    $BANK_ID = '970436'; 
    $ACCOUNT_NO = '1234567890'; 
    $ACCOUNT_NAME = 'NGUYEN VAN ADMIN';

    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input) || json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Dữ liệu JSON không hợp lệ"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if (!empty($input['HoTenNguoiDat']) && !empty($input['SoDienThoai']) && !empty($input['PhuongThucThanhToan']) && !empty($input['DanhSachVe'])) {
        
        $phuongThuc = $input['PhuongThucThanhToan'];
        if (!in_array($phuongThuc, ['COD', 'ChuyenKhoan'])) {
            echo json_encode(["success" => false, "message" => "Phương thức thanh toán không hợp lệ"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $conn->beginTransaction();

        $trangThaiThanhToan = ($phuongThuc === 'COD') ? 'DaThanhToan' : 'ChuaThanhToan';

        $stmtDatVe = $conn->prepare("INSERT INTO datve (MaTaiKhoan, HoTenNguoiDat, SoDienThoai, Email, TrangThai, PhuongThucThanhToan, TrangThaiThanhToan) VALUES (:MaTaiKhoan, :HoTenNguoiDat, :SoDienThoai, :Email, 'DaDat', :PhuongThucThanhToan, :TrangThaiThanhToan)");
        $stmtDatVe->execute([
            ':MaTaiKhoan' => $MaTaiKhoan ?? 3,
            ':HoTenNguoiDat' => $input['HoTenNguoiDat'],
            ':SoDienThoai' => $input['SoDienThoai'],
            ':Email' => $input['Email'] ?? 'admin@example.com',
            ':PhuongThucThanhToan' => $phuongThuc,
            ':TrangThaiThanhToan' => $trangThaiThanhToan
        ]);

        $maDatVe = $conn->lastInsertId();
        $tongTien = 0;

        $stmtVe = $conn->prepare("INSERT INTO ve (MaDatVe, MaChuyenXe, MaXe, MaGhe, HoTenHanhKhach, SoDienThoaiHanhKhach, GiaVe, TrangThai) VALUES (:MaDatVe, :MaChuyenXe, :MaXe, :MaGhe, :HoTenHanhKhach, :SoDienThoaiHanhKhach, :GiaVe, 'DaDat')");

        foreach ($input['DanhSachVe'] as $ve) {
            $tongTien += floatval($ve['GiaVe']);
            $stmtVe->execute([
                ':MaDatVe' => $maDatVe,
                ':MaChuyenXe' => $ve['MaChuyenXe'],
                ':MaXe' => $ve['MaXe'],
                ':MaGhe' => $ve['MaGhe'],
                ':HoTenHanhKhach' => $ve['HoTenHanhKhach'] ?? $input['HoTenNguoiDat'],
                ':SoDienThoaiHanhKhach' => $ve['SoDienThoaiHanhKhach'] ?? $input['SoDienThoai'],
                ':GiaVe' => $ve['GiaVe']
            ]);
        }
        $conn->commit();

        $qrCodeUrl = null;
        $noiDungChuyenKhoan = null;

        if ($phuongThuc === 'ChuyenKhoan') {
            $noiDungChuyenKhoan = "DATVE " . $maDatVe . " " . $input['SoDienThoai'];
            $qrCodeUrl = "https://img.vietqr.io/image/{$BANK_ID}-{$ACCOUNT_NO}-compact2.png?amount={$tongTien}&addInfo=" . rawurlencode($noiDungChuyenKhoan) . "&accountName=" . rawurlencode($ACCOUNT_NAME);
        }

        echo json_encode([
            "success" => true, 
            "message" => "Admin tạo vé thành công!", 
            "data" => [
                "MaDatVe" => (int)$maDatVe,
                "TongTien" => $tongTien,
                "PhuongThucThanhToan" => $phuongThuc,
                "TrangThaiThanhToan" => $trangThaiThanhToan,
                "NoiDungChuyenKhoan" => $noiDungChuyenKhoan,
                "QrCodeUrl" => $qrCodeUrl,
                "NhanVienTao" => $maAdmin // Lấy từ Session để biết Admin nào đã tạo đơn
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Thiếu dữ liệu đặt vé"], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
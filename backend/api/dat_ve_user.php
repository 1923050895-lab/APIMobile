<?php

session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Chỉ hỗ trợ POST"]);
    exit();
}

$conn = new PDO("mysql:host=127.0.0.1;dbname=appdatvexekhach;charset=utf8mb4", "root", "");
$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$BANK_ID = '970436'; 
$ACCOUNT_NO = '1234567890'; 
$ACCOUNT_NAME = 'NGUYEN VAN ADMIN';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->HoTenNguoiDat) && !empty($data->SoDienThoai) && !empty($data->DanhSachVe)) {
    try {
        $conn->beginTransaction();

        // ÉP BUỘC DÀNH CHO USER APP
        $phuongThucThanhToan = 'ChuyenKhoan';
        $trangThaiThanhToan = 'ChuaThanhToan';

        $stmtDatVe = $conn->prepare("INSERT INTO datve (MaTaiKhoan, HoTenNguoiDat, SoDienThoai, Email, TrangThai, PhuongThucThanhToan, TrangThaiThanhToan) VALUES (:MaTaiKhoan, :HoTenNguoiDat, :SoDienThoai, :Email, 'DaDat', :PhuongThucThanhToan, :TrangThaiThanhToan)");
        $stmtDatVe->execute([
            ':MaTaiKhoan' => $data->MaTaiKhoan ?? null,
            ':HoTenNguoiDat' => $data->HoTenNguoiDat,
            ':SoDienThoai' => $data->SoDienThoai,
            ':Email' => $data->Email ?? null,
            ':PhuongThucThanhToan' => $phuongThucThanhToan,
            ':TrangThaiThanhToan' => $trangThaiThanhToan
        ]);

        $maDatVe = $conn->lastInsertId();
        $tongTien = 0;

        $stmtVe = $conn->prepare("INSERT INTO ve (MaDatVe, MaChuyenXe, MaXe, MaGhe, HoTenHanhKhach, SoDienThoaiHanhKhach, GiaVe, TrangThai) VALUES (:MaDatVe, :MaChuyenXe, :MaXe, :MaGhe, :HoTenHanhKhach, :SoDienThoaiHanhKhach, :GiaVe, 'DaDat')");

        foreach ($data->DanhSachVe as $ve) {
            $tongTien += floatval($ve->GiaVe);
            $stmtVe->execute([
                ':MaDatVe' => $maDatVe,
                ':MaChuyenXe' => $ve->MaChuyenXe,
                ':MaXe' => $ve->MaXe,
                ':MaGhe' => $ve->MaGhe,
                ':HoTenHanhKhach' => $ve->HoTenHanhKhach ?? $data->HoTenNguoiDat,
                ':SoDienThoaiHanhKhach' => $ve->SoDienThoaiHanhKhach ?? $data->SoDienThoai,
                ':GiaVe' => $ve->GiaVe
            ]);
        }
        $conn->commit();

        $noiDungChuyenKhoan = "DATVE " . $maDatVe . " " . $data->SoDienThoai;
        $qrCodeUrl = "https://img.vietqr.io/image/{$BANK_ID}-{$ACCOUNT_NO}-compact2.png?amount={$tongTien}&addInfo=" . rawurlencode($noiDungChuyenKhoan) . "&accountName=" . rawurlencode($ACCOUNT_NAME);

        echo json_encode(["success" => true, "message" => "Đặt vé thành công!", "data" => [
            "MaDatVe" => (int)$maDatVe,
            "TongTien" => $tongTien,
            "PhuongThucThanhToan" => $phuongThucThanhToan,
            "TrangThaiThanhToan" => $trangThaiThanhToan,
            "NoiDungChuyenKhoan" => $noiDungChuyenKhoan,
            "QrCodeUrl" => $qrCodeUrl
        ]]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["success" => false, "message" => "Lỗi: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Thiếu dữ liệu"]);
}
?>
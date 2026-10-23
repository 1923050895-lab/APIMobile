<?php
/**
 * TripController - Xử lý tra cứu chuyến xe (UC-01) & sơ đồ ghế (UC-02)
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

class TripController {
    /**
     * UC-01: Tra cứu và lọc danh sách chuyến xe
     */
    public static function search(): void {
        $db = Database::getConnection();

        $diemDi  = $_GET['diem_di'] ?? null;
        $diemDen = $_GET['diem_den'] ?? null;
        $ngayDi  = $_GET['ngay_di'] ?? null; // Định dạng YYYY-MM-DD
        $giaMin  = $_GET['gia_min'] ?? null;
        $giaMax  = $_GET['gia_max'] ?? null;
        $loaiXe  = $_GET['loai_xe'] ?? null;

        $sql = "
            SELECT 
                c.MaChuyen, c.ThoiGianDi, c.ThoiGianDen, c.GiaVe, c.TrangThai,
                t.MaTuyenXe, t.TenTuyen, t.KhoangCachKm, t.ThoiGianDuKienPhut,
                ddDi.MaDiaDiem AS MaDiemDi, ddDi.TenDiaDiem AS TenDiemDi, ddDi.DiaChi AS DiaChiDiemDi,
                ddDen.MaDiaDiem AS MaDiemDen, ddDen.TenDiaDiem AS TenDiemDen, ddDen.DiaChi AS DiaChiDiemDen,
                x.MaXe, x.BienSo, x.TenXe, x.LoaiXe, x.SoLuongGhe,
                (
                    SELECT COUNT(*) 
                    FROM chi_tiet_dat_ve ct 
                    WHERE ct.MaChuyen = c.MaChuyen AND ct.TrangThaiChiTiet = 'DaDat'
                ) AS SoGheDaDat,
                (
                    x.SoLuongGhe - (
                        SELECT COUNT(*) 
                        FROM chi_tiet_dat_ve ct 
                        WHERE ct.MaChuyen = c.MaChuyen AND ct.TrangThaiChiTiet = 'DaDat'
                    )
                ) AS SoGheConTrong
            FROM chuyen_xe c
            JOIN tuyen_xe t ON c.MaTuyenXe = t.MaTuyenXe
            JOIN dia_diem ddDi ON t.MaDiemDi = ddDi.MaDiaDiem
            JOIN dia_diem ddDen ON t.MaDiemDen = ddDen.MaDiaDiem
            JOIN xe x ON c.MaXe = x.MaXe
            WHERE c.TrangThai = 'SapChay'
              AND c.ThoiGianDi > NOW()
        ";

        $params = [];

        if (!empty($diemDi)) {
            $sql .= " AND (t.MaDiemDi = :diemDi OR ddDi.TenDiaDiem LIKE :diemDiLike)";
            $params['diemDi'] = $diemDi;
            $params['diemDiLike'] = "%$diemDi%";
        }

        if (!empty($diemDen)) {
            $sql .= " AND (t.MaDiemDen = :diemDen OR ddDen.TenDiaDiem LIKE :diemDenLike)";
            $params['diemDen'] = $diemDen;
            $params['diemDenLike'] = "%$diemDen%";
        }

        if (!empty($ngayDi)) {
            $sql .= " AND DATE(c.ThoiGianDi) = :ngayDi";
            $params['ngayDi'] = $ngayDi;
        }

        if ($giaMin !== null && is_numeric($giaMin)) {
            $sql .= " AND c.GiaVe >= :giaMin";
            $params['giaMin'] = $giaMin;
        }

        if ($giaMax !== null && is_numeric($giaMax)) {
            $sql .= " AND c.GiaVe <= :giaMax";
            $params['giaMax'] = $giaMax;
        }

        if (!empty($loaiXe)) {
            $sql .= " AND x.LoaiXe = :loaiXe";
            $params['loaiXe'] = $loaiXe;
        }

        $khungGio = $_GET['khung_gio'] ?? $_GET['buoi_di'] ?? null;
        if (!empty($khungGio)) {
            if ($khungGio === 'sang') {
                $sql .= " AND HOUR(c.ThoiGianDi) >= 0 AND HOUR(c.ThoiGianDi) < 12";
            } elseif ($khungGio === 'chieu') {
                $sql .= " AND HOUR(c.ThoiGianDi) >= 12 AND HOUR(c.ThoiGianDi) < 18";
            } elseif ($khungGio === 'toi') {
                $sql .= " AND HOUR(c.ThoiGianDi) >= 18";
            }
        }

        $sql .= " ORDER BY c.ThoiGianDi ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $trips = $stmt->fetchAll();

        Response::success('Tra cứu chuyến xe thành công', [
            'total' => count($trips),
            'trips' => $trips
        ]);
    }

    /**
     * UC-02: Xem sơ đồ ghế và tình trạng từng ghế trên chuyến
     */
    public static function getSeats(int $tripId): void {
        $db = Database::getConnection();

        // Lấy thông tin chuyến và xe kèm số chỗ trống
        $stmtTrip = $db->prepare("
            SELECT 
                c.MaChuyen, c.ThoiGianDi, c.ThoiGianDen, c.GiaVe, c.TrangThai,
                t.TenTuyen, ddDi.TenDiaDiem AS TenDiemDi, ddDen.TenDiaDiem AS TenDiemDen,
                x.MaXe, x.BienSo, x.TenXe, x.LoaiXe, x.SoLuongGhe,
                (
                    x.SoLuongGhe - (
                        SELECT COUNT(*) 
                        FROM chi_tiet_dat_ve ct 
                        WHERE ct.MaChuyen = c.MaChuyen AND ct.TrangThaiChiTiet = 'DaDat'
                    )
                ) AS SoGheConTrong
            FROM chuyen_xe c
            JOIN tuyen_xe t ON c.MaTuyenXe = t.MaTuyenXe
            JOIN dia_diem ddDi ON t.MaDiemDi = ddDi.MaDiaDiem
            JOIN dia_diem ddDen ON t.MaDiemDen = ddDen.MaDiaDiem
            JOIN xe x ON c.MaXe = x.MaXe
            WHERE c.MaChuyen = :id
        ");
        $stmtTrip->execute(['id' => $tripId]);
        $trip = $stmtTrip->fetch();

        if (!$trip) {
            Response::notFound('Không tìm thấy thông tin chuyến xe');
        }

        // Lấy danh sách toàn bộ ghế vật lý của xe + trạng thái đặt trên chuyến này
        $stmtSeats = $db->prepare("
            SELECT 
                g.MaGhe, g.SoGhe, g.Tang, g.TrangThai AS TrangThaiGheVatLy,
                CASE 
                    WHEN ct.MaChiTiet IS NOT NULL THEN 'DaDat'
                    WHEN g.TrangThai = 'Hong' THEN 'Hong'
                    ELSE 'ConTrong'
                END AS TrangThaiDat,
                CASE 
                    WHEN ct.MaChiTiet IS NOT NULL THEN 'DaDat'
                    WHEN g.TrangThai = 'Hong' THEN 'Hong'
                    ELSE 'ConTrong'
                END AS TrangThai,
                ct.MaDon
            FROM ghe g
            LEFT JOIN chi_tiet_dat_ve ct ON g.MaGhe = ct.MaGhe 
                AND ct.MaChuyen = :tripId 
                AND ct.TrangThaiChiTiet = 'DaDat'
            WHERE g.MaXe = :busId
            ORDER BY g.Tang ASC, g.SoGhe ASC
        ");
        $stmtSeats->execute([
            'tripId' => $tripId,
            'busId'  => $trip['MaXe']
        ]);
        $seats = $stmtSeats->fetchAll();

        Response::success('Lấy sơ đồ ghế chuyến đi thành công', [
            'trip'  => $trip,
            'seats' => $seats
        ]);
    }

    /**
     * Lấy danh mục địa điểm bến xe
     */
    public static function getLocations(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM dia_diem WHERE TrangThai = 'HoatDong' ORDER BY TenDiaDiem ASC");
        Response::success('Lấy danh sách địa điểm thành công', $stmt->fetchAll());
    }
}

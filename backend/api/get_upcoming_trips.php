
<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Chi chap nhan phuong thuc POST'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/../config/db.php';

try {
    // Doc JSON tu request body
    $input = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!is_array($input) || json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'JSON khong hop le'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $database = new Database();
    $conn = $database->getConnection();

    $sql = "
        SELECT *
        FROM (
            SELECT
                cx.MaChuyenXe,
                tx.DiemDi,
                tx.DiemDen,
                x.MaXe,
                x.BienSo,
                x.TenXe,
                cx.GioKhoiHanh,
                cx.GioDenDuKien,
                cx.GiaVe,
                cx.TrangThai,

                GREATEST(
                    (
                        SELECT COUNT(*)
                        FROM ghe g
                        WHERE g.MaXe = cx.MaXe
                    ) -
                    (
                        SELECT COUNT(*)
                        FROM ve v
                        WHERE v.MaChuyenXe = cx.MaChuyenXe
                          AND v.TrangThai = 'DaDat'
                    ),
                    0
                ) AS SoGheConTrong

            FROM chuyenxe cx
            INNER JOIN tuyenxe tx
                ON cx.MaTuyenXe = tx.MaTuyenXe
            INNER JOIN xe x
                ON cx.MaXe = x.MaXe

            WHERE cx.GioKhoiHanh > NOW()
              AND cx.TrangThai = 'SapChay'
              AND x.TrangThai = 'HoatDong'
        ) AS ds
        WHERE 1 = 1
    ";

    $params = [];

    // Diem di
    if (isset($input['diemDi']) && trim($input['diemDi']) !== '') {
        $sql .= " AND ds.DiemDi LIKE :diemDi";
        $params['diemDi'] = '%' . trim($input['diemDi']) . '%';
    }

    // Diem den
    if (isset($input['diemDen']) && trim($input['diemDen']) !== '') {
        $sql .= " AND ds.DiemDen LIKE :diemDen";
        $params['diemDen'] = '%' . trim($input['diemDen']) . '%';
    }

    // Gio khoi hanh tu / den
    foreach ([
        'gioKhoiHanhTu' => ['ds.GioKhoiHanh >= :gioKhoiHanhTu', 'gioKhoiHanhTu'],
        'gioKhoiHanhDen' => ['ds.GioKhoiHanh <= :gioKhoiHanhDen', 'gioKhoiHanhDen'],
        'gioDenTu' => ['ds.GioDenDuKien >= :gioDenTu', 'gioDenTu'],
        'gioDenDen' => ['ds.GioDenDuKien <= :gioDenDen', 'gioDenDen']
    ] as $key => [$condition, $paramName]) {
        if (isset($input[$key]) && $input[$key] !== '') {
            $date = DateTime::createFromFormat(
                'Y-m-d H:i:s',
                $input[$key]
            );

            if (!$date || $date->format('Y-m-d H:i:s') !== $input[$key]) {
                throw new InvalidArgumentException(
                    "$key phai co dang YYYY-MM-DD HH:MM:SS"
                );
            }

            $sql .= " AND $condition";
            $params[$paramName] = $input[$key];
        }
    }

    // Gia ve tu
    if (isset($input['giaTu']) && $input['giaTu'] !== '') {
        if (!is_numeric($input['giaTu']) || $input['giaTu'] < 0) {
            throw new InvalidArgumentException('giaTu khong hop le');
        }

        $sql .= " AND ds.GiaVe >= :giaTu";
        $params['giaTu'] = $input['giaTu'];
    }

    // Gia ve den
    if (isset($input['giaDen']) && $input['giaDen'] !== '') {
        if (!is_numeric($input['giaDen']) || $input['giaDen'] < 0) {
            throw new InvalidArgumentException('giaDen khong hop le');
        }

        $sql .= " AND ds.GiaVe <= :giaDen";
        $params['giaDen'] = $input['giaDen'];
    }

    // So ghe trong toi thieu
    if (isset($input['soGheToiThieu']) &&
        $input['soGheToiThieu'] !== '') {

        $soGhe = filter_var(
            $input['soGheToiThieu'],
            FILTER_VALIDATE_INT
        );

        if ($soGhe === false || $soGhe < 0) {
            throw new InvalidArgumentException(
                'soGheToiThieu phai la so nguyen khong am'
            );
        }

        $sql .= " AND ds.SoGheConTrong >= :soGheToiThieu";
        $params['soGheToiThieu'] = $soGhe;
    }

    $sql .= " ORDER BY ds.GioKhoiHanh ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $trips = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Lay danh sach chuyen xe thanh cong',
        'total' => count($trips),
        'data' => $trips
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (InvalidArgumentException $e) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log($e->getMessage());
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Loi khi lay danh sach chuyen xe'
    ], JSON_UNESCAPED_UNICODE);
}

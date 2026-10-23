<?php
/**
 * AdminController - Quản trị hệ thống (UC-10, UC-11, UC-12, UC-13, UC-14)
 * Yêu cầu quyền Admin nghiêm ngặt
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

class AdminController {
    /* ========================================================
     * UC-10: QUẢN LÝ ĐỊA ĐIỂM / TRẠM
     * ======================================================== */
    public static function listLocations(): void {
        Auth::requireRole(['Admin']);
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM dia_diem ORDER BY MaDiaDiem DESC");
        Response::success('Lấy danh sách địa điểm thành công', $stmt->fetchAll());
    }

    public static function createLocation(array $data): void {
        Auth::requireRole(['Admin']);
        $name    = trim($data['TenDiaDiem'] ?? '');
        $address = trim($data['DiaChi'] ?? '');
        $desc    = trim($data['MoTa'] ?? '');

        if (empty($name) || empty($address)) {
            Response::error('Tên địa điểm và địa chỉ chi tiết không được để trống');
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO dia_diem (TenDiaDiem, DiaChi, MoTa, TrangThai) VALUES (:name, :addr, :desc, 'HoatDong')");
        $stmt->execute(['name' => $name, 'addr' => $address, 'desc' => $desc]);

        Response::success('Thêm địa điểm mới thành công', [
            'MaDiaDiem' => (int)$db->lastInsertId(),
            'TenDiaDiem'=> $name
        ], 201);
    }

    public static function updateLocation(int $id, array $data): void {
        Auth::requireRole(['Admin']);
        $db = Database::getConnection();

        $name    = trim($data['TenDiaDiem'] ?? '');
        $address = trim($data['DiaChi'] ?? '');
        $desc    = trim($data['MoTa'] ?? '');
        $status  = $data['TrangThai'] ?? 'HoatDong';

        $stmt = $db->prepare("
            UPDATE dia_diem 
            SET TenDiaDiem = :name, DiaChi = :addr, MoTa = :desc, TrangThai = :status
            WHERE MaDiaDiem = :id
        ");
        $stmt->execute([
            'name'   => $name,
            'addr'   => $address,
            'desc'   => $desc,
            'status' => $status,
            'id'     => $id
        ]);

        Response::success('Cập nhật địa điểm thành công');
    }

    /* ========================================================
     * UC-11: QUẢN LÝ XE VÀ GHẾ
     * ======================================================== */
    public static function listBuses(): void {
        Auth::requireRole(['Admin']);
        $db = Database::getConnection();
        $stmt = $db->query("
            SELECT x.*, COUNT(g.MaGhe) AS TongSoGheKhaiBao
            FROM xe x
            LEFT JOIN ghe g ON x.MaXe = g.MaXe
            GROUP BY x.MaXe
            ORDER BY x.MaXe DESC
        ");
        Response::success('Lấy danh sách xe thành công', $stmt->fetchAll());
    }

    public static function createBus(array $data): void {
        Auth::requireRole(['Admin']);
        $plate     = trim($data['BienSo'] ?? '');
        $name      = trim($data['TenXe'] ?? '');
        $type      = trim($data['LoaiXe'] ?? 'GiuongNam');
        $seatCount = (int)($data['SoLuongGhe'] ?? 24);

        if (empty($plate) || empty($name) || $seatCount <= 0) {
            Response::error('Vui lòng nhập biển số, tên xe và số lượng ghế hợp lệ (> 0)');
        }

        $db = Database::getConnection();

        // Kiểm tra biển số trùng
        $stmtCheck = $db->prepare("SELECT MaXe FROM xe WHERE BienSo = :plate");
        $stmtCheck->execute(['plate' => $plate]);
        if ($stmtCheck->fetch()) {
            Response::error('Biển số xe đã tồn tại trong hệ thống');
        }

        try {
            $db->beginTransaction();

            $stmtBus = $db->prepare("
                INSERT INTO xe (BienSo, TenXe, LoaiXe, SoLuongGhe, TrangThai)
                VALUES (:plate, :name, :type, :seats, 'HoatDong')
            ");
            $stmtBus->execute([
                'plate' => $plate,
                'name'  => $name,
                'type'  => $type,
                'seats' => $seatCount
            ]);
            $busId = (int)$db->lastInsertId();

            // Tự động sinh danh mục ghế vật lý tương ứng cho xe
            $stmtSeat = $db->prepare("INSERT INTO ghe (MaXe, SoGhe, Tang, TrangThai) VALUES (:busId, :seatNum, :floor, 'HoatDong')");
            $half = (int)ceil($seatCount / 2);
            for ($i = 1; $i <= $seatCount; $i++) {
                $floor = ($i <= $half) ? 1 : 2;
                $prefix = ($floor === 1) ? 'A' : 'B';
                $numInFloor = ($floor === 1) ? $i : ($i - $half);
                $seatLabel = sprintf("%s%02d", $prefix, $numInFloor);

                $stmtSeat->execute([
                    'busId'   => $busId,
                    'seatNum' => $seatLabel,
                    'floor'   => $floor
                ]);
            }

            $db->commit();

            Response::success("Tạo xe mới và tự động sinh {$seatCount} ghế thành công", [
                'MaXe'       => $busId,
                'BienSo'     => $plate,
                'SoLuongGhe' => $seatCount
            ], 201);

        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi khi thêm xe: ' . $e->getMessage(), 500);
        }
    }

    public static function updateBus(int $id, array $data): void {
        Auth::requireRole(['Admin']);
        $plate  = trim($data['BienSo'] ?? '');
        $name   = trim($data['TenXe'] ?? '');
        $type   = trim($data['LoaiXe'] ?? '');
        $status = $data['TrangThai'] ?? 'HoatDong';

        if (empty($plate) || empty($name)) {
            Response::error('Biển số xe và tên xe không được để trống');
        }

        $db = Database::getConnection();

        // Kiểm tra biển số trùng với xe khác
        $stmtCheck = $db->prepare("SELECT MaXe FROM xe WHERE BienSo = :plate AND MaXe != :id");
        $stmtCheck->execute(['plate' => $plate, 'id' => $id]);
        if ($stmtCheck->fetch()) {
            Response::error('Biển số xe này đã được sử dụng bởi xe khác');
        }

        $stmt = $db->prepare("
            UPDATE xe 
            SET BienSo = :plate, TenXe = :name, LoaiXe = :type, TrangThai = :status
            WHERE MaXe = :id
        ");
        $stmt->execute([
            'plate'  => $plate,
            'name'   => $name,
            'type'   => $type ?: 'GiuongNam',
            'status' => $status,
            'id'     => $id
        ]);

        Response::success('Cập nhật thông tin xe thành công');
    }

    public static function getBusSeats(int $busId): void {
        Auth::requireRole(['Admin']);
        $db = Database::getConnection();

        $stmtBus = $db->prepare("SELECT * FROM xe WHERE MaXe = :id");
        $stmtBus->execute(['id' => $busId]);
        $bus = $stmtBus->fetch();
        if (!$bus) Response::notFound('Không tìm thấy thông tin xe');

        $stmt = $db->prepare("SELECT * FROM ghe WHERE MaXe = :id ORDER BY Tang ASC, SoGhe ASC");
        $stmt->execute(['id' => $busId]);

        Response::success('Lấy danh sách ghế của xe thành công', [
            'bus'   => $bus,
            'seats' => $stmt->fetchAll()
        ]);
    }

    /* ========================================================
     * UC-12: QUẢN LÝ CHUYẾN XE, LỊCH TRÌNH VÀ GIÁ VÉ (BR-09)
     * ======================================================== */
    public static function listRoutes(): void {
        Auth::requireRole(['Admin']);
        $db = Database::getConnection();
        $stmt = $db->query("
            SELECT t.*, ddDi.TenDiaDiem AS TenDiemDi, ddDen.TenDiaDiem AS TenDiemDen
            FROM tuyen_xe t
            JOIN dia_diem ddDi ON t.MaDiemDi = ddDi.MaDiaDiem
            JOIN dia_diem ddDen ON t.MaDiemDen = ddDen.MaDiaDiem
            WHERE t.TrangThai = 'HoatDong'
            ORDER BY t.TenTuyen ASC
        ");
        Response::success('Lấy danh mục tuyến xe thành công', $stmt->fetchAll());
    }

    public static function createRoute(array $data): void {
        Auth::requireRole(['Admin']);
        $departureId = (int)($data['MaDiemDi'] ?? 0);
        $destinationId = (int)($data['MaDiemDen'] ?? 0);
        $distance = !empty($data['KhoangCachKm']) ? (float)$data['KhoangCachKm'] : null;
        $estMinutes = !empty($data['ThoiGianDuKienPhut']) ? (int)$data['ThoiGianDuKienPhut'] : null;
        $routeName = trim($data['TenTuyen'] ?? '');

        if ($departureId <= 0 || $destinationId <= 0) {
            Response::error('Vui lòng chọn điểm đi và điểm đến hợp lệ');
        }
        if ($departureId === $destinationId) {
            Response::error('Điểm đi và điểm đến không được trùng nhau');
        }

        $db = Database::getConnection();
        if (empty($routeName)) {
            $st1 = $db->prepare("SELECT TenDiaDiem FROM dia_diem WHERE MaDiaDiem = :id");
            $st1->execute(['id' => $departureId]);
            $dd1 = $st1->fetchColumn();

            $st2 = $db->prepare("SELECT TenDiaDiem FROM dia_diem WHERE MaDiaDiem = :id");
            $st2->execute(['id' => $destinationId]);
            $dd2 = $st2->fetchColumn();

            if (!$dd1 || !$dd2) {
                Response::error('Điểm đi hoặc điểm đến không tồn tại trong hệ thống');
            }
            $routeName = $dd1 . ' - ' . $dd2;
        }

        $checkStmt = $db->prepare("SELECT MaTuyenXe FROM tuyen_xe WHERE MaDiemDi = :di AND MaDiemDen = :den AND TrangThai = 'HoatDong'");
        $checkStmt->execute(['di' => $departureId, 'den' => $destinationId]);
        if ($checkStmt->fetch()) {
            Response::error("Tuyến xe này đã tồn tại trong hệ thống");
        }

        $stmt = $db->prepare("
            INSERT INTO tuyen_xe (TenTuyen, MaDiemDi, MaDiemDen, KhoangCachKm, ThoiGianDuKienPhut, TrangThai)
            VALUES (:ten, :di, :den, :km, :phut, 'HoatDong')
        ");
        $stmt->execute([
            'ten'  => $routeName,
            'di'   => $departureId,
            'den'  => $destinationId,
            'km'   => $distance,
            'phut' => $estMinutes
        ]);

        $routeId = (int)$db->lastInsertId();
        Response::success('Thêm tuyến xe mới thành công', [
            'MaTuyenXe' => $routeId,
            'TenTuyen'  => $routeName,
            'MaDiemDi'  => $departureId,
            'MaDiemDen' => $destinationId
        ], 201);
    }

    public static function listTrips(): void {
        Auth::requireRole(['Admin']);
        $db = Database::getConnection();
        $stmt = $db->query("
            SELECT c.*, t.TenTuyen, x.BienSo, x.TenXe, x.SoLuongGhe,
                   ddDi.TenDiaDiem AS TenDiemDi, ddDen.TenDiaDiem AS TenDiemDen,
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
            WHERE c.ThoiGianDi > NOW()
              AND c.TrangThai != 'HuyChuyen'
            ORDER BY c.ThoiGianDi ASC
        ");
        Response::success('Lấy danh sách chuyến xe chưa khởi hành thành công', $stmt->fetchAll());
    }

    public static function createTrip(array $data): void {
        Auth::requireRole(['Admin']);
        $routeId   = (int)($data['MaTuyenXe'] ?? 0);
        $busId     = (int)($data['MaXe'] ?? 0);
        $depTime   = trim($data['ThoiGianDi'] ?? '');
        $arrTime   = trim($data['ThoiGianDen'] ?? '');
        $price     = (float)($data['GiaVe'] ?? 0);

        if ($routeId <= 0 || $busId <= 0 || empty($depTime) || empty($arrTime) || $price <= 0) {
            Response::error('Vui lòng nhập đầy đủ tuyến, xe, giờ xuất phát, giờ đến và giá vé (> 0)');
        }

        if (strtotime($arrTime) <= strtotime($depTime)) {
            Response::error('Thời gian đến dự kiến phải sau thời gian xuất phát');
        }

        // Không cho phép tạo chuyến trong quá khứ so với thời gian thực tế
        if (strtotime($depTime) <= time()) {
            Response::error('Thời gian xuất phát phải lớn hơn thời gian thực tế hiện tại');
        }

        $db = Database::getConnection();

        // KIỂM TRA TRÙNG LỊCH: Xem xe này trong khung giờ [depTime, arrTime] đã được xếp ở chuyến khác chưa
        $stmtConflict = $db->prepare("
            SELECT c.MaChuyen, c.ThoiGianDi, c.ThoiGianDen, t.TenTuyen, x.BienSo, x.TenXe
            FROM chuyen_xe c
            JOIN tuyen_xe t ON c.MaTuyenXe = t.MaTuyenXe
            JOIN xe x ON c.MaXe = x.MaXe
            WHERE c.MaXe = :busId
              AND c.TrangThai NOT IN ('HuyChuyen', 'DaHuy')
              AND (:depTime < c.ThoiGianDen AND :arrTime > c.ThoiGianDi)
            LIMIT 1
        ");
        $stmtConflict->execute([
            'busId'   => $busId,
            'depTime' => $depTime,
            'arrTime' => $arrTime
        ]);
        $conflict = $stmtConflict->fetch();
        if ($conflict) {
            Response::error("Xe {$conflict['TenXe']} ({$conflict['BienSo']}) đã được xếp cho chuyến #{$conflict['MaChuyen']} ('{$conflict['TenTuyen']}') từ {$conflict['ThoiGianDi']} đến {$conflict['ThoiGianDen']}. Không thể xếp trùng khung giờ!", 400);
        }

        $stmt = $db->prepare("
            INSERT INTO chuyen_xe (MaTuyenXe, MaXe, ThoiGianDi, ThoiGianDen, GiaVe, TrangThai)
            VALUES (:routeId, :busId, :depTime, :arrTime, :price, 'SapChay')
        ");
        $stmt->execute([
            'routeId' => $routeId,
            'busId'   => $busId,
            'depTime' => $depTime,
            'arrTime' => $arrTime,
            'price'   => $price
        ]);

        Response::success('Tạo chuyến xe mới thành công với giá vé cố định', [
            'MaChuyen' => (int)$db->lastInsertId(),
            'GiaVe'    => $price
        ], 201);
    }

    public static function updateTrip(int $tripId, array $data): void {
        Auth::requireRole(['Admin']);
        $db = Database::getConnection();

        $routeId = !empty($data['MaTuyenXe']) ? (int)$data['MaTuyenXe'] : null;
        $busId   = !empty($data['MaXe']) ? (int)$data['MaXe'] : null;
        $depTime = !empty($data['ThoiGianDi']) ? trim($data['ThoiGianDi']) : null;
        $arrTime = !empty($data['ThoiGianDen']) ? trim($data['ThoiGianDen']) : null;
        $price   = isset($data['GiaVe']) ? (float)$data['GiaVe'] : null;
        $status  = $data['TrangThai'] ?? null;

        $fields = [];
        $params = ['id' => $tripId];

        if ($routeId !== null) { $fields[] = "MaTuyenXe = :routeId"; $params['routeId'] = $routeId; }
        if ($busId !== null)   { $fields[] = "MaXe = :busId"; $params['busId'] = $busId; }
        if ($depTime !== null) { $fields[] = "ThoiGianDi = :depTime"; $params['depTime'] = $depTime; }
        if ($arrTime !== null) { $fields[] = "ThoiGianDen = :arrTime"; $params['arrTime'] = $arrTime; }
        if ($price !== null && $price > 0) { $fields[] = "GiaVe = :price"; $params['price'] = $price; }
        if ($status !== null && in_array($status, ['SapChay', 'DangChay', 'HoanThanh', 'HuyChuyen'], true)) {
            $fields[] = "TrangThai = :status";
            $params['status'] = $status;
        }

        if (empty($fields)) {
            Response::error('Không có thông tin thay đổi hợp lệ');
        }

        $sql = "UPDATE chuyen_xe SET " . implode(', ', $fields) . " WHERE MaChuyen = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::success('Cập nhật thông tin chuyến xe thành công');
    }

    /* ========================================================
     * UC-13: QUẢN LÝ TÀI KHOẢN VÀ PHÂN QUYỀN
     * ======================================================== */
    public static function listUsers(): void {
        Auth::requireRole(['Admin']);
        $db = Database::getConnection();
        $stmt = $db->query("
            SELECT t.MaTaiKhoan, t.TenDangNhap, t.HoTen, t.SoDienThoai, t.Email, t.VaiTro, t.TrangThai, t.NgayTao,
                   v.MaVi, IFNULL(v.SoDu, 0.00) AS SoDu
            FROM taikhoan t
            LEFT JOIN vi_noi_bo v ON t.MaTaiKhoan = v.MaTaiKhoan
            ORDER BY t.MaTaiKhoan ASC
        ");
        Response::success('Lấy danh sách tài khoản người dùng thành công', $stmt->fetchAll());
    }

    public static function createUser(array $data): void {
        Auth::requireRole(['Admin']);
        $username = trim($data['TenDangNhap'] ?? '');
        $password = trim($data['MatKhau'] ?? '');
        $fullName = trim($data['HoTen'] ?? '');
        $phone    = trim($data['SoDienThoai'] ?? '');
        $email    = trim($data['Email'] ?? '');
        $role     = $data['VaiTro'] ?? 'KhachHang';

        if (empty($username) || empty($password) || empty($fullName) || empty($phone)) {
            Response::error('Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu, họ tên và số điện thoại');
        }

        if (!in_array($role, ['KhachHang', 'NhanVien', 'Admin'], true)) {
            Response::error('Vai trò không hợp lệ (KhachHang, NhanVien, Admin)');
        }

        $db = Database::getConnection();

        // Kiểm tra trùng lặp
        $stmtCheck = $db->prepare("SELECT MaTaiKhoan FROM taikhoan WHERE TenDangNhap = :u OR SoDienThoai = :p");
        $stmtCheck->execute(['u' => $username, 'p' => $phone]);
        if ($stmtCheck->fetch()) {
            Response::error('Tên đăng nhập hoặc số điện thoại đã được sử dụng trong hệ thống');
        }

        try {
            $db->beginTransaction();

            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $db->prepare("
                INSERT INTO taikhoan (TenDangNhap, MatKhau, HoTen, SoDienThoai, Email, VaiTro, TrangThai)
                VALUES (:u, :p, :name, :phone, :email, :role, 'HoatDong')
            ");
            $stmt->execute([
                'u'     => $username,
                'p'     => $hash,
                'name'  => $fullName,
                'phone' => $phone,
                'email' => $email,
                'role'  => $role
            ]);
            $userId = (int)$db->lastInsertId();

            // Khởi tạo ví nếu là khách hàng
            if ($role === 'KhachHang') {
                $stmtWallet = $db->prepare("INSERT INTO vi_noi_bo (MaTaiKhoan, SoDu) VALUES (:uid, 0.00)");
                $stmtWallet->execute(['uid' => $userId]);
            }

            $db->commit();

            Response::success('Tạo tài khoản người dùng mới thành công', [
                'MaTaiKhoan'  => $userId,
                'TenDangNhap' => $username,
                'HoTen'       => $fullName,
                'VaiTro'      => $role
            ], 201);

        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi khi tạo tài khoản: ' . $e->getMessage(), 500);
        }
    }

    public static function updateUserStatus(int $userId, array $data): void {
        $admin = Auth::requireRole(['Admin']);
        $status   = $data['TrangThai'] ?? null;
        $role     = $data['VaiTro'] ?? null;
        $fullName = isset($data['HoTen']) ? trim($data['HoTen']) : null;
        $phone    = isset($data['SoDienThoai']) ? trim($data['SoDienThoai']) : null;
        $email    = isset($data['Email']) ? trim($data['Email']) : null;
        $password = !empty($data['MatKhau']) ? trim($data['MatKhau']) : null;

        if ($userId === (int)$admin['MaTaiKhoan'] && $status === 'BiKhoa') {
            Response::error('Không thể tự khóa tài khoản quản trị viên đang đăng nhập!');
        }

        $db = Database::getConnection();
        $fields = [];
        $params = ['id' => $userId];

        if ($fullName !== null && $fullName !== '') {
            $fields[] = "HoTen = :name";
            $params['name'] = $fullName;
        }

        if ($phone !== null && $phone !== '') {
            $fields[] = "SoDienThoai = :phone";
            $params['phone'] = $phone;
        }

        if ($email !== null) {
            $fields[] = "Email = :email";
            $params['email'] = $email;
        }

        if ($status && in_array($status, ['HoatDong', 'BiKhoa'], true)) {
            $fields[] = "TrangThai = :status";
            $params['status'] = $status;
        }

        if ($role && in_array($role, ['KhachHang', 'NhanVien', 'Admin', 'Guest'], true)) {
            $fields[] = "VaiTro = :role";
            $params['role'] = $role;
        }

        if ($password !== null) {
            $fields[] = "MatKhau = :pass";
            $params['pass'] = password_hash($password, PASSWORD_BCRYPT);
        }

        if (empty($fields)) {
            Response::error('Không có thông tin thay đổi hợp lệ');
        }

        $sql = "UPDATE taikhoan SET " . implode(', ', $fields) . " WHERE MaTaiKhoan = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::success('Cập nhật tài khoản người dùng thành công');
    }

    /* ========================================================
     * DUYỆT YÊU CẦU NẠP TIỀN VIETQR (ADMIN APPROVAL)
     * ======================================================== */
    public static function listDepositRequests(): void {
        Auth::requireRole(['Admin']);
        $db = Database::getConnection();

        $status = $_GET['trang_thai'] ?? null;
        $sql = "
            SELECT y.*, t.TenDangNhap, t.HoTen, t.SoDienThoai, t.Email,
                   v.SoDu AS SoDuHienTai, adm.HoTen AS TenAdminDuyet
            FROM yeu_cau_nap_tien y
            JOIN taikhoan t ON y.MaTaiKhoan = t.MaTaiKhoan
            JOIN vi_noi_bo v ON t.MaTaiKhoan = v.MaTaiKhoan
            LEFT JOIN taikhoan adm ON y.MaAdminDuyet = adm.MaTaiKhoan
        ";

        if ($status && in_array($status, ['ChoDuyet', 'DaDuyet', 'TuChoi'], true)) {
            $sql .= " WHERE y.TrangThai = :status";
            $stmt = $db->prepare($sql . " ORDER BY y.NgayTao DESC");
            $stmt->execute(['status' => $status]);
        } else {
            $stmt = $db->query($sql . " ORDER BY CASE WHEN y.TrangThai = 'ChoDuyet' THEN 0 ELSE 1 END, y.NgayTao DESC");
        }

        Response::success('Lấy danh sách yêu cầu nạp tiền thành công', $stmt->fetchAll());
    }

    public static function approveDepositRequest(int $requestId): void {
        $admin = Auth::requireRole(['Admin']);
        $adminId = $admin['MaTaiKhoan'];

        $db = Database::getConnection();

        try {
            $db->beginTransaction();

            // 1. Khóa và kiểm tra yêu cầu nạp tiền
            $stmtReq = $db->prepare("
                SELECT y.*, t.HoTen, v.MaVi, v.SoDu
                FROM yeu_cau_nap_tien y
                JOIN taikhoan t ON y.MaTaiKhoan = t.MaTaiKhoan
                JOIN vi_noi_bo v ON t.MaTaiKhoan = v.MaTaiKhoan
                WHERE y.MaYeuCau = :id
                FOR UPDATE
            ");
            $stmtReq->execute(['id' => $requestId]);
            $req = $stmtReq->fetch();

            if (!$req) {
                $db->rollBack();
                Response::notFound('Không tìm thấy yêu cầu nạp tiền');
            }

            if ($req['TrangThai'] !== 'ChoDuyet') {
                $db->rollBack();
                Response::error("Yêu cầu này đã được xử lý trước đó với trạng thái: {$req['TrangThai']}");
            }

            $amount = (float)$req['SoTien'];
            $currentBalance = (float)$req['SoDu'];
            $newBalance = $currentBalance + $amount;

            // 2. Cập nhật số dư ví người dùng
            $stmtWallet = $db->prepare("UPDATE vi_noi_bo SET SoDu = :newBalance WHERE MaVi = :walletId");
            $stmtWallet->execute([
                'newBalance' => $newBalance,
                'walletId'   => $req['MaVi']
            ]);

            // 3. Ghi nhận lịch sử giao dịch ví (giao_dich_vi)
            $stmtLog = $db->prepare("
                INSERT INTO giao_dich_vi (MaVi, LoaiGiaoDich, SoTien, SoDuTruoc, SoDuSau, MaDon, GhiChu)
                VALUES (:walletId, 'NapTien', :amount, :before, :after, NULL, :note)
            ");
            $stmtLog->execute([
                'walletId' => $req['MaVi'],
                'amount'   => $amount,
                'before'   => $currentBalance,
                'after'    => $newBalance,
                'note'     => "Admin {$admin['HoTen']} duyệt nạp tiền VietQR ({$req['MaYeuCauHienThi']})"
            ]);

            // 4. Cập nhật trạng thái yêu cầu thành DaDuyet
            $stmtApprove = $db->prepare("
                UPDATE yeu_cau_nap_tien 
                SET TrangThai = 'DaDuyet',
                    MaAdminDuyet = :adminId,
                    NgayDuyet = NOW()
                WHERE MaYeuCau = :id
            ");
            $stmtApprove->execute([
                'adminId' => $adminId,
                'id'      => $requestId
            ]);

            $db->commit();

            Response::success("Đã duyệt nạp tiền thành công! Đã cộng " . number_format($amount, 0, ',', '.') . " đ vào ví của {$req['HoTen']}", [
                'request_id'   => $requestId,
                'request_code' => $req['MaYeuCauHienThi'],
                'user_id'      => $req['MaTaiKhoan'],
                'customer_name'=> $req['HoTen'],
                'amount_added' => $amount,
                'new_balance'  => $newBalance,
                'approved_by'  => $admin['HoTen'],
                'approved_at'  => date('Y-m-d H:i:s')
            ]);

        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Lỗi khi duyệt nạp tiền: ' . $e->getMessage(), 500);
        }
    }

    public static function rejectDepositRequest(int $requestId, array $data): void {
        $admin = Auth::requireRole(['Admin']);
        $adminId = $admin['MaTaiKhoan'];
        $reason = trim($data['LyDo'] ?? 'Thông tin chuyển khoản không khớp hoặc chưa nhận được tiền');

        $db = Database::getConnection();

        $stmt = $db->prepare("
            UPDATE yeu_cau_nap_tien 
            SET TrangThai = 'TuChoi',
                MaAdminDuyet = :adminId,
                NgayDuyet = NOW(),
                GhiChu = :reason
            WHERE MaYeuCau = :id AND TrangThai = 'ChoDuyet'
        ");
        $stmt->execute([
            'adminId' => $adminId,
            'reason'  => $reason,
            'id'      => $requestId
        ]);

        if ($stmt->rowCount() === 0) {
            Response::error('Yêu cầu không tồn tại hoặc đã được xử lý trước đó');
        }

        Response::success('Đã từ chối yêu cầu nạp tiền', [
            'request_id'  => $requestId,
            'status'      => 'TuChoi',
            'rejected_by' => $admin['HoTen'],
            'reason'      => $reason
        ]);
    }
}


CREATE DATABASE IF NOT EXISTS AppDatVeXeKhach
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE AppDatVeXeKhach;

-- =========================================
-- 1. TAI KHOAN
-- =========================================
CREATE TABLE TaiKhoan (
    MaTaiKhoan INT AUTO_INCREMENT PRIMARY KEY,
    TenDangNhap VARCHAR(50) NOT NULL UNIQUE,
    MatKhau VARCHAR(255) NOT NULL,
    HoTen VARCHAR(100) NOT NULL,
    Email VARCHAR(150) UNIQUE,
    SoDienThoai VARCHAR(15),
    VaiTro ENUM('User', 'Admin') NOT NULL DEFAULT 'User',
    TrangThai TINYINT(1) NOT NULL DEFAULT 1,
    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (TrangThai IN (0, 1))
) ENGINE = InnoDB;

-- =========================================
-- 2. TUYEN XE
-- =========================================
CREATE TABLE TuyenXe (
    MaTuyenXe INT AUTO_INCREMENT PRIMARY KEY,
    DiemDi VARCHAR(100) NOT NULL,
    DiemDen VARCHAR(100) NOT NULL,
    KhoangCachKm DECIMAL(8,2),
    ThoiGianDuKienPhut INT,

    CHECK (DiemDi <> DiemDen),
    CHECK (KhoangCachKm IS NULL OR KhoangCachKm > 0),
    CHECK (ThoiGianDuKienPhut IS NULL
           OR ThoiGianDuKienPhut > 0)
) ENGINE = InnoDB;

-- =========================================
-- 3. XE
-- =========================================
CREATE TABLE Xe (
    MaXe INT AUTO_INCREMENT PRIMARY KEY,
    BienSo VARCHAR(20) NOT NULL UNIQUE,
    TenXe VARCHAR(100) NOT NULL,
    SoLuongGhe INT NOT NULL,
    TrangThai ENUM('HoatDong', 'BaoTri', 'NgungHoatDong')
        NOT NULL DEFAULT 'HoatDong',

    CHECK (SoLuongGhe > 0)
) ENGINE = InnoDB;

-- =========================================
-- 4. GHE
-- =========================================
CREATE TABLE Ghe (
    MaGhe INT AUTO_INCREMENT PRIMARY KEY,
    MaXe INT NOT NULL,
    SoGhe VARCHAR(10) NOT NULL,
    LoaiGhe ENUM('Thuong', 'VIP') NOT NULL DEFAULT 'Thuong',

    CONSTRAINT FK_Ghe_Xe
        FOREIGN KEY (MaXe)
        REFERENCES Xe(MaXe),

    UNIQUE KEY UQ_Ghe_Xe_SoGhe (MaXe, SoGhe),
    UNIQUE KEY UQ_Ghe_MaGhe_MaXe (MaGhe, MaXe)
) ENGINE = InnoDB;

-- =========================================
-- 5. CHUYEN XE
-- =========================================
CREATE TABLE ChuyenXe (
    MaChuyenXe INT AUTO_INCREMENT PRIMARY KEY,
    MaTuyenXe INT NOT NULL,
    MaXe INT NOT NULL,
    GioKhoiHanh DATETIME NOT NULL,
    GioDenDuKien DATETIME NOT NULL,
    GiaVe DECIMAL(12,2) NOT NULL,
    TrangThai ENUM('SapChay', 'DangChay', 'HoanThanh', 'DaHuy')
        NOT NULL DEFAULT 'SapChay',

    CONSTRAINT FK_ChuyenXe_TuyenXe
        FOREIGN KEY (MaTuyenXe)
        REFERENCES TuyenXe(MaTuyenXe),

    CONSTRAINT FK_ChuyenXe_Xe
        FOREIGN KEY (MaXe)
        REFERENCES Xe(MaXe),

    UNIQUE KEY UQ_ChuyenXe_MaChuyenXe_MaXe
        (MaChuyenXe, MaXe),

    INDEX IX_ChuyenXe_Tuyen_Gio
        (MaTuyenXe, GioKhoiHanh),

    CHECK (GioDenDuKien > GioKhoiHanh),
    CHECK (GiaVe >= 0)
) ENGINE = InnoDB;

-- =========================================
-- 6. DAT VE
-- =========================================
CREATE TABLE DatVe (
    MaDatVe INT AUTO_INCREMENT PRIMARY KEY,
    MaTaiKhoan INT NULL,
    HoTenNguoiDat VARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(15) NOT NULL,
    Email VARCHAR(150),
    NgayDat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai ENUM('DaDat', 'DaHuy') NOT NULL DEFAULT 'DaDat',

    CONSTRAINT FK_DatVe_TaiKhoan
        FOREIGN KEY (MaTaiKhoan)
        REFERENCES TaiKhoan(MaTaiKhoan)
        ON DELETE SET NULL,

    INDEX IX_DatVe_TaiKhoan_NgayDat (MaTaiKhoan, NgayDat),
    INDEX IX_DatVe_SoDienThoai (SoDienThoai)
) ENGINE = InnoDB;

-- =========================================
-- 7. VE
-- =========================================
CREATE TABLE Ve (
    MaVe INT AUTO_INCREMENT PRIMARY KEY,
    MaDatVe INT NOT NULL,
    MaChuyenXe INT NOT NULL,
    MaXe INT NOT NULL,
    MaGhe INT NOT NULL,
    HoTenHanhKhach VARCHAR(100) NOT NULL,
    SoDienThoaiHanhKhach VARCHAR(15) NOT NULL,
    GiaVe DECIMAL(12,2) NOT NULL,
    TrangThai ENUM('DaDat', 'DaHuy') NOT NULL DEFAULT 'DaDat',

    -- Chỉ giữ mã ghế khi vé còn được đặt.
    -- Vé đã hủy sẽ có giá trị NULL, cho phép đặt lại ghế.
    GheDangDat INT
        GENERATED ALWAYS AS (
            CASE
                WHEN TrangThai = 'DaDat' THEN MaGhe
                ELSE NULL
            END
        ) STORED,

    CONSTRAINT FK_Ve_DatVe
        FOREIGN KEY (MaDatVe)
        REFERENCES DatVe(MaDatVe),

    CONSTRAINT FK_Ve_ChuyenXe_Xe
        FOREIGN KEY (MaChuyenXe, MaXe)
        REFERENCES ChuyenXe(MaChuyenXe, MaXe),

    CONSTRAINT FK_Ve_Ghe_Xe
        FOREIGN KEY (MaGhe, MaXe)
        REFERENCES Ghe(MaGhe, MaXe),

    -- Một ghế chỉ được đặt một lần trong một chuyến
    UNIQUE KEY UQ_Ve_Chuyen_Ghe
        (MaChuyenXe, GheDangDat),

    INDEX IX_Ve_MaDatVe (MaDatVe),
    INDEX IX_Ve_MaChuyenXe (MaChuyenXe),

    CHECK (GiaVe >= 0)
) ENGINE = InnoDB;

-- =========================================
-- 1. TAI KHOAN
-- =========================================
INSERT INTO TaiKhoan
    (TenDangNhap, MatKhau, HoTen, Email, SoDienThoai, VaiTro)
VALUES
    ('user01', 'HASH_DEMO_USER01', 'Nguyen Van An',
     'an@example.com', '0901000001', 'User'),
    ('user02', 'HASH_DEMO_USER02', 'Tran Thi Binh',
     'binh@example.com', '0901000002', 'User'),
    ('admin01', 'HASH_DEMO_ADMIN01', 'Quan tri vien',
     'admin@example.com', '0901000003', 'Admin');

-- =========================================
-- 2. TUYEN XE
-- =========================================
INSERT INTO TuyenXe
    (DiemDi, DiemDen, KhoangCachKm, ThoiGianDuKienPhut)
VALUES
    ('TP. Ho Chi Minh', 'Da Lat', 300, 420),
    ('TP. Ho Chi Minh', 'Vung Tau', 100, 150),
    ('TP. Ho Chi Minh', 'Can Tho', 170, 210),
    ('Ha Noi', 'Hai Phong', 120, 120),
    ('Da Lat', 'TP. Ho Chi Minh', 300, 420);

-- =========================================
-- 3. XE
-- =========================================
INSERT INTO Xe
    (BienSo, TenXe, SoLuongGhe, TrangThai)
VALUES
    ('51B-10001', 'Limousine 16 cho', 16, 'HoatDong'),
    ('51B-10002', 'Xe giuong nam 34 cho', 34, 'HoatDong'),
    ('65B-20001', 'Xe giuong nam 40 cho', 40, 'HoatDong'),
    ('15B-30001', 'Xe khach 29 cho', 29, 'HoatDong'),
    ('49B-40001', 'Limousine 16 cho', 16, 'HoatDong');

-- =========================================
-- 4. GHE
-- Tao ghe tu dong cho tung xe
-- =========================================
INSERT INTO Ghe (MaXe, SoGhe, LoaiGhe)
SELECT x.MaXe, CONCAT('G', LPAD(n.So, 2, '0')),
       CASE WHEN n.So <= 4 THEN 'VIP' ELSE 'Thuong' END
FROM Xe x
JOIN (
    SELECT 1 AS So UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
    SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
    SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL
    SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL
    SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL
    SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL
    SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL
    SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL
    SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL
    SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL
    SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL
    SELECT 34 UNION ALL SELECT 35 UNION ALL SELECT 36 UNION ALL
    SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL
    SELECT 40
) n ON n.So <= x.SoLuongGhe;

-- =========================================
-- 5. CHUYEN XE
-- Chuyen xe tu 19/10 den 25/10/2026
-- =========================================
INSERT INTO ChuyenXe
    (MaTuyenXe, MaXe, GioKhoiHanh, GioDenDuKien, GiaVe, TrangThai)
VALUES
    (1, 1, '2026-10-19 07:00:00', '2026-10-19 14:00:00', 350000, 'SapChay'),
    (1, 2, '2026-10-20 21:00:00', '2026-10-21 04:00:00', 300000, 'SapChay'),
    (2, 1, '2026-10-21 08:00:00', '2026-10-21 10:30:00', 180000, 'SapChay'),
    (3, 3, '2026-10-22 09:00:00', '2026-10-22 12:30:00', 200000, 'SapChay'),
    (4, 4, '2026-10-23 06:30:00', '2026-10-23 08:30:00', 150000, 'SapChay'),
    (5, 5, '2026-10-24 08:00:00', '2026-10-24 15:00:00', 350000, 'SapChay'),
    (1, 1, '2026-10-25 07:00:00', '2026-10-25 14:00:00', 350000, 'SapChay');

-- =========================================
-- 6. DAT VE
-- =========================================
INSERT INTO DatVe
    (MaTaiKhoan, HoTenNguoiDat, SoDienThoai, Email, NgayDat, TrangThai)
VALUES
    (1, 'Nguyen Van An', '0901000001',
     'an@example.com', '2026-10-15 09:00:00', 'DaDat'),
    (2, 'Tran Thi Binh', '0901000002',
     'binh@example.com', '2026-10-15 10:00:00', 'DaDat');

-- =========================================
-- 7. VE
-- Chon ghe thuoc dung xe cua chuyen
-- =========================================
INSERT INTO Ve
    (MaDatVe, MaChuyenXe, MaXe, MaGhe,
     HoTenHanhKhach, SoDienThoaiHanhKhach, GiaVe, TrangThai)
SELECT
    1, cx.MaChuyenXe, cx.MaXe, g.MaGhe,
    'Nguyen Van An', '0901000001', cx.GiaVe, 'DaDat'
FROM ChuyenXe cx
JOIN Ghe g ON g.MaXe = cx.MaXe AND g.SoGhe = 'G01'
WHERE cx.MaTuyenXe = 1
  AND cx.GioKhoiHanh = '2026-10-19 07:00:00'
LIMIT 1;

INSERT INTO Ve
    (MaDatVe, MaChuyenXe, MaXe, MaGhe,
     HoTenHanhKhach, SoDienThoaiHanhKhach, GiaVe, TrangThai)
SELECT
    2, cx.MaChuyenXe, cx.MaXe, g.MaGhe,
    'Tran Thi Binh', '0901000002', cx.GiaVe, 'DaDat'
FROM ChuyenXe cx
JOIN Ghe g ON g.MaXe = cx.MaXe AND g.SoGhe = 'G02'
WHERE cx.MaTuyenXe = 2
  AND cx.GioKhoiHanh = '2026-10-21 08:00:00'
LIMIT 1;

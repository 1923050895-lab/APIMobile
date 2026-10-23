-- ========================================================
-- HỆ THỐNG QUẢN LÝ ĐẶT VÉ XE KHÁCH (BUS TICKET MANAGEMENT)
-- Cơ sở dữ liệu thiết kế theo tài liệu phân tích hệ thống
-- Phiên bản: 1.0 (Chuẩn hóa UTF8MB4 & InnoDB)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `appdatvexekhach` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `appdatvexekhach`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `giao_dich_ngan_hang`;
DROP TABLE IF EXISTS `lich_su_in_ve`;
DROP TABLE IF EXISTS `ve`;
DROP TABLE IF EXISTS `chi_tiet_dat_ve`;
DROP TABLE IF EXISTS `don_dat_ve`;
DROP TABLE IF EXISTS `chuyen_xe`;
DROP TABLE IF EXISTS `ghe`;
DROP TABLE IF EXISTS `xe`;
DROP TABLE IF EXISTS `tuyen_xe`;
DROP TABLE IF EXISTS `dia_diem`;
DROP TABLE IF EXISTS `giao_dich_vi`;
DROP TABLE IF EXISTS `vi_noi_bo`;
DROP TABLE IF EXISTS `taikhoan`;

-- Drop any legacy tables if they exist
DROP TABLE IF EXISTS `chuyenxe`;
DROP TABLE IF EXISTS `datve`;
DROP TABLE IF EXISTS `diadiem`;
DROP TABLE IF EXISTS `tuyenxe`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. BẢNG TÀI KHOẢN (TaiKhoan)
CREATE TABLE `taikhoan` (
  `MaTaiKhoan` INT(11) NOT NULL AUTO_INCREMENT,
  `TenDangNhap` VARCHAR(50) NOT NULL UNIQUE,
  `MatKhau` VARCHAR(255) NOT NULL,
  `HoTen` VARCHAR(100) NOT NULL,
  `SoDienThoai` VARCHAR(15) NULL,
  `Email` VARCHAR(150) NULL,
  `VaiTro` ENUM('KhachHang', 'NhanVien', 'Admin', 'Guest') NOT NULL DEFAULT 'KhachHang',
  `TrangThai` ENUM('HoatDong', 'BiKhoa') NOT NULL DEFAULT 'HoatDong',
  `NgayTao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaTaiKhoan`),
  INDEX `IDX_TaiKhoan_VaiTro` (`VaiTro`),
  INDEX `IDX_TaiKhoan_SDT` (`SoDienThoai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG VÍ NỘI BỘ (ViNoiBo - BR-01)
CREATE TABLE `vi_noi_bo` (
  `MaVi` INT(11) NOT NULL AUTO_INCREMENT,
  `MaTaiKhoan` INT(11) NOT NULL UNIQUE,
  `SoDu` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `NgayCapNhat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaVi`),
  CONSTRAINT `FK_ViNoiBo_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE CASCADE,
  CONSTRAINT `CHK_ViNoiBo_SoDu` CHECK (`SoDu` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG GIAO DỊCH VÍ (GiaoDichVi - BR-01, BR-04)
CREATE TABLE `giao_dich_vi` (
  `MaGiaoDich` INT(11) NOT NULL AUTO_INCREMENT,
  `MaVi` INT(11) NOT NULL,
  `LoaiGiaoDich` ENUM('NapTien', 'ThanhToanVe', 'HoanTien') NOT NULL,
  `SoTien` DECIMAL(15,2) NOT NULL,
  `SoDuTruoc` DECIMAL(15,2) NOT NULL,
  `SoDuSau` DECIMAL(15,2) NOT NULL,
  `MaDon` INT(11) NULL,
  `ThoiGian` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `GhiChu` VARCHAR(255) NULL,
  PRIMARY KEY (`MaGiaoDich`),
  INDEX `IDX_GDV_Vi` (`MaVi`),
  INDEX `IDX_GDV_MaDon` (`MaDon`),
  CONSTRAINT `FK_GiaoDichVi_Vi` FOREIGN KEY (`MaVi`) REFERENCES `vi_noi_bo` (`MaVi`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG ĐỊA ĐIỂM / TRẠM (DiaDiem - UC-10)
CREATE TABLE `dia_diem` (
  `MaDiaDiem` INT(11) NOT NULL AUTO_INCREMENT,
  `TenDiaDiem` VARCHAR(100) NOT NULL,
  `DiaChi` VARCHAR(255) NOT NULL,
  `MoTa` TEXT NULL,
  `TrangThai` ENUM('HoatDong', 'NgungHoatDong') NOT NULL DEFAULT 'HoatDong',
  PRIMARY KEY (`MaDiaDiem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG TUYẾN XE (TuyenXe)
CREATE TABLE `tuyen_xe` (
  `MaTuyenXe` INT(11) NOT NULL AUTO_INCREMENT,
  `TenTuyen` VARCHAR(150) NOT NULL,
  `MaDiemDi` INT(11) NOT NULL,
  `MaDiemDen` INT(11) NOT NULL,
  `KhoangCachKm` DECIMAL(8,2) NULL,
  `ThoiGianDuKienPhut` INT(11) NULL,
  `TrangThai` ENUM('HoatDong', 'NgungHoatDong') NOT NULL DEFAULT 'HoatDong',
  PRIMARY KEY (`MaTuyenXe`),
  INDEX `IDX_Tuyen_DiemDi` (`MaDiemDi`),
  INDEX `IDX_Tuyen_DiemDen` (`MaDiemDen`),
  CONSTRAINT `FK_TuyenXe_DiemDi` FOREIGN KEY (`MaDiemDi`) REFERENCES `dia_diem` (`MaDiaDiem`),
  CONSTRAINT `FK_TuyenXe_DiemDen` FOREIGN KEY (`MaDiemDen`) REFERENCES `dia_diem` (`MaDiaDiem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG XE (Xe - UC-11)
CREATE TABLE `xe` (
  `MaXe` INT(11) NOT NULL AUTO_INCREMENT,
  `BienSo` VARCHAR(20) NOT NULL UNIQUE,
  `TenXe` VARCHAR(100) NOT NULL,
  `LoaiXe` VARCHAR(50) NOT NULL DEFAULT 'GiuongNam',
  `SoLuongGhe` INT(11) NOT NULL,
  `TrangThai` ENUM('HoatDong', 'BaoTri', 'NgungHoatDong') NOT NULL DEFAULT 'HoatDong',
  PRIMARY KEY (`MaXe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG GHẾ VẬT LÝ (Ghe - UC-11)
CREATE TABLE `ghe` (
  `MaGhe` INT(11) NOT NULL AUTO_INCREMENT,
  `MaXe` INT(11) NOT NULL,
  `SoGhe` VARCHAR(10) NOT NULL,
  `Tang` TINYINT(1) NOT NULL DEFAULT 1,
  `TrangThai` ENUM('HoatDong', 'Hong') NOT NULL DEFAULT 'HoatDong',
  PRIMARY KEY (`MaGhe`),
  UNIQUE KEY `UQ_Ghe_Xe_SoGhe` (`MaXe`, `SoGhe`),
  CONSTRAINT `FK_Ghe_Xe` FOREIGN KEY (`MaXe`) REFERENCES `xe` (`MaXe`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG CHUYẾN XE (ChuyenXe - UC-12, BR-09)
CREATE TABLE `chuyen_xe` (
  `MaChuyen` INT(11) NOT NULL AUTO_INCREMENT,
  `MaTuyenXe` INT(11) NOT NULL,
  `MaXe` INT(11) NOT NULL,
  `ThoiGianDi` DATETIME NOT NULL,
  `ThoiGianDen` DATETIME NOT NULL,
  `GiaVe` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `TrangThai` ENUM('SapChay', 'DangChay', 'HoanThanh', 'DaHuy') NOT NULL DEFAULT 'SapChay',
  PRIMARY KEY (`MaChuyen`),
  INDEX `IDX_Chuyen_Tuyen` (`MaTuyenXe`),
  INDEX `IDX_Chuyen_Xe` (`MaXe`),
  INDEX `IDX_Chuyen_ThoiGianDi` (`ThoiGianDi`),
  CONSTRAINT `FK_ChuyenXe_TuyenXe` FOREIGN KEY (`MaTuyenXe`) REFERENCES `tuyen_xe` (`MaTuyenXe`),
  CONSTRAINT `FK_ChuyenXe_Xe` FOREIGN KEY (`MaXe`) REFERENCES `xe` (`MaXe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BẢNG ĐƠN ĐẶT VÉ (DonDatVe - UC-03, UC-07, BR-01, BR-07, BR-08)
CREATE TABLE `don_dat_ve` (
  `MaDon` INT(11) NOT NULL AUTO_INCREMENT,
  `MaDonHienThi` VARCHAR(30) NOT NULL UNIQUE,
  `MaTaiKhoan` INT(11) NOT NULL,
  `MaChuyen` INT(11) NOT NULL,
  `TenKhachHang` VARCHAR(100) NOT NULL,
  `SoDienThoaiKhach` VARCHAR(15) NOT NULL,
  `EmailKhach` VARCHAR(150) NULL,
  `NgayDat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `SoLuongGhe` INT(11) NOT NULL DEFAULT 1,
  `TongTien` DECIMAL(15,2) NOT NULL,
  `PhuongThucThanhToan` ENUM('ViNoiBo', 'TienMat', 'ChuyenKhoan') NOT NULL DEFAULT 'ViNoiBo',
  `TrangThaiThanhToan` ENUM('ChuaThanhToan', 'DaThanhToan', 'ThatBai') NOT NULL DEFAULT 'ChuaThanhToan',
  `TrangThaiDon` ENUM('ChoXacNhan', 'ThanhCong', 'DaHuy') NOT NULL DEFAULT 'ChoXacNhan',
  `LoaiDat` ENUM('Online', 'Quay') NOT NULL DEFAULT 'Online',
  `MaNhanVienXacNhan` INT(11) NULL,
  `ThoiGianXacNhan` DATETIME NULL,
  PRIMARY KEY (`MaDon`),
  INDEX `IDX_Don_TaiKhoan` (`MaTaiKhoan`),
  INDEX `IDX_Don_Chuyen` (`MaChuyen`),
  INDEX `IDX_Don_TrangThai` (`TrangThaiDon`),
  CONSTRAINT `FK_DonDatVe_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`),
  CONSTRAINT `FK_DonDatVe_ChuyenXe` FOREIGN KEY (`MaChuyen`) REFERENCES `chuyen_xe` (`MaChuyen`),
  CONSTRAINT `FK_DonDatVe_NhanVien` FOREIGN KEY (`MaNhanVienXacNhan`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BẢNG CHI TIẾT ĐẶT VÉ (ChiTietDatVe - BR-02, BR-05, UC-02)
-- Sử dụng GheDangGiu (GENERATED COLUMN) để đảm bảo 1 ghế chỉ được đặt bởi 1 đơn còn hiệu lực trên cùng chuyến
CREATE TABLE `chi_tiet_dat_ve` (
  `MaChiTiet` INT(11) NOT NULL AUTO_INCREMENT,
  `MaDon` INT(11) NOT NULL,
  `MaChuyen` INT(11) NOT NULL,
  `MaGhe` INT(11) NOT NULL,
  `DonGia` DECIMAL(12,2) NOT NULL,
  `TrangThaiChiTiet` ENUM('DaDat', 'DaHuy') NOT NULL DEFAULT 'DaDat',
  `GheDangGiu` INT(11) GENERATED ALWAYS AS (CASE WHEN `TrangThaiChiTiet` = 'DaDat' THEN `MaGhe` ELSE NULL END) STORED,
  PRIMARY KEY (`MaChiTiet`),
  UNIQUE KEY `UQ_Chuyen_GheDangGiu` (`MaChuyen`, `GheDangGiu`),
  INDEX `IDX_ChiTiet_Don` (`MaDon`),
  INDEX `IDX_ChiTiet_Ghe` (`MaGhe`),
  CONSTRAINT `FK_ChiTiet_Don` FOREIGN KEY (`MaDon`) REFERENCES `don_dat_ve` (`MaDon`) ON DELETE CASCADE,
  CONSTRAINT `FK_ChiTiet_Chuyen` FOREIGN KEY (`MaChuyen`) REFERENCES `chuyen_xe` (`MaChuyen`),
  CONSTRAINT `FK_ChiTiet_Ghe` FOREIGN KEY (`MaGhe`) REFERENCES `ghe` (`MaGhe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. BẢNG VÉ (Ve - BR-03, BR-04, BR-05, UC-03, UC-04, UC-05, UC-06)
-- 1 đơn chỉ có đúng 1 mã vé duy nhất chứa danh sách toàn bộ ghế
CREATE TABLE `ve` (
  `MaVe` INT(11) NOT NULL AUTO_INCREMENT,
  `MaDon` INT(11) NOT NULL UNIQUE,
  `MaVeHienThi` VARCHAR(30) NOT NULL UNIQUE,
  `TrangThaiVe` ENUM('ChuaIn', 'DaIn', 'DaHuy') NOT NULL DEFAULT 'ChuaIn',
  `ThoiGianInDauTien` DATETIME NULL,
  `ThoiGianHuy` DATETIME NULL,
  `SoTienHoan` DECIMAL(15,2) NULL DEFAULT 0.00,
  PRIMARY KEY (`MaVe`),
  INDEX `IDX_Ve_TrangThai` (`TrangThaiVe`),
  CONSTRAINT `FK_Ve_DonDatVe` FOREIGN KEY (`MaDon`) REFERENCES `don_dat_ve` (`MaDon`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. BẢNG LỊCH SỬ IN VÉ (LichSuInVe - BR-03, UC-04, UC-05, UC-09)
CREATE TABLE `lich_su_in_ve` (
  `MaLichSuIn` INT(11) NOT NULL AUTO_INCREMENT,
  `MaVe` INT(11) NOT NULL,
  `MaTaiKhoanThaoTac` INT(11) NOT NULL,
  `ThoiGianIn` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `SoLanIn` INT(11) NOT NULL DEFAULT 1,
  `GhiChu` VARCHAR(255) NULL,
  PRIMARY KEY (`MaLichSuIn`),
  INDEX `IDX_LichSuIn_Ve` (`MaVe`),
  CONSTRAINT `FK_LichSuIn_Ve` FOREIGN KEY (`MaVe`) REFERENCES `ve` (`MaVe`) ON DELETE CASCADE,
  CONSTRAINT `FK_LichSuIn_TaiKhoan` FOREIGN KEY (`MaTaiKhoanThaoTac`) REFERENCES `taikhoan` (`MaTaiKhoan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. BẢNG GIAO DỊCH NGÂN HÀNG (GiaoDichNganHang - BR-10, UC-14)
-- Idempotent chống cộng tiền trùng bằng MaThamChieuNganHang UNIQUE
CREATE TABLE `giao_dich_ngan_hang` (
  `MaGiaoDichNH` INT(11) NOT NULL AUTO_INCREMENT,
  `MaThamChieuNganHang` VARCHAR(100) NOT NULL UNIQUE,
  `NoiDungChuyenKhoan` VARCHAR(255) NOT NULL,
  `SoTien` DECIMAL(15,2) NOT NULL,
  `ThoiGianGiaoDich` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `MaTaiKhoanDuKien` INT(11) NULL,
  `TrangThaiXuLy` ENUM('ChoXuLy', 'ThanhCong', 'ThatBai', 'SaiCuPhap') NOT NULL DEFAULT 'ChoXuLy',
  `ThoiGianXuLy` DATETIME NULL,
  `GhiChu` VARCHAR(255) NULL,
  PRIMARY KEY (`MaGiaoDichNH`),
  INDEX `IDX_GDNH_TrangThai` (`TrangThaiXuLy`),
  CONSTRAINT `FK_GDNH_TaiKhoan` FOREIGN KEY (`MaTaiKhoanDuKien`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. BẢNG YÊU CẦU NẠP TIỀN VIETQR (YeuCauNapTien - Chờ Admin Duyệt)
CREATE TABLE `yeu_cau_nap_tien` (
  `MaYeuCau` INT(11) NOT NULL AUTO_INCREMENT,
  `MaYeuCauHienThi` VARCHAR(30) NOT NULL UNIQUE,
  `MaTaiKhoan` INT(11) NOT NULL,
  `SoTien` DECIMAL(15,2) NOT NULL,
  `NoiDungChuyenKhoan` VARCHAR(255) NOT NULL,
  `NganHang` VARCHAR(50) NOT NULL DEFAULT 'Vietcombank',
  `SoTaiKhoanNhan` VARCHAR(50) NOT NULL DEFAULT '1041002875',
  `TenTaiKhoanNhan` VARCHAR(100) NOT NULL DEFAULT 'NGUYEN MANH CUONG',
  `TrangThai` ENUM('ChoDuyet', 'DaDuyet', 'TuChoi') NOT NULL DEFAULT 'ChoDuyet',
  `NgayTao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `MaAdminDuyet` INT(11) NULL,
  `NgayDuyet` DATETIME NULL,
  `GhiChu` VARCHAR(255) NULL,
  PRIMARY KEY (`MaYeuCau`),
  INDEX `IDX_YCNT_TaiKhoan` (`MaTaiKhoan`),
  INDEX `IDX_YCNT_TrangThai` (`TrangThai`),
  CONSTRAINT `FK_YCNT_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE CASCADE,
  CONSTRAINT `FK_YCNT_Admin` FOREIGN KEY (`MaAdminDuyet`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- DỮ LIỆU KHỞI TẠO (SEED DATA)
-- Mật khẩu mặc định cho các tài khoản test: 123456
-- Hash bcrypt tương ứng: $2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi
-- ========================================================

-- Tài khoản: Admin, Nhân viên quầy, Khách hàng, Tài khoản Guest (cho khách vãng lai)
INSERT INTO `taikhoan` (`MaTaiKhoan`, `TenDangNhap`, `MatKhau`, `HoTen`, `SoDienThoai`, `Email`, `VaiTro`, `TrangThai`) VALUES
(1, 'admin01', '$2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi', 'Quản Trị Viên Hệ Thống', '0909000001', 'admin@vexekhach.vn', 'Admin', 'HoatDong'),
(2, 'nhanvien01', '$2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi', 'Nguyễn Thị Thu Ngân', '0909000002', 'nhanvien01@vexekhach.vn', 'NhanVien', 'HoatDong'),
(3, 'khachhang01', '$2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi', 'Nguyễn Văn An', '0901000001', 'an.nguyen@gmail.com', 'KhachHang', 'HoatDong'),
(4, 'khachhang02', '$2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi', 'Trần Thị Bình', '0901000002', 'binh.tran@gmail.com', 'KhachHang', 'HoatDong'),
(5, 'guest', '$2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi', 'Khách Vãng Lai Tại Quầy', '0999999999', 'guest@vexekhach.vn', 'Guest', 'HoatDong');

-- Khởi tạo ví nội bộ cho người dùng
INSERT INTO `vi_noi_bo` (`MaVi`, `MaTaiKhoan`, `SoDu`) VALUES
(1, 1, 0.00),
(2, 2, 0.00),
(3, 3, 1500000.00), -- Khách hàng 1 có sẵn 1.500.000đ để test đặt vé
(4, 4, 300000.00),  -- Khách hàng 2 có sẵn 300.000đ
(5, 5, 0.00);

-- Danh mục Địa điểm / Bến xe
INSERT INTO `dia_diem` (`MaDiaDiem`, `TenDiaDiem`, `DiaChi`, `MoTa`, `TrangThai`) VALUES
(1, 'Bến xe Miền Đông Mới', '501 Hoàng Hữu Nam, TP. Thủ Đức, TP. Hồ Chí Minh', 'Bến xe liên tỉnh phía Đông', 'HoatDong'),
(2, 'Bến xe Liên tỉnh Đà Lạt', '01 Tô Hiến Thành, Phường 3, TP. Đà Lạt', 'Bến xe trung tâm TP. Đà Lạt', 'HoatDong'),
(3, 'Bến xe Vũng Tàu', '192 Nam Kỳ Khởi Nghĩa, Phường Thắng Tam, TP. Vũng Tàu', 'Bến xe khách TP. Vũng Tàu', 'HoatDong'),
(4, 'Bến xe Trung tâm Cần Thơ', 'Quốc lộ 1A, Hưng Thạnh, Cái Răng, Cần Thơ', 'Bến xe lớn Tây Nam Bộ', 'HoatDong'),
(5, 'Bến xe Nước Ngầm', 'Km8 Đường Giải Phóng, Hoàng Liệt, Hoàng Mai, Hà Nội', 'Bến xe cửa ngõ phía Nam Hà Nội', 'HoatDong'),
(6, 'Bến xe Niệm Nghĩa', '275 Trần Nguyên Hãn, Lê Chân, Hải Phòng', 'Bến xe trung tâm Hải Phòng', 'HoatDong');

-- Danh mục Tuyến xe
INSERT INTO `tuyen_xe` (`MaTuyenXe`, `TenTuyen`, `MaDiemDi`, `MaDiemDen`, `KhoangCachKm`, `ThoiGianDuKienPhut`, `TrangThai`) VALUES
(1, 'TP.HCM - Đà Lạt', 1, 2, 305.00, 390, 'HoatDong'),
(2, 'TP.HCM - Vũng Tàu', 1, 3, 105.00, 150, 'HoatDong'),
(3, 'TP.HCM - Cần Thơ', 1, 4, 169.00, 210, 'HoatDong'),
(4, 'Hà Nội - Hải Phòng', 5, 6, 120.00, 120, 'HoatDong'),
(5, 'Đà Lạt - TP.HCM', 2, 1, 305.00, 390, 'HoatDong');

-- Danh mục Xe
INSERT INTO `xe` (`MaXe`, `BienSo`, `TenXe`, `LoaiXe`, `SoLuongGhe`, `TrangThai`) VALUES
(1, '51B-123.45', 'Limousine Cung Điện 24 Phòng', 'Limousine', 24, 'HoatDong'),
(2, '51B-678.90', 'Xe Giường Nằm VIP 24 Chỗ', 'GiuongNam', 24, 'HoatDong'),
(3, '49B-555.88', 'Limousine 16 Ghế Cao Cấp', 'GheNgoi', 16, 'HoatDong');

-- Khởi tạo ghế cho Xe 1 (24 phòng: A01 - A12 tầng dưới, B01 - B12 tầng trên)
INSERT INTO `ghe` (`MaXe`, `SoGhe`, `Tang`, `TrangThai`) VALUES
(1, 'A01', 1, 'HoatDong'), (1, 'A02', 1, 'HoatDong'), (1, 'A03', 1, 'HoatDong'), (1, 'A04', 1, 'HoatDong'),
(1, 'A05', 1, 'HoatDong'), (1, 'A06', 1, 'HoatDong'), (1, 'A07', 1, 'HoatDong'), (1, 'A08', 1, 'HoatDong'),
(1, 'A09', 1, 'HoatDong'), (1, 'A10', 1, 'HoatDong'), (1, 'A11', 1, 'HoatDong'), (1, 'A12', 1, 'HoatDong'),
(1, 'B01', 2, 'HoatDong'), (1, 'B02', 2, 'HoatDong'), (1, 'B03', 2, 'HoatDong'), (1, 'B04', 2, 'HoatDong'),
(1, 'B05', 2, 'HoatDong'), (1, 'B06', 2, 'HoatDong'), (1, 'B07', 2, 'HoatDong'), (1, 'B08', 2, 'HoatDong'),
(1, 'B09', 2, 'HoatDong'), (1, 'B10', 2, 'HoatDong'), (1, 'B11', 2, 'HoatDong'), (1, 'B12', 2, 'HoatDong');

-- Khởi tạo ghế cho Xe 2 (Xe Giường Nằm 24 Chỗ: 2 tầng, mỗi tầng 2 hàng x 6 chỗ)
INSERT INTO `ghe` (`MaXe`, `SoGhe`, `Tang`, `TrangThai`) VALUES
(2, 'A01', 1, 'HoatDong'), (2, 'A02', 1, 'HoatDong'), (2, 'A03', 1, 'HoatDong'), (2, 'A04', 1, 'HoatDong'),
(2, 'A05', 1, 'HoatDong'), (2, 'A06', 1, 'HoatDong'), (2, 'A07', 1, 'HoatDong'), (2, 'A08', 1, 'HoatDong'),
(2, 'A09', 1, 'HoatDong'), (2, 'A10', 1, 'HoatDong'), (2, 'A11', 1, 'HoatDong'), (2, 'A12', 1, 'HoatDong'),
(2, 'B01', 2, 'HoatDong'), (2, 'B02', 2, 'HoatDong'), (2, 'B03', 2, 'HoatDong'), (2, 'B04', 2, 'HoatDong'),
(2, 'B05', 2, 'HoatDong'), (2, 'B06', 2, 'HoatDong'), (2, 'B07', 2, 'HoatDong'), (2, 'B08', 2, 'HoatDong'),
(2, 'B09', 2, 'HoatDong'), (2, 'B10', 2, 'HoatDong'), (2, 'B11', 2, 'HoatDong'), (2, 'B12', 2, 'HoatDong');

-- Khởi tạo ghế cho Xe 3 (16 ghế ngồi: G01 - G16)
INSERT INTO `ghe` (`MaXe`, `SoGhe`, `Tang`, `TrangThai`) VALUES
(3, 'G01', 1, 'HoatDong'), (3, 'G02', 1, 'HoatDong'), (3, 'G03', 1, 'HoatDong'), (3, 'G04', 1, 'HoatDong'),
(3, 'G05', 1, 'HoatDong'), (3, 'G06', 1, 'HoatDong'), (3, 'G07', 1, 'HoatDong'), (3, 'G08', 1, 'HoatDong'),
(3, 'G09', 1, 'HoatDong'), (3, 'G10', 1, 'HoatDong'), (3, 'G11', 1, 'HoatDong'), (3, 'G12', 1, 'HoatDong'),
(3, 'G13', 1, 'HoatDong'), (3, 'G14', 1, 'HoatDong'), (3, 'G15', 1, 'HoatDong'), (3, 'G16', 1, 'HoatDong');

-- Chuyến xe mẫu
INSERT INTO `chuyen_xe` (`MaChuyen`, `MaTuyenXe`, `MaXe`, `ThoiGianDi`, `ThoiGianDen`, `GiaVe`, `TrangThai`) VALUES
(1, 1, 1, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 7 HOUR), 350000.00, 'SapChay'),
(2, 1, 1, DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 7 HOUR), 350000.00, 'SapChay'),
(3, 2, 3, DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 2 HOUR), DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 5 HOUR), 180000.00, 'SapChay');

-- Đơn đặt vé mẫu (Khách hàng Nguyễn Văn An đặt 2 ghế A01, A02 của Chuyến 1)
INSERT INTO `don_dat_ve` (`MaDon`, `MaDonHienThi`, `MaTaiKhoan`, `MaChuyen`, `TenKhachHang`, `SoDienThoaiKhach`, `EmailKhach`, `NgayDat`, `SoLuongGhe`, `TongTien`, `PhuongThucThanhToan`, `TrangThaiThanhToan`, `TrangThaiDon`, `LoaiDat`) VALUES
(1, 'DON-20261022-0001', 3, 1, 'Nguyễn Văn An', '0901000001', 'an.nguyen@gmail.com', NOW(), 2, 700000.00, 'ViNoiBo', 'DaThanhToan', 'ThanhCong', 'Online');

-- Chi tiết ghế đặt cho Đơn 1 (ghế A01, A02)
INSERT INTO `chi_tiet_dat_ve` (`MaChiTiet`, `MaDon`, `MaChuyen`, `MaGhe`, `DonGia`, `TrangThaiChiTiet`) VALUES
(1, 1, 1, 1, 350000.00, 'DaDat'),
(2, 1, 1, 2, 350000.00, 'DaDat');

-- Vé tương ứng cho Đơn 1 (1 vé duy nhất chứa cả 2 ghế)
INSERT INTO `ve` (`MaVe`, `MaDon`, `MaVeHienThi`, `TrangThaiVe`, `ThoiGianInDauTien`) VALUES
(1, 1, 'VE-20261022-8888', 'ChuaIn', NULL);

-- Ghi nhận giao dịch ví trừ tiền đơn 1
INSERT INTO `giao_dich_vi` (`MaVi`, `LoaiGiaoDich`, `SoTien`, `SoDuTruoc`, `SoDuSau`, `MaDon`, `GhiChu`) VALUES
(3, 'ThanhToanVe', 700000.00, 2200000.00, 1500000.00, 1, 'Thanh toán đơn đặt vé DON-20261022-0001 (2 ghế)');

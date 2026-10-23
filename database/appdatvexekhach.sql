-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 23, 2026 lúc 08:01 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `appdatvexekhach`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chi_tiet_dat_ve`
--

CREATE TABLE `chi_tiet_dat_ve` (
  `MaChiTiet` int(11) NOT NULL,
  `MaDon` int(11) NOT NULL,
  `MaChuyen` int(11) NOT NULL,
  `MaGhe` int(11) NOT NULL,
  `DonGia` decimal(12,2) NOT NULL,
  `TrangThaiChiTiet` enum('DaDat','DaHuy') NOT NULL DEFAULT 'DaDat',
  `GheDangGiu` int(11) GENERATED ALWAYS AS (case when `TrangThaiChiTiet` = 'DaDat' then `MaGhe` else NULL end) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `chi_tiet_dat_ve`
--

INSERT INTO `chi_tiet_dat_ve` (`MaChiTiet`, `MaDon`, `MaChuyen`, `MaGhe`, `DonGia`, `TrangThaiChiTiet`) VALUES
(1, 1, 1, 1, 350000.00, 'DaDat'),
(2, 1, 1, 2, 350000.00, 'DaDat'),
(3, 2, 1, 3, 350000.00, 'DaDat'),
(4, 2, 1, 4, 350000.00, 'DaDat'),
(5, 3, 1, 5, 350000.00, 'DaHuy'),
(6, 4, 1, 5, 350000.00, 'DaHuy'),
(7, 5, 1, 5, 350000.00, 'DaHuy'),
(8, 6, 1, 5, 350000.00, 'DaHuy'),
(9, 7, 1, 6, 350000.00, 'DaDat'),
(10, 8, 1, 5, 350000.00, 'DaDat'),
(11, 9, 3, 38, 180000.00, 'DaDat'),
(12, 10, 3, 35, 180000.00, 'DaDat'),
(13, 11, 1, 8, 350000.00, 'DaHuy'),
(14, 12, 1, 7, 350000.00, 'DaDat');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chuyen_xe`
--

CREATE TABLE `chuyen_xe` (
  `MaChuyen` int(11) NOT NULL,
  `MaTuyenXe` int(11) NOT NULL,
  `MaXe` int(11) NOT NULL,
  `ThoiGianDi` datetime NOT NULL,
  `ThoiGianDen` datetime NOT NULL,
  `GiaVe` decimal(12,2) NOT NULL DEFAULT 0.00,
  `TrangThai` enum('SapChay','DangChay','HoanThanh','DaHuy') NOT NULL DEFAULT 'SapChay'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `chuyen_xe`
--

INSERT INTO `chuyen_xe` (`MaChuyen`, `MaTuyenXe`, `MaXe`, `ThoiGianDi`, `ThoiGianDen`, `GiaVe`, `TrangThai`) VALUES
(1, 1, 1, '2026-10-23 19:03:39', '2026-10-24 02:03:39', 350000.00, 'SapChay'),
(2, 1, 1, '2026-10-24 19:03:39', '2026-10-25 02:03:39', 350000.00, 'SapChay'),
(3, 2, 3, '2026-10-23 21:03:39', '2026-10-24 00:03:39', 180000.00, 'SapChay'),
(4, 5, 4, '2026-11-01 07:30:00', '2026-11-01 13:30:00', 290000.00, 'SapChay'),
(5, 5, 2, '2026-10-23 08:00:00', '2026-10-23 14:00:00', 250000.00, 'SapChay');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `dia_diem`
--

CREATE TABLE `dia_diem` (
  `MaDiaDiem` int(11) NOT NULL,
  `TenDiaDiem` varchar(100) NOT NULL,
  `DiaChi` varchar(255) NOT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` enum('HoatDong','NgungHoatDong') NOT NULL DEFAULT 'HoatDong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `dia_diem`
--

INSERT INTO `dia_diem` (`MaDiaDiem`, `TenDiaDiem`, `DiaChi`, `MoTa`, `TrangThai`) VALUES
(1, 'Bến xe Miền Đông Mới', '501 Hoàng Hữu Nam, TP. Thủ Đức, TP. Hồ Chí Minh', 'Bến xe liên tỉnh phía Đông', 'HoatDong'),
(2, 'Bến xe Liên tỉnh Đà Lạt', '01 Tô Hiến Thành, Phường 3, TP. Đà Lạt', 'Bến xe trung tâm TP. Đà Lạt', 'HoatDong'),
(3, 'Bến xe Vũng Tàu', '192 Nam Kỳ Khởi Nghĩa, Phường Thắng Tam, TP. Vũng Tàu', 'Bến xe khách TP. Vũng Tàu', 'HoatDong'),
(4, 'Bến xe Trung tâm Cần Thơ', 'Quốc lộ 1A, Hưng Thạnh, Cái Răng, Cần Thơ', 'Bến xe lớn Tây Nam Bộ', 'HoatDong'),
(5, 'Bến xe Nước Ngầm', 'Km8 Đường Giải Phóng, Hoàng Liệt, Hoàng Mai, Hà Nội', 'Bến xe cửa ngõ phía Nam Hà Nội', 'HoatDong'),
(6, 'Bến xe Niệm Nghĩa', '275 Trần Nguyên Hãn, Lê Chân, Hải Phòng', 'Bến xe trung tâm Hải Phòng', 'HoatDong');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `don_dat_ve`
--

CREATE TABLE `don_dat_ve` (
  `MaDon` int(11) NOT NULL,
  `MaDonHienThi` varchar(30) NOT NULL,
  `MaTaiKhoan` int(11) NOT NULL,
  `MaChuyen` int(11) NOT NULL,
  `TenKhachHang` varchar(100) NOT NULL,
  `SoDienThoaiKhach` varchar(15) NOT NULL,
  `EmailKhach` varchar(150) DEFAULT NULL,
  `NgayDat` datetime NOT NULL DEFAULT current_timestamp(),
  `SoLuongGhe` int(11) NOT NULL DEFAULT 1,
  `TongTien` decimal(15,2) NOT NULL,
  `PhuongThucThanhToan` enum('ViNoiBo','TienMat','ChuyenKhoan') NOT NULL DEFAULT 'ViNoiBo',
  `TrangThaiThanhToan` enum('ChuaThanhToan','DaThanhToan','ThatBai') NOT NULL DEFAULT 'ChuaThanhToan',
  `TrangThaiDon` enum('ChoXacNhan','ThanhCong','DaHuy') NOT NULL DEFAULT 'ChoXacNhan',
  `LoaiDat` enum('Online','Quay') NOT NULL DEFAULT 'Online',
  `MaNhanVienXacNhan` int(11) DEFAULT NULL,
  `ThoiGianXacNhan` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `don_dat_ve`
--

INSERT INTO `don_dat_ve` (`MaDon`, `MaDonHienThi`, `MaTaiKhoan`, `MaChuyen`, `TenKhachHang`, `SoDienThoaiKhach`, `EmailKhach`, `NgayDat`, `SoLuongGhe`, `TongTien`, `PhuongThucThanhToan`, `TrangThaiThanhToan`, `TrangThaiDon`, `LoaiDat`, `MaNhanVienXacNhan`, `ThoiGianXacNhan`) VALUES
(1, 'DON-20261022-0001', 3, 1, 'Nguyễn Văn An', '0901000001', 'an.nguyen@gmail.com', '2026-10-22 19:03:39', 2, 700000.00, 'ViNoiBo', 'DaThanhToan', 'ThanhCong', 'Online', NULL, NULL),
(2, 'DON-20261022-5275D0', 3, 1, 'Nguyễn Văn An', '0901000001', 'an.nguyen@gmail.com', '2026-10-22 19:13:41', 2, 700000.00, 'ViNoiBo', 'DaThanhToan', 'ThanhCong', 'Online', NULL, NULL),
(3, 'DON-20261022-C5DF8E', 3, 1, 'Nguyễn Văn An', '0901000001', 'an.nguyen@gmail.com', '2026-10-22 19:14:04', 1, 350000.00, 'ViNoiBo', 'DaThanhToan', 'DaHuy', 'Online', NULL, NULL),
(4, 'DON-20261022-737011', 3, 1, 'Nguyễn Văn An', '0901000001', 'an.nguyen@gmail.com', '2026-10-22 19:14:31', 1, 350000.00, 'ViNoiBo', 'DaThanhToan', 'DaHuy', 'Online', NULL, NULL),
(5, 'DON-20261022-ECD56C', 3, 1, 'Nguyễn Văn An', '0901000001', 'an.nguyen@gmail.com', '2026-10-22 19:15:10', 1, 350000.00, 'ViNoiBo', 'DaThanhToan', 'DaHuy', 'Online', NULL, NULL),
(6, 'DON-20261022-B1995F', 3, 1, 'Nguyễn Văn An', '0901000001', 'an.nguyen@gmail.com', '2026-10-22 19:15:55', 1, 350000.00, 'ViNoiBo', 'DaThanhToan', 'DaHuy', 'Online', NULL, NULL),
(7, 'QUAY-20261022-B415D7', 5, 1, 'Khách Vãng Lai', '0988776655', NULL, '2026-10-22 19:15:55', 1, 350000.00, 'ChuyenKhoan', 'DaThanhToan', 'ThanhCong', 'Quay', 2, '2026-10-22 19:15:55'),
(8, 'DON-20261022-BCCF6F', 3, 1, 'Nguyễn Văn An', '0901000001', 'an.nguyen@gmail.com', '2026-10-22 19:31:39', 1, 350000.00, 'ViNoiBo', 'DaThanhToan', 'ThanhCong', 'Online', NULL, NULL),
(9, 'QUAY-20261022-123D2F', 5, 3, 'Nguyễn Văn Khách', '0988776655', NULL, '2026-10-22 19:32:49', 1, 180000.00, 'TienMat', 'DaThanhToan', 'ThanhCong', 'Quay', 2, '2026-10-22 14:32:49'),
(10, 'DON-20261022-009C72', 4, 3, 'Trần Thị Bình', '0901000002', 'binh.tran@gmail.com', '2026-10-22 19:36:48', 1, 180000.00, 'ViNoiBo', 'DaThanhToan', 'ThanhCong', 'Online', NULL, NULL),
(11, 'DON-20261022-4AAAA4', 4, 1, 'Trần Thị Bình', '0901000002', 'binh.tran@gmail.com', '2026-10-22 19:37:40', 1, 350000.00, 'ViNoiBo', 'DaThanhToan', 'DaHuy', 'Online', NULL, NULL),
(12, 'DON-20261023-A6A4BE', 3, 1, 'Nguyễn Văn An', '0901000001', 'an.nguyen@gmail.com', '2026-10-23 12:08:42', 1, 350000.00, 'ViNoiBo', 'DaThanhToan', 'ThanhCong', 'Online', NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ghe`
--

CREATE TABLE `ghe` (
  `MaGhe` int(11) NOT NULL,
  `MaXe` int(11) NOT NULL,
  `SoGhe` varchar(10) NOT NULL,
  `Tang` tinyint(1) NOT NULL DEFAULT 1,
  `TrangThai` enum('HoatDong','Hong') NOT NULL DEFAULT 'HoatDong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `ghe`
--

INSERT INTO `ghe` (`MaGhe`, `MaXe`, `SoGhe`, `Tang`, `TrangThai`) VALUES
(1, 1, 'A01', 1, 'HoatDong'),
(2, 1, 'A02', 1, 'HoatDong'),
(3, 1, 'A03', 1, 'HoatDong'),
(4, 1, 'A04', 1, 'HoatDong'),
(5, 1, 'A05', 1, 'HoatDong'),
(6, 1, 'A06', 1, 'HoatDong'),
(7, 1, 'A07', 1, 'HoatDong'),
(8, 1, 'A08', 1, 'HoatDong'),
(9, 1, 'A09', 1, 'HoatDong'),
(10, 1, 'A10', 1, 'HoatDong'),
(11, 1, 'A11', 1, 'HoatDong'),
(12, 1, 'A12', 1, 'HoatDong'),
(13, 1, 'B01', 2, 'HoatDong'),
(14, 1, 'B02', 2, 'HoatDong'),
(15, 1, 'B03', 2, 'HoatDong'),
(16, 1, 'B04', 2, 'HoatDong'),
(17, 1, 'B05', 2, 'HoatDong'),
(18, 1, 'B06', 2, 'HoatDong'),
(19, 1, 'B07', 2, 'HoatDong'),
(20, 1, 'B08', 2, 'HoatDong'),
(21, 1, 'B09', 2, 'HoatDong'),
(22, 1, 'B10', 2, 'HoatDong'),
(23, 1, 'B11', 2, 'HoatDong'),
(24, 1, 'B12', 2, 'HoatDong'),
(25, 3, 'G01', 1, 'HoatDong'),
(26, 3, 'G02', 1, 'HoatDong'),
(27, 3, 'G03', 1, 'HoatDong'),
(28, 3, 'G04', 1, 'HoatDong'),
(29, 3, 'G05', 1, 'HoatDong'),
(30, 3, 'G06', 1, 'HoatDong'),
(31, 3, 'G07', 1, 'HoatDong'),
(32, 3, 'G08', 1, 'HoatDong'),
(33, 3, 'G09', 1, 'HoatDong'),
(34, 3, 'G10', 1, 'HoatDong'),
(35, 3, 'G11', 1, 'HoatDong'),
(36, 3, 'G12', 1, 'HoatDong'),
(37, 3, 'G13', 1, 'HoatDong'),
(38, 3, 'G14', 1, 'HoatDong'),
(39, 3, 'G15', 1, 'HoatDong'),
(40, 3, 'G16', 1, 'HoatDong'),
(41, 4, 'A01', 1, 'HoatDong'),
(42, 4, 'A02', 1, 'HoatDong'),
(43, 4, 'A03', 1, 'HoatDong'),
(44, 4, 'A04', 1, 'HoatDong'),
(45, 4, 'A05', 1, 'HoatDong'),
(46, 4, 'A06', 1, 'HoatDong'),
(47, 4, 'A07', 1, 'HoatDong'),
(48, 4, 'A08', 1, 'HoatDong'),
(49, 4, 'A09', 1, 'HoatDong'),
(50, 4, 'A10', 1, 'HoatDong'),
(51, 4, 'A11', 1, 'HoatDong'),
(52, 4, 'A12', 1, 'HoatDong'),
(53, 4, 'B01', 2, 'HoatDong'),
(54, 4, 'B02', 2, 'HoatDong'),
(55, 4, 'B03', 2, 'HoatDong'),
(56, 4, 'B04', 2, 'HoatDong'),
(57, 4, 'B05', 2, 'HoatDong'),
(58, 4, 'B06', 2, 'HoatDong'),
(59, 4, 'B07', 2, 'HoatDong'),
(60, 4, 'B08', 2, 'HoatDong'),
(61, 4, 'B09', 2, 'HoatDong'),
(62, 4, 'B10', 2, 'HoatDong'),
(63, 4, 'B11', 2, 'HoatDong'),
(64, 4, 'B12', 2, 'HoatDong'),
(65, 2, 'A01', 1, 'HoatDong'),
(66, 2, 'A02', 1, 'HoatDong'),
(67, 2, 'A03', 1, 'HoatDong'),
(68, 2, 'A04', 1, 'HoatDong'),
(69, 2, 'A05', 1, 'HoatDong'),
(70, 2, 'A06', 1, 'HoatDong'),
(71, 2, 'A07', 1, 'HoatDong'),
(72, 2, 'A08', 1, 'HoatDong'),
(73, 2, 'A09', 1, 'HoatDong'),
(74, 2, 'A10', 1, 'HoatDong'),
(75, 2, 'A11', 1, 'HoatDong'),
(76, 2, 'A12', 1, 'HoatDong'),
(77, 2, 'B01', 2, 'HoatDong'),
(78, 2, 'B02', 2, 'HoatDong'),
(79, 2, 'B03', 2, 'HoatDong'),
(80, 2, 'B04', 2, 'HoatDong'),
(81, 2, 'B05', 2, 'HoatDong'),
(82, 2, 'B06', 2, 'HoatDong'),
(83, 2, 'B07', 2, 'HoatDong'),
(84, 2, 'B08', 2, 'HoatDong'),
(85, 2, 'B09', 2, 'HoatDong'),
(86, 2, 'B10', 2, 'HoatDong'),
(87, 2, 'B11', 2, 'HoatDong'),
(88, 2, 'B12', 2, 'HoatDong');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `giao_dich_ngan_hang`
--

CREATE TABLE `giao_dich_ngan_hang` (
  `MaGiaoDichNH` int(11) NOT NULL,
  `MaThamChieuNganHang` varchar(100) NOT NULL,
  `NoiDungChuyenKhoan` varchar(255) NOT NULL,
  `SoTien` decimal(15,2) NOT NULL,
  `ThoiGianGiaoDich` datetime NOT NULL DEFAULT current_timestamp(),
  `MaTaiKhoanDuKien` int(11) DEFAULT NULL,
  `TrangThaiXuLy` enum('ChoXuLy','ThanhCong','ThatBai','SaiCuPhap') NOT NULL DEFAULT 'ChoXuLy',
  `ThoiGianXuLy` datetime DEFAULT NULL,
  `GhiChu` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `giao_dich_ngan_hang`
--

INSERT INTO `giao_dich_ngan_hang` (`MaGiaoDichNH`, `MaThamChieuNganHang`, `NoiDungChuyenKhoan`, `SoTien`, `ThoiGianGiaoDich`, `MaTaiKhoanDuKien`, `TrangThaiXuLy`, `ThoiGianXuLy`, `GhiChu`) VALUES
(1, 'VMB579712', 'NAPVI 3', 500000.00, '2026-10-22 19:13:41', 3, 'ThanhCong', '2026-10-22 19:13:41', 'Đã cộng tiền vào ví nội bộ thành công'),
(2, 'MB808151', 'NAPVI 1', 500000.00, '2026-10-22 19:33:57', 1, 'ThanhCong', '2026-10-22 19:33:57', 'Đã cộng tiền vào ví nội bộ thành công'),
(3, 'MB992035', 'NAPVI 3', 500000.00, '2026-10-22 19:34:07', 3, 'ThanhCong', '2026-10-22 19:34:07', 'Đã cộng tiền vào ví nội bộ thành công'),
(4, 'MB352723', 'NAPVI 4', 500000.00, '2026-10-22 19:37:34', 4, 'ThanhCong', '2026-10-22 19:37:34', 'Đã cộng tiền vào ví nội bộ thành công');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `giao_dich_vi`
--

CREATE TABLE `giao_dich_vi` (
  `MaGiaoDich` int(11) NOT NULL,
  `MaVi` int(11) NOT NULL,
  `LoaiGiaoDich` enum('NapTien','ThanhToanVe','HoanTien') NOT NULL,
  `SoTien` decimal(15,2) NOT NULL,
  `SoDuTruoc` decimal(15,2) NOT NULL,
  `SoDuSau` decimal(15,2) NOT NULL,
  `MaDon` int(11) DEFAULT NULL,
  `ThoiGian` datetime NOT NULL DEFAULT current_timestamp(),
  `GhiChu` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `giao_dich_vi`
--

INSERT INTO `giao_dich_vi` (`MaGiaoDich`, `MaVi`, `LoaiGiaoDich`, `SoTien`, `SoDuTruoc`, `SoDuSau`, `MaDon`, `ThoiGian`, `GhiChu`) VALUES
(1, 3, 'ThanhToanVe', 700000.00, 2200000.00, 1500000.00, 1, '2026-10-22 19:03:39', 'Thanh toán đơn đặt vé DON-20261022-0001 (2 ghế)'),
(2, 3, 'ThanhToanVe', 700000.00, 1500000.00, 800000.00, 2, '2026-10-22 19:13:41', 'Thanh toán vé VE-20261022-52822B (2 ghế: A03, A04) cho chuyến TP.HCM - Đà Lạt'),
(3, 3, 'NapTien', 500000.00, 800000.00, 1300000.00, NULL, '2026-10-22 19:13:41', 'Nạp tiền tự động qua ngân hàng. Mã GD: VMB579712 (Nội dung: NAPVI 3)'),
(4, 3, 'ThanhToanVe', 350000.00, 1300000.00, 950000.00, 3, '2026-10-22 19:14:04', 'Thanh toán vé VE-20261022-C5E14F (1 ghế: A05) cho chuyến TP.HCM - Đà Lạt'),
(5, 3, 'HoanTien', 175000.00, 950000.00, 1125000.00, 3, '2026-10-22 19:14:04', 'Hoàn 50% tiền vé VE-20261022-C5E14F do hủy vé trước khi in (Giá trị đơn: 350.000đ)'),
(6, 3, 'ThanhToanVe', 350000.00, 1125000.00, 775000.00, 4, '2026-10-22 19:14:31', 'Thanh toán vé VE-20261022-737310 (1 ghế: A05) cho chuyến TP.HCM - Đà Lạt'),
(7, 3, 'HoanTien', 175000.00, 775000.00, 950000.00, 4, '2026-10-22 19:14:31', 'Hoàn 50% tiền vé VE-20261022-737310 do hủy vé trước khi in (Giá trị đơn: 350.000đ)'),
(8, 3, 'ThanhToanVe', 350000.00, 950000.00, 600000.00, 5, '2026-10-22 19:15:10', 'Thanh toán vé VE-20261022-ECD781 (1 ghế: A05) cho chuyến TP.HCM - Đà Lạt'),
(9, 3, 'HoanTien', 175000.00, 600000.00, 775000.00, 5, '2026-10-22 19:15:10', 'Hoàn 50% tiền vé VE-20261022-ECD781 do hủy vé trước khi in (Giá trị đơn: 350.000đ)'),
(10, 3, 'ThanhToanVe', 350000.00, 775000.00, 425000.00, 6, '2026-10-22 19:15:55', 'Thanh toán vé VE-20261022-B19D26 (1 ghế: A05) cho chuyến TP.HCM - Đà Lạt'),
(11, 3, 'HoanTien', 175000.00, 425000.00, 600000.00, 6, '2026-10-22 19:15:55', 'Hoàn 50% tiền vé VE-20261022-B19D26 do hủy vé trước khi in (Giá trị đơn: 350.000đ)'),
(12, 3, 'ThanhToanVe', 350000.00, 600000.00, 250000.00, 8, '2026-10-22 19:31:39', 'Thanh toán vé VE-20261022-BCD7DD (1 ghế: A05) cho chuyến TP.HCM - Đà Lạt'),
(13, 1, 'NapTien', 500000.00, 0.00, 500000.00, NULL, '2026-10-22 19:33:57', 'Nạp tiền tự động qua ngân hàng. Mã GD: MB808151 (Nội dung: NAPVI 1)'),
(14, 3, 'NapTien', 500000.00, 250000.00, 750000.00, NULL, '2026-10-22 19:34:07', 'Nạp tiền tự động qua ngân hàng. Mã GD: MB992035 (Nội dung: NAPVI 3)'),
(15, 4, 'ThanhToanVe', 180000.00, 300000.00, 120000.00, 10, '2026-10-22 19:36:48', 'Thanh toán vé VE-20261022-009FA2 (1 ghế: G11) cho chuyến TP.HCM - Vũng Tàu'),
(16, 4, 'NapTien', 500000.00, 120000.00, 620000.00, NULL, '2026-10-22 19:37:34', 'Nạp tiền tự động qua ngân hàng. Mã GD: MB352723 (Nội dung: NAPVI 4)'),
(17, 4, 'ThanhToanVe', 350000.00, 620000.00, 270000.00, 11, '2026-10-22 19:37:40', 'Thanh toán vé VE-20261022-4AADE7 (1 ghế: A08) cho chuyến TP.HCM - Đà Lạt'),
(18, 4, 'HoanTien', 175000.00, 270000.00, 445000.00, 11, '2026-10-22 19:37:50', 'Hoàn 50% tiền vé VE-20261022-4AADE7 do hủy vé trước khi in (Giá trị đơn: 350.000đ)'),
(19, 3, 'NapTien', 250000.00, 750000.00, 1000000.00, NULL, '2026-10-22 19:49:54', 'Admin Quản Trị Viên Hệ Thống duyệt nạp tiền VietQR (NAP-20261022-272086)'),
(20, 4, 'NapTien', 10000.00, 445000.00, 455000.00, NULL, '2026-10-22 19:57:46', 'Admin Quản Trị Viên Hệ Thống duyệt nạp tiền VietQR (NAP-20261022-F580B5)'),
(21, 4, 'NapTien', 10000.00, 455000.00, 465000.00, NULL, '2026-10-22 19:58:11', 'Admin Quản Trị Viên Hệ Thống duyệt nạp tiền VietQR (NAP-20261022-BD7B97)'),
(22, 4, 'NapTien', 200000.00, 465000.00, 665000.00, NULL, '2026-10-22 20:18:18', 'Admin Quản Trị Viên Hệ Thống duyệt nạp tiền VietQR (NAP-20261022-E7AFA1)'),
(23, 4, 'NapTien', 500000.00, 665000.00, 1165000.00, NULL, '2026-10-23 11:58:05', 'Admin Quản Trị Viên Hệ Thống duyệt nạp tiền VietQR (NAP-20261023-032BA5)'),
(24, 3, 'ThanhToanVe', 350000.00, 1000000.00, 650000.00, 12, '2026-10-23 12:08:42', 'Thanh toán vé VE-20261023-A6B6AD (1 ghế: A07) cho chuyến TP.HCM - Đà Lạt');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `lich_su_in_ve`
--

CREATE TABLE `lich_su_in_ve` (
  `MaLichSuIn` int(11) NOT NULL,
  `MaVe` int(11) NOT NULL,
  `MaTaiKhoanThaoTac` int(11) NOT NULL,
  `ThoiGianIn` datetime NOT NULL DEFAULT current_timestamp(),
  `SoLanIn` int(11) NOT NULL DEFAULT 1,
  `GhiChu` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `lich_su_in_ve`
--

INSERT INTO `lich_su_in_ve` (`MaLichSuIn`, `MaVe`, `MaTaiKhoanThaoTac`, `ThoiGianIn`, `SoLanIn`, `GhiChu`) VALUES
(1, 2, 3, '2026-10-22 19:13:41', 1, 'Khách hàng in vé trực tuyến'),
(2, 7, 2, '2026-10-22 19:15:55', 1, 'Nhân viên in vé tại quầy cho khách'),
(3, 9, 2, '2026-10-22 19:32:59', 1, 'Nhân viên in vé tại quầy cho khách'),
(4, 10, 4, '2026-10-22 19:37:23', 1, 'Khách hàng in vé trực tuyến');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `taikhoan`
--

CREATE TABLE `taikhoan` (
  `MaTaiKhoan` int(11) NOT NULL,
  `TenDangNhap` varchar(50) NOT NULL,
  `MatKhau` varchar(255) NOT NULL,
  `HoTen` varchar(100) NOT NULL,
  `SoDienThoai` varchar(15) DEFAULT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `VaiTro` enum('KhachHang','NhanVien','Admin','Guest') NOT NULL DEFAULT 'KhachHang',
  `TrangThai` enum('HoatDong','BiKhoa') NOT NULL DEFAULT 'HoatDong',
  `NgayTao` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `taikhoan`
--

INSERT INTO `taikhoan` (`MaTaiKhoan`, `TenDangNhap`, `MatKhau`, `HoTen`, `SoDienThoai`, `Email`, `VaiTro`, `TrangThai`, `NgayTao`) VALUES
(1, 'admin01', '$2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi', 'Quản Trị Viên Hệ Thống', '0909000001', 'admin@vexekhach.vn', 'Admin', 'HoatDong', '2026-10-22 19:03:39'),
(2, 'nhanvien01', '$2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi', 'Nguyễn Thị Thu Ngân', '0909000002', 'nhanvien01@vexekhach.vn', 'NhanVien', 'HoatDong', '2026-10-22 19:03:39'),
(3, 'khachhang01', '$2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi', 'Nguyễn Mạnh Cường', '0988776655', 'khach01_vip@gmail.com', 'KhachHang', 'HoatDong', '2026-10-22 19:03:39'),
(4, 'khachhang02', '$2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi', 'Trần Thị Bình', '0901000002', 'binh.tran@gmail.com', 'KhachHang', 'HoatDong', '2026-10-22 19:03:39'),
(5, 'guest', '$2y$10$4tzU.PuHc0oonCvlKNbnAugINdD72hs.1u0ICZJIE69IoK1B1Mcqi', 'Khách Vãng Lai', '0999999999', 'guest@vexekhach.vn', 'Guest', 'HoatDong', '2026-10-22 19:03:39'),
(6, 'staff_test_8325', '$2y$10$52JHWe9w1A.B3kcYuyyU0.qNqYh6iTGeHixnq1UXpW0gu35hHOfUe', 'Nhân Viên', '0911008325', 'staff8325@vexenhanh.vn', 'NhanVien', 'BiKhoa', '2026-10-22 20:15:27');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tuyen_xe`
--

CREATE TABLE `tuyen_xe` (
  `MaTuyenXe` int(11) NOT NULL,
  `TenTuyen` varchar(150) NOT NULL,
  `MaDiemDi` int(11) NOT NULL,
  `MaDiemDen` int(11) NOT NULL,
  `KhoangCachKm` decimal(8,2) DEFAULT NULL,
  `ThoiGianDuKienPhut` int(11) DEFAULT NULL,
  `TrangThai` enum('HoatDong','NgungHoatDong') NOT NULL DEFAULT 'HoatDong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `tuyen_xe`
--

INSERT INTO `tuyen_xe` (`MaTuyenXe`, `TenTuyen`, `MaDiemDi`, `MaDiemDen`, `KhoangCachKm`, `ThoiGianDuKienPhut`, `TrangThai`) VALUES
(1, 'TP.HCM - Đà Lạt', 1, 2, 305.00, 390, 'HoatDong'),
(2, 'TP.HCM - Vũng Tàu', 1, 3, 105.00, 150, 'HoatDong'),
(3, 'TP.HCM - Cần Thơ', 1, 4, 169.00, 210, 'HoatDong'),
(4, 'Hà Nội - Hải Phòng', 5, 6, 120.00, 120, 'HoatDong'),
(5, 'Đà Lạt - TP.HCM', 2, 1, 305.00, 390, 'HoatDong');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ve`
--

CREATE TABLE `ve` (
  `MaVe` int(11) NOT NULL,
  `MaDon` int(11) NOT NULL,
  `MaVeHienThi` varchar(30) NOT NULL,
  `TrangThaiVe` enum('ChuaIn','DaIn','DaHuy') NOT NULL DEFAULT 'ChuaIn',
  `ThoiGianInDauTien` datetime DEFAULT NULL,
  `ThoiGianHuy` datetime DEFAULT NULL,
  `SoTienHoan` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `ve`
--

INSERT INTO `ve` (`MaVe`, `MaDon`, `MaVeHienThi`, `TrangThaiVe`, `ThoiGianInDauTien`, `ThoiGianHuy`, `SoTienHoan`) VALUES
(1, 1, 'VE-20261022-8888', 'ChuaIn', NULL, NULL, 0.00),
(2, 2, 'VE-20261022-52822B', 'DaIn', '2026-10-22 19:13:41', NULL, 0.00),
(3, 3, 'VE-20261022-C5E14F', 'DaHuy', NULL, '2026-10-22 19:14:04', 175000.00),
(4, 4, 'VE-20261022-737310', 'DaHuy', NULL, '2026-10-22 19:14:31', 175000.00),
(5, 5, 'VE-20261022-ECD781', 'DaHuy', NULL, '2026-10-22 19:15:10', 175000.00),
(6, 6, 'VE-20261022-B19D26', 'DaHuy', NULL, '2026-10-22 19:15:55', 175000.00),
(7, 7, 'VE-20261022-B41965', 'DaIn', '2026-10-22 19:15:55', NULL, 0.00),
(8, 8, 'VE-20261022-BCD7DD', 'ChuaIn', NULL, NULL, 0.00),
(9, 9, 'VE-20261022-1249A0', 'DaIn', '2026-10-22 19:32:59', NULL, 0.00),
(10, 10, 'VE-20261022-009FA2', 'DaIn', '2026-10-22 19:37:23', NULL, 0.00),
(11, 11, 'VE-20261022-4AADE7', 'DaHuy', NULL, '2026-10-22 19:37:50', 175000.00),
(12, 12, 'VE-20261023-A6B6AD', 'ChuaIn', NULL, NULL, 0.00);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vi_noi_bo`
--

CREATE TABLE `vi_noi_bo` (
  `MaVi` int(11) NOT NULL,
  `MaTaiKhoan` int(11) NOT NULL,
  `SoDu` decimal(15,2) NOT NULL DEFAULT 0.00,
  `NgayCapNhat` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Đang đổ dữ liệu cho bảng `vi_noi_bo`
--

INSERT INTO `vi_noi_bo` (`MaVi`, `MaTaiKhoan`, `SoDu`, `NgayCapNhat`) VALUES
(1, 1, 500000.00, '2026-10-22 19:33:57'),
(2, 2, 0.00, '2026-10-22 19:03:39'),
(3, 3, 650000.00, '2026-10-23 12:08:42'),
(4, 4, 1165000.00, '2026-10-23 11:58:05'),
(5, 5, 0.00, '2026-10-22 19:03:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `xe`
--

CREATE TABLE `xe` (
  `MaXe` int(11) NOT NULL,
  `BienSo` varchar(20) NOT NULL,
  `TenXe` varchar(100) NOT NULL,
  `LoaiXe` varchar(50) NOT NULL DEFAULT 'GiuongNam',
  `SoLuongGhe` int(11) NOT NULL,
  `TrangThai` enum('HoatDong','BaoTri','NgungHoatDong') NOT NULL DEFAULT 'HoatDong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `xe`
--

INSERT INTO `xe` (`MaXe`, `BienSo`, `TenXe`, `LoaiXe`, `SoLuongGhe`, `TrangThai`) VALUES
(1, '51B-123.45', 'Limousine Cung Điện 24 Phòng', 'Limousine', 24, 'HoatDong'),
(2, '51B-678.90', 'Xe Giường Nằm VIP 24 Chỗ', 'GiuongNam', 24, 'HoatDong'),
(3, '49B-555.88', 'Limousine 16 Ghế Cao Cấp', 'GheNgoi', 16, 'HoatDong'),
(4, '51B-8325', 'Thaco VIP Luxury Express Pro', 'Limousine', 24, 'HoatDong');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `yeu_cau_nap_tien`
--

CREATE TABLE `yeu_cau_nap_tien` (
  `MaYeuCau` int(11) NOT NULL,
  `MaYeuCauHienThi` varchar(30) NOT NULL,
  `MaTaiKhoan` int(11) NOT NULL,
  `SoTien` decimal(15,2) NOT NULL,
  `NoiDungChuyenKhoan` varchar(255) NOT NULL,
  `NganHang` varchar(50) NOT NULL DEFAULT 'Vietcombank',
  `SoTaiKhoanNhan` varchar(50) NOT NULL DEFAULT '1041002875',
  `TenTaiKhoanNhan` varchar(100) NOT NULL DEFAULT 'NGUYEN MANH CUONG',
  `TrangThai` enum('ChoDuyet','DaDuyet','TuChoi') NOT NULL DEFAULT 'ChoDuyet',
  `NgayTao` datetime NOT NULL DEFAULT current_timestamp(),
  `MaAdminDuyet` int(11) DEFAULT NULL,
  `NgayDuyet` datetime DEFAULT NULL,
  `GhiChu` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `yeu_cau_nap_tien`
--

INSERT INTO `yeu_cau_nap_tien` (`MaYeuCau`, `MaYeuCauHienThi`, `MaTaiKhoan`, `SoTien`, `NoiDungChuyenKhoan`, `NganHang`, `SoTaiKhoanNhan`, `TenTaiKhoanNhan`, `TrangThai`, `NgayTao`, `MaAdminDuyet`, `NgayDuyet`, `GhiChu`) VALUES
(1, 'NAP-20261022-272086', 3, 250000.00, 'NAPVI 3 NAP-20261022-272086', 'Vietcombank', '1041002875', 'NGUYEN MANH CUONG', 'DaDuyet', '2026-10-22 19:49:54', 1, '2026-10-22 19:49:54', NULL),
(2, 'NAP-20261022-DBB6BB', 4, 200000.00, 'NAPVI 4 NAP-20261022-DBB6BB', 'Vietcombank', '1041002875', 'NGUYEN MANH CUONG', 'TuChoi', '2026-10-22 19:56:29', 1, '2026-10-22 19:57:19', 'Chưa nhận được tiền chuyển khoản hoặc sai cú pháp'),
(3, 'NAP-20261022-F580B5', 4, 10000.00, 'NAPVI 4 NAP-20261022-F580B5', 'Vietcombank', '1041002875', 'NGUYEN MANH CUONG', 'DaDuyet', '2026-10-22 19:56:47', 1, '2026-10-22 19:57:46', NULL),
(4, 'NAP-20261022-BD7B97', 4, 10000.00, 'NAPVI 4 NAP-20261022-BD7B97', 'Vietcombank', '1041002875', 'NGUYEN MANH CUONG', 'DaDuyet', '2026-10-22 19:58:03', 1, '2026-10-22 19:58:11', NULL),
(5, 'NAP-20261022-E7AFA1', 4, 200000.00, 'NAPVI 4 NAP-20261022-E7AFA1', 'Vietcombank', '1041002875', 'NGUYEN MANH CUONG', 'DaDuyet', '2026-10-22 20:18:06', 1, '2026-10-22 20:18:18', NULL),
(6, 'NAP-20261023-032BA5', 4, 500000.00, 'NAPVI 4 NAP-20261023-032BA5', 'Vietcombank', '1041002875', 'NGUYEN MANH CUONG', 'DaDuyet', '2026-10-23 11:57:36', 1, '2026-10-23 11:58:05', NULL);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `chi_tiet_dat_ve`
--
ALTER TABLE `chi_tiet_dat_ve`
  ADD PRIMARY KEY (`MaChiTiet`),
  ADD UNIQUE KEY `UQ_Chuyen_GheDangGiu` (`MaChuyen`,`GheDangGiu`),
  ADD KEY `IDX_ChiTiet_Don` (`MaDon`),
  ADD KEY `IDX_ChiTiet_Ghe` (`MaGhe`);

--
-- Chỉ mục cho bảng `chuyen_xe`
--
ALTER TABLE `chuyen_xe`
  ADD PRIMARY KEY (`MaChuyen`),
  ADD KEY `IDX_Chuyen_Tuyen` (`MaTuyenXe`),
  ADD KEY `IDX_Chuyen_Xe` (`MaXe`),
  ADD KEY `IDX_Chuyen_ThoiGianDi` (`ThoiGianDi`);

--
-- Chỉ mục cho bảng `dia_diem`
--
ALTER TABLE `dia_diem`
  ADD PRIMARY KEY (`MaDiaDiem`);

--
-- Chỉ mục cho bảng `don_dat_ve`
--
ALTER TABLE `don_dat_ve`
  ADD PRIMARY KEY (`MaDon`),
  ADD UNIQUE KEY `MaDonHienThi` (`MaDonHienThi`),
  ADD KEY `IDX_Don_TaiKhoan` (`MaTaiKhoan`),
  ADD KEY `IDX_Don_Chuyen` (`MaChuyen`),
  ADD KEY `IDX_Don_TrangThai` (`TrangThaiDon`),
  ADD KEY `FK_DonDatVe_NhanVien` (`MaNhanVienXacNhan`);

--
-- Chỉ mục cho bảng `ghe`
--
ALTER TABLE `ghe`
  ADD PRIMARY KEY (`MaGhe`),
  ADD UNIQUE KEY `UQ_Ghe_Xe_SoGhe` (`MaXe`,`SoGhe`);

--
-- Chỉ mục cho bảng `giao_dich_ngan_hang`
--
ALTER TABLE `giao_dich_ngan_hang`
  ADD PRIMARY KEY (`MaGiaoDichNH`),
  ADD UNIQUE KEY `MaThamChieuNganHang` (`MaThamChieuNganHang`),
  ADD KEY `IDX_GDNH_TrangThai` (`TrangThaiXuLy`),
  ADD KEY `FK_GDNH_TaiKhoan` (`MaTaiKhoanDuKien`);

--
-- Chỉ mục cho bảng `giao_dich_vi`
--
ALTER TABLE `giao_dich_vi`
  ADD PRIMARY KEY (`MaGiaoDich`),
  ADD KEY `IDX_GDV_Vi` (`MaVi`),
  ADD KEY `IDX_GDV_MaDon` (`MaDon`);

--
-- Chỉ mục cho bảng `lich_su_in_ve`
--
ALTER TABLE `lich_su_in_ve`
  ADD PRIMARY KEY (`MaLichSuIn`),
  ADD KEY `IDX_LichSuIn_Ve` (`MaVe`),
  ADD KEY `FK_LichSuIn_TaiKhoan` (`MaTaiKhoanThaoTac`);

--
-- Chỉ mục cho bảng `taikhoan`
--
ALTER TABLE `taikhoan`
  ADD PRIMARY KEY (`MaTaiKhoan`),
  ADD UNIQUE KEY `TenDangNhap` (`TenDangNhap`),
  ADD KEY `IDX_TaiKhoan_VaiTro` (`VaiTro`),
  ADD KEY `IDX_TaiKhoan_SDT` (`SoDienThoai`);

--
-- Chỉ mục cho bảng `tuyen_xe`
--
ALTER TABLE `tuyen_xe`
  ADD PRIMARY KEY (`MaTuyenXe`),
  ADD KEY `IDX_Tuyen_DiemDi` (`MaDiemDi`),
  ADD KEY `IDX_Tuyen_DiemDen` (`MaDiemDen`);

--
-- Chỉ mục cho bảng `ve`
--
ALTER TABLE `ve`
  ADD PRIMARY KEY (`MaVe`),
  ADD UNIQUE KEY `MaDon` (`MaDon`),
  ADD UNIQUE KEY `MaVeHienThi` (`MaVeHienThi`),
  ADD KEY `IDX_Ve_TrangThai` (`TrangThaiVe`);

--
-- Chỉ mục cho bảng `vi_noi_bo`
--
ALTER TABLE `vi_noi_bo`
  ADD PRIMARY KEY (`MaVi`),
  ADD UNIQUE KEY `MaTaiKhoan` (`MaTaiKhoan`);

--
-- Chỉ mục cho bảng `xe`
--
ALTER TABLE `xe`
  ADD PRIMARY KEY (`MaXe`),
  ADD UNIQUE KEY `BienSo` (`BienSo`);

--
-- Chỉ mục cho bảng `yeu_cau_nap_tien`
--
ALTER TABLE `yeu_cau_nap_tien`
  ADD PRIMARY KEY (`MaYeuCau`),
  ADD UNIQUE KEY `MaYeuCauHienThi` (`MaYeuCauHienThi`),
  ADD KEY `IDX_YCNT_TaiKhoan` (`MaTaiKhoan`),
  ADD KEY `IDX_YCNT_TrangThai` (`TrangThai`),
  ADD KEY `FK_YCNT_Admin` (`MaAdminDuyet`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `chi_tiet_dat_ve`
--
ALTER TABLE `chi_tiet_dat_ve`
  MODIFY `MaChiTiet` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT cho bảng `chuyen_xe`
--
ALTER TABLE `chuyen_xe`
  MODIFY `MaChuyen` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `dia_diem`
--
ALTER TABLE `dia_diem`
  MODIFY `MaDiaDiem` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `don_dat_ve`
--
ALTER TABLE `don_dat_ve`
  MODIFY `MaDon` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `ghe`
--
ALTER TABLE `ghe`
  MODIFY `MaGhe` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT cho bảng `giao_dich_ngan_hang`
--
ALTER TABLE `giao_dich_ngan_hang`
  MODIFY `MaGiaoDichNH` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `giao_dich_vi`
--
ALTER TABLE `giao_dich_vi`
  MODIFY `MaGiaoDich` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT cho bảng `lich_su_in_ve`
--
ALTER TABLE `lich_su_in_ve`
  MODIFY `MaLichSuIn` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `taikhoan`
--
ALTER TABLE `taikhoan`
  MODIFY `MaTaiKhoan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `tuyen_xe`
--
ALTER TABLE `tuyen_xe`
  MODIFY `MaTuyenXe` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `ve`
--
ALTER TABLE `ve`
  MODIFY `MaVe` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `vi_noi_bo`
--
ALTER TABLE `vi_noi_bo`
  MODIFY `MaVi` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `xe`
--
ALTER TABLE `xe`
  MODIFY `MaXe` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `yeu_cau_nap_tien`
--
ALTER TABLE `yeu_cau_nap_tien`
  MODIFY `MaYeuCau` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `chi_tiet_dat_ve`
--
ALTER TABLE `chi_tiet_dat_ve`
  ADD CONSTRAINT `FK_ChiTiet_Chuyen` FOREIGN KEY (`MaChuyen`) REFERENCES `chuyen_xe` (`MaChuyen`),
  ADD CONSTRAINT `FK_ChiTiet_Don` FOREIGN KEY (`MaDon`) REFERENCES `don_dat_ve` (`MaDon`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_ChiTiet_Ghe` FOREIGN KEY (`MaGhe`) REFERENCES `ghe` (`MaGhe`);

--
-- Các ràng buộc cho bảng `chuyen_xe`
--
ALTER TABLE `chuyen_xe`
  ADD CONSTRAINT `FK_ChuyenXe_TuyenXe` FOREIGN KEY (`MaTuyenXe`) REFERENCES `tuyen_xe` (`MaTuyenXe`),
  ADD CONSTRAINT `FK_ChuyenXe_Xe` FOREIGN KEY (`MaXe`) REFERENCES `xe` (`MaXe`);

--
-- Các ràng buộc cho bảng `don_dat_ve`
--
ALTER TABLE `don_dat_ve`
  ADD CONSTRAINT `FK_DonDatVe_ChuyenXe` FOREIGN KEY (`MaChuyen`) REFERENCES `chuyen_xe` (`MaChuyen`),
  ADD CONSTRAINT `FK_DonDatVe_NhanVien` FOREIGN KEY (`MaNhanVienXacNhan`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_DonDatVe_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`);

--
-- Các ràng buộc cho bảng `ghe`
--
ALTER TABLE `ghe`
  ADD CONSTRAINT `FK_Ghe_Xe` FOREIGN KEY (`MaXe`) REFERENCES `xe` (`MaXe`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `giao_dich_ngan_hang`
--
ALTER TABLE `giao_dich_ngan_hang`
  ADD CONSTRAINT `FK_GDNH_TaiKhoan` FOREIGN KEY (`MaTaiKhoanDuKien`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `giao_dich_vi`
--
ALTER TABLE `giao_dich_vi`
  ADD CONSTRAINT `FK_GiaoDichVi_Vi` FOREIGN KEY (`MaVi`) REFERENCES `vi_noi_bo` (`MaVi`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `lich_su_in_ve`
--
ALTER TABLE `lich_su_in_ve`
  ADD CONSTRAINT `FK_LichSuIn_TaiKhoan` FOREIGN KEY (`MaTaiKhoanThaoTac`) REFERENCES `taikhoan` (`MaTaiKhoan`),
  ADD CONSTRAINT `FK_LichSuIn_Ve` FOREIGN KEY (`MaVe`) REFERENCES `ve` (`MaVe`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `tuyen_xe`
--
ALTER TABLE `tuyen_xe`
  ADD CONSTRAINT `FK_TuyenXe_DiemDen` FOREIGN KEY (`MaDiemDen`) REFERENCES `dia_diem` (`MaDiaDiem`),
  ADD CONSTRAINT `FK_TuyenXe_DiemDi` FOREIGN KEY (`MaDiemDi`) REFERENCES `dia_diem` (`MaDiaDiem`);

--
-- Các ràng buộc cho bảng `ve`
--
ALTER TABLE `ve`
  ADD CONSTRAINT `FK_Ve_DonDatVe` FOREIGN KEY (`MaDon`) REFERENCES `don_dat_ve` (`MaDon`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `vi_noi_bo`
--
ALTER TABLE `vi_noi_bo`
  ADD CONSTRAINT `FK_ViNoiBo_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `yeu_cau_nap_tien`
--
ALTER TABLE `yeu_cau_nap_tien`
  ADD CONSTRAINT `FK_YCNT_Admin` FOREIGN KEY (`MaAdminDuyet`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_YCNT_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

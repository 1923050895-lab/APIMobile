-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 19, 2026 lúc 02:21 PM
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
-- Cấu trúc bảng cho bảng `chuyenxe`
--

CREATE TABLE `chuyenxe` (
  `MaChuyenXe` int(11) NOT NULL,
  `MaTuyenXe` int(11) NOT NULL,
  `MaXe` int(11) NOT NULL,
  `GioKhoiHanh` datetime NOT NULL,
  `GioDenDuKien` datetime NOT NULL,
  `GiaVe` decimal(12,2) NOT NULL,
  `TrangThai` enum('SapChay','DangChay','HoanThanh','DaHuy') NOT NULL DEFAULT 'SapChay'
) ;

--
-- Đang đổ dữ liệu cho bảng `chuyenxe`
--

INSERT INTO `chuyenxe` (`MaChuyenXe`, `MaTuyenXe`, `MaXe`, `GioKhoiHanh`, `GioDenDuKien`, `GiaVe`, `TrangThai`) VALUES
(1, 1, 1, '2026-10-19 07:00:00', '2026-10-19 14:00:00', 350000.00, 'SapChay'),
(2, 1, 2, '2026-10-20 21:00:00', '2026-10-21 04:00:00', 300000.00, 'SapChay'),
(3, 2, 1, '2026-10-21 08:00:00', '2026-10-21 10:30:00', 180000.00, 'SapChay'),
(4, 3, 3, '2026-10-22 09:00:00', '2026-10-22 12:30:00', 200000.00, 'SapChay'),
(5, 4, 4, '2026-10-23 06:30:00', '2026-10-23 08:30:00', 150000.00, 'SapChay'),
(6, 5, 5, '2026-10-24 08:00:00', '2026-10-24 15:00:00', 350000.00, 'SapChay'),
(7, 1, 1, '2026-10-25 07:00:00', '2026-10-25 14:00:00', 350000.00, 'SapChay');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `datve`
--

CREATE TABLE `datve` (
  `MaDatVe` int(11) NOT NULL,
  `MaTaiKhoan` int(11) DEFAULT NULL,
  `HoTenNguoiDat` varchar(100) NOT NULL,
  `SoDienThoai` varchar(15) NOT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `NgayDat` datetime NOT NULL DEFAULT current_timestamp(),
  `TrangThai` enum('DaDat','DaHuy') NOT NULL DEFAULT 'DaDat'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `datve`
--

INSERT INTO `datve` (`MaDatVe`, `MaTaiKhoan`, `HoTenNguoiDat`, `SoDienThoai`, `Email`, `NgayDat`, `TrangThai`) VALUES
(1, 1, 'Nguyen Van An', '0901000001', 'an@example.com', '2026-10-15 09:00:00', 'DaDat'),
(2, 2, 'Tran Thi Binh', '0901000002', 'binh@example.com', '2026-10-15 10:00:00', 'DaDat');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ghe`
--

CREATE TABLE `ghe` (
  `MaGhe` int(11) NOT NULL,
  `MaXe` int(11) NOT NULL,
  `SoGhe` varchar(10) NOT NULL,
  `LoaiGhe` enum('Thuong','VIP') NOT NULL DEFAULT 'Thuong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `ghe`
--

INSERT INTO `ghe` (`MaGhe`, `MaXe`, `SoGhe`, `LoaiGhe`) VALUES
(1, 1, 'G01', 'VIP'),
(2, 2, 'G01', 'VIP'),
(3, 3, 'G01', 'VIP'),
(4, 4, 'G01', 'VIP'),
(5, 5, 'G01', 'VIP'),
(6, 1, 'G02', 'VIP'),
(7, 2, 'G02', 'VIP'),
(8, 3, 'G02', 'VIP'),
(9, 4, 'G02', 'VIP'),
(10, 5, 'G02', 'VIP'),
(11, 1, 'G03', 'VIP'),
(12, 2, 'G03', 'VIP'),
(13, 3, 'G03', 'VIP'),
(14, 4, 'G03', 'VIP'),
(15, 5, 'G03', 'VIP'),
(16, 1, 'G04', 'VIP'),
(17, 2, 'G04', 'VIP'),
(18, 3, 'G04', 'VIP'),
(19, 4, 'G04', 'VIP'),
(20, 5, 'G04', 'VIP'),
(21, 1, 'G05', 'Thuong'),
(22, 2, 'G05', 'Thuong'),
(23, 3, 'G05', 'Thuong'),
(24, 4, 'G05', 'Thuong'),
(25, 5, 'G05', 'Thuong'),
(26, 1, 'G06', 'Thuong'),
(27, 2, 'G06', 'Thuong'),
(28, 3, 'G06', 'Thuong'),
(29, 4, 'G06', 'Thuong'),
(30, 5, 'G06', 'Thuong'),
(31, 1, 'G07', 'Thuong'),
(32, 2, 'G07', 'Thuong'),
(33, 3, 'G07', 'Thuong'),
(34, 4, 'G07', 'Thuong'),
(35, 5, 'G07', 'Thuong'),
(36, 1, 'G08', 'Thuong'),
(37, 2, 'G08', 'Thuong'),
(38, 3, 'G08', 'Thuong'),
(39, 4, 'G08', 'Thuong'),
(40, 5, 'G08', 'Thuong'),
(41, 1, 'G09', 'Thuong'),
(42, 2, 'G09', 'Thuong'),
(43, 3, 'G09', 'Thuong'),
(44, 4, 'G09', 'Thuong'),
(45, 5, 'G09', 'Thuong'),
(46, 1, 'G10', 'Thuong'),
(47, 2, 'G10', 'Thuong'),
(48, 3, 'G10', 'Thuong'),
(49, 4, 'G10', 'Thuong'),
(50, 5, 'G10', 'Thuong'),
(51, 1, 'G11', 'Thuong'),
(52, 2, 'G11', 'Thuong'),
(53, 3, 'G11', 'Thuong'),
(54, 4, 'G11', 'Thuong'),
(55, 5, 'G11', 'Thuong'),
(56, 1, 'G12', 'Thuong'),
(57, 2, 'G12', 'Thuong'),
(58, 3, 'G12', 'Thuong'),
(59, 4, 'G12', 'Thuong'),
(60, 5, 'G12', 'Thuong'),
(61, 1, 'G13', 'Thuong'),
(62, 2, 'G13', 'Thuong'),
(63, 3, 'G13', 'Thuong'),
(64, 4, 'G13', 'Thuong'),
(65, 5, 'G13', 'Thuong'),
(66, 1, 'G14', 'Thuong'),
(67, 2, 'G14', 'Thuong'),
(68, 3, 'G14', 'Thuong'),
(69, 4, 'G14', 'Thuong'),
(70, 5, 'G14', 'Thuong'),
(71, 1, 'G15', 'Thuong'),
(72, 2, 'G15', 'Thuong'),
(73, 3, 'G15', 'Thuong'),
(74, 4, 'G15', 'Thuong'),
(75, 5, 'G15', 'Thuong'),
(76, 1, 'G16', 'Thuong'),
(77, 2, 'G16', 'Thuong'),
(78, 3, 'G16', 'Thuong'),
(79, 4, 'G16', 'Thuong'),
(80, 5, 'G16', 'Thuong'),
(81, 2, 'G17', 'Thuong'),
(82, 3, 'G17', 'Thuong'),
(83, 4, 'G17', 'Thuong'),
(84, 2, 'G18', 'Thuong'),
(85, 3, 'G18', 'Thuong'),
(86, 4, 'G18', 'Thuong'),
(87, 2, 'G19', 'Thuong'),
(88, 3, 'G19', 'Thuong'),
(89, 4, 'G19', 'Thuong'),
(90, 2, 'G20', 'Thuong'),
(91, 3, 'G20', 'Thuong'),
(92, 4, 'G20', 'Thuong'),
(93, 2, 'G21', 'Thuong'),
(94, 3, 'G21', 'Thuong'),
(95, 4, 'G21', 'Thuong'),
(96, 2, 'G22', 'Thuong'),
(97, 3, 'G22', 'Thuong'),
(98, 4, 'G22', 'Thuong'),
(99, 2, 'G23', 'Thuong'),
(100, 3, 'G23', 'Thuong'),
(101, 4, 'G23', 'Thuong'),
(102, 2, 'G24', 'Thuong'),
(103, 3, 'G24', 'Thuong'),
(104, 4, 'G24', 'Thuong'),
(105, 2, 'G25', 'Thuong'),
(106, 3, 'G25', 'Thuong'),
(107, 4, 'G25', 'Thuong'),
(108, 2, 'G26', 'Thuong'),
(109, 3, 'G26', 'Thuong'),
(110, 4, 'G26', 'Thuong'),
(111, 2, 'G27', 'Thuong'),
(112, 3, 'G27', 'Thuong'),
(113, 4, 'G27', 'Thuong'),
(114, 2, 'G28', 'Thuong'),
(115, 3, 'G28', 'Thuong'),
(116, 4, 'G28', 'Thuong'),
(117, 2, 'G29', 'Thuong'),
(118, 3, 'G29', 'Thuong'),
(119, 4, 'G29', 'Thuong'),
(120, 2, 'G30', 'Thuong'),
(121, 3, 'G30', 'Thuong'),
(122, 2, 'G31', 'Thuong'),
(123, 3, 'G31', 'Thuong'),
(124, 2, 'G32', 'Thuong'),
(125, 3, 'G32', 'Thuong'),
(126, 2, 'G33', 'Thuong'),
(127, 3, 'G33', 'Thuong'),
(128, 2, 'G34', 'Thuong'),
(129, 3, 'G34', 'Thuong'),
(130, 3, 'G35', 'Thuong'),
(131, 3, 'G36', 'Thuong'),
(132, 3, 'G37', 'Thuong'),
(133, 3, 'G38', 'Thuong'),
(134, 3, 'G39', 'Thuong'),
(135, 3, 'G40', 'Thuong');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `taikhoan`
--

CREATE TABLE `taikhoan` (
  `MaTaiKhoan` int(11) NOT NULL,
  `TenDangNhap` varchar(50) NOT NULL,
  `MatKhau` varchar(255) NOT NULL,
  `HoTen` varchar(100) NOT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `SoDienThoai` varchar(15) DEFAULT NULL,
  `VaiTro` enum('User','Admin') NOT NULL DEFAULT 'User',
  `TrangThai` tinyint(1) NOT NULL DEFAULT 1,
  `NgayTao` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Đang đổ dữ liệu cho bảng `taikhoan`
--

INSERT INTO `taikhoan` (`MaTaiKhoan`, `TenDangNhap`, `MatKhau`, `HoTen`, `Email`, `SoDienThoai`, `VaiTro`, `TrangThai`, `NgayTao`) VALUES
(1, 'user01', '$2y$10$OX4TGAFAhe./GDcQChTBMuLgrcDuwXBpNbXOjqv/k5upHRUbkb.ii', 'Nguyen Van An', 'an@example.com', '0901000001', 'User', 1, '2026-10-18 21:18:20'),
(2, 'user02', '$2y$10$Fzpa9zXS8C47BCIRJkKkke0FJPMObd.VpNKyYrL3L8qbKtW5O6oVW', 'Tran Thi Binh', 'binh@example.com', '0901000002', 'User', 1, '2026-10-18 21:18:20'),
(3, 'admin01', '$2y$10$WG5OUmdmpCRjB3J4Jc/SUO2EYwlgRKzsuFhpJSgWB2aWdDhKebTrC', 'Quan tri vien', 'admin@example.com', '0901000003', 'Admin', 1, '2026-10-18 21:18:20'),
(4, 'user03', '$2y$10$gfmyv6kak6RkQc0jZ3kQrenvNahNpQPhwoNgIS4qFFr3wGEV2g7PS', 'Nguyen Van C', 'user03@example.com', '0987654321', 'User', 1, '2026-10-19 19:19:28');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tuyenxe`
--

CREATE TABLE `tuyenxe` (
  `MaTuyenXe` int(11) NOT NULL,
  `DiemDi` varchar(100) NOT NULL,
  `DiemDen` varchar(100) NOT NULL,
  `KhoangCachKm` decimal(8,2) DEFAULT NULL,
  `ThoiGianDuKienPhut` int(11) DEFAULT NULL
) ;

--
-- Đang đổ dữ liệu cho bảng `tuyenxe`
--

INSERT INTO `tuyenxe` (`MaTuyenXe`, `DiemDi`, `DiemDen`, `KhoangCachKm`, `ThoiGianDuKienPhut`) VALUES
(1, 'TP. Ho Chi Minh', 'Da Lat', 300.00, 420),
(2, 'TP. Ho Chi Minh', 'Vung Tau', 100.00, 150),
(3, 'TP. Ho Chi Minh', 'Can Tho', 170.00, 210),
(4, 'Ha Noi', 'Hai Phong', 120.00, 120),
(5, 'Da Lat', 'TP. Ho Chi Minh', 300.00, 420);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ve`
--

CREATE TABLE `ve` (
  `MaVe` int(11) NOT NULL,
  `MaDatVe` int(11) NOT NULL,
  `MaChuyenXe` int(11) NOT NULL,
  `MaXe` int(11) NOT NULL,
  `MaGhe` int(11) NOT NULL,
  `HoTenHanhKhach` varchar(100) NOT NULL,
  `SoDienThoaiHanhKhach` varchar(15) NOT NULL,
  `GiaVe` decimal(12,2) NOT NULL,
  `TrangThai` enum('DaDat','DaHuy') NOT NULL DEFAULT 'DaDat',
  `GheDangDat` int(11) GENERATED ALWAYS AS (case when `TrangThai` = 'DaDat' then `MaGhe` else NULL end) STORED
) ;

--
-- Đang đổ dữ liệu cho bảng `ve`
--

INSERT INTO `ve` (`MaVe`, `MaDatVe`, `MaChuyenXe`, `MaXe`, `MaGhe`, `HoTenHanhKhach`, `SoDienThoaiHanhKhach`, `GiaVe`, `TrangThai`) VALUES
(1, 1, 1, 1, 1, 'Nguyen Van An', '0901000001', 350000.00, 'DaDat'),
(2, 2, 3, 1, 6, 'Tran Thi Binh', '0901000002', 180000.00, 'DaDat');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `xe`
--

CREATE TABLE `xe` (
  `MaXe` int(11) NOT NULL,
  `BienSo` varchar(20) NOT NULL,
  `TenXe` varchar(100) NOT NULL,
  `SoLuongGhe` int(11) NOT NULL,
  `TrangThai` enum('HoatDong','BaoTri','NgungHoatDong') NOT NULL DEFAULT 'HoatDong'
) ;

--
-- Đang đổ dữ liệu cho bảng `xe`
--

INSERT INTO `xe` (`MaXe`, `BienSo`, `TenXe`, `SoLuongGhe`, `TrangThai`) VALUES
(1, '51B-10001', 'Limousine 16 cho', 16, 'HoatDong'),
(2, '51B-10002', 'Xe giuong nam 34 cho', 34, 'HoatDong'),
(3, '65B-20001', 'Xe giuong nam 40 cho', 40, 'HoatDong'),
(4, '15B-30001', 'Xe khach 29 cho', 29, 'HoatDong'),
(5, '49B-40001', 'Limousine 16 cho', 16, 'HoatDong');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `chuyenxe`
--
ALTER TABLE `chuyenxe`
  ADD PRIMARY KEY (`MaChuyenXe`),
  ADD UNIQUE KEY `UQ_ChuyenXe_MaChuyenXe_MaXe` (`MaChuyenXe`,`MaXe`),
  ADD KEY `FK_ChuyenXe_Xe` (`MaXe`),
  ADD KEY `IX_ChuyenXe_Tuyen_Gio` (`MaTuyenXe`,`GioKhoiHanh`);

--
-- Chỉ mục cho bảng `datve`
--
ALTER TABLE `datve`
  ADD PRIMARY KEY (`MaDatVe`),
  ADD KEY `IX_DatVe_TaiKhoan_NgayDat` (`MaTaiKhoan`,`NgayDat`),
  ADD KEY `IX_DatVe_SoDienThoai` (`SoDienThoai`);

--
-- Chỉ mục cho bảng `ghe`
--
ALTER TABLE `ghe`
  ADD PRIMARY KEY (`MaGhe`),
  ADD UNIQUE KEY `UQ_Ghe_Xe_SoGhe` (`MaXe`,`SoGhe`),
  ADD UNIQUE KEY `UQ_Ghe_MaGhe_MaXe` (`MaGhe`,`MaXe`);

--
-- Chỉ mục cho bảng `taikhoan`
--
ALTER TABLE `taikhoan`
  ADD PRIMARY KEY (`MaTaiKhoan`),
  ADD UNIQUE KEY `TenDangNhap` (`TenDangNhap`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Chỉ mục cho bảng `tuyenxe`
--
ALTER TABLE `tuyenxe`
  ADD PRIMARY KEY (`MaTuyenXe`);

--
-- Chỉ mục cho bảng `ve`
--
ALTER TABLE `ve`
  ADD PRIMARY KEY (`MaVe`),
  ADD UNIQUE KEY `UQ_Ve_Chuyen_Ghe` (`MaChuyenXe`,`GheDangDat`),
  ADD KEY `FK_Ve_ChuyenXe_Xe` (`MaChuyenXe`,`MaXe`),
  ADD KEY `FK_Ve_Ghe_Xe` (`MaGhe`,`MaXe`),
  ADD KEY `IX_Ve_MaDatVe` (`MaDatVe`),
  ADD KEY `IX_Ve_MaChuyenXe` (`MaChuyenXe`);

--
-- Chỉ mục cho bảng `xe`
--
ALTER TABLE `xe`
  ADD PRIMARY KEY (`MaXe`),
  ADD UNIQUE KEY `BienSo` (`BienSo`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `chuyenxe`
--
ALTER TABLE `chuyenxe`
  MODIFY `MaChuyenXe` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `datve`
--
ALTER TABLE `datve`
  MODIFY `MaDatVe` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `ghe`
--
ALTER TABLE `ghe`
  MODIFY `MaGhe` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=136;

--
-- AUTO_INCREMENT cho bảng `taikhoan`
--
ALTER TABLE `taikhoan`
  MODIFY `MaTaiKhoan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `tuyenxe`
--
ALTER TABLE `tuyenxe`
  MODIFY `MaTuyenXe` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `ve`
--
ALTER TABLE `ve`
  MODIFY `MaVe` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `xe`
--
ALTER TABLE `xe`
  MODIFY `MaXe` int(11) NOT NULL AUTO_INCREMENT;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `chuyenxe`
--
ALTER TABLE `chuyenxe`
  ADD CONSTRAINT `FK_ChuyenXe_TuyenXe` FOREIGN KEY (`MaTuyenXe`) REFERENCES `tuyenxe` (`MaTuyenXe`),
  ADD CONSTRAINT `FK_ChuyenXe_Xe` FOREIGN KEY (`MaXe`) REFERENCES `xe` (`MaXe`);

--
-- Các ràng buộc cho bảng `datve`
--
ALTER TABLE `datve`
  ADD CONSTRAINT `FK_DatVe_TaiKhoan` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `taikhoan` (`MaTaiKhoan`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `ghe`
--
ALTER TABLE `ghe`
  ADD CONSTRAINT `FK_Ghe_Xe` FOREIGN KEY (`MaXe`) REFERENCES `xe` (`MaXe`);

--
-- Các ràng buộc cho bảng `ve`
--
ALTER TABLE `ve`
  ADD CONSTRAINT `FK_Ve_ChuyenXe_Xe` FOREIGN KEY (`MaChuyenXe`,`MaXe`) REFERENCES `chuyenxe` (`MaChuyenXe`, `MaXe`),
  ADD CONSTRAINT `FK_Ve_DatVe` FOREIGN KEY (`MaDatVe`) REFERENCES `datve` (`MaDatVe`),
  ADD CONSTRAINT `FK_Ve_Ghe_Xe` FOREIGN KEY (`MaGhe`,`MaXe`) REFERENCES `ghe` (`MaGhe`, `MaXe`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

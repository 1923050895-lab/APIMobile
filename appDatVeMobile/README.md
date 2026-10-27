# 📱 Ứng Dụng Đặt Vé Xe Khách - React Native Expo

Dự án ứng dụng di động được xây dựng bằng **React Native (Expo SDK 58)**, kết nối trực tiếp với hệ thống Backend PHP 8.2 & MySQL qua **Axios** và lưu trữ cục bộ với **AsyncStorage**.

---

## 🚀 Tính Năng Chính Đáp Ứng Theo Yêu Cầu

### 1. Phân chia giao diện và chức năng theo 3 vai trò (Role-Based Navigation)
- **Khách hàng (`KhachHang`)**:
  - 🚌 **Tìm kiếm chuyến xe**: Chọn điểm đi, điểm đến từ danh mục, lọc theo ngày giờ.
  - 💺 **Sơ đồ 2 hàng ghế (Trái & Phải)**: Hiển thị chuẩn 2 hàng ghế với lối đi ở giữa cho cả Tầng 1 và Tầng 2, phân biệt rõ ghế trống, ghế đang chọn và ghế đã bán.
  - 💳 **Nạp tiền ví qua VietQR**: Nhập số tiền nạp -> Tạo mã VietQR (VietinBank - STK `1041002875` - Tên `NGUYEN MANH CUONG`) -> Bấm "Gửi Admin Duyệt" để admin xác nhận biến động tài khoản.
  - 🎫 **Quản lý vé**: Xem danh sách vé đã đặt, in vé online (mã QR lên xe), hủy vé (hoàn 90% số dư vào ví theo BR-04).
- **Nhân viên quầy (`NhanVienQuay`)**:
  - 🏢 **Bán vé trực tiếp tại quầy**: Chọn chuyến xe, nhập tên hành khách và SĐT, chọn ghế trên sơ đồ 2 hàng, thu tiền mặt hoặc chuyển khoản, in vé vật lý ngay tại quầy.
- **Quản trị viên (`Admin`)**:
  - 🛣️ **Thêm tuyến xe mới bằng cách chọn Điểm Đi và Điểm Đến**: Hệ thống tự động ghép tên tuyến (Ví dụ: *Bến Xe Miền Đông - Bến Xe Trung Tâm Đà Nẵng*), nhập khoảng cách km và thời gian dự kiến -> Bấm tạo tuyến thành công là có thể thêm chuyến xe ngay cho tuyến đó!
  - 🚌 **Quản lý chuyến xe**: Thêm chuyến xe mới (chọn tuyến vừa tạo, chọn xe, giờ xuất phát, giờ đến, giá vé).
  - 💳 **Duyệt nạp tiền VietQR**: Kiểm tra các yêu cầu nạp tiền của người dùng, duyệt cộng tiền vào ví hoặc từ chối.
  - 👥 **Quản lý người dùng**: Khóa / mở khóa tài khoản, tạo tài khoản nhân viên quầy vé mới.

---

### 2. Modal Đăng nhập / Đăng ký & Tự động lưu tên đăng nhập với AsyncStorage
- **Gọi Modal lên LIỀN khi mở ứng dụng**: Nếu chưa có phiên đăng nhập, hệ thống sẽ tự động bật Modal Đăng nhập/Đăng ký ngay khi người dùng vừa vào app.
- **Tự động lưu tên người dùng**: Khi đăng nhập hoặc đăng ký thành công lần đầu, tên đăng nhập sẽ được lưu vào `AsyncStorage` (`saved_username`). Lần thứ hai người dùng mở ứng dụng / mở modal đăng nhập, ô **Tên đăng nhập sẽ được tự động điền sẵn**, người dùng không cần phải gõ lại tên nữa.

---

### 3. Cấu hình Axios & Kết nối API linh hoạt
- File cấu hình: `src/api/apiClient.js`
- Tự động gắn header `Authorization: Bearer <Token>` vào mọi request khi đã đăng nhập.
- Tự động bắt lỗi mạng và chuẩn hóa response từ backend PHP.
- Hỗ trợ đổi địa chỉ IP máy chủ API trực tiếp trong ứng dụng qua popup **⚙️ Cấu hình máy chủ API** (chuyển đổi linh hoạt giữa WiFi `192.168.1.87`, Android Emulator `10.0.2.2`, hoặc Localhost).

---

## 🛠️ Hướng Dẫn Khởi Chạy Ứng Dụng

Di chuyển vào thư mục dự án và khởi chạy bằng lệnh:

```bash
cd D:\Xampp2\htdocs\appDatVeMobile
npx expo start
```

### Các tùy chọn kiểm thử:
- **Quét mã QR trên điện thoại thật**: Mở ứng dụng **Expo Go** trên iOS/Android và quét mã QR trên màn hình terminal.
- **Chạy trên Android Emulator**: Nhấn phím `a` trên terminal.
- **Chạy trên Web Browser**: Nhấn phím `w` trên terminal (cần cài `@expo/metro-runtime` nếu muốn chạy web).

---

## 🔑 Tài Khoản Kiểm Thử Mẫu Sẵn Có

| Vai trò | Tên đăng nhập | Mật khẩu | Chức năng chính |
|:---|:---|:---|:---|
| **Admin** | `admin` | `123456` | Thêm tuyến xe (chọn điểm đi/đến), thêm chuyến, duyệt nạp tiền VietQR, quản lý user |
| **Nhân viên quầy** | `nv_sg` | `123456` | Xuất vé trực tiếp tại quầy, thu tiền mặt/chuyển khoản |
| **Khách hàng** | `khach1` | `123456` | Đặt vé sơ đồ 2 hàng, nạp tiền VietQR, quản lý vé, hủy vé |

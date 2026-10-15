# 🚌 Dự Án AppDatVeXe (PHP Backend + React Native Mobile)

Tài liệu này hướng dẫn cách thiết lập, cài đặt và chạy dự án **AppDatVeXe** trên máy tính cá nhân cho các thành viên trong nhóm.

---

## 📂 1. Cấu trúc thư mục dự án
* `backend/`: Mã nguồn PHP (API) chạy trên môi trường XAMPP.
* `mobile/`: Ứng dụng di động đa nền tảng viết bằng React Native.
* `database/`: Chứa file sao lưu cơ sở dữ liệu MySQL (`.sql`).

---

## ⚙️ 2. Yêu cầu chuẩn bị trước khi bắt đầu
Trước khi chạy dự án, máy tính của bạn cần cài đặt sẵn:
1. **XAMPP** (bao gồm Apache và MySQL).
2. **Node.js** và npm (dùng cho React Native).
3. Trình biên tập mã nguồn (VS Code, Android Studio, hoặc Xcode nếu chạy iOS).

---

## 🛠️ 3. Các bước thiết lập chi tiết

### Bước A: Đặt thư mục vào XAMPP
1. Clone hoặc tải thư mục dự án `AppDatVeXe` này vào thư mục `htdocs` của XAMPP:
   * Đường dẫn chuẩn trên Windows: `C:\xampp\htdocs\AppDatVeXe`
2. Khởi động bảng điều khiển **XAMPP Control Panel**, sau đó bật hai dịch vụ **Apache** và **MySQL**.

### Bước B: Thiết lập Cơ sở dữ liệu (Database)
1. Mở trình duyệt web và truy cập vào: `http://localhost/phpmyadmin/`
2. Tạo một Database mới (ví dụ đặt tên: `db_datvexe`).
3. Nhấn vào tab **Import**, chọn tệp `.sql` nằm trong thư mục `database/` của dự án (`AppDatVeXe/database/...`) và bấm **Go** để nạp dữ liệu mẫu.
4. Mở file cấu hình kết nối database trong thư mục `backend/config/db.php` để đảm bảo thông tin kết nối đúng với máy của bạn (Mặc định: `host=localhost`, `user=root`, `password=` trống).

### Bước C: Cài đặt và chạy Backend (PHP)
* Bạn có thể kiểm tra xem API đã chạy chưa bằng cách truy cập trình duyệt:
  `http://localhost/AppDatVeXe/backend/`

### Bước D: Cài đặt và chạy Mobile App (React Native)
1. Mở Terminal / Command Prompt và di chuyển vào thư mục `mobile`:
   ```bash
   cd C:\xampp\htdocs\AppDatVeXe\mobile
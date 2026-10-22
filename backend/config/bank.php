<?php

/**
 * Cấu hình thông tin tài khoản ngân hàng để nhận thanh toán chuyển khoản (VietQR).
 * Bạn có thể thay đổi các thông tin bên dưới theo tài khoản ngân hàng thực tế của nhà xe.
 */
return [
    // Mã ngân hàng theo chuẩn Napas / VietQR
    // Một số mã phổ biến:
    // MB        : Ngân hàng TMCP Quân Đội (MBBank)
    // VCB       : Ngân hàng TMCP Ngoại Thương VN (Vietcombank)
    // TCB       : Ngân hàng Kỹ Thương VN (Techcombank)
    // ICB       : Ngân hàng Công Thương VN (VietinBank)
    // BIDV      : Ngân hàng Đầu tư và Phát triển VN
    // ACB       : Ngân hàng Á Châu
    // VPB       : Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)
    // TPB       : Ngân hàng Tiên Phong (TPBank)
    // STB       : Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)
    // HDB       : Ngân hàng TMCP Phát triển TP.HCM (HDBank)
    'bank_id' => 'VCB',

    // Tên đầy đủ hiển thị của ngân hàng
    'bank_name' => 'NGUYEN MANH CUONG',

    // Số tài khoản ngân hàng nhận tiền
    'account_no' => '1041002875',

    // Tên chủ tài khoản (viết hoa không dấu hoặc có dấu)
    'account_name' => 'NGUYEN MANH CUONG',

    // Kiểu hiển thị mã QR VietQR:
    // 'compact2': Khung đầy đủ thông tin (Logo ngân hàng, tên chủ TK, số TK, số tiền) - ĐẸP VÀ CHUYÊN NGHIỆP NHẤT
    // 'compact' : Khung thu gọn
    // 'qr_only' : Chỉ hiển thị mã QR vuông
    // 'print'   : Mẫu dành cho in ấn hóa đơn
    'qr_template' => 'compact2',

    // Tiền tố nội dung chuyển khoản để nhận diện mã đặt vé
    // Ví dụ: 'DATVE' -> Nội dung chuyển khoản sẽ là: 'DATVE 1025' hoặc 'DATVE1025'
    'transfer_prefix' => 'DATVE'
];

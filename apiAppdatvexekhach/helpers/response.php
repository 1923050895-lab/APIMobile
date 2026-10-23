<?php
/**
 * Response Helper - Chuẩn hóa định dạng trả về của API
 */

class Response {
    public static function json(int $statusCode, bool $success, string $message, $data = null, $errors = null): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        
        $payload = [
            'success'   => $success,
            'message'   => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        if ($data !== null) {
            $payload['data'] = $data;
        }

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    public static function success(string $message, $data = null, int $statusCode = 200): void {
        self::json($statusCode, true, $message, $data);
    }

    public static function error(string $message, int $statusCode = 400, $errors = null): void {
        self::json($statusCode, false, $message, null, $errors);
    }

    public static function notFound(string $message = 'Không tìm thấy tài nguyên'): void {
        self::error($message, 404);
    }

    public static function unauthorized(string $message = 'Yêu cầu đăng nhập hoặc phiên làm việc hết hạn'): void {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Bạn không có quyền thực hiện hành động này'): void {
        self::error($message, 403);
    }
}

<?php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/../config/db.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    echo "=== CẤU TRÚC CÁC BẢNG ===\n";
    foreach (['datve', 've', 'ghe', 'chuyenxe', 'xe', 'tuyenxe', 'taikhoan'] as $t) {
        echo "\n>>> BẢNG: $t <<<\n";
        $columns = $conn->query("DESCRIBE $t")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $col) {
            echo "{$col['Field']} | {$col['Type']} | Null: {$col['Null']} | Key: {$col['Key']} | Default: " . var_export($col['Default'], true) . " | Extra: {$col['Extra']}\n";
        }
    }
} catch (Throwable $e) {
    echo "LỖI: " . $e->getMessage();
}

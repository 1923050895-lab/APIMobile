
<?php

class Database
{
    private string $host = "localhost";
    private string $port = "3306"; // port mysql
    private string $db_name = "appdatvexekhach";
    private string $username = "root";
    private string $password = "";

    public ?PDO $conn = null;

    public function getConnection(): ?PDO
    {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";

            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw new RuntimeException("Không thể kết nối cơ sở dữ liệu.");
        }

        return $this->conn;
    }
}

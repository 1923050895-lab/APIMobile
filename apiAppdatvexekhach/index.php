<?php
/**
 * Front Controller & API Router
 * Hệ thống Quản lý Đặt Vé Xe Khách (PHP 8.2 & MySQL)
 */

// Bật CORS cho phép gọi từ Frontend Web / Mobile App
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/TripController.php';
require_once __DIR__ . '/controllers/BookingController.php';
require_once __DIR__ . '/controllers/TicketController.php';
require_once __DIR__ . '/controllers/CounterController.php';
require_once __DIR__ . '/controllers/WalletController.php';
require_once __DIR__ . '/controllers/AdminController.php';
require_once __DIR__ . '/controllers/BankWebhookController.php';

// Xác định URI và method
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Loại bỏ base path của folder dự án (e.g. /apiAppdatvexekhach)
$scriptDir = dirname($_SERVER['SCRIPT_NAME']);
$scriptDir = str_replace('\\', '/', $scriptDir);
if ($scriptDir !== '/' && strpos($uri, $scriptDir) === 0) {
    $uri = substr($uri, strlen($scriptDir));
}

// Hỗ trợ route qua query param nếu rewrite bị tắt: index.php?r=trips/search
if (isset($_GET['r']) && !empty($_GET['r'])) {
    $uri = '/' . ltrim($_GET['r'], '/');
}

$uri = trim($uri, '/');
if (strpos($uri, 'api/') === 0) {
    $uri = substr($uri, 4); // Bỏ prefix api/
}

// Lấy JSON input body cho phương thức POST/PUT
$rawBody = file_get_contents('php://input');
if ($rawBody !== false) {
    if (substr($rawBody, 0, 3) === "\xEF\xBB\xBF") {
        $rawBody = substr($rawBody, 3);
    }
    $body = json_decode($rawBody, true);
    if ($body === null && !empty($rawBody)) {
        // Cố gắng khắc phục encoding nếu client gửi encoding Windows-1258 hoặc ISO
        $utf8Body = mb_convert_encoding($rawBody, 'UTF-8', 'UTF-8, Windows-1258, Windows-1252, ISO-8859-1');
        $body = json_decode($utf8Body, true);
    }
}
$body = is_array($body) ? $body : [];
if (!empty($_POST)) {
    $body = array_merge($body, $_POST);
}

// Bảng điều hướng Router
try {
    // 1. AUTH ROUTES
    if ($method === 'POST' && $uri === 'auth/register') {
        AuthController::register($body);
    } elseif ($method === 'POST' && $uri === 'auth/login') {
        AuthController::login($body);
    } elseif ($method === 'GET' && $uri === 'auth/profile') {
        AuthController::profile();
    } elseif (($method === 'POST' || $method === 'PUT') && ($uri === 'auth/update-profile' || $uri === 'auth/profile')) {
        AuthController::updateProfile($body);
    }

    // 2. TRIPS & STATIONS (UC-01, UC-02)
    elseif ($method === 'GET' && ($uri === 'trips' || $uri === 'trips/search')) {
        TripController::search();
    } elseif ($method === 'GET' && preg_match('#^trips/(\d+)/seats$#', $uri, $m)) {
        TripController::getSeats((int)$m[1]);
    } elseif ($method === 'GET' && $uri === 'locations') {
        TripController::getLocations();
    }

    // 3. WALLET (BR-01, BR-04, VIETQR NẠP TIỀN)
    elseif ($method === 'GET' && $uri === 'wallet/balance') {
        WalletController::getBalance();
    } elseif ($method === 'GET' && $uri === 'wallet/transactions') {
        WalletController::getTransactions();
    } elseif ($method === 'POST' && $uri === 'wallet/deposit-request') {
        WalletController::createDepositRequest($body);
    } elseif ($method === 'GET' && $uri === 'wallet/my-deposit-requests') {
        WalletController::myDepositRequests();
    }

    // 4. BOOKINGS (UC-03)
    elseif ($method === 'POST' && ($uri === 'bookings/book' || $uri === 'bookings')) {
        BookingController::bookOnline($body);
    }

    // 5. TICKETS (UC-04, UC-05, UC-06)
    elseif ($method === 'GET' && $uri === 'tickets/my-tickets') {
        TicketController::myTickets();
    } elseif ($method === 'GET' && preg_match('#^tickets/(\d+)$#', $uri, $m)) {
        TicketController::detail((int)$m[1]);
    } elseif ($method === 'POST' && preg_match('#^tickets/(\d+)/print$#', $uri, $m)) {
        TicketController::printOnline((int)$m[1]);
    } elseif ($method === 'POST' && preg_match('#^tickets/(\d+)/cancel$#', $uri, $m)) {
        TicketController::cancel((int)$m[1]);
    }

    // 6. COUNTER STAFF (UC-07, UC-08, UC-09, BR-06, BR-07, BR-08)
    elseif ($method === 'POST' && $uri === 'counter/create-booking') {
        CounterController::createBooking($body);
    } elseif ($method === 'POST' && $uri === 'counter/confirm-payment') {
        CounterController::confirmPayment($body);
    } elseif ($method === 'POST' && preg_match('#^counter/print-ticket/(\d+)$#', $uri, $m)) {
        CounterController::printCounterTicket((int)$m[1]);
    } elseif ($method === 'POST' && $uri === 'counter/print-ticket') {
        $tId = (int)($body['MaVe'] ?? 0);
        CounterController::printCounterTicket($tId);
    }

    // 7. BANK WEBHOOK / AUTOMATIC DEPOSIT (UC-14, BR-10)
    elseif ($method === 'POST' && ($uri === 'bank/deposit' || $uri === 'bank/webhook')) {
        BankWebhookController::processDeposit($body);
    }

    // 8. ADMIN ROUTES (UC-10, UC-11, UC-12, UC-13, UC-14)
    elseif ($method === 'GET' && $uri === 'admin/locations') {
        AdminController::listLocations();
    } elseif ($method === 'POST' && $uri === 'admin/locations') {
        AdminController::createLocation($body);
    } elseif ($method === 'PUT' && preg_match('#^admin/locations/(\d+)$#', $uri, $m)) {
        AdminController::updateLocation((int)$m[1], $body);
    } elseif ($method === 'GET' && $uri === 'admin/buses') {
        AdminController::listBuses();
    } elseif ($method === 'POST' && $uri === 'admin/buses') {
        AdminController::createBus($body);
    } elseif ($method === 'PUT' && preg_match('#^admin/buses/(\d+)$#', $uri, $m)) {
        AdminController::updateBus((int)$m[1], $body);
    } elseif ($method === 'GET' && preg_match('#^admin/buses/(\d+)/seats$#', $uri, $m)) {
        AdminController::getBusSeats((int)$m[1]);
    } elseif ($method === 'GET' && $uri === 'admin/routes') {
        AdminController::listRoutes();
    } elseif ($method === 'POST' && $uri === 'admin/routes') {
        AdminController::createRoute($body);
    } elseif ($method === 'GET' && $uri === 'admin/trips') {
        AdminController::listTrips();
    } elseif ($method === 'POST' && $uri === 'admin/trips') {
        AdminController::createTrip($body);
    } elseif ($method === 'PUT' && preg_match('#^admin/trips/(\d+)$#', $uri, $m)) {
        AdminController::updateTrip((int)$m[1], $body);
    } elseif ($method === 'GET' && $uri === 'admin/users') {
        AdminController::listUsers();
    } elseif ($method === 'POST' && $uri === 'admin/users') {
        AdminController::createUser($body);
    } elseif ($method === 'PUT' && preg_match('#^admin/users/(\d+)$#', $uri, $m)) {
        AdminController::updateUserStatus((int)$m[1], $body);
    } elseif ($method === 'GET' && $uri === 'admin/bank-transactions') {
        AdminController::listBankTransactions();
    } elseif ($method === 'GET' && $uri === 'admin/deposit-requests') {
        AdminController::listDepositRequests();
    } elseif ($method === 'POST' && preg_match('#^admin/deposit-requests/(\d+)/approve$#', $uri, $m)) {
        AdminController::approveDepositRequest((int)$m[1]);
    } elseif ($method === 'POST' && preg_match('#^admin/deposit-requests/(\d+)/reject$#', $uri, $m)) {
        AdminController::rejectDepositRequest((int)$m[1], $body);
    }

    // 9. DEFAULT / ROOT HEALTHCHECK
    elseif ($uri === '' || $uri === 'index.php') {
        Response::success('API Hệ thống Quản lý Đặt Vé Xe Khách đang hoạt động bình thường', [
            'service'    => 'Bus Ticket Booking API',
            'version'    => '1.0.0',
            'php_version'=> phpversion(),
            'docs'       => 'test_api.html'
        ]);
    } else {
        Response::notFound("Endpoint '$method /$uri' không tồn tại trên hệ thống");
    }

} catch (Throwable $e) {
    Response::error('Lỗi máy chủ nội bộ: ' . $e->getMessage(), 500);
}

<?php
// CORS headers for React frontend communication
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getDbConnection()
{
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $username = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASS') ?: '';
    $database = getenv('DB_NAME') ?: 'hospitalappointment_db';
    $port = (int) (getenv('DB_PORT') ?: 3307);

    $conn = new mysqli($host, $username, $password, $database, $port);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed',
            'error' => $conn->connect_error,
        ]);
        exit;
    }

    $conn->set_charset('utf8mb4');
    return $conn;
}

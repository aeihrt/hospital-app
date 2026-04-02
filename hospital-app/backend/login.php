<?php
// CORS headers for React frontend communication
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed',
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$role = strtoupper(trim($input['role'] ?? ''));

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'email and password are required',
    ]);
    exit;
}

$conn = getDbConnection();
$sql = 'SELECT user_id, first_name, last_name, email, password_hash FROM users WHERE email = ? LIMIT 1';
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to prepare statement',
        'error' => $conn->error,
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result ? $result->fetch_assoc() : null;

if ($user && password_verify($password, $user['password_hash'])) {
    $userRole = null;

    if ($role !== '') {
        $roleMap = [
            'ADMIN' => 'R001',
            'DOCTOR' => 'R002',
            'PATIENT' => 'R003',
        ];

        $requestedRoleId = $roleMap[$role] ?? null;
        if ($requestedRoleId === null) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid role selected',
            ]);
            $stmt->close();
            $conn->close();
            exit;
        }

        $roleCheckSql = 'SELECT role_id FROM user_roles WHERE user_id = ? AND role_id = ? LIMIT 1';
        $roleStmt = $conn->prepare($roleCheckSql);

        if (!$roleStmt) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to verify role',
                'error' => $conn->error,
            ]);
            $stmt->close();
            $conn->close();
            exit;
        }

        $roleStmt->bind_param('ss', $user['user_id'], $requestedRoleId);
        $roleStmt->execute();
        $roleResult = $roleStmt->get_result();
        $userRole = $roleResult ? $roleResult->fetch_assoc() : null;
        $roleStmt->close();

        if (!$userRole) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'You are not registered as ' . strtolower($role),
            ]);
            $stmt->close();
            $conn->close();
            exit;
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'user_id' => $user['user_id'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'email' => $user['email'],
            'role_id' => $userRole['role_id'] ?? null,
        ],
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password',
    ]);
}

$stmt->close();
$conn->close();

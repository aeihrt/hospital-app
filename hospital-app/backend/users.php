<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed',
    ]);
    exit;
}

$conn = getDbConnection();

try {
    $sql = '
        SELECT
            u.user_id,
            u.email,
            u.first_name,
            u.last_name,
            u.phone,
            u.is_active,
            u.created_at,
            r.role_id,
            r.name AS role_name
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.user_id
        LEFT JOIN roles r ON r.role_id = ur.role_id
        ORDER BY u.created_at DESC
    ';

    $result = $conn->query($sql);
    $users = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $firstName = trim((string) ($row['first_name'] ?? ''));
            $lastName = trim((string) ($row['last_name'] ?? ''));
            $fullName = trim($firstName . ' ' . $lastName);

            $users[] = [
                'userId' => $row['user_id'],
                'fullName' => $fullName !== '' ? $fullName : 'Unknown User',
                'email' => $row['email'],
                'phone' => $row['phone'] ?? '',
                'role' => $row['role_name'] ? ucfirst(strtolower($row['role_name'])) : 'User',
                'roleId' => $row['role_id'],
                'status' => ((int) $row['is_active'] === 1) ? 'Active' : 'Inactive',
                'createdAt' => $row['created_at'],
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'users' => $users,
    ]);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load users',
        'error' => $error->getMessage(),
    ]);
}

$conn->close();
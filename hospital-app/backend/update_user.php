<?php
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
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$action = trim($input['action'] ?? '');
$userId = trim($input['userId'] ?? '');

if ($action === '' || $userId === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'action and userId are required']);
    exit;
}

$conn = getDbConnection();

if ($action === 'edit') {
    $firstName = trim($input['firstName'] ?? '');
    $lastName  = trim($input['lastName'] ?? '');
    $email     = trim($input['email'] ?? '');
    $phone     = trim($input['phone'] ?? '');
    $status    = strtoupper(trim($input['status'] ?? 'ACTIVE'));
    $role      = ucfirst(strtolower(trim($input['role'] ?? '')));

    if ($firstName === '' || $email === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'First name and email are required']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }

    $isActive = $status === 'INACTIVE' ? 0 : 1;
    $roleMap  = ['Admin' => 'R001', 'Doctor' => 'R002', 'Patient' => 'R003'];
    $roleId   = $roleMap[$role] ?? null;

    try {
        $conn->begin_transaction();

        $stmt = $conn->prepare('UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, is_active = ? WHERE user_id = ?');
        $stmt->bind_param('ssssis', $firstName, $lastName, $email, $phone, $isActive, $userId);
        $stmt->execute();
        $stmt->close();

        if ($roleId !== null) {
            $roleStmt = $conn->prepare('UPDATE user_roles SET role_id = ? WHERE user_id = ?');
            $roleStmt->bind_param('ss', $roleId, $userId);
            $roleStmt->execute();
            $roleStmt->close();
        }

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'User updated successfully']);
    } catch (Throwable $e) {
        $conn->rollback();
        $isDuplicate = str_contains($e->getMessage(), 'Duplicate');
        http_response_code($isDuplicate ? 409 : 500);
        echo json_encode(['success' => false, 'message' => $isDuplicate ? 'Email already exists' : 'Failed to update user']);
    }

} elseif ($action === 'toggle_status') {
    try {
        $stmt = $conn->prepare('UPDATE users SET is_active = 1 - is_active WHERE user_id = ?');
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $stmt->close();

        $fetchStmt = $conn->prepare('SELECT is_active FROM users WHERE user_id = ?');
        $fetchStmt->bind_param('s', $userId);
        $fetchStmt->execute();
        $fetchStmt->bind_result($isActive);
        $fetchStmt->fetch();
        $fetchStmt->close();

        echo json_encode([
            'success'   => true,
            'message'   => 'Status updated',
            'newStatus' => ((int) $isActive === 1) ? 'Active' : 'Inactive',
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to toggle status']);
    }

} elseif ($action === 'change_password') {
    $password = $input['password'] ?? '';

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    try {
        $stmt = $conn->prepare('UPDATE users SET password_hash = ? WHERE user_id = ?');
        $stmt->bind_param('ss', $hash, $userId);
        $stmt->execute();
        $stmt->close();

        echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to change password']);
    }

} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

$conn->close();

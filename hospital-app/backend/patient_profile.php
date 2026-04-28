<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed',
    ]);
    exit;
}

$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }
}

$userId = trim((string) ($_GET['userId'] ?? ($input['userId'] ?? '')));

if ($userId === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'userId is required',
    ]);
    exit;
}

$conn = getDbConnection();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $sql = '
            SELECT
                u.user_id,
                u.email,
                u.first_name,
                u.last_name,
                u.phone,
                u.is_active,
                p.date_of_birth,
                p.sex,
                p.address,
                p.emergency_phone
            FROM users u
            LEFT JOIN patients p ON p.user_id = u.user_id
            WHERE u.user_id = ?
            LIMIT 1
        ';

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Failed to prepare profile query: ' . $conn->error);
        }

        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result ? $result->fetch_assoc() : null;
        $stmt->close();

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Patient profile not found',
            ]);
            $conn->close();
            exit;
        }

        $fullName = trim((string) ($row['first_name'] ?? '') . ' ' . (string) ($row['last_name'] ?? ''));

        echo json_encode([
            'success' => true,
            'profile' => [
                'userId' => $row['user_id'],
                'fullName' => $fullName !== '' ? $fullName : 'Patient',
                'email' => $row['email'],
                'phone' => $row['phone'] ?? '',
                'dateOfBirth' => $row['date_of_birth'] ?? '',
                'sex' => $row['sex'] ?? '',
                'address' => $row['address'] ?? '',
                'emergencyPhone' => $row['emergency_phone'] ?? '',
                'status' => ((int) ($row['is_active'] ?? 1) === 1) ? 'Active' : 'Inactive',
            ],
        ]);
        $conn->close();
        exit;
    }

    $fullName = trim((string) ($input['fullName'] ?? ''));
    $email = trim((string) ($input['email'] ?? ''));
    $phone = trim((string) ($input['phone'] ?? ''));
    $dateOfBirth = trim((string) ($input['dateOfBirth'] ?? ''));
    $sex = trim((string) ($input['sex'] ?? ''));
    $address = trim((string) ($input['address'] ?? ''));
    $emergencyPhone = trim((string) ($input['emergencyPhone'] ?? ''));

    if ($fullName === '' || $email === '' || $phone === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'fullName, email, and phone are required',
        ]);
        $conn->close();
        exit;
    }

    [$firstName, $lastName] = array_pad(preg_split('/\s+/', $fullName, 2), 2, '');

    $conn->begin_transaction();

    $userSql = 'UPDATE users SET email = ?, first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
    $userStmt = $conn->prepare($userSql);
    if (!$userStmt) {
        throw new Exception('Failed to prepare user update: ' . $conn->error);
    }

    $userStmt->bind_param('sssss', $email, $firstName, $lastName, $phone, $userId);
    $userStmt->execute();
    $userStmt->close();

    $patientSql = '
        UPDATE patients
        SET date_of_birth = ?, sex = ?, address = ?, emergency_phone = ?
        WHERE user_id = ?
    ';
    $patientStmt = $conn->prepare($patientSql);
    if (!$patientStmt) {
        throw new Exception('Failed to prepare patient update: ' . $conn->error);
    }

    $patientStmt->bind_param('sssss', $dateOfBirth, $sex, $address, $emergencyPhone, $userId);
    $patientStmt->execute();
    $patientStmt->close();

    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'profile' => [
            'userId' => $userId,
            'fullName' => $fullName,
            'email' => $email,
            'phone' => $phone,
            'dateOfBirth' => $dateOfBirth,
            'sex' => $sex,
            'address' => $address,
            'emergencyPhone' => $emergencyPhone,
        ],
    ]);
} catch (Throwable $error) {
    if ($conn->errno) {
        $conn->rollback();
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save patient profile',
        'error' => $error->getMessage(),
    ]);
}

$conn->close();
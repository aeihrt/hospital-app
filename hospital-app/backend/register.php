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

function generateId($prefix)
{
    return strtoupper($prefix . substr(bin2hex(random_bytes(8)), 0, 9));
}

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

$fullName = trim($input['fullName'] ?? ($input['name'] ?? ''));
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$phone = trim($input['phone'] ?? '');
$role = strtoupper(trim($input['role'] ?? 'PATIENT'));
$status = strtoupper(trim($input['status'] ?? 'ACTIVE'));
$dateOfBirth = trim($input['dateOfBirth'] ?? '');
$specialization = trim($input['specialization'] ?? '');

if ($fullName === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'fullName, email, and password are required',
    ]);
    exit;
}

if (!in_array($role, ['ADMIN', 'DOCTOR', 'PATIENT'], true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid role selected',
    ]);
    exit;
}

if ($role === 'PATIENT' && $dateOfBirth === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Date of birth is required for patients',
    ]);
    exit;
}

if ($role === 'DOCTOR' && $specialization === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Specialization is required for doctors',
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format',
    ]);
    exit;
}

$conn = getDbConnection();
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$isActive = $status === 'INACTIVE' ? 0 : 1;
$roleMap = [
    'ADMIN' => 'R001',
    'DOCTOR' => 'R002',
    'PATIENT' => 'R003',
];
$roleId = $roleMap[$role];

$nameParts = preg_split('/\s+/', $fullName);
$firstName = $nameParts[0] ?? '';
$lastName = implode(' ', array_slice($nameParts, 1));
$userId = generateId('U');

try {
    $conn->begin_transaction();

    $userSql = 'INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)';
    $userStmt = $conn->prepare($userSql);

    if (!$userStmt) {
        throw new Exception('Failed to prepare user statement: ' . $conn->error);
    }

    $userStmt->bind_param('ssssssi', $userId, $email, $passwordHash, $firstName, $lastName, $phone, $isActive);
    $userStmt->execute();
    $userStmt->close();

    $roleSql = 'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)';
    $roleStmt = $conn->prepare($roleSql);

    if (!$roleStmt) {
        throw new Exception('Failed to prepare role statement: ' . $conn->error);
    }

    $roleStmt->bind_param('ss', $userId, $roleId);
    $roleStmt->execute();
    $roleStmt->close();

    if ($role === 'PATIENT') {
        $patientId = generateId('P');
        $patientSql = 'INSERT INTO patients (patient_id, user_id, date_of_birth) VALUES (?, ?, ?)';
        $patientStmt = $conn->prepare($patientSql);

        if (!$patientStmt) {
            throw new Exception('Failed to prepare patient statement: ' . $conn->error);
        }

        $patientStmt->bind_param('sss', $patientId, $userId, $dateOfBirth);
        $patientStmt->execute();
        $patientStmt->close();
    }

    if ($role === 'DOCTOR') {
        $doctorId = generateId('D');
        $doctorSql = 'INSERT INTO doctors (doctor_id, user_id, full_name, phone, email, department) VALUES (?, ?, ?, ?, ?, ?)';
        $doctorStmt = $conn->prepare($doctorSql);

        if (!$doctorStmt) {
            throw new Exception('Failed to prepare doctor statement: ' . $conn->error);
        }

        $doctorStmt->bind_param('ssssss', $doctorId, $userId, $fullName, $phone, $email, $specialization);
        $doctorStmt->execute();
        $doctorStmt->close();
    }

    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'user' => [
            'user_id' => $userId,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'role' => $role,
            'status' => $isActive === 1 ? 'Active' : 'Inactive',
        ],
    ]);
} catch (Throwable $error) {
    $conn->rollback();
    $isDuplicateEmail = $conn->errno === 1062 || str_contains($error->getMessage(), 'Duplicate');
    http_response_code($isDuplicateEmail ? 409 : 500);
    echo json_encode([
        'success' => false,
        'message' => $isDuplicateEmail ? 'Email already exists' : 'Failed to register user',
        'error' => $error->getMessage(),
    ]);
}

$conn->close();

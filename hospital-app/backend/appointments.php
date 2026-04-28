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

function generateId($prefix)
{
    return strtoupper($prefix . substr(bin2hex(random_bytes(8)), 0, 9));
}

function splitFullName($fullName)
{
    $parts = preg_split('/\s+/', trim($fullName));
    $firstName = $parts[0] ?? '';
    $lastName = implode(' ', array_slice($parts, 1));

    return [$firstName, $lastName];
}

function generateSyntheticEmail($fullName)
{
    $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '.', $fullName), '.'));
    if ($slug === '') {
        $slug = 'patient';
    }

    return $slug . '.' . substr(bin2hex(random_bytes(3)), 0, 6) . '@local.patient';
}

function formatAppointmentResponse(array $row): array
{
    $startTimestamp = strtotime($row['appointment_start']);

    return [
        'appointmentId' => $row['appointment_id'],
        'time' => $startTimestamp ? strtolower(date('g:ia', $startTimestamp)) : $row['appointment_start'],
        'date' => $startTimestamp ? date('F j, Y', $startTimestamp) : $row['appointment_start'],
        'patientName' => $row['patient_name'] ?: 'Unknown patient',
        'patientMeta' => $row['patient_meta'] ?: 'N/A',
        'doctor' => $row['doctor_name'] ?: 'Unknown doctor',
        'department' => $row['department'] ?: 'General',
        'specialty' => $row['department'] ?: 'General',
        'room' => $row['room'] ?: 'N/A',
        'reason' => $row['reason'] ?: 'No reason provided',
        'status' => $row['status'] ?: 'BOOKED',
        'bookedBy' => $row['created_by_role'] ?: 'System',
        'endTime' => $startTimestamp ? strtoupper(date('g:i A', strtotime($row['appointment_end']))) : $row['appointment_end'],
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $conn = getDbConnection();

    $patientUserId = trim((string) ($_GET['patientUserId'] ?? ''));
    $doctorUserId = trim((string) ($_GET['doctorUserId'] ?? ''));

    try {
        $whereClause = '';
        if ($patientUserId !== '' && $doctorUserId !== '') {
            $whereClause = 'WHERE p.user_id = ? AND d.user_id = ?';
        } elseif ($patientUserId !== '') {
            $whereClause = 'WHERE p.user_id = ?';
        } elseif ($doctorUserId !== '') {
            $whereClause = 'WHERE d.user_id = ?';
        }

        $sql = <<<SQL
            SELECT
                a.appointment_id,
                a.appointment_start,
                a.appointment_end,
                a.status,
                a.reason,
                d.full_name AS doctor_name,
                d.department,
                d.room,
                CONCAT(COALESCE(u.first_name, ''), CASE WHEN COALESCE(u.last_name, '') = '' THEN '' ELSE CONCAT(' ', u.last_name) END) AS patient_name,
                CASE
                    WHEN p.date_of_birth IS NULL THEN 'Unknown'
                    ELSE CONCAT(DATE_FORMAT(p.date_of_birth, '%b %e, %Y'), ' | ', COALESCE(p.sex, 'N/A'))
                END AS patient_meta,
                CASE
                    WHEN cb.user_id IS NULL THEN NULL
                    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = cb.user_id AND ur.role_id = 'R001') THEN 'Admin'
                    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = cb.user_id AND ur.role_id = 'R002') THEN 'Doctor'
                    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = cb.user_id AND ur.role_id = 'R003') THEN 'Patient'
                    ELSE NULL
                END AS created_by_role
            FROM appointments a
            INNER JOIN patients p ON p.patient_id = a.patient_id
            INNER JOIN users u ON u.user_id = p.user_id
            INNER JOIN doctors d ON d.doctor_id = a.doctor_id
            LEFT JOIN users cb ON cb.user_id = a.created_by
            {$whereClause}
            ORDER BY a.appointment_start DESC
        SQL;

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Failed to prepare appointments query: ' . $conn->error);
        }

        if ($patientUserId !== '' && $doctorUserId !== '') {
            $stmt->bind_param('ss', $patientUserId, $doctorUserId);
        } elseif ($patientUserId !== '') {
            $stmt->bind_param('s', $patientUserId);
        } elseif ($doctorUserId !== '') {
            $stmt->bind_param('s', $doctorUserId);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $appointments = [];

        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $appointments[] = formatAppointmentResponse($row);
            }
        }

        $stmt->close();

        echo json_encode([
            'success' => true,
            'appointments' => $appointments,
        ]);
    } catch (Throwable $error) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to load appointments',
            'error' => $error->getMessage(),
        ]);
    }

    $conn->close();
    exit;
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

$patientName = trim($input['patientName'] ?? '');
$doctorName = trim($input['doctor'] ?? '');
$department = trim($input['department'] ?? '');
$date = trim($input['date'] ?? '');
$time = trim($input['time'] ?? '');
$notes = trim($input['notes'] ?? '');
$createdBy = trim((string) ($input['createdBy'] ?? ''));
$patientUserId = trim((string) ($input['patientUserId'] ?? ''));
$appointmentId = trim((string) ($input['appointmentId'] ?? ''));
$status = strtoupper(trim($input['status'] ?? 'BOOKED'));
$slotMinutes = (int) ($input['slotMinutes'] ?? 30);

$conn = getDbConnection();

if ($appointmentId !== '' && !in_array($status, ['BOOKED', 'COMPLETED', 'CANCELED', 'NO_SHOW'], true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid status value',
    ]);
    $conn->close();
    exit;
}

if ($appointmentId !== '' && $patientUserId !== '' && $status !== 'BOOKED') {
    $updateSql = '
        UPDATE appointments a
        INNER JOIN patients p ON p.patient_id = a.patient_id
        SET a.status = ?, a.updated_at = CURRENT_TIMESTAMP
        WHERE a.appointment_id = ? AND p.user_id = ?
    ';
    $updateStmt = $conn->prepare($updateSql);
    if (!$updateStmt) {
        throw new Exception('Failed to prepare appointment update: ' . $conn->error);
    }

    $updateStmt->bind_param('sss', $status, $appointmentId, $patientUserId);
    $updateStmt->execute();
    $affectedRows = $updateStmt->affected_rows;
    $updateStmt->close();

    if ($affectedRows === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Appointment not found or cannot be updated',
        ]);
        $conn->close();
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Appointment updated successfully',
        'appointment' => [
            'appointmentId' => $appointmentId,
            'status' => $status,
        ],
    ]);

    $conn->close();
    exit;
}

if ($patientName === '' || $doctorName === '' || $department === '' || $date === '' || $time === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'patientName, doctor, department, date, and time are required',
    ]);
    exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !preg_match('/^\d{2}:\d{2}$/', $time)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid date or time format',
    ]);
    exit;
}

if (!in_array($status, ['BOOKED', 'COMPLETED', 'CANCELED', 'NO_SHOW'], true)) {
    $status = 'BOOKED';
}

if ($slotMinutes < 5 || $slotMinutes > 240) {
    $slotMinutes = 30;
}

$startTimestamp = strtotime($date . ' ' . $time . ':00');
if ($startTimestamp === false) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to parse date and time',
    ]);
    exit;
}

$appointmentStart = date('Y-m-d H:i:s', $startTimestamp);
$appointmentEnd = date('Y-m-d H:i:s', strtotime('+' . $slotMinutes . ' minutes', $startTimestamp));

try {
    $conn->begin_transaction();

    $doctorSql = 'SELECT doctor_id FROM doctors WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(?)) LIMIT 1';
    $doctorStmt = $conn->prepare($doctorSql);
    if (!$doctorStmt) {
        throw new Exception('Failed to prepare doctor lookup: ' . $conn->error);
    }

    $doctorStmt->bind_param('s', $doctorName);
    $doctorStmt->execute();
    $doctorResult = $doctorStmt->get_result();
    $doctorRow = $doctorResult ? $doctorResult->fetch_assoc() : null;
    $doctorStmt->close();

    if ($doctorRow) {
        $doctorId = $doctorRow['doctor_id'];
    } else {
        $doctorId = generateId('D');
        $insertDoctorSql = 'INSERT INTO doctors (doctor_id, full_name, department, is_active) VALUES (?, ?, ?, 1)';
        $insertDoctorStmt = $conn->prepare($insertDoctorSql);
        if (!$insertDoctorStmt) {
            throw new Exception('Failed to prepare doctor insert: ' . $conn->error);
        }

        $insertDoctorStmt->bind_param('sss', $doctorId, $doctorName, $department);
        $insertDoctorStmt->execute();
        $insertDoctorStmt->close();
    }

    $patientRow = null;
    if ($patientUserId !== '') {
        $patientSql = 'SELECT patient_id FROM patients WHERE user_id = ? LIMIT 1';
        $patientStmt = $conn->prepare($patientSql);
        if (!$patientStmt) {
            throw new Exception('Failed to prepare patient lookup: ' . $conn->error);
        }

        $patientStmt->bind_param('s', $patientUserId);
        $patientStmt->execute();
        $patientResult = $patientStmt->get_result();
        $patientRow = $patientResult ? $patientResult->fetch_assoc() : null;
        $patientStmt->close();
    }

    if ($patientRow === null) {
        $patientSql = "
            SELECT p.patient_id
            FROM patients p
            INNER JOIN users u ON u.user_id = p.user_id
            WHERE LOWER(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))) = LOWER(TRIM(?))
            LIMIT 1
        ";
        $patientStmt = $conn->prepare($patientSql);
        if (!$patientStmt) {
            throw new Exception('Failed to prepare patient lookup: ' . $conn->error);
        }

        $patientStmt->bind_param('s', $patientName);
        $patientStmt->execute();
        $patientResult = $patientStmt->get_result();
        $patientRow = $patientResult ? $patientResult->fetch_assoc() : null;
        $patientStmt->close();
    }

    if ($patientRow) {
        $patientId = $patientRow['patient_id'];
    } else {
        $userId = generateId('U');
        $patientId = generateId('P');
        [$firstName, $lastName] = splitFullName($patientName);
        $email = generateSyntheticEmail($patientName);
        $passwordHash = password_hash(bin2hex(random_bytes(8)), PASSWORD_BCRYPT);

        $insertUserSql = 'INSERT INTO users (user_id, email, password_hash, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, 1)';
        $insertUserStmt = $conn->prepare($insertUserSql);
        if (!$insertUserStmt) {
            throw new Exception('Failed to prepare user insert: ' . $conn->error);
        }

        $insertUserStmt->bind_param('sssss', $userId, $email, $passwordHash, $firstName, $lastName);
        $insertUserStmt->execute();
        $insertUserStmt->close();

        $insertRoleSql = 'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)';
        $insertRoleStmt = $conn->prepare($insertRoleSql);
        if ($insertRoleStmt) {
            $patientRole = 'R003';
            $insertRoleStmt->bind_param('ss', $userId, $patientRole);
            $insertRoleStmt->execute();
            $insertRoleStmt->close();
        }

        $insertPatientSql = 'INSERT INTO patients (patient_id, user_id) VALUES (?, ?)';
        $insertPatientStmt = $conn->prepare($insertPatientSql);
        if (!$insertPatientStmt) {
            throw new Exception('Failed to prepare patient insert: ' . $conn->error);
        }

        $insertPatientStmt->bind_param('ss', $patientId, $userId);
        $insertPatientStmt->execute();
        $insertPatientStmt->close();
    }

    $createdByUserId = null;
    if ($createdBy !== '') {
        $createdBySql = 'SELECT user_id FROM users WHERE user_id = ? LIMIT 1';
        $createdByStmt = $conn->prepare($createdBySql);
        if (!$createdByStmt) {
            throw new Exception('Failed to prepare created_by lookup: ' . $conn->error);
        }

        $createdByStmt->bind_param('s', $createdBy);
        $createdByStmt->execute();
        $createdByResult = $createdByStmt->get_result();
        $createdByRow = $createdByResult ? $createdByResult->fetch_assoc() : null;
        $createdByStmt->close();

        if ($createdByRow) {
            $createdByUserId = $createdBy;
        }
    }

    $appointmentId = generateId('A');
    $insertAppointmentSql = '
        INSERT INTO appointments
            (appointment_id, patient_id, doctor_id, appointment_start, appointment_end, reason, status, created_by)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
    ';
    $insertAppointmentStmt = $conn->prepare($insertAppointmentSql);
    if (!$insertAppointmentStmt) {
        throw new Exception('Failed to prepare appointment insert: ' . $conn->error);
    }

    $reason = $notes === '' ? null : $notes;
    $insertAppointmentStmt->bind_param(
        'ssssssss',
        $appointmentId,
        $patientId,
        $doctorId,
        $appointmentStart,
        $appointmentEnd,
        $reason,
        $status,
        $createdByUserId
    );
    $insertAppointmentStmt->execute();
    $insertAppointmentStmt->close();

    $reasonText = $reason ?? ($notes === '' ? null : $notes);

    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Appointment created successfully',
        'appointment' => [
            'appointmentId' => $appointmentId,
            'time' => strtolower(date('g:ia', $startTimestamp)),
            'date' => date('F j, Y', $startTimestamp),
            'patientName' => $patientName,
            'patientMeta' => $reason ?: 'P - N/A | N/A',
            'doctor' => $doctorName,
            'department' => $department,
            'specialty' => $department,
            'room' => null,
            'reason' => $reasonText,
            'status' => $status,
            'bookedBy' => $createdByUserId ? 'Admin' : 'System',
            'endTime' => strtoupper(date('g:i A', strtotime($appointmentEnd))),
        ],
    ]);
} catch (Throwable $error) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to create appointment',
        'error' => $error->getMessage(),
    ]);
}

$conn->close();

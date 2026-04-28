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

function generateId($prefix)
{
    return strtoupper($prefix . substr(bin2hex(random_bytes(8)), 0, 9));
}

function dayNameFromIndex($dayOfWeek)
{
    $days = [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];

    return $days[(int) $dayOfWeek] ?? 'Unknown';
}

function dayIndexFromName($dayName)
{
    $map = [
        'sunday' => 0,
        'monday' => 1,
        'tuesday' => 2,
        'wednesday' => 3,
        'thursday' => 4,
        'friday' => 5,
        'saturday' => 6,
    ];

    $key = strtolower(trim((string) $dayName));
    return $map[$key] ?? null;
}

function timeRangeLabel($startTime, $endTime)
{
    $start = strtotime((string) $startTime);
    $end = strtotime((string) $endTime);

    if ($start === false || $end === false) {
        return trim((string) $startTime . ' - ' . (string) $endTime);
    }

    return date('g:i A', $start) . ' - ' . date('g:i A', $end);
}

function normalizeTimeForDb($value)
{
    $raw = trim((string) $value);
    if ($raw === '') {
        return null;
    }

    $timestamp = strtotime($raw);
    if ($timestamp === false) {
        return null;
    }

    return date('H:i:s', $timestamp);
}

function resolveScheduleTable($conn)
{
    $candidates = ['doctor_schedules', 'schedules'];
    foreach ($candidates as $table) {
        $escaped = $conn->real_escape_string($table);
        $query = "SHOW TABLES LIKE '{$escaped}'";
        $result = $conn->query($query);
        if ($result && $result->num_rows > 0) {
            return $table;
        }
    }

    return null;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $conn = getDbConnection();

    try {
        $doctorSql = '
            SELECT
                d.doctor_id,
                d.user_id,
                d.license_no,
                d.full_name,
                d.phone,
                d.email,
                d.department,
                d.room,
                d.is_active,
                d.created_at,
                d.updated_at,
                u.first_name,
                u.last_name
            FROM doctors d
            LEFT JOIN users u ON u.user_id = d.user_id
            ORDER BY d.created_at DESC
        ';

        $doctorResult = $conn->query($doctorSql);
        $scheduleMap = [];

        $scheduleTable = resolveScheduleTable($conn);
        if ($scheduleTable !== null) {
            $scheduleSql = "
                SELECT
                    schedule_id,
                    doctor_id,
                    day_of_week,
                    start_time,
                    end_time,
                    slot_minutes,
                    is_active
                FROM {$scheduleTable}
                ORDER BY day_of_week ASC, start_time ASC
            ";

            $scheduleResult = $conn->query($scheduleSql);
            if ($scheduleResult) {
                while ($schedule = $scheduleResult->fetch_assoc()) {
                    $doctorId = $schedule['doctor_id'];
                    if (!isset($scheduleMap[$doctorId])) {
                        $scheduleMap[$doctorId] = [];
                    }

                    $scheduleMap[$doctorId][] = [
                        'scheduleId' => $schedule['schedule_id'],
                        'day' => dayNameFromIndex($schedule['day_of_week']),
                        'time' => timeRangeLabel($schedule['start_time'], $schedule['end_time']),
                        'slotMinutes' => (int) $schedule['slot_minutes'],
                        'isActive' => (int) $schedule['is_active'] === 1,
                    ];
                }
            }
        }

        $doctors = [];
        if ($doctorResult) {
            while ($row = $doctorResult->fetch_assoc()) {
                $doctorSchedules = $scheduleMap[$row['doctor_id']] ?? [];
                $primarySchedule = $doctorSchedules[0] ?? null;
                $fullName = trim((string) ($row['full_name'] ?: trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''))));

                $doctors[] = [
                    'doctorId' => $row['doctor_id'],
                    'userId' => $row['user_id'],
                    'name' => $fullName !== '' ? $fullName : 'Unknown Doctor',
                    'email' => $row['email'] ?? '',
                    'phone' => $row['phone'] ?? '',
                    'license' => $row['license_no'] ?? '',
                    'specialty' => $row['department'] ?? '',
                    'room' => $row['room'] ?? '',
                    'status' => ((int) $row['is_active'] === 1) ? 'Active' : 'Inactive',
                    'day' => $primarySchedule['day'] ?? 'N/A',
                    'start' => $primarySchedule ? explode(' - ', $primarySchedule['time'])[0] : 'N/A',
                    'end' => $primarySchedule ? explode(' - ', $primarySchedule['time'])[1] : 'N/A',
                    'slot' => $primarySchedule['slotMinutes'] ?? 30,
                    'schedules' => $doctorSchedules,
                ];
            }
        }

        echo json_encode([
            'success' => true,
            'doctors' => $doctors,
        ]);
    } catch (Throwable $error) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to load doctors',
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

$doctorId = trim((string) ($input['doctorId'] ?? ''));
$userId = trim((string) ($input['userId'] ?? ''));
$name = trim((string) ($input['name'] ?? ''));
$license = trim((string) ($input['license'] ?? ''));
$department = trim((string) ($input['department'] ?? ''));
$room = trim((string) ($input['room'] ?? ''));
$phone = trim((string) ($input['phone'] ?? ''));
$email = trim((string) ($input['email'] ?? ''));
$status = strtoupper(trim((string) ($input['status'] ?? 'ACTIVE')));
$schedules = $input['schedules'] ?? null;

$singleSchedule = null;
if (
    isset($input['day']) ||
    isset($input['startTime']) ||
    isset($input['endTime']) ||
    isset($input['slot']) ||
    isset($input['slotMinutes'])
) {
    $singleSchedule = [
        'day' => $input['day'] ?? null,
        'start' => $input['startTime'] ?? null,
        'end' => $input['endTime'] ?? null,
        'slotMinutes' => (int) ($input['slotMinutes'] ?? $input['slot'] ?? 30),
        'isActive' => strtoupper((string) ($input['scheduleStatus'] ?? $input['status'] ?? 'ACTIVE')) !== 'INACTIVE',
    ];
}

if (!is_array($schedules) && $singleSchedule !== null) {
    $schedules = [$singleSchedule];
}

$requiresDoctorSave = ($name !== '' || $department !== '' || $phone !== '' || $email !== '');
if ($requiresDoctorSave && ($name === '' || $department === '' || $phone === '' || $email === '')) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'name, department, phone, and email are required',
    ]);
    exit;
}

$isActive = $status === 'INACTIVE' ? 0 : 1;

$conn = getDbConnection();

try {
    $conn->begin_transaction();

    if ($doctorId === '' && $userId !== '') {
        $doctorByUserStmt = $conn->prepare('SELECT doctor_id FROM doctors WHERE user_id = ? LIMIT 1');
        if ($doctorByUserStmt) {
            $doctorByUserStmt->bind_param('s', $userId);
            $doctorByUserStmt->execute();
            $doctorByUserResult = $doctorByUserStmt->get_result();
            $doctorByUserRow = $doctorByUserResult ? $doctorByUserResult->fetch_assoc() : null;
            $doctorByUserStmt->close();
            if ($doctorByUserRow) {
                $doctorId = $doctorByUserRow['doctor_id'];
            }
        }
    }

    $savedDoctorId = $doctorId;
    if ($requiresDoctorSave) {
        if ($doctorId !== '') {
            $sql = '
                UPDATE doctors
                SET
                    user_id = CASE WHEN ? <> "" THEN ? ELSE user_id END,
                    license_no = ?,
                    full_name = ?,
                    phone = ?,
                    email = ?,
                    department = ?,
                    room = ?,
                    is_active = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE doctor_id = ?
            ';
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception('Failed to prepare doctor update: ' . $conn->error);
            }

            $stmt->bind_param('ssssssssis', $userId, $userId, $license, $name, $phone, $email, $department, $room, $isActive, $doctorId);
            $stmt->execute();
            $stmt->close();

            $savedDoctorId = $doctorId;
        } else {
            $savedDoctorId = generateId('D');
            $sql = '
                INSERT INTO doctors (doctor_id, user_id, license_no, full_name, phone, email, department, room, is_active)
                VALUES (?, NULLIF(?, ""), ?, ?, ?, ?, ?, ?, ?)
            ';
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception('Failed to prepare doctor insert: ' . $conn->error);
            }

            $stmt->bind_param('ssssssssi', $savedDoctorId, $userId, $license, $name, $phone, $email, $department, $room, $isActive);
            $stmt->execute();
            $stmt->close();
        }
    } elseif ($savedDoctorId === '' && $userId !== '') {
        $doctorByUserStmt = $conn->prepare('SELECT doctor_id FROM doctors WHERE user_id = ? LIMIT 1');
        if ($doctorByUserStmt) {
            $doctorByUserStmt->bind_param('s', $userId);
            $doctorByUserStmt->execute();
            $doctorByUserResult = $doctorByUserStmt->get_result();
            $doctorByUserRow = $doctorByUserResult ? $doctorByUserResult->fetch_assoc() : null;
            $doctorByUserStmt->close();
            if ($doctorByUserRow) {
                $savedDoctorId = $doctorByUserRow['doctor_id'];
            }
        }
    }

    if ($savedDoctorId === '' && $userId !== '' && is_array($schedules)) {
        $profileStmt = $conn->prepare('SELECT first_name, last_name, email, phone FROM users WHERE user_id = ? LIMIT 1');
        if ($profileStmt) {
            $profileStmt->bind_param('s', $userId);
            $profileStmt->execute();
            $profileResult = $profileStmt->get_result();
            $profileRow = $profileResult ? $profileResult->fetch_assoc() : null;
            $profileStmt->close();

            if ($profileRow) {
                $savedDoctorId = generateId('D');
                $generatedName = trim((string) (($profileRow['first_name'] ?? '') . ' ' . ($profileRow['last_name'] ?? '')));
                if ($generatedName === '') {
                    $generatedName = 'Unknown Doctor';
                }

                $generatedEmail = trim((string) ($profileRow['email'] ?? ''));
                $generatedPhone = trim((string) ($profileRow['phone'] ?? ''));
                $generatedDepartment = $department !== '' ? $department : 'General';
                $generatedRoom = $room;
                $generatedLicense = $license;

                $insertFallbackDoctorSql = '
                    INSERT INTO doctors (doctor_id, user_id, license_no, full_name, phone, email, department, room, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ';
                $insertFallbackDoctorStmt = $conn->prepare($insertFallbackDoctorSql);
                if (!$insertFallbackDoctorStmt) {
                    throw new Exception('Failed to prepare fallback doctor insert: ' . $conn->error);
                }

                $insertFallbackDoctorStmt->bind_param(
                    'ssssssssi',
                    $savedDoctorId,
                    $userId,
                    $generatedLicense,
                    $generatedName,
                    $generatedPhone,
                    $generatedEmail,
                    $generatedDepartment,
                    $generatedRoom,
                    $isActive
                );
                $insertFallbackDoctorStmt->execute();
                $insertFallbackDoctorStmt->close();
            }
        }
    }

    $savedSchedules = false;
    $scheduleTable = resolveScheduleTable($conn);
    if ($savedDoctorId !== '' && $scheduleTable !== null && is_array($schedules)) {
        $deleteSql = "DELETE FROM {$scheduleTable} WHERE doctor_id = ?";
        $deleteStmt = $conn->prepare($deleteSql);
        if (!$deleteStmt) {
            throw new Exception('Failed to prepare schedule delete: ' . $conn->error);
        }
        $deleteStmt->bind_param('s', $savedDoctorId);
        $deleteStmt->execute();
        $deleteStmt->close();

        $insertSql = "
            INSERT INTO {$scheduleTable}
                (schedule_id, doctor_id, day_of_week, start_time, end_time, slot_minutes, is_active)
            VALUES
                (?, ?, ?, ?, ?, ?, ?)
        ";
        $insertStmt = $conn->prepare($insertSql);
        if (!$insertStmt) {
            throw new Exception('Failed to prepare schedule insert: ' . $conn->error);
        }

        foreach ($schedules as $schedule) {
            if (!is_array($schedule)) {
                continue;
            }

            $dayValue = $schedule['day'] ?? null;
            $startValue = $schedule['start'] ?? $schedule['startTime'] ?? null;
            $endValue = $schedule['end'] ?? $schedule['endTime'] ?? null;
            $slotValue = (int) ($schedule['slotMinutes'] ?? $schedule['slot'] ?? 30);
            if ($slotValue < 5 || $slotValue > 240) {
                $slotValue = 30;
            }

            $isActiveSchedule = $schedule['isActive'] ?? true;
            if (isset($schedule['status'])) {
                $isActiveSchedule = strtoupper((string) $schedule['status']) !== 'INACTIVE';
            }

            $dayIndex = is_numeric($dayValue) ? (int) $dayValue : dayIndexFromName($dayValue);
            if ($dayIndex === null) {
                continue;
            }

            $startTime = normalizeTimeForDb($startValue);
            $endTime = normalizeTimeForDb($endValue);
            if ($startTime === null || $endTime === null) {
                continue;
            }

            $scheduleId = trim((string) ($schedule['scheduleId'] ?? ''));
            if ($scheduleId === '') {
                $scheduleId = generateId('S');
            }

            $isActiveBit = $isActiveSchedule ? 1 : 0;
            $insertStmt->bind_param('ssissii', $scheduleId, $savedDoctorId, $dayIndex, $startTime, $endTime, $slotValue, $isActiveBit);
            $insertStmt->execute();
            $savedSchedules = true;
        }

        $insertStmt->close();
    }

    if (!$requiresDoctorSave && !$savedSchedules) {
        throw new Exception('No doctor or schedule data was provided');
    }

    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => $requiresDoctorSave
            ? ($doctorId !== '' ? 'Doctor updated successfully' : 'Doctor created successfully')
            : 'Schedule updated successfully',
        'doctor' => [
            'doctorId' => $savedDoctorId,
            'userId' => $userId,
            'name' => $name,
            'license' => $license,
            'specialty' => $department,
            'room' => $room,
            'phone' => $phone,
            'email' => $email,
            'status' => $isActive === 1 ? 'Active' : 'Inactive',
        ],
        'schedulesSaved' => $savedSchedules,
    ]);
} catch (Throwable $error) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save doctor',
        'error' => $error->getMessage(),
    ]);
}

$conn->close();

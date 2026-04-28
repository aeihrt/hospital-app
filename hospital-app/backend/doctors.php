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

    if ($start === false || $end === false) {
        return trim($startTime . ' - ' . $endTime);
    }

    return date('g:i A', $start) . ' - ' . date('g:i A', $end);
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

        $doctors = [];
        if ($doctorResult) {
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

$doctorId = trim($input['doctorId'] ?? '');
$name = trim($input['name'] ?? '');
$license = trim($input['license'] ?? '');
$department = trim($input['department'] ?? '');
$room = trim($input['room'] ?? '');
$phone = trim($input['phone'] ?? '');
$email = trim($input['email'] ?? '');
$status = strtoupper(trim($input['status'] ?? 'ACTIVE'));

if ($name === '' || $department === '' || $phone === '' || $email === '') {
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
    if ($doctorId !== '') {
        $sql = '
            UPDATE doctors
            SET license_no = ?, full_name = ?, phone = ?, email = ?, department = ?, room = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE doctor_id = ?
        ';
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Failed to prepare doctor update: ' . $conn->error);
        }

        $stmt->bind_param('ssssssis', $license, $name, $phone, $email, $department, $room, $isActive, $doctorId);
        $stmt->execute();
        $stmt->close();

        $savedDoctorId = $doctorId;
    } else {
        $savedDoctorId = generateId('D');
        $sql = '
            INSERT INTO doctors (doctor_id, license_no, full_name, phone, email, department, room, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ';
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Failed to prepare doctor insert: ' . $conn->error);
        }

        $stmt->bind_param('sssssssi', $savedDoctorId, $license, $name, $phone, $email, $department, $room, $isActive);
        $stmt->execute();
        $stmt->close();
    }

    echo json_encode([
        'success' => true,
        'message' => $doctorId !== '' ? 'Doctor updated successfully' : 'Doctor created successfully',
        'doctor' => [
            'doctorId' => $savedDoctorId,
            'name' => $name,
            'license' => $license,
            'specialty' => $department,
            'room' => $room,
            'phone' => $phone,
            'email' => $email,
            'status' => $isActive === 1 ? 'Active' : 'Inactive',
        ],
    ]);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save doctor',
        'error' => $error->getMessage(),
    ]);
}

$conn->close();
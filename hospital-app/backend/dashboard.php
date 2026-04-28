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

function formatAppointmentRow(array $row): array
{
    $startTimestamp = strtotime($row['appointment_start']);

    return [
        'appointmentId' => $row['appointment_id'],
        'patient' => $row['patient_name'] ?: 'Unknown patient',
        'doctor' => $row['doctor_name'] ?: 'Unknown doctor',
        'department' => $row['department'] ?: 'General',
        'day' => $startTimestamp ? date('M j, Y', $startTimestamp) : $row['appointment_start'],
        'time' => $startTimestamp ? strtolower(date('g:ia', $startTimestamp)) : $row['appointment_start'],
        'status' => $row['status'],
        'bookedBy' => $row['created_by_role'] ?: 'System',
    ];
}

$conn = getDbConnection();

try {
    $countsSql = [
        'totalUsers' => 'SELECT COUNT(*) AS total FROM users',
        'totalDoctors' => 'SELECT COUNT(*) AS total FROM doctors',
        'totalPatients' => 'SELECT COUNT(*) AS total FROM patients',
        'totalAppointments' => 'SELECT COUNT(*) AS total FROM appointments',
    ];

    $counts = [];
    foreach ($countsSql as $key => $sql) {
        $result = $conn->query($sql);
        $row = $result ? $result->fetch_assoc() : null;
        $counts[$key] = (int) ($row['total'] ?? 0);
    }

    $statusResult = $conn->query('SELECT status, COUNT(*) AS total FROM appointments GROUP BY status');
    $statusCounts = [];
    if ($statusResult) {
        while ($row = $statusResult->fetch_assoc()) {
            $statusCounts[$row['status']] = (int) $row['total'];
        }
    }

    $appointmentsSql = '
        SELECT
            a.appointment_id,
            a.appointment_start,
            a.status,
            a.reason,
            d.full_name AS doctor_name,
            d.department,
            CONCAT(COALESCE(u.first_name, ""), CASE WHEN COALESCE(u.last_name, "") = "" THEN "" ELSE CONCAT(" ", u.last_name) END) AS patient_name,
            CASE
                WHEN cb.user_id IS NULL THEN NULL
                WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = cb.user_id AND ur.role_id = "R001") THEN "Admin"
                WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = cb.user_id AND ur.role_id = "R002") THEN "Doctor"
                WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = cb.user_id AND ur.role_id = "R003") THEN "Patient"
                ELSE NULL
            END AS created_by_role
        FROM appointments a
        INNER JOIN patients p ON p.patient_id = a.patient_id
        INNER JOIN users u ON u.user_id = p.user_id
        INNER JOIN doctors d ON d.doctor_id = a.doctor_id
        LEFT JOIN users cb ON cb.user_id = a.created_by
        ORDER BY a.appointment_start DESC
        LIMIT 6
    ';

    $recentAppointments = [];
    $result = $conn->query($appointmentsSql);
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $recentAppointments[] = formatAppointmentRow($row);
        }
    }

    echo json_encode([
        'success' => true,
        'summary' => $counts,
        'statusCounts' => $statusCounts,
        'recentAppointments' => $recentAppointments,
    ]);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load dashboard data',
        'error' => $error->getMessage(),
    ]);
}

$conn->close();
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

$action        = trim($input['action'] ?? '');
$appointmentId = trim($input['appointmentId'] ?? '');

if ($action === '' || $appointmentId === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'action and appointmentId are required']);
    exit;
}

$conn = getDbConnection();

if ($action === 'edit') {
    $date   = trim($input['date'] ?? '');
    $time   = trim($input['time'] ?? '');
    $reason = trim($input['reason'] ?? '');
    $slotMinutes = max(5, min(240, (int) ($input['slotMinutes'] ?? 30)));

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !preg_match('/^\d{2}:\d{2}$/', $time)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid date or time format']);
        exit;
    }

    $startTimestamp = strtotime($date . ' ' . $time . ':00');
    if ($startTimestamp === false) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unable to parse date and time']);
        exit;
    }

    $appointmentStart = date('Y-m-d H:i:s', $startTimestamp);
    $appointmentEnd   = date('Y-m-d H:i:s', strtotime('+' . $slotMinutes . ' minutes', $startTimestamp));
    $reasonValue      = $reason === '' ? null : $reason;

    try {
        $stmt = $conn->prepare('UPDATE appointments SET appointment_start = ?, appointment_end = ?, reason = ?, updated_at = CURRENT_TIMESTAMP WHERE appointment_id = ?');
        $stmt->bind_param('ssss', $appointmentStart, $appointmentEnd, $reasonValue, $appointmentId);
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            'success' => true,
            'message' => 'Appointment updated',
            'date'    => date('F j, Y', $startTimestamp),
            'time'    => strtolower(date('g:ia', $startTimestamp)),
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update appointment']);
    }

} elseif ($action === 'update_status') {
    $status = strtoupper(trim($input['status'] ?? ''));
    $allowed = ['BOOKED', 'COMPLETED', 'CANCELED', 'NO_SHOW'];

    if (!in_array($status, $allowed, true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid status value']);
        exit;
    }

    try {
        $stmt = $conn->prepare('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE appointment_id = ?');
        $stmt->bind_param('ss', $status, $appointmentId);
        $stmt->execute();
        $stmt->close();

        echo json_encode(['success' => true, 'message' => 'Status updated', 'newStatus' => $status]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update status']);
    }

} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

$conn->close();

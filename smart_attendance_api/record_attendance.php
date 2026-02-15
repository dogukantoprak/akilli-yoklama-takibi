<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['session_id', 'student_id']);

$sessionId = (int) $data['session_id'];
$studentId = (int) $data['student_id'];
$deviceId = isset($data['device_id']) ? (int) $data['device_id'] : null;
$confidence = isset($data['confidence']) ? (float) $data['confidence'] : null;

if ($sessionId <= 0 || $studentId <= 0) {
    json_response(['ok' => false, 'error' => 'Invalid payload'], 400);
}

try {
    $db = get_db();
    $stmt = $db->prepare(
        'INSERT INTO attendance_records (session_id, student_id, status) ' .
        'VALUES (:session_id, :student_id, :status) ' .
        'ON DUPLICATE KEY UPDATE status = :status, checked_at = CURRENT_TIMESTAMP',
    );
    $stmt->execute([
        'session_id' => $sessionId,
        'student_id' => $studentId,
        'status' => 'present',
    ]);

    $logStmt = $db->prepare(
        'INSERT INTO attendance_scan_logs (device_id, session_id, student_id, scan_result, reason) ' .
        'VALUES (:device_id, :session_id, :student_id, :scan_result, :reason)',
    );
    $logStmt->execute([
        'device_id' => $deviceId,
        'session_id' => $sessionId,
        'student_id' => $studentId,
        'scan_result' => 'success',
        'reason' => $confidence !== null ? 'confidence:' . $confidence : null,
    ]);

    json_response(['ok' => true]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Record failed'], 500);
}

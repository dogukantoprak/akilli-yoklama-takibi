<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['session_id', 'scan_result']);

$sessionId = (int) $data['session_id'];
$deviceId = isset($data['device_id']) ? (int) $data['device_id'] : null;
$studentId = isset($data['student_id']) ? (int) $data['student_id'] : null;
$scanResult = normalize_string($data['scan_result']);
$reason = normalize_string($data['reason'] ?? '');

if ($sessionId <= 0 || !in_array($scanResult, ['success', 'fail'], true)) {
    json_response(['ok' => false, 'error' => 'Invalid payload'], 400);
}

try {
    $db = get_db();
    $stmt = $db->prepare(
        'INSERT INTO attendance_scan_logs (device_id, session_id, student_id, scan_result, reason) ' .
        'VALUES (:device_id, :session_id, :student_id, :scan_result, :reason)',
    );
    $stmt->execute([
        'device_id' => $deviceId,
        'session_id' => $sessionId,
        'student_id' => $studentId ?: null,
        'scan_result' => $scanResult,
        'reason' => $reason !== '' ? $reason : null,
    ]);

    json_response(['ok' => true]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Log failed'], 500);
}

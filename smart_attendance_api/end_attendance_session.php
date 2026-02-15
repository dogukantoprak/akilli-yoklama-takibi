<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['session_id']);

$sessionId = (int) $data['session_id'];
if ($sessionId <= 0) {
    json_response(['ok' => false, 'error' => 'Invalid payload'], 400);
}

try {
    $db = get_db();
    $sessionStmt = $db->prepare('SELECT course_id, start_time FROM attendance_sessions WHERE id = :id LIMIT 1');
    $sessionStmt->execute(['id' => $sessionId]);
    $session = $sessionStmt->fetch();
    if (!$session) {
        json_response(['ok' => false, 'error' => 'Session not found'], 404);
    }

    $endTime = (new DateTime())->format('H:i:s');
    $duration = null;
    if (!empty($session['start_time'])) {
        $start = DateTime::createFromFormat('H:i:s', $session['start_time']);
        if ($start) {
            $duration = (int) round((time() - $start->getTimestamp()) / 60);
        }
    }

    $updateStmt = $db->prepare(
        'UPDATE attendance_sessions SET status = :status, end_time = :end_time, duration = COALESCE(:duration, duration) WHERE id = :id',
    );
    $updateStmt->execute([
        'status' => 'tamamlandi',
        'end_time' => $endTime,
        'duration' => $duration,
        'id' => $sessionId,
    ]);

    $insertAbsentStmt = $db->prepare(
        'INSERT INTO attendance_records (session_id, student_id, status) ' .
        'SELECT :session_id, ce.student_id, "absent" ' .
        'FROM course_enrollments ce ' .
        'LEFT JOIN attendance_records ar ON ar.session_id = :session_id AND ar.student_id = ce.student_id ' .
        'WHERE ce.course_id = :course_id AND ar.id IS NULL',
    );
    $insertAbsentStmt->execute([
        'session_id' => $sessionId,
        'course_id' => $session['course_id'],
    ]);

    json_response(['ok' => true]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'End session failed'], 500);
}

<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['course_id', 'session_date', 'start_time']);

$courseId = (int) $data['course_id'];
$sessionDate = normalize_string($data['session_date']);
$startTime = normalize_string($data['start_time']);
$duration = isset($data['duration']) ? (int) $data['duration'] : 50;

if ($courseId <= 0 || $sessionDate === '' || $startTime === '') {
    json_response(['ok' => false, 'error' => 'Invalid payload'], 400);
}

try {
    $db = get_db();
    $courseStmt = $db->prepare('SELECT teacher_id FROM courses WHERE id = :id LIMIT 1');
    $courseStmt->execute(['id' => $courseId]);
    $course = $courseStmt->fetch();
    if (!$course || !$course['teacher_id']) {
        json_response(['ok' => false, 'error' => 'Teacher not assigned'], 400);
    }

    $endTime = null;
    $startDateTime = DateTime::createFromFormat('H:i', $startTime);
    if ($startDateTime && $duration > 0) {
        $startDateTime->modify('+' . $duration . ' minutes');
        $endTime = $startDateTime->format('H:i:s');
    }

    $stmt = $db->prepare(
        'INSERT INTO attendance_sessions (course_id, teacher_id, session_date, start_time, end_time, duration, status) ' .
        'VALUES (:course_id, :teacher_id, :session_date, :start_time, :end_time, :duration, :status)',
    );
    $stmt->execute([
        'course_id' => $courseId,
        'teacher_id' => (int) $course['teacher_id'],
        'session_date' => $sessionDate,
        'start_time' => $startTime,
        'end_time' => $endTime,
        'duration' => $duration,
        'status' => 'aktif',
    ]);
    $sessionId = (int) $db->lastInsertId();

    json_response([
        'ok' => true,
        'session' => [
            'id' => $sessionId,
            'course_id' => $courseId,
            'session_date' => $sessionDate,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'duration' => $duration,
            'status' => 'aktif',
        ],
    ]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Create session failed'], 500);
}

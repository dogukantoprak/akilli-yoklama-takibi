<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['student_id', 'course_codes']);

$studentId = (int) $data['student_id'];
$courseCodes = is_array($data['course_codes']) ? $data['course_codes'] : [];

if ($studentId <= 0 || count($courseCodes) === 0) {
    json_response(['ok' => false, 'error' => 'Invalid payload'], 400);
}

try {
    $db = get_db();
    $courseStmt = $db->prepare('SELECT id FROM courses WHERE code = :code LIMIT 1');
    $insertStmt = $db->prepare(
        'INSERT IGNORE INTO course_enrollments (course_id, student_id) VALUES (:course_id, :student_id)',
    );

    foreach ($courseCodes as $code) {
        $courseStmt->execute(['code' => $code]);
        $course = $courseStmt->fetch();
        if (!$course) {
            continue;
        }
        $insertStmt->execute([
            'course_id' => $course['id'],
            'student_id' => $studentId,
        ]);
    }

    json_response(['ok' => true]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Assignment failed'], 500);
}

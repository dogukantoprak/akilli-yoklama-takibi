<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['student_id', 'course_code']);

$studentId = (int) $data['student_id'];
$courseCode = normalize_string($data['course_code']);

if ($studentId <= 0 || $courseCode === '') {
    json_response(['ok' => false, 'error' => 'Invalid payload'], 400);
}

try {
    $db = get_db();
    $courseStmt = $db->prepare('SELECT id FROM courses WHERE code = :code LIMIT 1');
    $courseStmt->execute(['code' => $courseCode]);
    $course = $courseStmt->fetch();
    if (!$course) {
        json_response(['ok' => false, 'error' => 'Course not found'], 404);
    }

    $deleteStmt = $db->prepare(
        'DELETE FROM course_enrollments WHERE course_id = :course_id AND student_id = :student_id',
    );
    $deleteStmt->execute([
        'course_id' => $course['id'],
        'student_id' => $studentId,
    ]);

    json_response(['ok' => true]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Remove failed'], 500);
}

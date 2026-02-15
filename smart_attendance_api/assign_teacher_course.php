<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['teacher_id', 'course_code']);

$teacherId = (int) $data['teacher_id'];
$courseCode = normalize_string($data['course_code']);

if ($teacherId <= 0 || $courseCode === '') {
    json_response(['ok' => false, 'error' => 'Invalid payload'], 400);
}

try {
    $db = get_db();
    $stmt = $db->prepare('UPDATE courses SET teacher_id = :tid WHERE code = :code');
    $stmt->execute([
        'tid' => $teacherId,
        'code' => $courseCode,
    ]);

    json_response(['ok' => true]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Assign failed'], 500);
}

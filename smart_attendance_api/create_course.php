<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['code', 'name']);

$code = strtoupper(normalize_string($data['code']));
$name = normalize_string($data['name']);
$teacherId = isset($data['teacher_id']) ? (int) $data['teacher_id'] : null;
$classroom = normalize_string($data['classroom'] ?? '');
$semester = normalize_string($data['semester'] ?? '');
$statusRaw = normalize_string($data['status'] ?? 'aktif');
$status = $statusRaw === 'aktif' ? 'aktif' : 'tamamlandi';

try {
    $db = get_db();
    $stmt = $db->prepare(
        'INSERT INTO courses (code, name, teacher_id, classroom, semester, status) ' .
        'VALUES (:code, :name, :teacher_id, :classroom, :semester, :status)',
    );
    $stmt->execute([
        'code' => $code,
        'name' => $name,
        'teacher_id' => $teacherId ?: null,
        'classroom' => $classroom !== '' ? $classroom : null,
        'semester' => $semester !== '' ? $semester : null,
        'status' => $status,
    ]);
    $courseId = (int) $db->lastInsertId();

    json_response([
        'ok' => true,
        'course' => [
            'id' => $courseId,
            'code' => $code,
            'name' => $name,
            'teacher_id' => $teacherId,
            'classroom' => $classroom,
            'semester' => $semester,
            'status' => $status,
        ],
    ]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Course creation failed'], 500);
}

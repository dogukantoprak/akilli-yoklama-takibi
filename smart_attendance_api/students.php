<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('GET');

$includeFace = isset($_GET['include_face']) && $_GET['include_face'] === '1';

try {
    $db = get_db();
    $stmt = $db->query(
        'SELECT s.id, s.student_no, s.department, s.class_level, s.phone, s.status, s.photo_url, s.face_encoding, ' .
        'u.full_name, u.email ' .
        'FROM students s LEFT JOIN users u ON s.user_id = u.id ' .
        'ORDER BY s.id DESC',
    );
    $rows = $stmt->fetchAll();

    $courseStmt = $db->prepare(
        'SELECT c.code, c.name FROM course_enrollments ce ' .
        'JOIN courses c ON ce.course_id = c.id WHERE ce.student_id = :sid',
    );

    $result = [];
    foreach ($rows as $row) {
        $courseStmt->execute(['sid' => $row['id']]);
        $courses = [];
        foreach ($courseStmt->fetchAll() as $course) {
            $courses[] = $course['code'] . ' - ' . $course['name'];
        }

        $item = [
            'id' => (int) $row['id'],
            'name' => $row['full_name'] ?? 'Student',
            'student_no' => $row['student_no'],
            'department' => $row['department'],
            'class_level' => $row['class_level'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'status' => $row['status'],
            'photo_url' => $row['photo_url'],
            'courses' => $courses,
        ];

        if ($includeFace) {
            $item['face_encoding'] = $row['face_encoding'];
        }

        $result[] = $item;
    }

    json_response($result);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Server error'], 500);
}

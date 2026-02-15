<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('GET');

$courseId = isset($_GET['course_id']) ? (int) $_GET['course_id'] : 0;
if ($courseId <= 0) {
    json_response(['ok' => false, 'error' => 'Missing course_id'], 400);
}

try {
    $db = get_db();
    $stmt = $db->prepare(
        'SELECT st.id, st.student_no, st.photo_url, st.face_encoding, u.full_name ' .
        'FROM course_enrollments ce ' .
        'JOIN students st ON ce.student_id = st.id ' .
        'LEFT JOIN users u ON st.user_id = u.id ' .
        'WHERE ce.course_id = :course_id',
    );
    $stmt->execute(['course_id' => $courseId]);
    $rows = $stmt->fetchAll();

    $result = [];
    foreach ($rows as $row) {
        $result[] = [
            'id' => (int) $row['id'],
            'student_no' => $row['student_no'],
            'name' => $row['full_name'] ?? 'Student',
            'photo_url' => $row['photo_url'],
            'face_encoding' => $row['face_encoding'],
        ];
    }

    json_response(['ok' => true, 'students' => $result]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Server error'], 500);
}

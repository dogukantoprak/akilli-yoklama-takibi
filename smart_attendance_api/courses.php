<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('GET');

try {
    $db = get_db();
    $stmt = $db->query(
        'SELECT c.id, c.code, c.name, c.teacher_id, c.classroom, c.semester, c.status, ' .
        'u.full_name AS instructor, ' .
        '(SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS students ' .
        'FROM courses c ' .
        'LEFT JOIN teachers t ON c.teacher_id = t.id ' .
        'LEFT JOIN users u ON t.user_id = u.id ' .
        'ORDER BY c.id DESC',
    );
    $rows = $stmt->fetchAll();

    $result = [];
    foreach ($rows as $row) {
        $result[] = [
            'id' => (int) $row['id'],
            'teacher_id' => $row['teacher_id'] ? (int) $row['teacher_id'] : null,
            'code' => $row['code'],
            'name' => $row['name'],
            'instructor' => $row['instructor'] ?: '-',
            'classroom' => $row['classroom'] ?: '-',
            'semester' => $row['semester'] ?: '-',
            'status' => $row['status'],
            'students' => (int) $row['students'],
        ];
    }

    json_response($result);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Server error'], 500);
}

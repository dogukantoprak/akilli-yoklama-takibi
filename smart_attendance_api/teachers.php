<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('GET');

try {
    $db = get_db();
    $stmt = $db->query(
        'SELECT t.id, t.title, t.department, t.phone, t.email, u.full_name, u.username ' .
        'FROM teachers t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.id DESC',
    );
    $rows = $stmt->fetchAll();

    $courseStmt = $db->prepare('SELECT code, name FROM courses WHERE teacher_id = :tid');

    $result = [];
    foreach ($rows as $row) {
        $courseStmt->execute(['tid' => $row['id']]);
        $courses = [];
        foreach ($courseStmt->fetchAll() as $course) {
            $courses[] = $course['code'] . ' - ' . $course['name'];
        }

        $result[] = [
            'id' => (int) $row['id'],
            'name' => $row['full_name'] ?? 'Teacher',
            'title' => $row['title'],
            'department' => $row['department'],
            'phone' => $row['phone'],
            'email' => $row['email'],
            'username' => $row['username'],
            'courses' => $courses,
        ];
    }

    json_response($result);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Server error'], 500);
}

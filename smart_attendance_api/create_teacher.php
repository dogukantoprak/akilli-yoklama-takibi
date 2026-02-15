<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['name', 'title', 'email']);

$name = normalize_string($data['name']);
$title = normalize_string($data['title']);
$department = normalize_string($data['department'] ?? '');
$phone = normalize_string($data['phone'] ?? '');
$email = normalize_string($data['email']);
$courseCodes = is_array($data['course_codes'] ?? null) ? $data['course_codes'] : [];

$defaultPassword = '123456';

try {
    $db = get_db();
    $db->beginTransaction();

    $userStmt = $db->prepare(
        'INSERT INTO users (username, password_hash, role, full_name, email) ' .
        'VALUES (:username, :password_hash, :role, :full_name, :email)',
    );
    $userStmt->execute([
        'username' => $email,
        'password_hash' => hash_password($defaultPassword),
        'role' => 'teacher',
        'full_name' => $name,
        'email' => $email,
    ]);
    $userId = (int) $db->lastInsertId();

    $teacherStmt = $db->prepare(
        'INSERT INTO teachers (user_id, title, department, phone, email) ' .
        'VALUES (:user_id, :title, :department, :phone, :email)',
    );
    $teacherStmt->execute([
        'user_id' => $userId,
        'title' => $title,
        'department' => $department !== '' ? $department : null,
        'phone' => $phone !== '' ? $phone : null,
        'email' => $email,
    ]);
    $teacherId = (int) $db->lastInsertId();

    if (count($courseCodes) > 0) {
        $courseStmt = $db->prepare('UPDATE courses SET teacher_id = :tid WHERE code = :code');
        foreach ($courseCodes as $code) {
            $courseStmt->execute([
                'tid' => $teacherId,
                'code' => $code,
            ]);
        }
    }

    $db->commit();

    json_response([
        'ok' => true,
        'teacher' => [
            'id' => $teacherId,
            'name' => $name,
            'title' => $title,
            'department' => $department,
            'phone' => $phone,
            'email' => $email,
            'default_password' => $defaultPassword,
        ],
    ]);
} catch (Throwable $e) {
    if ($db && $db->inTransaction()) {
        $db->rollBack();
    }
    json_response(['ok' => false, 'error' => 'Teacher creation failed'], 500);
}

<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['name', 'student_no']);

$name = normalize_string($data['name']);
$studentNo = normalize_string($data['student_no']);
$department = normalize_string($data['department'] ?? '');
$classLevel = normalize_string($data['class_level'] ?? '');
$email = normalize_string($data['email'] ?? '');
$phone = normalize_string($data['phone'] ?? '');
$status = normalize_string($data['status'] ?? 'aktif');
$faceEncoding = $data['face_encoding'] ?? null;

$defaultPassword = '123456';

try {
    $db = get_db();
    $db->beginTransaction();

    $userStmt = $db->prepare(
        'INSERT INTO users (username, password_hash, role, full_name, email) ' .
        'VALUES (:username, :password_hash, :role, :full_name, :email)',
    );
    $userStmt->execute([
        'username' => $studentNo,
        'password_hash' => hash_password($defaultPassword),
        'role' => 'student',
        'full_name' => $name,
        'email' => $email !== '' ? $email : null,
    ]);
    $userId = (int) $db->lastInsertId();

    $studentStmt = $db->prepare(
        'INSERT INTO students (user_id, student_no, department, class_level, phone, status, photo_url, face_encoding) ' .
        'VALUES (:user_id, :student_no, :department, :class_level, :phone, :status, :photo_url, :face_encoding)',
    );
    $studentStmt->execute([
        'user_id' => $userId,
        'student_no' => $studentNo,
        'department' => $department !== '' ? $department : null,
        'class_level' => $classLevel !== '' ? $classLevel : null,
        'phone' => $phone !== '' ? $phone : null,
        'status' => $status === 'pasif' ? 'pasif' : 'aktif',
        'photo_url' => null,
        'face_encoding' => $faceEncoding,
    ]);
    $studentId = (int) $db->lastInsertId();

    $photoUrl = null;
    if (!empty($request['files']['photo'])) {
        $file = $request['files']['photo'];
        $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $ext = 'jpg';
        }
        $fileName = 'student_' . $studentId . '.' . $ext;
        $config = get_config();
        $targetPath = $config['upload_dir'] . DIRECTORY_SEPARATOR . 'students' . DIRECTORY_SEPARATOR . $fileName;
        $saved = save_uploaded_file($file, $targetPath);
        if ($saved) {
            $photoUrl = rtrim($config['base_url'], '/') . '/uploads/students/' . $fileName;
            $updateStmt = $db->prepare('UPDATE students SET photo_url = :photo_url WHERE id = :id');
            $updateStmt->execute([
                'photo_url' => $photoUrl,
                'id' => $studentId,
            ]);
        }
    }

    $db->commit();

    json_response([
        'ok' => true,
        'student' => [
            'id' => $studentId,
            'name' => $name,
            'student_no' => $studentNo,
            'department' => $department,
            'class_level' => $classLevel,
            'email' => $email,
            'phone' => $phone,
            'status' => $status === 'pasif' ? 'pasif' : 'aktif',
            'photo_url' => $photoUrl,
            'default_password' => $defaultPassword,
        ],
    ]);
} catch (Throwable $e) {
    if ($db && $db->inTransaction()) {
        $db->rollBack();
    }
    json_response(['ok' => false, 'error' => 'Student creation failed'], 500);
}

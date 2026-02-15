<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['id', 'name', 'student_no']);

$studentId = (int) $data['id'];
if ($studentId <= 0) {
    json_response(['ok' => false, 'error' => 'Invalid payload'], 400);
}

$name = normalize_string($data['name']);
$studentNo = normalize_string($data['student_no']);
$department = normalize_string($data['department'] ?? '');
$classLevel = normalize_string($data['class_level'] ?? '');
$email = normalize_string($data['email'] ?? '');
$phone = normalize_string($data['phone'] ?? '');
$status = normalize_string($data['status'] ?? 'aktif');

$hasFaceEncoding = array_key_exists('face_encoding', $data);
$faceEncoding = $hasFaceEncoding ? $data['face_encoding'] : null;

if (!empty($request['files']['photo']) && (!$hasFaceEncoding || $faceEncoding === '')) {
    json_response(['ok' => false, 'error' => 'Face encoding missing'], 400);
}

try {
    $db = get_db();
    $db->beginTransaction();

    $studentStmt = $db->prepare('SELECT id, user_id, photo_url FROM students WHERE id = :id LIMIT 1');
    $studentStmt->execute(['id' => $studentId]);
    $student = $studentStmt->fetch();
    if (!$student) {
        json_response(['ok' => false, 'error' => 'Student not found'], 404);
    }

    $userStmt = $db->prepare(
        'UPDATE users SET username = :username, full_name = :full_name, email = :email WHERE id = :id',
    );
    $userStmt->execute([
        'username' => $studentNo,
        'full_name' => $name,
        'email' => $email !== '' ? $email : null,
        'id' => $student['user_id'],
    ]);

    if ($hasFaceEncoding) {
        $updateStudentStmt = $db->prepare(
            'UPDATE students SET student_no = :student_no, department = :department, class_level = :class_level, ' .
            'phone = :phone, status = :status, face_encoding = :face_encoding WHERE id = :id',
        );
        $updateStudentStmt->execute([
            'student_no' => $studentNo,
            'department' => $department !== '' ? $department : null,
            'class_level' => $classLevel !== '' ? $classLevel : null,
            'phone' => $phone !== '' ? $phone : null,
            'status' => $status === 'pasif' ? 'pasif' : 'aktif',
            'face_encoding' => $faceEncoding,
            'id' => $studentId,
        ]);
    } else {
        $updateStudentStmt = $db->prepare(
            'UPDATE students SET student_no = :student_no, department = :department, class_level = :class_level, ' .
            'phone = :phone, status = :status WHERE id = :id',
        );
        $updateStudentStmt->execute([
            'student_no' => $studentNo,
            'department' => $department !== '' ? $department : null,
            'class_level' => $classLevel !== '' ? $classLevel : null,
            'phone' => $phone !== '' ? $phone : null,
            'status' => $status === 'pasif' ? 'pasif' : 'aktif',
            'id' => $studentId,
        ]);
    }

    $photoUrl = $student['photo_url'] ?? null;
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
            $photoStmt = $db->prepare('UPDATE students SET photo_url = :photo_url WHERE id = :id');
            $photoStmt->execute([
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
        ],
    ]);
} catch (Throwable $e) {
    if ($db && $db->inTransaction()) {
        $db->rollBack();
    }
    json_response(['ok' => false, 'error' => 'Student update failed'], 500);
}

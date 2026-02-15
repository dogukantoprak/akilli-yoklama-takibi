<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];

require_fields($data, ['username', 'password']);

$username = normalize_string($data['username']);
$password = (string) $data['password'];

try {
    $db = get_db();
    $stmt = $db->prepare('SELECT * FROM users WHERE username = :u OR email = :u LIMIT 1');
    $stmt->execute(['u' => $username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_response(['ok' => false, 'error' => 'Invalid credentials'], 401);
    }

    $avatarUrl = null;
    if ($user['role'] === 'student') {
        $stmt = $db->prepare('SELECT photo_url FROM students WHERE user_id = :uid LIMIT 1');
        $stmt->execute(['uid' => $user['id']]);
        $student = $stmt->fetch();
        if ($student && !empty($student['photo_url'])) {
            $avatarUrl = $student['photo_url'];
        }
    }

    json_response([
        'ok' => true,
        'user' => [
            'username' => $user['username'],
            'role' => $user['role'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'avatar_url' => $avatarUrl,
        ],
    ]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Server error'], 500);
}

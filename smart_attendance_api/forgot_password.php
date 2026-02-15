<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('POST');

$request = get_request_data();
$data = $request['data'];
$action = $data['action'] ?? '';

if ($action === 'request') {
    require_fields($data, ['email']);
    $email = normalize_string($data['email']);

    try {
        $db = get_db();
        $stmt = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            json_response(['ok' => false, 'error' => 'Email not found'], 404);
        }

        $code = (string) random_int(100000, 999999);
        $expiresAt = (new DateTime('+15 minutes'))->format('Y-m-d H:i:s');
        $stmt = $db->prepare(
            'UPDATE users SET password_reset_code = :code, password_reset_expires = :expires WHERE id = :id',
        );
        $stmt->execute([
            'code' => $code,
            'expires' => $expiresAt,
            'id' => $user['id'],
        ]);

        json_response([
            'ok' => true,
            'message' => 'Reset code generated',
            'reset_code' => $code,
        ]);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'Server error'], 500);
    }
}

if ($action === 'reset') {
    require_fields($data, ['email', 'code', 'new_password']);
    $email = normalize_string($data['email']);
    $code = normalize_string($data['code']);
    $newPassword = (string) $data['new_password'];

    try {
        $db = get_db();
        $stmt = $db->prepare('SELECT id, password_reset_code, password_reset_expires FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !$user['password_reset_code']) {
            json_response(['ok' => false, 'error' => 'Reset not requested'], 400);
        }

        $expires = $user['password_reset_expires'];
        if ($user['password_reset_code'] !== $code || ($expires && strtotime($expires) < time())) {
            json_response(['ok' => false, 'error' => 'Invalid or expired code'], 400);
        }

        $hash = hash_password($newPassword);
        $stmt = $db->prepare(
            'UPDATE users SET password_hash = :hash, password_reset_code = NULL, password_reset_expires = NULL WHERE id = :id',
        );
        $stmt->execute([
            'hash' => $hash,
            'id' => $user['id'],
        ]);

        json_response(['ok' => true, 'message' => 'Password updated']);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'Server error'], 500);
    }
}

json_response(['ok' => false, 'error' => 'Invalid action'], 400);

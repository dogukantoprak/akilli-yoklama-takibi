<?php

function get_config(): array
{
    static $config = null;
    if ($config === null) {
        $config = require __DIR__ . DIRECTORY_SEPARATOR . 'config.php';
    }
    return $config;
}

function handle_cors(): void
{
    $config = get_config();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = $config['allowed_origins'] ?? [];

    if ($origin && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } else {
        header('Access-Control-Allow-Origin: *');
    }

    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function get_request_data(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return [
            'data' => is_array($decoded) ? $decoded : [],
            'files' => [],
        ];
    }

    return [
        'data' => $_POST ?? [],
        'files' => $_FILES ?? [],
    ];
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
    }
}

function require_fields(array $data, array $fields): void
{
    foreach ($fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            json_response(['ok' => false, 'error' => 'Missing field: ' . $field], 400);
        }
    }
}

function normalize_string(?string $value): string
{
    return trim((string) $value);
}

function save_uploaded_file(array $file, string $targetPath): ?string
{
    if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $targetDir = dirname($targetPath);
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        return null;
    }

    return $targetPath;
}

function hash_password(string $password): string
{
    return password_hash($password, PASSWORD_BCRYPT);
}

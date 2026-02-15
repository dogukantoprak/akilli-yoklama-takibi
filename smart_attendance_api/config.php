<?php

return [
    'db_host' => getenv('DB_HOST') ?: '127.0.0.1',
    'db_name' => getenv('DB_NAME') ?: 'smart_attendance',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') ?: '',
    'base_url' => getenv('API_BASE_URL') ?: 'http://localhost:8079/smart_attendance_api',
    'upload_dir' => __DIR__ . DIRECTORY_SEPARATOR . 'uploads',
    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:8079',
    ],
];

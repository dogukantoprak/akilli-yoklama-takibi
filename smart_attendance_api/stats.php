<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('GET');

try {
    $db = get_db();
    $studentCount = (int) $db->query('SELECT COUNT(*) FROM students')->fetchColumn();
    $courseCount = (int) $db->query('SELECT COUNT(*) FROM courses')->fetchColumn();
    $activeSessions = (int) $db
        ->query("SELECT COUNT(*) FROM attendance_sessions WHERE status = 'aktif'")
        ->fetchColumn();
    $activeDevices = (int) $db
        ->query("SELECT COUNT(*) FROM devices WHERE status = 'aktif'")
        ->fetchColumn();

    json_response([
        'ok' => true,
        'students' => $studentCount,
        'courses' => $courseCount,
        'active_sessions' => $activeSessions,
        'active_devices' => $activeDevices,
    ]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Server error'], 500);
}

<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('GET');

try {
    $db = get_db();
    $stmt = $db->query(
        'SELECT d.id, d.name, d.device_uid, d.device_type, d.ip_address, d.status, d.last_seen, ' .
        'COALESCE(d.classroom, c.name) AS classroom_name ' .
        'FROM devices d ' .
        'LEFT JOIN classrooms c ON d.classroom_id = c.id ' .
        'ORDER BY d.id DESC',
    );
    $rows = $stmt->fetchAll();

    $result = [];
    foreach ($rows as $row) {
        $result[] = [
            'id' => (int) $row['id'],
            'device_id' => $row['device_uid'] ?: ('DEV-' . $row['id']),
            'name' => $row['name'] ?: ('Device ' . $row['id']),
            'type' => $row['device_type'] ?: 'Tablet',
            'location' => $row['classroom_name'] ?: '-',
            'ip_address' => $row['ip_address'] ?: '-',
            'last_seen' => $row['last_seen'],
            'status' => $row['status'] === 'pasif' ? 'pasif' : 'aktif',
        ];
    }

    json_response($result);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Server error'], 500);
}

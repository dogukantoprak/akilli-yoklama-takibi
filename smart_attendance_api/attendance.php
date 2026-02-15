<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

require_method('GET');

try {
    $db = get_db();
    $stmt = $db->query(
        'SELECT s.id, s.course_id, s.session_date, s.start_time, s.end_time, s.duration, s.status, ' .
        'c.code AS course_code, c.name AS course_name, c.classroom, u.full_name AS instructor ' .
        'FROM attendance_sessions s ' .
        'JOIN courses c ON s.course_id = c.id ' .
        'LEFT JOIN teachers t ON c.teacher_id = t.id ' .
        'LEFT JOIN users u ON t.user_id = u.id ' .
        'ORDER BY s.id DESC',
    );
    $sessions = $stmt->fetchAll();

    $presentStmt = $db->prepare(
        'SELECT st.id AS student_id, u.full_name, st.photo_url FROM attendance_records ar ' .
        'JOIN students st ON ar.student_id = st.id ' .
        'LEFT JOIN users u ON st.user_id = u.id ' .
        'WHERE ar.session_id = :sid AND ar.status = "present"',
    );
    $absentStmt = $db->prepare(
        'SELECT st.id AS student_id, u.full_name, st.photo_url FROM attendance_records ar ' .
        'JOIN students st ON ar.student_id = st.id ' .
        'LEFT JOIN users u ON st.user_id = u.id ' .
        'WHERE ar.session_id = :sid AND ar.status = "absent"',
    );
    $rosterStmt = $db->prepare(
        'SELECT st.id, st.photo_url, u.full_name FROM course_enrollments ce ' .
        'JOIN students st ON ce.student_id = st.id ' .
        'LEFT JOIN users u ON st.user_id = u.id ' .
        'WHERE ce.course_id = :cid',
    );

    $result = [];
    foreach ($sessions as $session) {
        $presentStmt->execute(['sid' => $session['id']]);
        $presentRows = $presentStmt->fetchAll();

        $rosterStmt->execute(['cid' => $session['course_id']]);
        $rosterRows = $rosterStmt->fetchAll();
        $rosterById = [];
        foreach ($rosterRows as $row) {
            $rosterById[(int) $row['id']] = [
                'name' => $row['full_name'] ?? 'Student',
                'photo_url' => $row['photo_url'],
            ];
        }

        $presentList = [];
        $presentIds = [];
        foreach ($presentRows as $row) {
            $studentId = (int) $row['student_id'];
            if (!empty($rosterById) && !isset($rosterById[$studentId])) {
                continue;
            }
            $fallback = $rosterById[$studentId] ?? ['name' => 'Student', 'photo_url' => null];
            $presentList[] = [
                'name' => $row['full_name'] ?? $fallback['name'],
                'photo_url' => $row['photo_url'] ?? $fallback['photo_url'],
            ];
            $presentIds[$studentId] = true;
        }

        $absentList = [];
        if ($session['status'] === 'tamamlandi') {
            if (!empty($rosterById)) {
                foreach ($rosterById as $studentId => $student) {
                    if (!isset($presentIds[$studentId])) {
                        $absentList[] = [
                            'name' => $student['name'],
                            'photo_url' => $student['photo_url'],
                        ];
                    }
                }
            } else {
                $absentStmt->execute(['sid' => $session['id']]);
                foreach ($absentStmt->fetchAll() as $row) {
                    $absentList[] = [
                        'name' => $row['full_name'] ?? 'Student',
                        'photo_url' => $row['photo_url'],
                    ];
                }
            }
        }

        $result[] = [
            'id' => (int) $session['id'],
            'course_id' => (int) $session['course_id'],
            'course_code' => $session['course_code'],
            'course' => $session['course_name'],
            'date' => $session['session_date'],
            'time' => $session['start_time'] ? substr($session['start_time'], 0, 5) : '',
            'end_time' => $session['end_time'] ? substr($session['end_time'], 0, 5) : '',
            'duration' => $session['duration'] !== null ? (string) $session['duration'] : '',
            'classroom' => $session['classroom'],
            'instructor' => $session['instructor'],
            'attendees' => count($presentList),
            'absences' => count($absentList),
            'status' => $session['status'] === 'tamamlandi' ? 'Tamamlandi' : 'Devam Ediyor',
            'present' => $presentList,
            'absent' => $absentList,
        ];
    }

    json_response($result);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Server error'], 500);
}

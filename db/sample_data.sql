USE smart_attendance;

-- USERS
INSERT INTO users (username, email, password_hash, role)
VALUES
('admin', 'admin@university.edu', 'admin_hash', 'admin'),
('sinan', 'sinan@university.edu', 'sinan_hash', 'instructor');

-- INSTRUCTORS
INSERT INTO instructors (user_id, name, title, phone)
VALUES
(2, 'Prof. Dr. Sinan Güneş', 'Professor', '+90 555 000 00 00');

-- STUDENTS
INSERT INTO students (student_no, name, surname, department, class_name)
VALUES
('2021001', 'Ali', 'Yılmaz', 'Computer Engineering', '1'),
('2021002', 'Ayşe', 'Kara', 'Software Engineering', '1'),
('2021003', 'Mehmet', 'Demir', 'Computer Engineering', '2');

-- COURSES
INSERT INTO courses (course_code, course_name, instructor_id, day, hour, room_no)
VALUES
('CSE301', 'Operating Systems', 1, 'Mon', '09:00', 'B203'),
('CSE305', 'Software Validation', 1, 'Tue', '11:00', 'B204');

-- DEVICES
INSERT INTO devices (room_no, ip_address, camera_status, notes)
VALUES
('B203', '192.168.1.20', 'active', 'Main camera for OS course');

-- COURSE ENROLLMENTS
INSERT INTO course_enrollments (student_id, course_id, status)
VALUES
(1, 1, 'active'),
(2, 1, 'active'),
(3, 1, 'active');

-- ATTENDANCE SESSION
INSERT INTO attendance_sessions (course_id, device_id, session_date, start_time, end_time, total_students, present_students, status, created_by_user)
VALUES
(1, 1, '2025-11-15', '09:00', '10:00', 3, 2, 'completed', 2);

-- ATTENDANCE DETAILS
INSERT INTO attendance_details (attendance_id, student_id, status, confidence, recognized_at)
VALUES
(1, 1, 'Present', 0.95, '2025-11-15 09:05:00'),
(1, 2, 'Present', 0.92, '2025-11-15 09:06:30'),
(1, 3, 'Absent',  NULL, NULL);

-- Create database
CREATE DATABASE IF NOT EXISTS smart_attendance
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_attendance;

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    username       VARCHAR(64)  NOT NULL UNIQUE,
    email          VARCHAR(120) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           ENUM('admin','instructor') NOT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- INSTRUCTORS
-- =========================
CREATE TABLE instructors (
    instructor_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    name           VARCHAR(80) NOT NULL,
    title          VARCHAR(80),
    phone          VARCHAR(32),
    CONSTRAINT fk_instructors_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- =========================
-- STUDENTS
-- =========================
CREATE TABLE students (
    student_id     INT AUTO_INCREMENT PRIMARY KEY,
    student_no     VARCHAR(32)  NOT NULL UNIQUE,
    name           VARCHAR(80)  NOT NULL,
    surname        VARCHAR(80)  NOT NULL,
    department     VARCHAR(80),
    class_name     VARCHAR(40),
    face_photo_url VARCHAR(255),
    face_encoding  TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- COURSES
-- =========================
CREATE TABLE courses (
    course_id      INT AUTO_INCREMENT PRIMARY KEY,
    course_code    VARCHAR(32)  NOT NULL,
    course_name    VARCHAR(120) NOT NULL,
    instructor_id  INT,
    day            VARCHAR(16),
    hour           VARCHAR(16),
    room_no        VARCHAR(32),
    CONSTRAINT fk_courses_instructor
        FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id)
        ON DELETE SET NULL
);

-- =========================
-- DEVICES
-- =========================
CREATE TABLE devices (
    device_id      INT AUTO_INCREMENT PRIMARY KEY,
    room_no        VARCHAR(32),
    ip_address     VARCHAR(64),
    camera_status  ENUM('active','inactive','error') DEFAULT 'inactive',
    notes          VARCHAR(255)
);

-- =========================
-- COURSE ENROLLMENTS (N:N student-course)
-- =========================
CREATE TABLE course_enrollments (
    enrollment_id  INT AUTO_INCREMENT PRIMARY KEY,
    student_id     INT NOT NULL,
    course_id      INT NOT NULL,
    status         VARCHAR(16),
    enrolled_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_enroll_student
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_enroll_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE,
    CONSTRAINT uq_enroll UNIQUE (student_id, course_id)
);

-- =========================
-- ATTENDANCE SESSIONS
-- =========================
CREATE TABLE attendance_sessions (
    attendance_id    INT AUTO_INCREMENT PRIMARY KEY,
    course_id        INT NOT NULL,
    device_id        INT,
    session_date     DATE,
    start_time       VARCHAR(8),
    end_time         VARCHAR(8),
    total_students   INT,
    present_students INT,
    status           ENUM('scheduled','ongoing','completed','cancelled') DEFAULT 'scheduled',
    created_by_user  INT,
    CONSTRAINT fk_att_session_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_att_session_device
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_att_session_user
        FOREIGN KEY (created_by_user) REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- =========================
-- ATTENDANCE DETAILS
-- =========================
CREATE TABLE attendance_details (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id  INT NOT NULL,
    student_id     INT NOT NULL,
    status         ENUM('Present','Absent','Late','Excused') NOT NULL,
    confidence     FLOAT,
    recognized_at  DATETIME,
    CONSTRAINT fk_att_detail_session
        FOREIGN KEY (attendance_id) REFERENCES attendance_sessions(attendance_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_att_detail_student
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE
);

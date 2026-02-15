-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1
-- Üretim Zamanı: 28 Ara 2025, 14:15:50
-- Sunucu sürümü: 10.4.32-MariaDB
-- PHP Sürümü: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `smart_attendance`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `attendance_records`
--

CREATE TABLE `attendance_records` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `status` enum('present','absent') NOT NULL,
  `checked_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `attendance_records`
--

INSERT INTO `attendance_records` (`id`, `session_id`, `student_id`, `status`, `checked_at`) VALUES
(1, 1, 1, 'present', '2025-12-21 17:12:45'),
(2, 1, 2, 'absent', '2025-12-21 17:12:45'),
(3, 2, 1, 'present', '2025-12-21 17:12:45');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `attendance_scan_logs`
--

CREATE TABLE `attendance_scan_logs` (
  `id` int(11) NOT NULL,
  `device_id` int(11) DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `scan_result` enum('success','fail') NOT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `scanned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `attendance_sessions`
--

CREATE TABLE `attendance_sessions` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `device_id` int(11) DEFAULT NULL,
  `teacher_id` int(11) NOT NULL,
  `session_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `status` enum('aktif','tamamlandi') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `attendance_sessions`
--

INSERT INTO `attendance_sessions` (`id`, `course_id`, `device_id`, `teacher_id`, `session_date`, `start_time`, `end_time`, `duration`, `status`, `created_at`) VALUES
(1, 1, NULL, 2, '2025-01-05', '09:00:00', '09:50:00', 50, 'aktif', '2025-12-21 17:12:45'),
(2, 2, NULL, 1, '2025-01-06', '11:00:00', '11:50:00', 50, 'tamamlandi', '2025-12-21 17:12:45');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `device_id` int(11) DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `classrooms`
--

CREATE TABLE `classrooms` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `building` varchar(50) DEFAULT NULL,
  `floor` varchar(20) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `status` enum('aktif','pasif') DEFAULT 'aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `classroom` varchar(50) DEFAULT NULL,
  `semester` varchar(50) DEFAULT NULL,
  `status` enum('aktif','tamamlandi') DEFAULT 'aktif',
  `absence_limit` int(11) DEFAULT 3,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `courses`
--

INSERT INTO `courses` (`id`, `code`, `name`, `teacher_id`, `classroom`, `semester`, `status`, `absence_limit`, `created_at`) VALUES
(1, 'BM101', 'Bilgisayar Programlama I', 2, 'A-101', 'Guz 2024', 'aktif', 3, '2025-12-21 17:12:45'),
(2, 'BM102', 'Web Teknolojileri', 1, 'B-201', 'Guz 2024', 'aktif', 3, '2025-12-21 17:12:45'),
(3, 'BM255', 'Validation and Testing', 2, 'Ma-3', 'Güz 2025', 'aktif', 3, '2025-12-21 19:44:35');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `course_enrollments`
--

CREATE TABLE `course_enrollments` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `enrolled_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `course_enrollments`
--

INSERT INTO `course_enrollments` (`id`, `course_id`, `student_id`, `enrolled_at`) VALUES
(1, 1, 1, '2025-12-21 17:12:45'),
(2, 2, 1, '2025-12-21 17:12:45'),
(3, 2, 2, '2025-12-21 17:12:45');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `devices`
--

CREATE TABLE `devices` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `device_type` varchar(40) DEFAULT NULL,
  `classroom` varchar(50) DEFAULT NULL,
  `device_uid` varchar(100) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `status` enum('aktif','pasif') DEFAULT 'aktif',
  `last_seen` timestamp NULL DEFAULT NULL,
  `classroom_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `student_no` varchar(30) NOT NULL,
  `department` varchar(120) DEFAULT NULL,
  `class_level` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `status` enum('aktif','pasif') DEFAULT 'aktif',
  `photo_url` varchar(255) DEFAULT NULL,
  `face_encoding` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `students`
--

INSERT INTO `students` (`id`, `user_id`, `student_no`, `department`, `class_level`, `phone`, `status`, `photo_url`, `created_at`) VALUES
(1, 4, '20210001234', 'Bilgisayar Muhendisligi', '2. Sinif', '+90 555 333 33 33', 'aktif', NULL, '2025-12-21 17:12:45'),
(2, 5, '20210001235', 'Bilgisayar Muhendisligi', '2. Sinif', '+90 555 444 44 44', 'aktif', NULL, '2025-12-21 17:12:45'),
(4, 9, '220706000', 'yazılım müh', '', '5555555555', 'aktif', '', '2025-12-23 13:25:39');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `teachers`
--

CREATE TABLE `teachers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(80) DEFAULT NULL,
  `department` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `password_reset_code` varchar(20) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `teachers`
--

INSERT INTO `teachers` (`id`, `user_id`, `title`, `department`, `phone`, `email`, `created_at`) VALUES
(1, 2, 'Dr.', 'Bilgisayar Muhendisligi', '+90 555 111 11 11', 'ayse.kaya@uni.edu.tr', '2025-12-21 17:12:45'),
(2, 3, 'Prof. Dr.', 'Bilgisayar Muhendisligi', '+90 555 222 22 22', 'ahmet.yilmaz@uni.edu.tr', '2025-12-21 17:12:45'),
(3, 7, 'Doçent', 'Yazılım Mühendisliği', '05522088985', 'alim@gmail.com', '2025-12-21 19:46:47');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','teacher','student') NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `email` varchar(120) DEFAULT NULL,
  `password_reset_code` varchar(20) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `full_name`, `email`, `created_at`) VALUES
(1, 'admin', '$2y$10$06HbKRYvM9goFbwkDtVdB.DfxGtzLL9vZHBITGx2G0Xik20pNZyAG', 'admin', 'Admin Kullanici', 'admin@uni.edu.tr', '2025-12-21 17:12:45'),
(2, 'egitmen', '$2y$10$06HbKRYvM9goFbwkDtVdB.DfxGtzLL9vZHBITGx2G0Xik20pNZyAG', 'teacher', 'Dr. Ayse Kaya', 'ayse.kaya@uni.edu.tr', '2025-12-21 17:12:45'),
(3, 'ahmet', '$2y$10$06HbKRYvM9goFbwkDtVdB.DfxGtzLL9vZHBITGx2G0Xik20pNZyAG', 'teacher', 'Prof. Dr. Ahmet Yilmaz', 'ahmet.yilmaz@uni.edu.tr', '2025-12-21 17:12:45'),
(4, '20210001234', '$2y$10$06HbKRYvM9goFbwkDtVdB.DfxGtzLL9vZHBITGx2G0Xik20pNZyAG', 'student', 'Ahmet Yilmaz', 'ahmet.ogrenci@uni.edu.tr', '2025-12-21 17:12:45'),
(5, '20210001235', '$2y$10$06HbKRYvM9goFbwkDtVdB.DfxGtzLL9vZHBITGx2G0Xik20pNZyAG', 'student', 'Ayse Kaya', 'ayse.ogrenci@uni.edu.tr', '2025-12-21 17:12:45'),
(7, 'alim@gmail.com', '$2y$10$mQr459IeUQUtglEY/QtBW.glQ.rD09BiEke8FS2DeRQKkAm2HGcDW', 'teacher', 'Alim ALDEMİR', 'alim@gmail.com', '2025-12-21 19:46:47'),
(8, 'Emre', '$2y$10$5Dg28oz7dgzeNT3rAFSt3ulmhyQa5x3GZuWelFULWhMbhCuJudDv2', 'student', 'Emre KOÇ', 'emre@gmail.com', '2025-12-21 19:50:52'),
(9, '220706000', '$2y$10$OHSwQGq9S9HSqXykcUVi6u6kQgrqGfI/.wUI4K40Vp23QMHjud7Xe', 'student', 'Doğukan toprak', 'dogu@gmail.com', '2025-12-23 13:25:39');

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_session_student` (`session_id`,`student_id`),
  ADD KEY `fk_records_student` (`student_id`);

--
-- Tablo için indeksler `attendance_scan_logs`
--
ALTER TABLE `attendance_scan_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_scan_device` (`device_id`),
  ADD KEY `idx_scan_session` (`session_id`),
  ADD KEY `idx_scan_student` (`student_id`);

--
-- Tablo için indeksler `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sessions_course` (`course_id`),
  ADD KEY `fk_sessions_teacher` (`teacher_id`),
  ADD KEY `idx_sessions_device` (`device_id`);

--
-- Tablo için indeksler `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_device` (`device_id`);

--
-- Tablo için indeksler `classrooms`
--
ALTER TABLE `classrooms`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_courses_teacher` (`teacher_id`);

--
-- Tablo için indeksler `course_enrollments`
--
ALTER TABLE `course_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_course_student` (`course_id`,`student_id`),
  ADD KEY `fk_enroll_student` (`student_id`);

--
-- Tablo için indeksler `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `device_uid` (`device_uid`),
  ADD KEY `fk_devices_classroom` (`classroom_id`);

--
-- Tablo için indeksler `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_no` (`student_no`),
  ADD UNIQUE KEY `uq_students_user` (`user_id`);

--
-- Tablo için indeksler `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_teachers_user` (`user_id`);

--
-- Tablo için indeksler `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `attendance_records`
--
ALTER TABLE `attendance_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Tablo için AUTO_INCREMENT değeri `attendance_scan_logs`
--
ALTER TABLE `attendance_scan_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Tablo için AUTO_INCREMENT değeri `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `classrooms`
--
ALTER TABLE `classrooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Tablo için AUTO_INCREMENT değeri `course_enrollments`
--
ALTER TABLE `course_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Tablo için AUTO_INCREMENT değeri `devices`
--
ALTER TABLE `devices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Tablo için AUTO_INCREMENT değeri `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Tablo için AUTO_INCREMENT değeri `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD CONSTRAINT `attendance_records_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_records_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_records_session` FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_records_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `attendance_scan_logs`
--
ALTER TABLE `attendance_scan_logs`
  ADD CONSTRAINT `fk_scan_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_scan_session` FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_scan_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD CONSTRAINT `fk_sessions_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sessions_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sessions_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_courses_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `course_enrollments`
--
ALTER TABLE `course_enrollments`
  ADD CONSTRAINT `course_enrollments_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_enrollments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_enroll_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_enroll_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `devices`
--
ALTER TABLE `devices`
  ADD CONSTRAINT `fk_devices_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `teachers`
--
ALTER TABLE `teachers`
  ADD CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

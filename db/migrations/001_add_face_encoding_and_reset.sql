ALTER TABLE students
  ADD COLUMN face_encoding LONGTEXT NULL AFTER photo_url;

ALTER TABLE users
  ADD COLUMN password_reset_code VARCHAR(20) NULL AFTER email,
  ADD COLUMN password_reset_expires DATETIME NULL AFTER password_reset_code;

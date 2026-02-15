ALTER TABLE devices
  ADD COLUMN device_type VARCHAR(40) NULL AFTER name,
  ADD COLUMN ip_address VARCHAR(64) NULL AFTER device_uid;

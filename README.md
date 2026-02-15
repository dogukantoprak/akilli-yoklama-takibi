# Akilli Yoklama Takibi

## Requirements
- Node.js 18+
- XAMPP (MariaDB + PHP 8)

## Database
1) Import `db/smart_attendance.sql` in phpMyAdmin.
2) Run the migration:
   - `db/migrations/001_add_face_encoding_and_reset.sql`
   - `db/migrations/002_add_device_fields.sql`
3) (Optional) Reset and seed demo data:
   - `db/seed.sql`

## API (PHP)
Run a local PHP server so the API lives at:
`http://localhost:8079/smart_attendance_api`

Example (from repo root):
```
php -S localhost:8079 -t .
```

Edit `smart_attendance_api/config.php` if your DB credentials differ.

## Frontend
```
npm install
npm run dev
```

The app reads API base from `.env` (`VITE_API_BASE`).

## Face Recognition Models
Download the required models into `public/models/`.
See `public/models/README.txt` for the list.

## Default Passwords
Students and teachers created by admin use the default password `123456`.

# Report: revisi-master-docs-supabase-pgsql

- Tanggal: 26/08/2026
- Jam: 00:00
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

Revisi BRD/PRD/FSD: migrasi DB dari 2 file SQLite terpisah ke PostgreSQL di Supabase dengan arsitektur:

- 2 jenis schema: `logic` (kode, konfigurasi, form, desain app hasil generate) & `data` (data aplikasi user)
- Masing-masing dipecah jadi environment: `logic_dev`, `data_dev`, `logic_prod`, `data_prod`
- Push DEV → PROD = clone struktur DB saja
- Naming convention objek DB (table, stored proc/func, view, dll): `{8_digit_user_short_uuid}_{8digit_project_uuid}_{objek_db_name}`
- Isolasi ketat: user/kode tidak boleh mengakses objek milik user/project lain
- Auth: login wajib (Google auth dulu) untuk mapping user ↔ project
- Halaman baru: manage project

## Rencana Aksi

1. Baca BRD.MD, PRD.MD, FSD.MD penuh.
2. Identifikasi semua bagian yang menyebut SQLite / penyimpanan.
3. Revisi FSD (detail teknis DB, naming, RLS/isolasi, auth flow), PRD (fitur auth + manage project + push dev→prod), BRD (dampak bisnis: multi-tenant Supabase, akun Google).
4. Jaga konsistensi terminologi antar dokumen.
5. Ringkas perubahan per dokumen.

## Yang Telah Dilakukan

- Baca 3 dokumen (BRD, PRD, FSD) penuh.
- Edit pertama BRD.MD (tambah baris revision history v1.1.0) sudah dijalankan.
- User membatalkan → edit BRD.MD di-rollback persis ke kondisi awal.

## Status Akhir

Gagal/Dibatalkan. User membatalkan request revisi sebelum eksekusi penuh. Rollback selesai — `git status` pada `.opencode/documents/` bersih, ketiga dokumen kembali ke kondisi baseline (commit `2a5e6c9`). Tidak ada perubahan tersisa.

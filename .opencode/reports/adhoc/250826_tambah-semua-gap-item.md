# Report: Tambah Semua Gap Item ke Master Plan

- Tanggal: 25/08/2026
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

"oke tambahkan semua" — masukkan seluruh 13 item gap analisis (schema migration DEV→PROD, SQL guard, project cleanup, object_prefix impl, end-user access, form evolution, storage attachment, quota, DAL API contract, observability, backup, session lifecycle, realtime/kolaborasi/nanti) ke BRD/PRD/FSD.

## Rencana Aksi

1. BRD: tambah FR baru (Module 1, 2) + Module 7-9 baru + NFR operasional.
2. PRD: update daftar modules + tech stack.
3. FSD: extend §3.1, tambah §3.6-3.8, DDL pendukung, error codes baru.

## Yang Telah Dilakukan

- **BRD.MD** (→ v1.2.0): FR-AUT-03 (session lifecycle), FR-PRJ-04 (hard-delete & cleanup 30 hari grace period); FR-SEC-05 (SQL Guard); Module 7 Schema Evolution & Migration (FR-MIG-01..04); Module 8 Generated App Distribution & End-User Access (FR-DST-01..03); Module 9 Storage, Quota & Observability (FR-STO/FR-QTA/FR-OBS/FR-OPS); NFR-MNT-03 (kontrak API DAL formal) + NFR §5.4 Operations & Reliability.
- **PRD.MD** (→ v1.6.0): modules dirombak menjadi Module 1-10 — tambah session lifecycle, cleanup, SQL Guard, attachments, Module 7 Schema Evolution & Migration, Module 8 Distribution & End-User Access, Module 9 Quota/Observability/Backup; tech stack + Supabase Storage & Observability.
- **FSD.MD** (→ v1.2.0): §3.1.6 Session Lifecycle, §3.1.7 Hard-Delete & Cleanup Flow; §3.5.3 SQL Guard; §3.6 Schema Evolution & Migration Engine (diff algorithm, execution, rollback); §3.7 Generated App Distribution (modes PRIVATE/RESTRICTED/PUBLIC, end-user scope); §3.8 Storage/Quota/Observability/Backup; DDL: fix object_prefix via trigger + tabel baru `app_distributions`, `usage_counters`, `audit_logs`, `{prefix}_schema_snapshots`, `{prefix}_migration_history`; JSON schema + komponen `FileInput`; error codes baru ERR_SQL_008, ERR_QTA_009, ERR_MIG_010, ERR_DST_011.

## Status Akhir

Selesai. Seluruh 13 item gap dimasukkan lintas tiga dokumen dengan terminologi konsisten (SQL Guard, Structural Diff/Migration, End-User Access Scope, Usage Counters). Item "bisa nanti" (realtime sync, kolaborasi multi-user, template marketplace, i18n) sengaja tidak dimasukkan ke requirement — hanya disebut sebagai backlog potensial jika diminta.

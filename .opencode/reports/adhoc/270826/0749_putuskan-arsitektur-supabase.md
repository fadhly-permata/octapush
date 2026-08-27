# Report: putuskan-arsitektur-supabase

- Tanggal: 27/08/2026
- Jam: 07:49
- Request type: adhoc
- Status: Selesai

## Permintaan User

User memutuskan: "untuk database kita pake PostgreSQL di Supabase aja ya. untuk sisanya, kita tahan dulu sampe kita restart opencode."

## Rencana Aksi

1. Catat keputusan arsitektur sebagai ADR-001 di `docs/adr/` (format FSD §7.3: Konteks → Keputusan → Konsekuensi).
2. Sinkronkan `README.md` (masih Dual SQLite) ke Supabase PostgreSQL agar tidak ada konflik.
3. Tahan item lain (scaffold, dll.) sampai restart opencode.

## Yang Telah Dilakukan

1. **Buat `docs/adr/ADR-001-supabase-postgresql-kanonik.md`** — format FSD §7.3 (Konteks → Keputusan → Konsekuensi), status Accepted. Keputusan: Supabase PostgreSQL sebagai arsitektur data kanonik.
2. **Sinkronkan `README.md`** — hapus referensi Dual SQLite/expo-sqlite:
   - Key Features: "Local-First & Dual SQLite" → "Supabase PostgreSQL Multi-Schema (4-schema logic/data × dev/prod)".
   - Diagram arsitektur: DB1/DB2 SQLite → Supabase 4-schema + tenant schema RLS-isolated.
   - Tech Stack: expo-sqlite/expo-task-manager → Supabase (Auth, Realtime, Storage, Edge Functions) + server-side cron/task queues.
3. **Sinkronkan `inline-role-backend-developer.md`** — hapus "dual SQLite" (2 tempat), arahkan ke Supabase PostgreSQL + ADR-001.
4. **Item lain ditahan** sesuai permintaan user sampai restart opencode.

## Status Akhir

Selesai. Keputusan arsitektur final: **Supabase PostgreSQL** (ADR-001). Konflik README vs BRD/PRD/FSD ter-resolve. Item lain (scaffold, setup Supabase, CI/CD, dll.) ditahan — lanjut setelah restart opencode.

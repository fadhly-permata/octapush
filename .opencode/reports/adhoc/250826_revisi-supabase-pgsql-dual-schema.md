# Report: Revisi Supabase PgSQL Dual Schema

- Tanggal: 25/08/2026
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

Ganti database dari dua file SQLite terpisah menjadi PostgreSQL di Supabase dengan 2 schema per environment: `logic_dev`, `data_dev`, `logic_prod`, `data_prod`. Struktur DB (table, store proc/func, view, dll) wajib memakai format `{8digit_user_short_uuid}_{8digit_project_uuid}_{objek_db_name}`. User/kode tidak boleh mengonsumsi objek milik user lain. Butuh login (Google Auth sementara) + halaman manage project. Aplikasi final bisa di-push ke PROD (clone struktur DB saja).

## Rencana Aksi

1. Baca BRD.MD, PRD.MD, FSD.MD secara penuh.
2. Analisis dampak request ke tiap dokumen.
3. Edit BRD: business objectives, flow, FR/NFR, data dictionary, tech stack.
4. Edit PRD: vision, architecture, features/modules, tech stack.
5. Edit FSD: architecture diagram, module specs, DDL specs, error codes.
6. Jaga konsistensi terminologi antar dokumen.

## Yang Telah Dilakukan

- **BRD.MD** (v1.0.0 → v1.1.0): revision history +1 baris; objectives diubah ke Supabase PG + Logic/Data schema + Dev-to-Prod; diagram §3.1 diganti (Google Auth/Project Mgmt entry point, 4 skema); business flow ditambah langkah Auth/Project Onboarding & Push to PROD; §4 direstrukturisasi — Module 1 baru Authentication & Project Management (FR-AUT/FR-PRJ), Module 2 Multi-Tenant Isolation dengan naming convention `{user8}_{prj8}_{object}`, modul lain renumber; NFR-SEC diperbarui (RLS, JWT, PROD write-guard); §6 Data Dictionary ditulis ulang penuh (`public.users`, `public.projects`, `ai_configs`, `user_preferences` + objek `{usr8}_{prj8}_*` per skema); §8 tech stack: Supabase PostgreSQL + Supabase Auth.
- **PRD.MD** (v1.4.0 → v1.5.0): header core stack & version; value proposition (auth, project mgmt, isolation via RLS, dev-to-prod, cloud persistence); diagram arsitektur §2 diganti; §3 ditulis ulang jadi "Supabase PostgreSQL Multi-Schema Architecture" (public / logic_dev / data_dev / logic_prod / data_prod); modules ditambah Module 1 Authentication & Project Management dan Module 6 Dev-to-Prod Promotion; tech stack table diperbarui.
- **FSD.MD** (v1.0.0 → v1.1.0): revision history + version; architecture diagram §2.1 diganti (Auth session, Object Prefix Resolver, RLS-Aware Query Guard); §3.1 di-expand menjadi "Authentication, Project Management & Multi-Tenant Isolation" (3.1.2–3.1.5 baru: Google Auth flow, Project Mgmt flow, Push to PROD flow, isolation rules); Publish Action Engine §3.4 pakai prefiks proyek + RLS; workflow node diagram disesuaikan; §4 DDL ditulis ulang penuh ke PostgreSQL (public/logic/data + template RLS policy + RPC `push_project_to_prod`); error codes ditambah `ERR_AUT_000`, `ERR_PRJ_005`, `ERR_PRM_006`, `ERR_RLS_007`.
- Konsistensi lintas-dokumen dicek via grep: tidak ada lagi referensi `system_metadata.db`, `app_data.db`, `user_schema_mappings`, atau Dual SQLite yang tersisa (kecuali di riwayat revisi).

## Status Akhir

Selesai. Ketiga dokumen direvisi secara surgical sesuai request: migrasi Supabase PgSQL 4-skema, naming convention `{user_short_uuid}_{project_uuid}_{objek}`, isolasi via RLS+DAL, Google Auth, halaman Project Management, dan Push to PROD (structure-only clone). Asumsi yang dipakai: metadata platform-level (users, projects, ai_configs, user_preferences) di schema `public`; artefak desain aplikasi di skema Logic; data operasional + queue/logs di skema Data; isolasi ditegakkan dua lapis (prefix resolver di DAL + RLS berbasis JWT).

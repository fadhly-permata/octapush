# Report: Tambah Backlog Item + i18n 2 Bahasa

- Tanggal: 25/08/2026
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

Melanjutkan revisi berjalan: masukkan juga item "bisa nanti" (realtime sync, kolaborasi multi-user, template marketplace). i18n dibatasi sementara 2 bahasa: Indonesia (`id`) + Inggris (`en`).

## Rencana Aksi

1. Selesaikan BRD: Module 9 (error log), Module 10 i18n (id/en), Module 11 Realtime/Collaboration/Marketplace, NFR try-catch.
2. PRD: modules + tech stack.
3. FSD: spesifikasi lengkap + DDL + coding standards + error codes.

## Yang Telah Dilakukan

- **BRD.MD**: revision history v1.3.0 di-update (realtime/collab/marketplace + i18n id/en); Module 10 i18n dibatasi 2 locale (`id` default, `en`) — FR-I18N-01..04; Module 11 baru Realtime Sync, Collaboration & Marketplace (FR-RTM-01, FR-COL-01, FR-MKT-01).
- **PRD.MD**: Module 10 i18n (2 locale), Module 11 Realtime/Collaboration/Marketplace; tech stack + i18next & Supabase Realtime.
- **FSD.MD**: §3.10 i18n (locale model, platform UI, generated app translations `{prefix}_app_translations`, fallback chain); §3.11 Realtime Sync (`project:{id}` channel), Collaboration (`public.project_members`, role owner/editor/viewer), Marketplace (`public.templates`/`template_items`, clone struktur Logic ke prefix baru); DDL: `user_preferences.locale`, `project_members`, `error_logs` lengkap, `templates`, `template_items`, `{prefix}_app_translations`; JSON schema + blok `"i18n"`; error codes ERR_RTM_014, ERR_I18N_015, ERR_MKT_016; §7 Coding Standards & Exception Handling Policy (mandatory try-catch, no empty catch, AppError typed rethrow, ErrorBoundary, CI gate).

## Status Akhir

Selesai. Seluruh permintaan ter-cover: security hardening, i18n 2 bahasa (id/en), mandat try-catch dengan enforcement plan (ESLint/CI), dan centralized error log untuk tracing + triage error user.

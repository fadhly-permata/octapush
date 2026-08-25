# PRODUCT REQUIREMENT DOCUMENT (PRD)

**Product Name:** OctaPush  
**Target Platforms:** Cross-Platform (Web, Android, iOS)  
**Core Stack:** React Native for Web / Expo, TypeScript, Supabase PostgreSQL (Multi-Schema), Supabase Auth (Google OAuth)  
**Document Version:** 1.7.0 (Penambahan Security Hardening anti-cheat/XSS/SQLi, i18n 2 bahasa `id`/`en`, mandat try-catch + Centralized Error Log, Realtime Sync, Multi-User Collaboration & Template Marketplace)  

---

## 1. Executive Summary & Product Vision

### 1.1 Vision
**OctaPush** adalah platform *AI-Driven Dynamic UI, Form Generator, & Workflow Engine* cross-platform yang memungkinkan pengguna membuat, menguji, dan merilis halaman **Master**, **Transaksi**, **Laporan (Report)**, serta **Custom Decision Workflow** secara instan dengan antarmuka adaptif (**Light, Dark, & System Auto Theme**) dan isolasi data tingkat tinggi per user.

### 1.2 Core Value Proposition
* **Google Authentication & Project Management:** Login via Google Auth (Supabase Auth) dan halaman khusus untuk mengelola proyek — setiap proyek memiliki identitas `project_uuid` 8 digit yang menjadi bagian dari penamaan seluruh objek DB-nya.
* **Multi-Tenant Object Isolation:** Memisahkan objek DB milik setiap user/proyek menggunakan konvensi nama `{8_digit_user_short_uuid}_{8digit_project_uuid}_{objek_db_name}` yang ditegakkan oleh Row Level Security (RLS) berbasis JWT untuk mencegah *data leakage* antar tenant.
* **Logic vs Data Schema Separation (Dev & Prod):** Artefak desain aplikasi (kode, konfigurasi, form) disimpan pada skema **Logic** (`logic_dev`/`logic_prod`), data operasional pada skema **Data** (`data_dev`/`data_prod`) dalam satu klaster Supabase PostgreSQL.
* **Dev-to-Prod Promotion:** Aplikasi final dapat di-*push* ke environment PROD melalui *clone struktur DB* tanpa menyalin data operasional.
* **Velocity & Push Generation:** Mengubah instruksi teks menjadi antarmuka fungsional dan logika bisnis otomatis dalam hitungan detik.
* **Iterative Refinement Studio:** Live preview interaktif bersisian dengan percakapan AI (*chat refinement*) untuk penyempurnaan UI dan skema workflow secara *real-time*.
* **Adaptive Theme Engine:** Dukungan pergantian tema visual secara presisi (Light Mode, Dark Mode, dan Auto/System Following) pada seluruh UI dan komponen buatan AI.
* **Event-Driven Workflow Engine:** Eksekusi otomatis logika bisnis berbasis trigger (Form Submit, Field Change, Cron Scheduler, atau Task Queue).
* **Multi-Provider AI Agnostic:** Fleksibel dikonfigurasi ke berbagai penyedia model LLM (OpenRouter, HuggingFace, OpenAI, Ollama Proxy, dll.).
* **Cloud Persistence with Strict Separation:** Pemisahan tegas antara *platform registry* (schema `public`), *app design artifacts* (skema Logic), dan *business data* (skema Data) di Supabase PostgreSQL.

---

## 2. System Architecture & High-Level Flow

OctaPush mengadopsi arsitektur **Multi-Tenant Dynamic Schema Engine, Workflow Runtime, & Iterative Feedback Loop**:

```text
 ┌─────────────────────────────────────────────────────────┐
 │      Google Auth Login & Project Management Page        │
 └────────────────────────────┬────────────────────────────┘
                              │
 ┌────────────────────────────┴────────────────────────────┐
 │               OctaPush Generation Studio                │
 └────────────────────────────┬────────────────────────────┘
                              │
  [User Prompt / Refinement] ─┼─> [Configured AI Provider]
                              │            │
                              │            ▼
                              │   [UI + Workflow Schema (JSON)]
                              │            │
                              │            ▼
  [Live Interactive Preview] <┼─── [Sandbox Memory Engine]
                              │
                              ▼ (User Approves "Publish" / "Push to PROD")
 ┌─────────────────────────────────────────────────────────┐
 │          Supabase PostgreSQL (Single Cluster)           │
 ├──────────────────────────┬──────────────────────────────┤
 │ public: users, projects, │ logic_dev: {usr8}_{prj8}_    │
 │ ai_configs, preferences  │   pages, workflows, versions │
 ├──────────────────────────┼──────────────────────────────┤
 │ data_dev: {usr8}_{prj8}_ │ logic_prod / data_prod:      │
 │   tbl_business, queue,   │   structure-only clone via   │
 │   execution_logs         │   Push to PROD               │
 └──────────────────────────┴──────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │              OctaPush Workflow Engine                   │
 │ (Form Triggers | Cron Scheduler | Task Queue Executor)  │
 └─────────────────────────────────────────────────────────┘
```

---

## 3. Supabase PostgreSQL Multi-Schema Architecture

Untuk mencegah pencampuran data antar pengguna yang membangun aplikasi di OctaPush, sistem menggunakan satu klaster Supabase PostgreSQL dengan skema `public` untuk registry platform, serta pasangan skema **Logic** dan **Data** per environment (`logic_dev`/`data_dev` untuk pengembangan, `logic_prod`/`data_prod` hasil *Push to PROD*). Seluruh objek DB milik aplikasi memakai format `{8_digit_user_short_uuid}_{8digit_project_uuid}_{objek_db_name}`.

### 3.1 Schema `public` (Platform Registry, Theme & User-Level Metadata)

#### Table: `users`
Registry pengguna platform, tersinkronisasi dengan Supabase Auth.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | UUID | PRIMARY KEY | ID dari Supabase Auth (`auth.users.id`) |
| `email` | TEXT | NOT NULL | Email Google terverifikasi |
| `display_name` | TEXT | NULLABLE | Nama tampilan pengguna |
| `user_short_uuid` | CHAR(8) | NOT NULL, UNIQUE | 8 digit short UUID untuk prefiks penamaan objek |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Waktu pendaftaran user |

#### Table: `projects`
Mapping user ↔ project beserta status environment.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | UUID v4 internal |
| `user_id` | UUID | FK → `public.users(user_id)` | Pemilik proyek |
| `project_name` | TEXT | NOT NULL | Nama proyek |
| `project_uuid` | CHAR(8) | NOT NULL, UNIQUE per user | 8 digit project UUID |
| `object_prefix` | TEXT | NOT NULL, UNIQUE | Gabungan `{user_short_uuid}_{project_uuid}` |
| `is_pushed_to_prod` | BOOLEAN | DEFAULT false | Status Push to PROD |
| `prod_pushed_at` | TIMESTAMPTZ | NULLABLE | Waktu push terakhir |
| `is_deleted` | BOOLEAN | DEFAULT false | Soft-delete flag |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Timestamp pembuatan |

#### Table: `ai_configs`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | UUID v4 |
| `user_id` | UUID | FK → `public.users(user_id)` | Owner konfigurasi API |
| `provider_name` | TEXT | NOT NULL | Contoh: OpenRouter, HuggingFace, OpenAI |
| `base_url` | TEXT | NOT NULL | Base URL API endpoint |
| `api_key` | TEXT | NOT NULL | Stored in Encrypted Form |
| `model_name` | TEXT | NOT NULL | Contoh: `meta-llama/llama-3.1-70b-instruct` |
| `is_active` | BOOLEAN | DEFAULT false | Aktif / Inaktif |

#### Table: `user_preferences`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | UUID | PRIMARY KEY, FK → `public.users(user_id)` | Owner preferensi |
| `theme_mode` | TEXT | DEFAULT 'auto' | Opsi pilihan: `light`, `dark`, `auto` |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Timestamp pembaruan |

---

### 3.2 Schemas `logic_dev` / `logic_prod` (App Design Artifacts per Project)

Artefak desain aplikasi hasil generasi AI — halaman (`generated_pages`), workflow (`workflows`), dan versi skema (`page_schema_versions`) — dibuat dinamis dengan prefiks `{usr8}_{prj8}_`. Skema `logic_prod` hanya diisi melalui *Push to PROD* (*structure-only clone*).

*Contoh Tabel pada `logic_dev`:*
```sql
-- object_prefix = "u1a2b3c4_p9f8e7d6"
CREATE TABLE IF NOT EXISTS "logic_dev"."u1a2b3c4_p9f8e7d6_generated_pages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "page_title" TEXT NOT NULL,
  "page_type" TEXT NOT NULL CHECK ("page_type" IN ('MASTER','TRANSACTION','REPORT')),
  "target_table" TEXT NOT NULL,
  "current_version" INTEGER DEFAULT 1,
  "is_published" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMPTZ DEFAULT now()
);
```

---

### 3.3 Schemas `data_dev` / `data_prod` (Isolated Business Data per Project)

Tabel bisnis dibuat secara dinamis **hanya dengan nama berkualifikasi prefiks proyek** (`{usr8}_{prj8}_`) untuk menjamin isolasi total. Akses dilindungi Row Level Security (RLS) berbasis klaim JWT Supabase Auth yang divalidasi terhadap `public.projects`.

*Contoh Eksekusi DDL Dinamis pada `data_dev`:*
```sql
-- 1. Mengambil object_prefix milik proyek aktif dari public.projects
--    (misal: u1a2b3c4_p9f8e7d6)
-- 2. Membuat tabel bisnis dengan prefiks kepemilikan tersebut
CREATE TABLE IF NOT EXISTS "data_dev"."u1a2b3c4_p9f8e7d6_tbl_master_supplier" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "kode_supplier" TEXT,
  "nama_supplier" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. OctaPush Dynamic Schema & Workflow Standard (JSON Specification)

[KODE_KONTAINER]json
{
  "page_title": "Transaksi Penjualan",
  "page_type": "TRANSACTION",
  "target_table": "tbl_penjualan",
  "layout": {
    "sections": [
      {
        "title": "Header Penjualan",
        "fields": [
          { "name": "no_faktur", "label": "No Faktur", "component": "TextInput", "required": true },
          { "name": "total_bayar", "label": "Total Bayar", "component": "NumberInput", "required": true }
        ]
      }
    ]
  },
  "workflows": [
    {
      "workflow_name": "Update Stok & Log Transaksi",
      "trigger": {
        "type": "FORM_EVENT",
        "event": "ON_SUBMIT",
        "target_page": "tbl_penjualan"
      },
      "nodes": [
        {
          "id": "step_1",
          "type": "CONDITION",
          "expression": "payload.total_bayar > 1000000",
          "on_true": "step_discount",
          "on_false": "step_update_stock"
        },
        {
          "id": "step_discount",
          "type": "EXECUTE_SQL",
          "sql": "UPDATE tbl_penjualan SET diskon = 50000 WHERE id = :payload.id",
          "next": "step_update_stock"
        },
        {
          "id": "step_update_stock",
          "type": "EXECUTE_SQL",
          "sql": "UPDATE tbl_master_barang SET stok = stok - :payload.qty WHERE id = :payload.barang_id",
          "next": "step_notify"
        },
        {
          "id": "step_notify",
          "type": "LOCAL_NOTIFICATION",
          "message": "Transaksi Penjualan Berhasil Disimpan",
          "next": null
        }
      ]
    }
  ]
}
[KODE_KONTAINER\

---

## 5. Detailed Product Features & Modules

### Module 1: Authentication & Project Management
* **Google Auth Login:** Login menggunakan Google OAuth via Supabase Auth; sesi menghasilkan JWT untuk akses database.
* **Session Lifecycle:** Logout, refresh token otomatis, dan revoke sesi per perangkat.
* **Project Management Page:** Halaman untuk membuat, melihat, memilih, mengubah nama, dan menghapus proyek milik user yang sedang login (soft-delete + hard-delete terjadwal dengan cleanup objek DB).
* **Project Provisioning:** Setiap proyek baru mendapatkan `project_uuid` (8 digit) yang digabung dengan `user_short_uuid` menjadi `object_prefix` untuk seluruh objek DB-nya.

### Module 2: Security & Multi-Tenant Object Isolation
* **Ownership Naming Convention:** Seluruh objek DB aplikasi (table, store proc/function, view, dll.) memakai format `{8_digit_user_short_uuid}_{8digit_project_uuid}_{objek_db_name}` pada skema `logic_dev`/`data_dev`/`logic_prod`/`data_prod`.
* **Mandatory DAL Routing:** Aplikasi hasil generasi **selalu** mengakses database melalui OctaPush DAL — tidak ada kredensial/koneksi langsung ke Supabase yang diekspos ke aplikasi, baik di environment DEV maupun PROD.
* **Isolated Data Access Layer (DAL):** Semua query database ditempelkan awalan (*prefixed*) `object_prefix` proyek aktif secara otomatis; kontrak API DAL terdokumentasi formal.
* **Row Level Security Enforcement:** Kebijakan RLS berbasis klaim JWT memastikan user/kode tidak dapat mengonsumsi objek milik user/proyek lain.
* **SQL Guard:** Node `EXECUTE_SQL` divalidasi parser — hanya DML terizinkan, objek wajib berprefiks proyek, tanpa multi-statement.
* **XSS & Input Sanitization:** Seluruh input disanitasi; renderer dinamis merender konten sebagai data (bukan HTML mentah); attachment divalidasi MIME & ukuran.
* **Anti-Cheat & Abuse Protection:** Validasi ulang payload di server (never trust client), CSRF token, security headers (CSP/HSTS), velocity check anti-automasi.

### Module 3: System Settings & Theme Engine
* **Theme Mode Switcher:** Pilihan Light, Dark, dan Auto/System Default.
* **Dynamic Palette Propagation:** Seluruh komponen UI dinamis menyesuaikan variabel warna tema secara otomatis.

### Module 4: AI Provider Configurator
*(Multi-Provider Support, API Key Encryption, Connectivity Tester)*

### Module 5: OctaPush Generation Studio
* **Split View / Mobile Sheet:** Dual pane untuk Chat & Live Theme-Aware Preview.
* **Contextual Refinement:** Obrolan multi-turn untuk penyempurnaan UI & logika workflow.
* **Publish to DEV:** DDL dieksekusi ke `logic_dev`/`data_dev` dengan prefiks proyek aktif.
* **File Attachments:** Field attachment pada form tersimpan di Supabase Storage dengan path berprefiks proyek.

### Module 6: Dev-to-Prod Promotion Engine
* **Push to PROD:** Aksi pada Project Management Page yang melakukan *clone struktur DB* dari skema DEV ke skema PROD tanpa menyalin data operasional.

### Module 7: Schema Evolution & Migration Engine
* **Re-Push (Structural Diff):** Push to PROD berulang mendeteksi diff struktur DEV→PROD dan menerapkannya sebagai migration (`ALTER TABLE`, objek baru) dengan preview + konfirmasi pemilik.
* **Form Evolution:** Perubahan form menghasilkan rencana migrasi kolom (aman vs destruktif) terhadap data existing.
* **PROD Rollback:** Snapshot struktur sebelum migration memungkinkan pengembalian kondisi PROD.

### Module 8: Generated App Distribution & End-User Access
* **Publishing Modes:** Public Link (tanpa login), Restricted (end-user login Google), atau Private (pemilik saja).
* **End-User Identity:** Sesi end-user terpisah dari builder, dengan `access_scope` terbatas pada runtime aplikasi terkait; seluruh aktivitas tetap via DAL + RLS.

### Module 9: Quota, Observability & Operations
* **Quota Enforcement:** Kuota per user (jumlah proyek, ukuran DB, attachment, rate limit DAL) dengan error `ERR_QTA_009`.
* **Audit & Dashboard:** Audit log immutable (`public.audit_logs`) untuk DDL/migration/promotion/hard-delete/RLS rejection + dashboard metrik workflow & DAL.
* **Backup:** PITR minimal 7 hari untuk data PROD.
* **Centralized Error Log & Tracing:** Tabel `public.error_logs` menampung semua error (client/DAL/workflow/AI/DB) dengan konteks user/project/session; tracing per user/proyek; triage status (`OPEN` → `INVESTIGATING` → `RESOLVED`/`IGNORED`) sebagai dasar perbaikan.

### Module 10: Internationalization (i18n)
* **2 Locale (fase awal):** `id` (Bahasa Indonesia, default) dan `en` (English).
* **Generated App i18n:** AI dapat menghasilkan blok `"i18n"` pada JSON skema; string dikelola pada `{usr8}_{prj8}_app_translations`; runtime merender sesuai locale end-user dengan fallback ke default.
* **Platform UI Locale:** Studio, Project Management, dan Settings tersedia dalam `id` & `en`.

### Module 11: Realtime Sync, Collaboration & Marketplace
* **Realtime Data Sync:** Update form/data realtime via Supabase Realtime pada objek prefiks proyek (RLS-aware), tanpa refresh manual.
* **Multi-User Collaboration:** Undang kolaborator per proyek dengan role `owner`/`editor`/`viewer` (`public.project_members`); presence indicator di Studio.
* **Template Marketplace:** Ekspor proyek sebagai template + instalasi ke proyek baru (clone struktur Logic ke prefix baru); metadata template (nama, deskripsi, versi, author).

### Module 12: Dynamic Runtime & Workflow Execution Engine
* **Triggers:** Form Callbacks (`ON_SUBMIT`, `ON_CHANGE`), Cron Scheduler, & Task Queue.
* **Nodes:** `CONDITION`, `EXECUTE_SQL`, `CALCULATION`, `LOCAL_NOTIFICATION`.
* **Environment-Aware Execution:** Runtime berjalan pada objek prefiks proyek aktif di `data_dev`, atau di `data_prod` bila aplikasi diakses dalam mode PROD.
* **Exception Handling Mandate:** Seluruh kode platform & artefak engine wajib try-catch; setiap error tercatat ke Centralized Error Log.

---

## 6. Recommended Technology Stack

| Layer | Technology Selected |
|---|---|
| **Core Framework** | React Native for Web / Expo SDK (TypeScript) |
| **Authentication** | Supabase Auth — Google OAuth Provider |
| **Multi-Tenant Security** | Object Prefix Resolver (`{user8}_{prj8}_`) + PostgreSQL Row Level Security (RLS) berbasis klaim JWT |
| **Theme & UI** | React Native Paper / Gluestack UI + `useColorScheme` Hook |
| **Database Driver** | Supabase PostgreSQL (`supabase-js` / PostgREST) dengan 4 schema environment (`logic_dev`, `data_dev`, `logic_prod`, `data_prod`) |
| **File Storage** | Supabase Storage (bucket berprefiks `{usr8}_{prj8}/` untuk attachment form) |
| **Internationalization** | `i18next` / `react-i18next` (locale: `id` default, `en`) + `{usr8}_{prj8}_app_translations` |
| **Realtime** | Supabase Realtime (channel per project, RLS-aware) |
| **Background Scheduler** | Supabase Edge Functions / pg_cron + Task Queue Tables |
| **Observability** | `public.audit_logs` (append-only) + Dashboard metrik workflow/DAL |
| **State Management** | Zustand |

---

## 7. Implementation Phasing (Build Roadmap)

Urutan eksekusi pengembangan — fase berikutnya tidak dimulai sebelum fase sebelumnya memenuhi acceptance criteria.

### Fase F1 — Foundation
* Scope: Google Auth, Project Management, OctaPush DAL, RLS + object prefix provisioning.
* Acceptance gate: lulus benchmark skalabilitas sesuai NFR-PER-03 di BRD (overhead RLS ≤ 20 md p95; simulasi 1.000 proyek; 50 provisioning paralel tanpa deadlock).

### Fase F2 — Generation Studio (DEV)
* Scope: AI Provider Configurator, Generation Studio dual-pane, Publish ke `logic_dev`/`data_dev`, Theme Engine, SQL Guard, try-catch + error logging pipeline.
* Acceptance gate: end-to-end prompt → form → publish → submit data berjalan pada environment DEV dengan isolasi penuh.

### Fase F3 — Production & Distribution
* Scope: Push to PROD (structure clone), Generated App Distribution (Private/Restricted/Public), Centralized Error Log dashboard & triage.
* Acceptance gate: aplikasi hasil generate dapat dipublikasikan dan digunakan end-user via DAL tanpa akses DB langsung.

### Fase F4 — Security Hardening & i18n
* Scope: sanitization/XSS/CSRF/security headers penuh, anti-abuse velocity check, i18n `id`/`en` untuk platform UI dan generated app, quota enforcement.
* Acceptance gate: lolos security checklist internal + kedua locale berfungsi end-to-end.

### Fase F5 — Ecosystem
* Scope: Schema Evolution & Migration engine (re-push diff), Realtime Sync, Multi-User Collaboration, Template Marketplace + seed templates.
* Acceptance gate: re-push migration aman pada proyek ber-data; kolaborasi multi-user dengan role terverifikasi.
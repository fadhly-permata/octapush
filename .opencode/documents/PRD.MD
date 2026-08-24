# PRODUCT REQUIREMENT DOCUMENT (PRD)

**Product Name:** OctaPush  
**Target Platforms:** Cross-Platform (Web, Android, iOS)  
**Core Stack:** React Native for Web / Expo, TypeScript, Dual SQLite Engine  
**Document Version:** 1.4.0 (Updated Product Branding to OctaPush)  

---

## 1. Executive Summary & Product Vision

### 1.1 Vision
**OctaPush** adalah platform *AI-Driven Dynamic UI, Form Generator, & Workflow Engine* cross-platform yang memungkinkan pengguna membuat, menguji, dan merilis halaman **Master**, **Transaksi**, **Laporan (Report)**, serta **Custom Decision Workflow** secara instan dengan antarmuka adaptif (**Light, Dark, & System Auto Theme**) dan isolasi data tingkat tinggi per user.

### 1.2 Core Value Proposition
* **Multi-Tenant Schema Isolation:** Memisahkan data setiap user ke dalam skema terisolasi berbasis UUID untuk mencegah pencampuran data (*data leakage*) dan meningkatkan keamanan.
* **Velocity & Push Generation:** Mengubah instruksi teks menjadi antarmuka fungsional dan logika bisnis otomatis dalam hitungan detik.
* **Iterative Refinement Studio:** Live preview interaktif bersisian dengan percakapan AI (*chat refinement*) untuk penyempurnaan UI dan skema workflow secara *real-time*.
* **Adaptive Theme Engine:** Dukungan pergantian tema visual secara presisi (Light Mode, Dark Mode, dan Auto/System Following) pada seluruh UI dan komponen buatan AI.
* **Event-Driven Workflow Engine:** Eksekusi otomatis logika bisnis berbasis trigger (Form Submit, Field Change, Cron Scheduler, atau Local Task Queue).
* **Multi-Provider AI Agnostic:** Fleksibel dikonfigurasi ke berbagai penyedia model LLM (OpenRouter, HuggingFace, OpenAI, Ollama Proxy, dll.).
* **Local-First & Isolated Data Persistence:** Pemisahan tegas antara *system metadata* dan *business data* menggunakan **dua database SQLite terpisah**.

---

## 2. System Architecture & High-Level Flow

OctaPush mengadopsi arsitektur **Multi-Tenant Dynamic Schema Engine, Workflow Runtime, & Iterative Feedback Loop**:

[KODE_KONTAINER]text
 ┌─────────────────────────────────────────────────────────┐
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
                              ▼ (User Approves & Clicks "Publish")
 ┌─────────────────────────────────────────────────────────┐
 │                   Database Storage                      │
 ├────────────────────────────┬────────────────────────────┤
 │ DB 1: system_metadata.db   │ DB 2: app_data.db          │
 │ - Public: Schema Mappings  │ - User Schema [UUID_A]     │
 │ - AI Configs & Preferences │   └─ Dynamic DDL Tables    │
 │ - Page & Workflow Schemas  │ - User Schema [UUID_B]     │
 │ - Triggers & Cron Rules    │   └─ Dynamic DDL Tables    │
 └────────────────────────────┴────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │              OctaPush Workflow Engine                   │
 │ (Form Triggers | Cron Scheduler | Task Queue Executor)  │
 └────────────────────────────┴────────────────────────────┘
[KODE_KONTAINER\

---

## 3. Dual SQLite Database & Schema Isolation Architecture

Untuk mencegah pencampuran data antar pengguna yang membangun aplikasi di OctaPush, sistem mengadopsi mekanisme **Schema Isolation Mapping**.

### 3.1 Database 1: `system_metadata.db` (Penyimpanan Sistem, Theme & Metadata)

#### Table: `user_schema_mappings` (Schema Public)
Menyimpan pemetaan antara User ID asli dengan nama skema terisolasi yang diacak menggunakan format UUID v4 demi keamanan.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | TEXT | PRIMARY KEY | ID unik pengguna |
| `schema_name` | TEXT | NOT NULL, UNIQUE | Nama skema acak format UUID (e.g. `usr_a1b2c3d4_...`) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pendaftaran user |

#### Table: `ai_configs`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `user_id` | TEXT | FOREIGN KEY | Owner konfigurasi API |
| `provider_name` | TEXT | NOT NULL | Contoh: OpenRouter, HuggingFace, OpenAI |
| `base_url` | TEXT | NOT NULL | Base URL API endpoint |
| `api_key` | TEXT | NOT NULL | Stored in Encrypted Form |
| `model_name` | TEXT | NOT NULL | Contoh: `meta-llama/llama-3.1-70b-instruct` |
| `is_active` | INTEGER | DEFAULT 0 | 1 = Aktif, 0 = Inaktif |

#### Table: `user_preferences`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | TEXT | PRIMARY KEY | Owner preferensi |
| `theme_mode` | TEXT | DEFAULT 'auto' | Opsi pilihan: `light`, `dark`, `auto` |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp pembaruan |

#### Table: `generated_pages`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `user_id` | TEXT | NOT NULL | Referensi Owner ke `user_schema_mappings` |
| `page_title` | TEXT | NOT NULL | Nama/Judul Halaman |
| `page_type` | TEXT | NOT NULL | Enum: `MASTER`, `TRANSACTION`, `REPORT` |
| `target_table` | TEXT | NOT NULL | Nama tabel dalam skema UUID user |
| `current_version` | INTEGER | DEFAULT 1 | Versi skema UI yang sedang aktif |
| `is_published` | INTEGER | DEFAULT 0 | 1 = Published, 0 = Draft |

#### Table: `workflows`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `user_id` | TEXT | NOT NULL | Owner Workflow |
| `workflow_name` | TEXT | NOT NULL | Nama Workflow / Process |
| `trigger_type` | TEXT | NOT NULL | Enum: `FORM_EVENT`, `SCHEDULER`, `QUEUE`, `MANUAL` |
| `trigger_config` | TEXT | NOT NULL | JSON konfigurasi trigger (Cron String / Form Event ID) |
| `workflow_json` | TEXT | NOT NULL | JSON definisi langkah (steps, conditions, actions) |

---

### 3.2 Database 2: `app_data.db` (Isolated Per-User Schema Storage)

Tabel bisnis dibuat secara dinamis **hanya di dalam skema khusus user** (`schema_name` UUID) untuk menjamin isolasi total.

*Contoh Eksekusi DDL Dinamis pada `app_data.db`:*
[KODE_KONTAINER]sql
-- 1. Mengambil schema_name milik user dari system_metadata.db (misal: usr_8f3a9b2c_4d1e...)
-- 2. Membuat tabel bisnis di dalam skema terisolasi pengguna tersebut
CREATE TABLE IF NOT EXISTS "usr_8f3a9b2c_4d1e_4567_89ab_cdef01234567"."tbl_master_supplier" (
  "id" TEXT PRIMARY KEY,
  "kode_supplier" TEXT,
  "nama_supplier" TEXT,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
[KODE_KONTAINER\

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

### Module 1: Security & Multi-Tenant Schema Manager
* **Automatic UUID Schema Provisioning:** Setiap user baru akan otomatis mendapatkan entri `schema_name` berbasis UUID v4 pada tabel mapping `user_schema_mappings`.
* **Isolated Data Access Layer (DAL):** Semua query database untuk aplikasi yang dibangun user ditempelkan awalan (*prefixed*) nama skema UUID pengguna secara otomatis.

### Module 2: System Settings & Theme Engine
* **Theme Mode Switcher:** Pilihan Light, Dark, dan Auto/System Default.
* **Dynamic Palette Propagation:** Seluruh komponen UI dinamis menyesuaikan variabel warna tema secara otomatis.

### Module 3: AI Provider Configurator
*(Multi-Provider Support, API Key Encryption, Connectivity Tester)*

### Module 4: OctaPush Generation Studio
* **Split View / Mobile Sheet:** Dual pane untuk Chat & Live Theme-Aware Preview.
* **Contextual Refinement:** Obrolan multi-turn untuk penyempurnaan UI & logika workflow.

### Module 5: Dynamic Runtime & Workflow Execution Engine
* **Triggers:** Form Callbacks (`ON_SUBMIT`, `ON_CHANGE`), Cron Scheduler, & Local Task Queue.
* **Nodes:** `CONDITION`, `EXECUTE_SQL`, `CALCULATION`, `LOCAL_NOTIFICATION`.

---

## 6. Recommended Technology Stack

| Layer | Technology Selected |
|---|---|
| **Core Framework** | React Native for Web / Expo SDK (TypeScript) |
| **Multi-Tenant Security** | Schema Mapping Manager (UUID v4 Generator & Resolver) |
| **Theme & UI** | React Native Paper / Gluestack UI + `useColorScheme` Hook |
| **Database Driver** | `expo-sqlite` (Dual connection support & multi-schema query builder) |
| **Background Scheduler** | `expo-background-fetch` & `expo-task-manager` |
| **State Management** | Zustand |
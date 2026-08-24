# FUNCTIONAL SPECIFICATION DOCUMENT (FSD)

**Project Name:** OctaPush Platform  
**Document Version:** 1.0.0  
**Status:** Approved / Baseline  
**Target Platform:** Cross-Platform (Web, Android, iOS)  

---

## 1. DOCUMENT CONTROL & REVISION HISTORY

| Version | Date | Author | Description of Changes |
|---|---|---|---|
| 1.0.0 | 25 Aug 2026 | Lead System Architect | Initial Functional Specification Document (FSD) created directly mapped to BRD v1.0.0 and PRD v1.4.0 (Theme Engine, Multi-Tenant Schema Resolver, Dual SQLite Engine, Dynamic Studio, and Workflow Engine). |

---

## 2. SYSTEM ARCHITECTURE & COMPONENT TOPOLOGY

### 2.1 Technical Architecture Diagram

```text
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                       OctaPush Client Application                       │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ ┌──────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐ │
 │ │ System Settings      │  │ Dynamic UI Studio   │  │ Runtime Render   │ │
 │ │ (Theme & AI Config)  │  │ (Chat & Preview)    │  │ (Forms & Engine) │ │
 │ └──────────┬───────────┘  └──────────┬──────────┘  └────────┬─────────┘ │
 └────────────┼─────────────────────────┼──────────────────────┼───────────┘
              │                         │                      │
              ▼                         ▼                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                   OctaPush Core Controller & DAL                        │
 ├────────────────────────────┬────────────────────────────────────────────┤
 │ - Theme Context Provider   │ - Schema Isolation Resolver (UUID Mapping) │
 │ - AI Provider Service      │ - Dynamic DDL / Query Builder Engine       │
 │ - State Engine (Zustand)   │ - Workflow Runtime & Task Queue Worker     │
 └────────────┬───────────────┴────────────────────────┬───────────────────┘
              │                                        │
              ▼                                        ▼
 ┌───────────────────────────┐            ┌────────────────────────────────┐
 │ DB 1: system_metadata.db  │            │ DB 2: app_data.db              │
 ├───────────────────────────┤            ├────────────────────────────────┤
 │ - public.user_schema_maps │            │ - "usr_uuid_A".tbl_business    │
 │ - public.ai_configs       │            │ - "usr_uuid_A".task_queue      │
 │ - public.user_preferences │            │ - "usr_uuid_B".tbl_business    │
 │ - public.generated_pages  │            │ - "usr_uuid_B".task_queue      │
 └───────────────────────────┘            └────────────────────────────────┘
```

---

## 3. DETAILED MODULE FUNCTIONAL SPECIFICATIONS

### 3.1 Module 1: Security & Multi-Tenant Schema Resolver

#### 3.1.1 Overview
Mekanisme ini bertugas menjamin isolasi data mutlak antar-pengguna pada basis data operasional `app_data.db` dengan memetakan `user_id` ke `schema_name` berbasis UUID v4 acak.

#### 3.1.2 Functional Logic & Rules
1. **App Initialization Hook:**
   * Saat aplikasi dijalankan, `SchemaResolverService` mengeksekusi kueri ke `system_metadata.db`:
     `SELECT schema_name FROM public.user_schema_mappings WHERE user_id = :current_user_id;`
   * Jika record **tidak ditemukan**:
     * System mernjadwalkan pembentukan UUID v4 acak (contoh: `usr_f47ac10b_58cc_4372_a567_0e02b2c3d479`).
     * Menyimpan record baru ke `public.user_schema_mappings`.
     * Menginisialisasi skema baru pada `app_data.db`: `CREATE SCHEMA IF NOT EXISTS "usr_f47ac10b_58cc_4372_a567_0e02b2c3d479";`
     * Membuat tabel internal pendukung pada skema tersebut (`workflow_task_queue` dan `workflow_execution_logs`).
2. **Dynamic DAL Query Transformation:**
   * Semua kueri DDL/DML ke `app_data.db` **wajib** melewati `QueryBuilderService`.
   * Setiap referensi tabel bisnis otomatis disisipi prefix skema aktif user:
     * *Input Kueri Studio:* `SELECT * FROM tbl_penjualan;`
     * *Transformed Kueri DAL:* `SELECT * FROM "usr_f47ac10b_58cc_4372_a567_0e02b2c3d479"."tbl_penjualan";`

---

### 3.2 Module 2: System Settings & Theme Engine

#### 3.2.1 Overview
Menyediakan manajemen konfigurasi preferensi visual adaptif (Light Mode, Dark Mode, dan Auto/System Default) yang berefek langsung pada seluruh komponen UI bawaan aplikasi dan komponen dinamis hasil *generate* AI.

#### 3.2.2 Functional Logic & State Flow
1. **Theme State Initialization:**
   * App membaca `theme_mode` dari `public.user_preferences` di `system_metadata.db`.
   * Jika kosong, default bernilai `auto`.
2. **Resolution Rules:**
   * Jika `theme_mode === 'light'`: Paksa palette `LightTheme`.
   * Jika `theme_mode === 'dark'`: Paksa palette `DarkTheme`.
   * Jika `theme_mode === 'auto'`: Ambil nilai dari hook `useColorScheme()` bawaan OS (`light` atau `dark`).
3. **Theme Token Propagation:**
   * Palette warna disalurkan melalui `ThemeContext.Provider` ke seluruh pohon komponen, termasuk *Dynamic Form Component Renderer*.

---

### 3.3 Module 3: AI Provider Configurator

#### 3.3.1 Overview
Modul pengelola koneksi LLM dinamis yang mendukung multi-provider (OpenRouter, HuggingFace, OpenAI, Ollama Proxy, LiteLLM) lengkap dengan enkripsi API Key.

#### 3.3.2 Functional Workflow
1. **Form Input Config:**
   * Input Field: `Provider Name`, `Base URL`, `API Key`, `Model Name`.
2. **Encryption Handler:**
   * API Key disandi menggunakan AES-256 pada Application Layer sebelum di-persist ke tabel `public.ai_configs` di `system_metadata.db`.
3. **Test Connection Logic:**
   * Mengirimkan request ping minimal (`/models` atau `chat/completions` ber-prompt tes) menggunakan kredensial yang diinput.
   * Menampilkan toast feedback: `Success (200 OK)` atau `Failed (HTTP Status Code / Error Message)`.

---

### 3.4 Module 4: OctaPush Generation Studio

#### 3.4.1 Overview
Ruang kerja interaktif dual-pane untuk memasukkan prompt, menerima generasi UI/Workflow dari AI, pratinjau langsung terisolasi, dan iterasi penyempurnaan skema secara real-time.

#### 3.4.2 Interface & Component Breakdown
* **Pane A (Chat Refinement Stream):**
  * Input text prompt & history percakapan.
  * Parser penerima respons AI berbasis format standar JSON OctaPush.
* **Pane B (Theme-Aware Live Preview Sandbox):**
  * Memory-based Renderer yang merender JSON skema menjadi komponen React Native/Expo aktual secara instant.
  * Menyediakan toggle pratinjau cepat untuk menguji responsivitas komponen pada tema Light/Dark.
* **Publish Action Engine:**
  * Saat tombol **Publish** ditekan:
    1. Menyimpan metadata ke `public.generated_pages` & `public.workflows`.
    2. Mengisolasi DDL dan mengeksekusi `CREATE TABLE IF NOT EXISTS` di skema UUID user pada `app_data.db`.

---

### 3.5 Module 5: Dynamic Runtime & Event-Driven Workflow Engine

#### 3.5.1 Overview
Runtime engine yang mengeksekusi logika bisnis saat form berinteraksi atau pemicu sistem berjalan (Form Callbacks, Cron Scheduler, Task Queue).

#### 3.5.2 Workflow Node Execution Algorithm

```text
 ┌─────────────────────────────────────────────────────────┐
 │               Event Triggered (e.g. ON_SUBMIT)          │
 └────────────────────────────┬────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │           Fetch Workflow Nodes from DB Metadata         │
 └────────────────────────────┬────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │             Execute Current Node Processing             │
 └────────────────────────────┬────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ NODE:         │     │ NODE:         │     │ NODE:         │
│ CONDITION     │     │ EXECUTE_SQL   │     │ NOTIFICATION  │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        ▼                     ▼                     ▼
  Evaluasi Bool       Jalankan Query DML      Tampilkan Native
  Expression          terisolasi di Skema     Toast/Push Alert
  (True/False)        UUID User                     │
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │           Write Log to workflow_execution_logs          │
 └─────────────────────────────────────────────────────────┘
```

---

## 4. DATABASE SCHEMA SPECIFICATIONS (DDL)

### 4.1 Database 1: `system_metadata.db`

```sql
-- Table: user_schema_mappings (Schema Public)
CREATE TABLE IF NOT EXISTS "user_schema_mappings" (
  "user_id" TEXT PRIMARY KEY,
  "schema_name" TEXT NOT NULL UNIQUE,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: ai_configs
CREATE TABLE IF NOT EXISTS "ai_configs" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "provider_name" TEXT NOT NULL,
  "base_url" TEXT NOT NULL,
  "api_key" TEXT NOT NULL,
  "model_name" TEXT NOT NULL,
  "is_active" INTEGER DEFAULT 0,
  FOREIGN KEY("user_id") REFERENCES "user_schema_mappings"("user_id")
);

-- Table: user_preferences
CREATE TABLE IF NOT EXISTS "user_preferences" (
  "user_id" TEXT PRIMARY KEY,
  "theme_mode" TEXT DEFAULT 'auto',
  "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY("user_id") REFERENCES "user_schema_mappings"("user_id")
);

-- Table: generated_pages
CREATE TABLE IF NOT EXISTS "generated_pages" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "page_title" TEXT NOT NULL,
  "page_type" TEXT NOT NULL,
  "target_table" TEXT NOT NULL,
  "current_version" INTEGER DEFAULT 1,
  "is_published" INTEGER DEFAULT 0,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: workflows
CREATE TABLE IF NOT EXISTS "workflows" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "workflow_name" TEXT NOT NULL,
  "trigger_type" TEXT NOT NULL,
  "trigger_config" TEXT NOT NULL,
  "workflow_json" TEXT NOT NULL,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4.2 Database 2: `app_data.db` (User Schema Level Template)

Setiap skema UUID pengguna yang baru dibentuk akan memuat struktur dasar internal sebagai berikut:

```sql
-- Template DDL untuk eksekusi pada skema UUID spesifik: "{schema_name}"

CREATE TABLE IF NOT EXISTS "{schema_name}"."workflow_task_queue" (
  "id" TEXT PRIMARY KEY,
  "workflow_id" TEXT NOT NULL,
  "payload_json" TEXT NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "retry_count" INTEGER DEFAULT 0,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "{schema_name}"."workflow_execution_logs" (
  "id" TEXT PRIMARY KEY,
  "workflow_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "execution_time_ms" INTEGER NOT NULL,
  "log_details" TEXT,
  "executed_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. INTERFACE & JSON SPECIFICATIONS

### 5.1 System API Contract / LLM Generation Schema

Format validasi skema JSON yang dikembalikan oleh AI LLM dan wajib diproses oleh Studio:

```json
{
  "$schema": "https://octapush.dev/schemas/v1/generation.json",
  "type": "object",
  "properties": {
    "page_title": { "type": "string" },
    "page_type": { "type": "string", "enum": ["MASTER", "TRANSACTION", "REPORT"] },
    "target_table": { "type": "string" },
    "layout": {
      "type": "object",
      "properties": {
        "sections": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "fields": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" },
                    "label": { "type": "string" },
                    "component": { 
                      "type": "string", 
                      "enum": ["TextInput", "NumberInput", "SelectInput", "DatePicker", "SwitchInput"] 
                    },
                    "required": { "type": "boolean" },
                    "default_value": { "type": ["string", "number", "boolean", "null"] }
                  },
                  "required": ["name", "label", "component", "required"]
                }
              }
            },
            "required": ["title", "fields"]
          }
        }
      },
      "required": ["sections"]
    },
    "workflows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "workflow_name": { "type": "string" },
          "trigger": {
            "type": "object",
            "properties": {
              "type": { "type": "string", "enum": ["FORM_EVENT", "SCHEDULER", "QUEUE", "MANUAL"] },
              "event": { "type": "string" },
              "target_page": { "type": "string" }
            },
            "required": ["type"]
          },
          "nodes": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "type": { "type": "string", "enum": ["CONDITION", "EXECUTE_SQL", "CALCULATION", "LOCAL_NOTIFICATION"] },
                "expression": { "type": "string" },
                "sql": { "type": "string" },
                "message": { "type": "string" },
                "on_true": { "type": ["string", "null"] },
                "on_false": { "type": ["string", "null"] },
                "next": { "type": ["string", "null"] }
              },
              "required": ["id", "type"]
            }
          }
        },
        "required": ["workflow_name", "trigger", "nodes"]
      }
    }
  },
  "required": ["page_title", "page_type", "target_table", "layout", "workflows"]
}
```

---

## 6. EXCEPTION HANDLING & ERROR CODES

| Error Code | Category | Cause / Trigger | System Action / User Feedback |
|---|---|---|---|
| `ERR_SEC_001` | Multi-Tenant | `user_id` gagal dipetakan ke `schema_name` UUID | System memicu auto-retry pembentukan UUID pada `user_schema_mappings`. |
| `ERR_DAL_002` | Database | Eksekusi DML pada tabel bisnis yang belum di-publish | Menampilkan alert: "Tabel bisnis belum diinisialisasi. Silakan Publish halaman terlebih dahulu." |
| `ERR_AIC_003` | AI Provider | Timeout / Invalid API Key saat melakukan kueri LLM | Menampilkan banner error pada Studio Chat & mengizinkan konfigurasi ulang di Settings. |
| `ERR_WFE_004` | Workflow Engine | Evaluasi sintaks `CONDITION` invalid atau SQL Syntax error | Menghentikan eksekusi node, mencatat status `FAILED` ke `workflow_execution_logs`, dan mengirimkan notifikasi error ke user. |
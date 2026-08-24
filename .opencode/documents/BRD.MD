# BUSINESS REQUIREMENT DOCUMENT (BRD)

**Project Name:** OctaPush Platform  
**Document Version:** 1.0.0  
**Status:** Approved / Baseline  
**Target Platform:** Cross-Platform (Web, Android, iOS)  

---

## 1. DOCUMENT CONTROL & REVISION HISTORY

| Version | Date | Author | Description of Changes |
|---|---|---|---|
| 1.0.0 | 25 Aug 2026 | System Architect / PM | Initial comprehensive BRD creation based on baseline PRD v1.4.0 (OctaPush Core Features, Theme Engine, Dual SQLite, and Multi-Tenant Schema Isolation). |

---

## 2. EXECUTIVE SUMMARY

### 2.1 Project Background
Pengembangan aplikasi internal enterprise (seperti form input data master, modul transaksi, dan pemrosesan laporan) sering kali mengalami *bottleneck* pada proses *UI prototyping*, penyusunan skema basis data, dan penulisan logika bisnis pendukung (*workflow*). Pendekatan *no-code/low-code* tradisional sering kali terlalu kaku, tidak memiliki *theme engine* yang adaptif, serta mencampur data antarpengguna (*multi-tenant data leakage*) dalam satu basis data publik.

**OctaPush** hadir sebagai platform *AI-Driven Dynamic UI, Form Generator, & Workflow Engine* lintas platform yang berbasis *Local-First Architecture*. OctaPush memungkinkan pengguna untuk membuat, menguji, merevisi, dan mengeksekusi aplikasi bisnis secara instan menggunakan instruksi teks alami (*natural language prompts*).

### 2.2 Business Objectives
* **Meningkatkan Kecepatan Pembuatan UI & Workflow (Velocity):** Mengurangi waktu pengodean antarmuka dan *backend workflow* dari hitungan hari menjadi hitungan detik.
* **Isolasi Data Tingkat Tinggi (Zero Data Leakage):** Menerapkan mekanisme pemisahan basis data fisik (*Dual SQLite*) dan isolasi skema dinamis berbasis UUID acak untuk setiap pengguna (*multi-tenant security*).
* **Adaptabilitas Visual & UX Fleksibel:** Menyediakan antarmuka yang mendukung *Theme Engine* adaptif (Light, Dark, Auto System) pada seluruh komponen bawaan maupun komponen dinamis hasil generator AI.
* **Kemandirian Infrastruktur AI (Multi-Provider AI Agnostic):** Menghindari *vendor lock-in* dengan mendukung berbagai penyedia model LLM (OpenRouter, HuggingFace, OpenAI, Ollama Proxy, LiteLLM, dll.).

---

## 3. BUSINESS PROCESS & SYSTEM FLOW

### 3.1 High-Level Architecture Flow

```text
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
```

### 3.2 End-to-End Business Flow

1. **User Onboarding & Schema Provisioning:**
   * Pengguna mendaftar/masuk ke dalam aplikasi.
   * Sistem secara otomatis memeriksa apakah `user_id` telah memiliki nama skema unik.
   * Jika belum, sistem menerbitkan UUID v4 acak (contoh: `usr_a1b2c3d4_...`) dan mencatatnya ke dalam tabel `public.user_schema_mappings` di `system_metadata.db`.
2. **AI Provider Configuration & Theme Setting:**
   * Pengguna mengonfigurasi penyedia LLM (API Key, Base URL, Model Name) dan memilih mode tema (Light, Dark, atau Auto).
3. **Prompt & Iterative UI/Workflow Generation:**
   * Pengguna memasukkan instruksi teks pada OctaPush Studio (misal: *"Buatkan form transaksi penjualan beserta workflow potong stok"*).
   * AI mengembalikan respons terstruktur berformat JSON (mengandung instruksi *layout UI* dan *workflow node*).
   * Sandbox merender *Live Preview* secara bersisian (*split view*) menggunakan tema visual aktif. Pengguna dapat melakukan iterasi percakapan untuk penyempurnaan UI/Workflow.
4. **Publishing & Dynamic DDL Execution:**
   * Ketika pengguna menekan **Publish**, sistem membaca `target_table` dan mengeksekusi perintah DDL (`CREATE TABLE IF NOT EXISTS`) langsung di dalam skema UUID khusus milik pengguna tersebut pada basis data `app_data.db`.
5. **Runtime Execution & Workflow Handling:**
   * Saat form diisi dan dikirim (`ON_SUBMIT`), *Event-Driven Workflow Engine* mengeksekusi instruksi logika (seperti `CONDITION`, `EXECUTE_SQL`, atau `LOCAL_NOTIFICATION`) secara terisolasi pada skema user.

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 Module 1: Multi-Tenant Security & Schema Isolation
* **FR-SEC-01 (Auto-Provisioning):** Sistem **wajib** mendaftarkan `user_id` ke dalam tabel `user_schema_mappings` pada skema `public` di `system_metadata.db` saat pengguna pertama kali berinteraksi dengan studio.
* **FR-SEC-02 (Randomized Schema Generation):** Nama skema (`schema_name`) **wajib** menggunakan format acak berbasis UUID v4 yang diawali prefiks unik untuk mencegah penebakan (*brute-force/enumeration attacks*).
* **FR-SEC-03 (Data Access Layer Isolation):** Semua eksekusi perintah DDL (pembuatan tabel) dan DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) pada basis data aplikasi (`app_data.db`) **wajib** menggunakan kualifikasi skema UUID pengguna yang aktif (`"schema_name"."table_name"`).

### 4.2 Module 2: System Settings & Theme Engine
* **FR-THM-01 (Theme Options):** Sistem **wajib** menyediakan 3 pilihan preferensi tema visual:
  1. `light`: Tampilan terang kontras tinggi.
  2. `dark`: Tampilan gelap hemat energi.
  3. `auto`: Mengikuti konfigurasi preferensi OS bawaan (*System Default*).
* **FR-THM-02 (Dynamic Palette Propagation):** Semua komponen UI bawaan dan komponen dinamis hasil generator AI **wajib** mengonsumsi variabel token warna yang sama dari *Theme Provider*.
* **FR-THM-03 (Persistence):** Preferensi tema pengguna **wajib** disimpan pada tabel `user_preferences` di `system_metadata.db` dan diterapkan secara instan saat aplikasi dibuka kembali.

### 4.3 Module 3: AI Provider Configurator
* **FR-AIC-01 (Multi-Provider Support):** Sistem **wajib** mendukung koneksi ke penyedia AI generatif standar OpenAPI/REST API (OpenRouter, HuggingFace, OpenAI, Ollama Proxy, LiteLLM).
* **FR-AIC-02 (Key Encryption):** API Key penyedia AI **wajib** dienkripsi sebelum disimpan ke dalam tabel `ai_configs` di `system_metadata.db`.
* **FR-AIC-03 (Connectivity Tester):** Sistem **harus** menyediakan tombol uji koneksi (*Test Connection*) untuk memvalidasi kredensial API Key dan endpoint sebelum disimpan.

### 4.4 Module 4: OctaPush Generation Studio
* **FR-STU-01 (Dual-Pane / Split-View Interface):** Antarmuka studio **wajib** menyediakan area obrolan AI (*Chat Refinement*) dan area pratinjau langsung (*Live Theme-Aware Preview*) secara bersisian pada desktop, atau *tab-sheet layout* pada perangkat seluler.
* **FR-STU-02 (Schema Versioning):** Setiap kali AI memberikan rekomendasi skema UI/Workflow baru, sistem **wajib** mencatat versi skema tersebut pada tabel `page_schema_versions` sehingga pengguna dapat melakukan *rollback* ke versi sebelumnya.
* **FR-STU-03 (Theme-Aware Live Rendering):** Pratinjau langsung UI **wajib** secara otomatis berganti skema warna secara instan jika pengguna mengubah tema visual di *Settings*.

### 4.5 Module 5: Dynamic Runtime & Event-Driven Workflow Engine
* **FR-WFE-01 (Trigger Handlers):** Workflow Engine **wajib** dapat menangkap *pemicu* eksekusi berdasarkan:
  * `FORM_EVENT` (`ON_SUBMIT`, `ON_CHANGE`).
  * `SCHEDULER` (Cron expression lokal).
  * `QUEUE` (Local Task Queue execution).
  * `MANUAL` (Tombol eksekusi langsung).
* **FR-WFE-02 (Node Operations):** Workflow Engine **wajib** mendukung node pemrosesan logika berikut:
  * `CONDITION`: Evaluasi ekspresi boolean (misal: `payload.total_bayar > 1000000`).
  * `EXECUTE_SQL`: Eksekusi perintah SQL dinamis pada skema UUID milik user terkait di `app_data.db`.
  * `CALCULATION`: Operasi Aritmatika dan manipulasi variabel data.
  * `LOCAL_NOTIFICATION`: Menampilkan notifikasi lokal pada perangkat pengguna.
* **FR-WFE-03 (Execution Logging):** Setiap eksekusi *workflow* **wajib** mencatat riwayat hasil eksekusi (`SUCCESS` / `FAILED`), durasi eksekusi (ms), dan detail log pada tabel `workflow_execution_logs` di `app_data.db`.

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Security & Data Privacy
* **NFR-SEC-01:** Tidak ada kueri dari satu user yang boleh menyentuh skema milik user lain pada `app_data.db`.
* **NFR-SEC-02:** Data sensitif seperti API Key AI **harus** dienkripsi di tingkat basis data lokal (*Application Layer Encryption*).
* **NFR-SEC-03:** Sistem harus beroperasi secara *Local-First*, sehingga data transaksi pengguna tersimpan di dalam perangkat lokal kecuali dihubungkan ke server eksternal atas izin pengguna.

### 5.2 Performance & Responsiveness
* **NFR-PER-01:** Pratinjau komponen UI dinamis (*Live Preview*) **harus** dirender kurang dari **200 md** setelah JSON skema selesai diproses oleh memori lokal.
* **NFR-PER-02:** Waktu respons perpindahan tema visual (Light -> Dark -> Auto) **harus** di bawah **50 md** tanpa mengalami *flicker* atau *re-render* penuh pada aplikasi.

### 5.3 Maintainability & Scalability
* **NFR-MNT-01:** Kode sumber menggunakan TypeScript secara menyeluruh (*strict mode*) pada kerangka kerja React Native (Expo SDK 51+).
* **NFR-MNT-02:** Arsitektur terbagi dengan jelas antara modul UI, Data Access Layer (DAL), AI Parser Engine, dan Workflow Execution Runtime.

---

## 6. DATA DICTIONARY & PHYSICAL DATABASE SCHEMA

Sistem menggunakan dua file basis data SQLite terpisah untuk menjaga isolasi metadata dan data operasional.

### 6.1 Database 1: `system_metadata.db`

#### 1. Table `public.user_schema_mappings`
Menyimpan pemetaan antara User ID dengan skema fisik terisolasi berformat UUID.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `user_id` | TEXT | PRIMARY KEY | ID unik pengguna |
| `schema_name` | TEXT | NOT NULL, UNIQUE | Nama skema acak berformat UUID v4 (misal: `usr_8f3a9b2c_4d1e_...`) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp registrasi pengguna |

#### 2. Table `ai_configs`
Menyimpan kredensial dan konfigurasi AI LLM per pengguna.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `user_id` | TEXT | FOREIGN KEY | ID Pemilik (referensi ke `user_schema_mappings`) |
| `provider_name` | TEXT | NOT NULL | Nama penyedia (OpenRouter, OpenAI, HuggingFace, dll.) |
| `base_url` | TEXT | NOT NULL | Base Endpoint URL API |
| `api_key` | TEXT | NOT NULL | API Key yang telah terenkripsi |
| `model_name` | TEXT | NOT NULL | Nama model LLM yang dipilih |
| `is_active` | INTEGER | DEFAULT 0 | Status aktif (1 = Aktif, 0 = Tidak) |

#### 3. Table `user_preferences`
Menyimpan konfigurasi aplikasi termasuk *Theme Engine*.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `user_id` | TEXT | PRIMARY KEY | ID Pemilik (referensi ke `user_schema_mappings`) |
| `theme_mode` | TEXT | DEFAULT 'auto' | Opsi tema (`light`, `dark`, `auto`) |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembaruan preferensi |

#### 4. Table `generated_pages`
Menyimpan metadata halaman UI yang telah dibuat oleh AI.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `user_id` | TEXT | NOT NULL | ID Pemilik |
| `page_title` | TEXT | NOT NULL | Judul/Nama Halaman |
| `page_type` | TEXT | NOT NULL | Jenis halaman (`MASTER`, `TRANSACTION`, `REPORT`) |
| `target_table` | TEXT | NOT NULL | Nama tabel target pada skema UUID milik user |
| `current_version` | INTEGER | DEFAULT 1 | Versi skema aktif |
| `is_published` | INTEGER | DEFAULT 0 | Status publikasi (1 = Published, 0 = Draft) |

#### 5. Table `workflows`
Menyimpan definisi logika *workflow* terstruktur.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `user_id` | TEXT | NOT NULL | ID Pemilik |
| `workflow_name` | TEXT | NOT NULL | Nama/Label Workflow |
| `trigger_type` | TEXT | NOT NULL | Pemicu (`FORM_EVENT`, `SCHEDULER`, `QUEUE`, `MANUAL`) |
| `trigger_config` | TEXT | NOT NULL | JSON Konfigurasi Trigger |
| `workflow_json` | TEXT | NOT NULL | Definisi langkah/node workflow dalam format JSON |

---

### 6.2 Database 2: `app_data.db` (Multi-Tenant User Schemas)

Di dalam `app_data.db`, tidak ada tabel bisnis global. Seluruh tabel dibuat secara dinamis di dalam skema khusus milik masing-masing pengguna berdasarkan `schema_name` UUID.

#### 1. Dynamic User Tables (Contoh pada Skema UUID User)
```sql
-- Contoh pembuat tabel otomatis oleh OctaPush Engine di dalam skema terisolasi pengguna:
CREATE TABLE IF NOT EXISTS "usr_8f3a9b2c_4d1e_4567_89ab_cdef01234567"."tbl_penjualan" (
  "id" TEXT PRIMARY KEY,
  "no_faktur" TEXT NOT NULL,
  "total_bayar" REAL NOT NULL,
  "diskon" REAL DEFAULT 0,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Table `"schema_uuid"`.`workflow_task_queue`
Antrean tugas lokal untuk eksekusi workflow latar belakang per user.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `workflow_id` | TEXT | NOT NULL | Referensi ID Workflow pada `system_metadata.db` |
| `payload_json` | TEXT | NOT NULL | Data input pemicu eksekusi |
| `status` | TEXT | DEFAULT 'PENDING' | Status antrean (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`) |
| `retry_count` | INTEGER | DEFAULT 0 | Jumlah percobaan ulang jika gagal |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pendaftaran tugas |

#### 3. Table `"schema_uuid"`.`workflow_execution_logs`
Riwayat eksekusi logika bisnis per user.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `workflow_id` | TEXT | NOT NULL | Referensi ID Workflow |
| `status` | TEXT | NOT NULL | Hasil eksekusi (`SUCCESS` / `FAILED`) |
| `execution_time_ms` | INTEGER | NOT NULL | Durasi pemrosesan dalam milidetik |
| `log_details` | TEXT | NULLABLE | Detail JSON langkah eksekusi atau pesan kesalahan |
| `executed_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp eksekusi |

---

## 7. JSON SCHEMA STANDARD (GENERATION OUTPUT)

Setiap luaran dari AI Generator **wajib** mematuhi spesifikasi standar JSON berikut agar dapat diproses oleh Studio dan Runtime Engine OctaPush:

```json
{
  "$schema": "https://octapush.dev/schemas/v1/generation.json",
  "page_title": "Transaksi Penjualan",
  "page_type": "TRANSACTION",
  "target_table": "tbl_penjualan",
  "layout": {
    "sections": [
      {
        "title": "Header Penjualan",
        "fields": [
          {
            "name": "no_faktur",
            "label": "No Faktur",
            "component": "TextInput",
            "required": true,
            "default_value": ""
          },
          {
            "name": "total_bayar",
            "label": "Total Bayar",
            "component": "NumberInput",
            "required": true,
            "default_value": 0
          }
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
```

---

## 8. TECHNICAL STACK & DEPENDENCY MAPPING

| Layer / Module | Technology Selected | Version / Specification |
|---|---|---|
| **Core Mobile/Web Framework** | React Native / Expo SDK | SDK 51+ (TypeScript Strict Mode) |
| **Theme & UI Library** | React Native Paper / Gluestack UI | Integrated with `useColorScheme` Hook |
| **State Management** | Zustand | Global State for Theme & AI Studio Session |
| **Database Engine** | `expo-sqlite` | Dual Connection Driver with Multi-Schema Support |
| **Tenant Isolation Engine** | OctaPush DAL (Data Access Layer) | Dynamic Query Builder with UUID Schema Resolver |
| **Background Processing** | `expo-task-manager` & `expo-background-fetch` | Cron Scheduler & Task Queue Worker |
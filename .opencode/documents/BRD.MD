# BUSINESS REQUIREMENT DOCUMENT (BRD)

**Project Name:** OctaPush Platform  
**Document Version:** 1.3.0  
**Status:** Approved / Baseline  
**Target Platform:** Cross-Platform (Web, Android, iOS)  

---

## 1. DOCUMENT CONTROL & REVISION HISTORY

| Version | Date | Author | Description of Changes |
|---|---|---|---|
| 1.0.0 | 25 Aug 2026 | System Architect / PM | Initial comprehensive BRD creation based on baseline PRD v1.4.0 (OctaPush Core Features, Theme Engine, Dual SQLite, and Multi-Tenant Schema Isolation). |
| 1.1.0 | 25 Aug 2026 | System Architect / PM | Database migration dari Dual SQLite ke Supabase PostgreSQL (4 schema: `logic_dev`, `data_dev`, `logic_prod`, `data_prod`), penambahan Google Authentication, Project Management, dan Dev-to-Prod Promotion. |
| 1.2.0 | 25 Aug 2026 | System Architect / PM | Penambahan: Schema Evolution & Migration (re-push DEV→PROD, form evolution), SQL Guard untuk `EXECUTE_SQL`, project hard-delete & cleanup, session lifecycle, Generated App Distribution (end-user access), File Attachment Storage, Quota & Rate Limiting, Observability/Audit, Backup & PITR. |
| 1.3.0 | 25 Aug 2026 | System Architect / PM | Penambahan: Security Hardening (anti-cheat/anti-abuse, XSS protection, input sanitization, CSRF/CSP — melengkapi SQL Guard & RLS), Internationalization/i18n 2 bahasa (`id` & `en`) untuk aplikasi hasil generasi, mandat try-catch pada seluruh kode (Exception Handling Policy), Centralized Error Log (`public.error_logs`) untuk tracing & triage error user, Realtime Sync, Multi-User Project Collaboration, dan Template Marketplace. |

---

## 2. EXECUTIVE SUMMARY

### 2.1 Project Background
Pengembangan aplikasi internal enterprise (seperti form input data master, modul transaksi, dan pemrosesan laporan) sering kali mengalami *bottleneck* pada proses *UI prototyping*, penyusunan skema basis data, dan penulisan logika bisnis pendukung (*workflow*). Pendekatan *no-code/low-code* tradisional sering kali terlalu kaku, tidak memiliki *theme engine* yang adaptif, serta mencampur data antarpengguna (*multi-tenant data leakage*) dalam satu basis data publik.

**OctaPush** hadir sebagai platform *AI-Driven Dynamic UI, Form Generator, & Workflow Engine* lintas platform yang berbasis *Cloud Database Architecture* (PostgreSQL di Supabase). OctaPush memungkinkan pengguna untuk membuat, menguji, merevisi, dan mengeksekusi aplikasi bisnis secara instan menggunakan instruksi teks alami (*natural language prompts*).

### 2.2 Business Objectives
* **Meningkatkan Kecepatan Pembuatan UI & Workflow (Velocity):** Mengurangi waktu pengodean antarmuka dan *backend workflow* dari hitungan hari menjadi hitungan detik.
* **Isolasi Data Tingkat Tinggi (Zero Data Leakage):** Menerapkan mekanisme pemisahan logis pada satu klaster Supabase PostgreSQL menggunakan 4 skema terpisah (`logic_dev`, `data_dev`, `logic_prod`, `data_prod`) dengan konvensi penamaan objek berbasis `{8_digit_user_short_uuid}_{8digit_project_uuid}_{objek_db_name}` untuk setiap pengguna dan proyek (*multi-tenant security*).
* **Pemisahan Desain & Data Aplikasi (Logic vs Data):** Memisahkan tegas artefak desain aplikasi hasil generasi AI (kode, konfigurasi, form) ke dalam *Logic Schema* dan data operasional aplikasi ke dalam *Data Schema*, masing-masing dengan varian DEV dan PROD.
* **Manajemen Siklus Hidup Aplikasi (Dev-to-Prod Promotion):** Pengguna dapat mendorong aplikasi yang sudah final dari environment DEV ke PROD melalui proses *clone struktur DB*, tanpa menyalin data operasional.
* **Adaptabilitas Visual & UX Fleksibel:** Menyediakan antarmuka yang mendukung *Theme Engine* adaptif (Light, Dark, Auto System) pada seluruh komponen bawaan maupun komponen dinamis hasil generator AI.
* **Kemandirian Infrastruktur AI (Multi-Provider AI Agnostic):** Menghindari *vendor lock-in* dengan mendukung berbagai penyedia model LLM (OpenRouter, HuggingFace, OpenAI, Ollama Proxy, LiteLLM, dll.).
* **Keamanan Berlapis (Defense-in-Depth Security):** Melindungi platform dan aplikasi hasil generasi dari serangan umum — SQL injection, XSS, CSRF, otomasi/abuse, dan manipulasi klien (*anti-cheat*) — melalui kombinasi SQL Guard, sanitization, RLS, dan rate limiting.
* **Jangkauan Pengguna Global (Multi-Language Reach):** Aplikasi hasil generasi mendukung multi bahasa sehingga end-user dapat menggunakan aplikasi dalam locale masing-masing.
* **Reliabilitas & Traceability Error:** Seluruh kode wajib menerapkan *exception handling* terstruktur (try-catch) dan seluruh error terekam pada log terpusat yang dapat di-trace per user/proyek sebagai dasar perbaikan cepat.

---

## 3. BUSINESS PROCESS & SYSTEM FLOW

### 3.1 High-Level Architecture Flow

```text
 ┌─────────────────────────────────────────────────────────┐
 │        Google Auth Login & Project Management           │
 │              (Supabase Auth + Project Page)             │
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
                              ▼ (User Approves & Clicks "Publish")
 ┌─────────────────────────────────────────────────────────┐
 │          Supabase PostgreSQL (Single Cluster)           │
 ├──────────────────────────┬──────────────────────────────┤
 │ Schema: logic_dev        │ Schema: data_dev             │
 │ - public.projects (reg.) │ - {usr8}_{prj8}_tbl_business │
 │ - {usr8}_{prj8}_pages,   │ - {usr8}_{prj8}_task_queue   │
 │   workflows, configs     │ - {usr8}_{prj8}_exec_logs    │
 ├──────────────────────────┼──────────────────────────────┤
 │ Schema: logic_prod       │ Schema: data_prod            │
 │ - (cloned structure      │ - (cloned structure from     │
 │   via Dev→Prod Push)     │   data_dev via Dev→Prod Push)│
 └──────────────────────────┴──────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │              OctaPush Workflow Engine                   │
 │ (Form Triggers | Cron Scheduler | Task Queue Executor)  │
 └─────────────────────────────────────────────────────────┘
```

### 3.2 End-to-End Business Flow

1. **Authentication & Project Onboarding:**
   * Pengguna masuk ke dalam aplikasi menggunakan **Google Authentication** (Supabase Auth).
   * Setelah login, pengguna diarahkan ke halaman **Project Management** untuk membuat atau memilih proyek.
   * Saat proyek baru dibuat, sistem menerbitkan `user_short_uuid` (8 digit) dan `project_uuid` (8 digit), lalu mencatatnya pada tabel `public.projects` dan menyediakan objek-objek awal pada skema `logic_dev` / `data_dev`.
2. **AI Provider Configuration & Theme Setting:**
   * Pengguna mengonfigurasi penyedia LLM (API Key, Base URL, Model Name) dan memilih mode tema (Light, Dark, atau Auto).
3. **Prompt & Iterative UI/Workflow Generation:**
   * Pengguna memasukkan instruksi teks pada OctaPush Studio (misal: *"Buatkan form transaksi penjualan beserta workflow potong stok"*).
   * AI mengembalikan respons terstruktur berformat JSON (mengandung instruksi *layout UI* dan *workflow node*).
   * Sandbox merender *Live Preview* secara bersisian (*split view*) menggunakan tema visual aktif. Pengguna dapat melakukan iterasi percakapan untuk penyempurnaan UI/Workflow.
4. **Publishing & Dynamic DDL Execution (DEV):**
   * Ketika pengguna menekan **Publish**, sistem membaca `target_table` dan mengeksekusi perintah DDL (`CREATE TABLE IF NOT EXISTS`) pada skema `logic_dev` / `data_dev` di Supabase PostgreSQL, dengan nama objek berkualifikasi `{8_digit_user_short_uuid}_{8digit_project_uuid}_{objek_db_name}`.
5. **Runtime Execution & Workflow Handling:**
   * Saat form diisi dan dikirim (`ON_SUBMIT`), *Event-Driven Workflow Engine* mengeksekusi instruksi logika (seperti `CONDITION`, `EXECUTE_SQL`, atau `LOCAL_NOTIFICATION`) secara terisolasi pada objek milik proyek aktif di environment DEV.
6. **Dev-to-Prod Promotion:**
   * Ketika aplikasi dinyatakan final, pengguna menekan **Push to PROD** pada halaman Project Management.
   * Sistem melakukan *clone struktur DB* (tabel, view, function/procedure, constraint) dari `logic_dev`/`data_dev` ke `logic_prod`/`data_prod` — struktur saja (*structure-only clone*), tanpa menyalin data operasional.

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 Module 1: Authentication & Project Management
* **FR-AUT-01 (Google Authentication):** Sistem **wajib** menyediakan proses login menggunakan **Google Auth** (via Supabase Auth) sebagai satu-satunya mekanisme autentikasi pada fase awal.
* **FR-AUT-02 (Session & Identity Mapping):** Setiap sesi login yang valid **wajib** menghasilkan identitas `user_id` (dari Supabase Auth) yang terhubung ke `user_short_uuid` (8 digit) pada tabel `public.users`.
* **FR-AUT-03 (Session Lifecycle):** Sistem **wajib** menyediakan logout, refresh token otomatis, dan pencabutan sesi per perangkat (*device/session revoke*) melalui Supabase Auth.
* **FR-PRJ-01 (Project Management Page):** Sistem **wajib** menyediakan halaman untuk membuat, melihat, memilih, mengubah nama, dan menghapus proyek milik pengguna yang sedang login.
* **FR-PRJ-02 (Project Provisioning):** Saat proyek baru dibuat, sistem **wajib** menerbitkan `project_uuid` (8 digit unik per user) dan mencatatnya pada tabel `public.projects`, serta menyiapkan struktur awal objek internal pada skema `logic_dev` dan `data_dev`.
* **FR-PRJ-03 (Environment Promotion / Push to PROD):** Sistem **wajib** menyediakan aksi *Push to PROD* yang melakukan *clone struktur DB* dari `logic_dev`/`data_dev` ke `logic_prod`/`data_prod` untuk proyek terkait, tanpa menyalin data operasional.
* **FR-PRJ-04 (Project Deletion & Cleanup):** Penghapusan proyek dimulai sebagai *soft-delete*; sistem **wajib** menyediakan proses *hard-delete* terjadwal (grace period minimal 30 hari) yang membersihkan seluruh objek `{prefix}_*` dari keempat skema beserta entri registry-nya, dengan konfirmasi destruktif eksplisit dari pemilik.

### 4.2 Module 2: Multi-Tenant Security & Schema Isolation
* **FR-SEC-01 (Dual Schema Separation):** Sistem **wajib** memisahkan artefak desain aplikasi (kode, konfigurasi, form) ke skema **Logic** (`logic_dev`/`logic_prod`) dan data operasional aplikasi ke skema **Data** (`data_dev`/`data_prod`) di satu klaster Supabase PostgreSQL.
* **FR-SEC-02 (Ownership Naming Convention):** Seluruh objek DB milik aplikasi hasil generasi (table, store proc/function, view, dll.) **wajib** menggunakan format `{8_digit_user_short_uuid}_{8digit_project_uuid}_{objek_db_name}`.
* **FR-SEC-03 (Mandatory DAL Access):** Seluruh akses database oleh aplikasi hasil generasi — baik environment DEV maupun PROD — **wajib** dirutekan melalui **OctaPush Data Access Layer (DAL)**. Aplikasi hasil generasi **dilarang** menyimpan atau menggunakan kredensial/koneksi langsung ke Supabase (termasuk anon key, service key, maupun connection string) untuk mengakses `data_dev`/`data_prod` secara langsung.
* **FR-SEC-04 (Data Access Layer Isolation):** Semua eksekusi perintah DDL dan DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) di dalam DAL **wajib** menggunakan kualifikasi nama objek lengkap (`{schema_env}.{user8}_{prj8}_{object}`) yang diregistrasi pada `public.projects`, dan **wajib** dilindungi oleh kebijakan Row Level Security (RLS) berbasis klaim JWT (`user_id`) sehingga user/kode tidak dapat mengonsumsi objek milik user lain.
* **FR-SEC-05 (SQL Guard):** Node `EXECUTE_SQL` pada Workflow Engine **wajib** melewati *SQL Guard*: parser yang memvalidasi hanya verb terizinkan (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), menolak DDL/DCL (`DROP`, `ALTER`, `TRUNCATE`, `GRANT`, dll.), memastikan seluruh objek yang direferensikan berprefiks `{usr8}_{prj8}_`, dan menolak multi-statement. Pelanggaran menghentikan eksekusi dan tercatat sebagai security event.
* **FR-SEC-06 (XSS & Input Sanitization):** Seluruh input pengguna — baik di Studio maupun aplikasi hasil generasi — **wajib** disanitasi (*sanitization*) dan di-*escape* saat dirender; field attachment divalidasi berdasarkan MIME type & ukuran; respons API menggunakan Content-Type ketat. Renderer komponen dinamis **wajib** merender konten sebagai data, bukan HTML mentah.
* **FR-SEC-07 (Anti-Cheat & Abuse Protection):** Sistem **wajib** melindungi form/workflow dari manipulasi klien: validasi ulang seluruh payload di sisi server (never trust client), CSRF token untuk endpoint mutating, security headers (CSP, HSTS, X-Frame-Options) pada app runtime, deteksi automasi/abuse (velocity check per IP/device/session), dan *server-side revalidation* untuk semua kalkulasi yang bersifat bisnis-kritis.

### 4.3 Module 3: System Settings & Theme Engine
* **FR-THM-01 (Theme Options):** Sistem **wajib** menyediakan 3 pilihan preferensi tema visual:
  1. `light`: Tampilan terang kontras tinggi.
  2. `dark`: Tampilan gelap hemat energi.
  3. `auto`: Mengikuti konfigurasi preferensi OS bawaan (*System Default*).
* **FR-THM-02 (Dynamic Palette Propagation):** Semua komponen UI bawaan dan komponen dinamis hasil generator AI **wajib** mengonsumsi variabel token warna yang sama dari *Theme Provider*.
* **FR-THM-03 (Persistence):** Preferensi tema pengguna **wajib** disimpan pada tabel `user_preferences` di schema `public` pada Supabase dan diterapkan secara instan saat aplikasi dibuka kembali.

### 4.4 Module 4: AI Provider Configurator
* **FR-AIC-01 (Multi-Provider Support):** Sistem **wajib** mendukung koneksi ke penyedia AI generatif standar OpenAPI/REST API (OpenRouter, HuggingFace, OpenAI, Ollama Proxy, LiteLLM).
* **FR-AIC-02 (Key Encryption):** API Key penyedia AI **wajib** dienkripsi sebelum disimpan ke dalam tabel `ai_configs` di schema `public` pada Supabase.
* **FR-AIC-03 (Connectivity Tester):** Sistem **harus** menyediakan tombol uji koneksi (*Test Connection*) untuk memvalidasi kredensial API Key dan endpoint sebelum disimpan.

### 4.5 Module 5: OctaPush Generation Studio
* **FR-STU-01 (Dual-Pane / Split-View Interface):** Antarmuka studio **wajib** menyediakan area obrolan AI (*Chat Refinement*) dan area pratinjau langsung (*Live Theme-Aware Preview*) secara bersisian pada desktop, atau *tab-sheet layout* pada perangkat seluler.
* **FR-STU-02 (Schema Versioning):** Setiap kali AI memberikan rekomendasi skema UI/Workflow baru, sistem **wajib** mencatat versi skema tersebut pada tabel `{usr8}_{prj8}_page_schema_versions` di `logic_dev` sehingga pengguna dapat melakukan *rollback* ke versi sebelumnya.
* **FR-STU-03 (Theme-Aware Live Rendering):** Pratinjau langsung UI **wajib** secara otomatis berganti skema warna secara instan jika pengguna mengubah tema visual di *Settings*.

### 4.6 Module 6: Dynamic Runtime & Event-Driven Workflow Engine
* **FR-WFE-01 (Trigger Handlers):** Workflow Engine **wajib** dapat menangkap *pemicu* eksekusi berdasarkan:
  * `FORM_EVENT` (`ON_SUBMIT`, `ON_CHANGE`).
  * `SCHEDULER` (Cron expression lokal).
  * `QUEUE` (Task Queue execution via Supabase).
  * `MANUAL` (Tombol eksekusi langsung).
* **FR-WFE-02 (Node Operations):** Workflow Engine **wajib** mendukung node pemrosesan logika berikut:
  * `CONDITION`: Evaluasi ekspresi boolean (misal: `payload.total_bayar > 1000000`).
  * `EXECUTE_SQL`: Eksekusi perintah SQL dinamis pada objek milik proyek aktif di `data_dev` (atau `data_prod` bila runtime berjalan di environment PROD).
  * `CALCULATION`: Operasi Aritmatika dan manipulasi variabel data.
  * `LOCAL_NOTIFICATION`: Menampilkan notifikasi lokal pada perangkat pengguna.
* **FR-WFE-03 (Execution Logging):** Setiap eksekusi *workflow* **wajib** mencatat riwayat hasil eksekusi (`SUCCESS` / `FAILED`), durasi eksekusi (ms), dan detail log pada tabel `{usr8}_{prj8}_workflow_execution_logs` di skema Data environment terkait.

### 4.7 Module 7: Schema Evolution & Dev-to-Prod Migration
* **FR-MIG-01 (Re-Push / Structural Diff):** Sistem **wajib** mendukung *Push to PROD* berulang: perubahan struktur di DEV dideteksi sebagai *diff* dan diterapkan ke PROD dalam bentuk migration (`ALTER TABLE ADD/DROP/ALTER COLUMN`, pembuatan objek baru) — bukan clone ulang dari nol.
* **FR-MIG-02 (Migration Preview & Confirmation):** Sebelum migration dieksekusi, sistem **wajib** menampilkan ringkasan perubahan (objek baru/diubah/dihapus) dan meminta konfirmasi eksplisit dari pemilik proyek; operasi destruktif (drop column/type change berisiko data loss) ditandai khusus.
* **FR-MIG-03 (Form Evolution):** Perubahan definisi form yang memengaruhi `target_table` **wajib** menghasilkan rencana migrasi kolom otomatis (tambah kolom = aman; rename/hapus/tipe berubah = butuh konfirmasi + strategi penanganan data existing).
* **FR-MIG-04 (PROD Rollback):** Setiap eksekusi migration ke PROD **wajib** mencatat snapshot struktur sebelumnya sehingga struktur PROD dapat dikembalikan (*rollback*) ke kondisi sebelum migration.

### 4.8 Module 8: Generated App Distribution & End-User Access
* **FR-DST-01 (App Publishing Modes):** Proyek yang sudah ada di PROD **wajib** dapat dipublikasikan kepada pengguna akhir melalui salah satu mode akses: (1) *Public Link* (tanpa login), (2) *Restricted* (end-user login via Google Auth), atau (3) *Private* (hanya pemilik).
* **FR-DST-02 (End-User Identity):** Identitas end-user dipisahkan dari identitas builder; sesi end-user tetap membawa klaim JWT namun dengan konteks `access_scope` yang membatasi akses hanya pada runtime aplikasi terkait, bukan Studio.
* **FR-DST-03 (Runtime via DAL):** Seluruh aktivitas end-user pada aplikasi hasil generasi **wajib** dirutekan melalui OctaPush DAL dengan aturan isolasi yang sama (prefiks proyek + RLS).

### 4.9 Module 9: Storage, Quota & Observability
* **FR-STO-01 (File Attachment Storage):** Form hasil generasi **wajib** mendukung field attachment yang disimpan di Supabase Storage dengan path berprefiks `{usr8}_{prj8}/...`; akses file tunduk pada RLS bucket policy yang sama dengan isolasi DB.
* **FR-QTA-01 (Quota Enforcement):** Sistem **wajib** menegakkan kuota per user: jumlah proyek aktif, total ukuran DB (`data_dev`+`data_prod`), jumlah attachment, dan rate limit permintaan DAL. Pelanggaran kuota menghasilkan error terstruktur (`ERR_QTA_009`).
* **FR-OBS-01 (Audit & Observability):** Sistem **wajib** mencatat audit log untuk seluruh operasi DDL, Push to PROD, migration, hard-delete, dan event RLS rejection pada tabel `public.audit_logs`, serta menyediakan dashboard metrik eksekusi workflow dan health DAL.
* **FR-OPS-01 (Backup & Recovery):** Data PROD **wajib** dilindungi kebijakan backup Supabase (PITR minimal 7 hari); prosedur restore terdokumentasi dan diuji secara berkala.
* **FR-ERR-01 (Centralized Error Log):** Sistem **wajib** menyediakan tabel `public.error_logs` tunggal yang menampung seluruh error dari semua sumber (client, DAL, workflow engine, AI provider, DB) beserta konteks tracing (`user_id`, `project_id`, environment, session/request id, severity, stack trace, context JSONB).
* **FR-ERR-02 (Error Tracing per User/Project):** Sistem **wajib** menyediakan tampilan tracing yang memungkinkan pemilik/platform menelusuri riwayat error yang dialami user/proyek tertentu — terfilter per severity, source, dan rentang waktu — dengan pengelompokan berdasarkan *fingerprint* error.
* **FR-ERR-03 (Error Triage Workflow):** Setiap entri error **wajib** memiliki status siklus hidup (`OPEN` → `INVESTIGATING` → `RESOLVED`/`IGNORED`) lengkap dengan catatan resolusi, sehingga perbaikan dapat dieksekusi langsung berdasarkan informasi log.

### 4.10 Module 10: Internationalization (i18n)
* **FR-I18N-01 (Supported Locales):** Untuk fase awal, aplikasi hasil generasi mendukung tepat 2 locale: `id` (Bahasa Indonesia, default) dan `en` (English).
* **FR-I18N-02 (Generated App Translation):** AI Generator **dapat** menghasilkan blok `"i18n"` pada JSON skema (label, placeholder, pesan notifikasi) untuk kedua locale; string tersimpan pada tabel `{usr8}_{prj8}_app_translations` di skema Logic dan dikelola/diedit oleh builder.
* **FR-I18N-03 (Runtime Locale Resolution):** Runtime end-user **wajib** merender label/pesan sesuai locale pilihan end-user dengan fallback ke default (`id`) bila key/locale tidak tersedia; preferensi locale end-user tersimpan di sisi klien.
* **FR-I18N-04 (Platform UI Locale):** Antarmuka OctaPush sendiri (Studio, Project Management, Settings) **wajib** tersedia dalam `id` dan `en`.

### 4.11 Module 11: Realtime Sync, Collaboration & Marketplace
* **FR-RTM-01 (Realtime Data Sync):** Form/data aplikasi hasil generasi **wajib** mendukung update realtime (via Supabase Realtime) pada objek milik proyek terkait, dengan aturan prefiks + RLS yang sama; perubahan antar sesi/end-user tampil tanpa refresh manual.
* **FR-COL-01 (Multi-User Project Collaboration):** Proyek **wajib** dapat mengundang kolaborator lain dengan role (`owner`, `editor`, `viewer`); RLS dan DAL memvalidasi keanggotaan via tabel `public.project_members`; presence indicator menampilkan kolaborator yang sedang aktif di Studio.
* **FR-MKT-01 (Template Marketplace):** Builder **wajib** dapat mengekspor proyek (struktur Logic: halaman, workflow, translations) sebagai template publik/private, dan pengguna lain dapat menginstalnya — sistem melakukan clone struktur template ke prefix proyek baru penerima; template mencatat metadata (nama, deskripsi, versi, author).

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Security & Data Privacy
* **NFR-SEC-01:** Tidak ada kueri dari satu user/proyek yang boleh menyentuh objek DB milik user/proyek lain — ditegakkan melalui konvensi nama `{user8}_{prj8}_*`, Row Level Security (RLS) berbasis klaim JWT Supabase Auth, dan validasi kepemilikan di DAL.
* **NFR-SEC-02:** Data sensitif seperti API Key AI **harus** dienkripsi (*Application Layer Encryption*) sebelum disimpan ke Supabase.
* **NFR-SEC-03:** Autentikasi **wajib** melewati Supabase Auth (Google OAuth); seluruh akses database membawa JWT sesi login sehingga kebijakan RLS dapat memverifikasi identitas pemilik objek.
* **NFR-SEC-04:** Environment PROD (`logic_prod`/`data_prod`) hanya boleh dimodifikasi melalui proses *Push to PROD* yang terekam audit-nya; operasi DDL manual langsung ke PROD dari sisi klien **dilarang**.
* **NFR-SEC-05:** Kredensial database Supabase (service key/connection string) hanya boleh berada di sisi server DAL OctaPush dan tidak pernah diekspos ke klien maupun dibundel ke dalam aplikasi hasil generasi.

### 5.2 Performance & Responsiveness
* **NFR-PER-01:** Pratinjau komponen UI dinamis (*Live Preview*) **harus** dirender kurang dari **200 md** setelah JSON skema selesai diproses oleh memori lokal.
* **NFR-PER-02:** Waktu respons perpindahan tema visual (Light -> Dark -> Auto) **harus** di bawah **50 md** tanpa mengalami *flicker* atau *re-render* penuh pada aplikasi.
* **NFR-PER-03 (Scalability Benchmark Gate):** Sebelum pengembangan fase lanjutan (di atas fondasi Auth/DAL/RLS), sistem **wajib** lulus benchmark simulasi beban penuh: overhead RLS ≤ 20 md tambahan pada p95 untuk query by-PK; simulasi 1.000 proyek terprovision tanpa degradasi katalog signifikan (< 10%); provisioning 50 proyek paralel selesai < 30 detik tanpa deadlock. Hasil benchmark menjadi dasar keputusan strategi policy RLS dan kapasitas objek dinamis.

### 5.3 Maintainability & Scalability
* **NFR-MNT-01:** Kode sumber menggunakan TypeScript secara menyeluruh (*strict mode*) pada kerangka kerja React Native (Expo SDK 51+).
* **NFR-MNT-02:** Arsitektur terbagi dengan jelas antara modul UI, Data Access Layer (DAL), AI Parser Engine, dan Workflow Execution Runtime.
* **NFR-MNT-03:** Kontrak API DAL didokumentasikan secara formal (endpoint, format request/response, error codes, idempotency, pagination) dan di-*versioning*.
* **NFR-MNT-04 (Exception Handling Policy / Mandatory Try-Catch):** Seluruh kode yang ditulis — baik kode platform OctaPush maupun artefak logika yang dihasilkan engine — **wajib** membungkus operasi berisiko dalam `try-catch`; dilarang *empty catch*; setiap catch **wajib** mencatat error ke Centralized Error Log (`public.error_logs`) sebelum rethrow sebagai typed error atau penanganan yang eksplisit. Aturan lengkap di FSD §7.

### 5.4 Operations & Reliability
* **NFR-OPS-01:** Seluruh operasi database terstruktur (DDL, migration, promotion) terekam pada audit log yang immutable (append-only).
* **NFR-OPS-02:** Data PROD dilindungi backup otomatis dengan PITR minimal 7 hari; target RTO/RPO restore terdokumentasi.
* **NFR-OPS-03:** Metrik kunci (latency DAL, tingkat kegagalan workflow, RLS rejection, pemakaian kuota) tersedia untuk monitoring dan alerting.

---

## 6. DATA DICTIONARY & PHYSICAL DATABASE SCHEMA

Sistem menggunakan satu klaster **PostgreSQL di Supabase** dengan 4 skema environment: `logic_dev`, `data_dev` (untuk pengembangan), serta `logic_prod`, `data_prod` (hasil *Push to PROD*). Seluruh objek DB milik aplikasi hasil generasi (table, store proc/function, view, dll.) **wajib** memakai format `{8_digit_user_short_uuid}_{8digit_project_uuid}_{objek_db_name}` (contoh: `u1a2b3c4_p9f8e7d6_tbl_penjualan`). Isolasi antar user/proyek ditegakkan melalui Row Level Security (RLS) berbasis klaim JWT Supabase Auth.

### 6.1 Schema `public` (Platform Registry & User-Level Metadata)

#### 1. Table `public.users`
Registry pengguna platform, tersinkronisasi dengan Supabase Auth.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `user_id` | UUID | PRIMARY KEY | ID dari Supabase Auth (`auth.users.id`) |
| `email` | TEXT | NOT NULL | Email Google terverifikasi |
| `display_name` | TEXT | NULLABLE | Nama tampilan pengguna |
| `user_short_uuid` | CHAR(8) | NOT NULL, UNIQUE | 8 digit short UUID acak untuk prefiks penamaan objek |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Timestamp registrasi pengguna |

#### 2. Table `public.projects`
Mapping user ↔ project dan status environment proyek.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | UUID v4 internal |
| `user_id` | UUID | FOREIGN KEY → `public.users(user_id)` | Pemilik proyek |
| `project_name` | TEXT | NOT NULL | Nama proyek yang ditampilkan |
| `project_uuid` | CHAR(8) | NOT NULL, UNIQUE per user | 8 digit project UUID untuk prefiks penamaan objek |
| `object_prefix` | TEXT | NOT NULL, UNIQUE | Hasil gabungan `{user_short_uuid}_{project_uuid}` |
| `is_pushed_to_prod` | BOOLEAN | DEFAULT false | Status apakah struktur sudah di-clone ke PROD |
| `prod_pushed_at` | TIMESTAMPTZ | NULLABLE | Waktu Push to PROD terakhir |
| `is_deleted` | BOOLEAN | DEFAULT false | Flag soft-delete |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Timestamp pembuatan proyek |

#### 3. Table `ai_configs`
Menyimpan kredensial dan konfigurasi AI LLM per pengguna.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | UUID v4 |
| `user_id` | UUID | FOREIGN KEY → `public.users(user_id)` | ID Pemilik |
| `provider_name` | TEXT | NOT NULL | Nama penyedia (OpenRouter, OpenAI, HuggingFace, dll.) |
| `base_url` | TEXT | NOT NULL | Base Endpoint URL API |
| `api_key` | TEXT | NOT NULL | API Key yang telah terenkripsi |
| `model_name` | TEXT | NOT NULL | Nama model LLM yang dipilih |
| `is_active` | BOOLEAN | DEFAULT false | Status aktif |

#### 4. Table `user_preferences`
Menyimpan konfigurasi aplikasi termasuk *Theme Engine*.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `user_id` | UUID | PRIMARY KEY, FK → `public.users(user_id)` | ID Pemilik |
| `theme_mode` | TEXT | DEFAULT 'auto' | Opsi tema (`light`, `dark`, `auto`) |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Waktu pembaruan preferensi |

---

### 6.2 Schema `logic_dev` / `logic_prod` (Artefak Desain Aplikasi per Proyek)

Berisi kode, konfigurasi, form, dan seluruh artefak desain aplikasi hasil generasi AI. Objek dibuat dinamis dengan prefiks `{usr8}_{prj8}_`.

#### 1. Table `{usr8}_{prj8}_generated_pages`
Metadata halaman UI yang telah dibuat oleh AI.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | UUID v4 |
| `page_title` | TEXT | NOT NULL | Judul/Nama Halaman |
| `page_type` | TEXT | NOT NULL | Jenis halaman (`MASTER`, `TRANSACTION`, `REPORT`) |
| `target_table` | TEXT | NOT NULL | Nama tabel logis target pada skema Data (`{usr8}_{prj8}_{nama}`) |
| `current_version` | INTEGER | DEFAULT 1 | Versi skema aktif |
| `is_published` | BOOLEAN | DEFAULT false | Status publikasi (Published / Draft) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Timestamp pembuatan |

#### 2. Table `{usr8}_{prj8}_workflows`
Definisi logika *workflow* terstruktur.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | UUID v4 |
| `workflow_name` | TEXT | NOT NULL | Nama/Label Workflow |
| `trigger_type` | TEXT | NOT NULL | Pemicu (`FORM_EVENT`, `SCHEDULER`, `QUEUE`, `MANUAL`) |
| `trigger_config` | JSONB | NOT NULL | Konfigurasi Trigger |
| `workflow_json` | JSONB | NOT NULL | Definisi langkah/node workflow |

---

### 6.3 Schema `data_dev` / `data_prod` (Data Operasional Aplikasi per Proyek)

Tidak ada tabel bisnis global. Seluruh tabel bisnis, view, function, dan queue/log dibuat dinamis dengan prefiks `{usr8}_{prj8}_`.

#### 1. Dynamic Business Tables
```sql
-- Contoh DDL otomatis oleh OctaPush Engine di data_dev:
-- object_prefix = "u1a2b3c4_p9f8e7d6"
CREATE TABLE IF NOT EXISTS "data_dev"."u1a2b3c4_p9f8e7d6_tbl_penjualan" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "no_faktur" TEXT NOT NULL,
  "total_bayar" NUMERIC(18,2) NOT NULL,
  "diskon" NUMERIC(18,2) DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT now()
);
```

#### 2. Table `{usr8}_{prj8}_workflow_task_queue`
Antrean tugas untuk eksekusi workflow latar belakang.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | UUID v4 |
| `workflow_id` | UUID | NOT NULL | Referensi workflow pada skema Logic |
| `payload_json` | JSONB | NOT NULL | Data input pemicu eksekusi |
| `status` | TEXT | DEFAULT 'PENDING' | Status antrean (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`) |
| `retry_count` | INTEGER | DEFAULT 0 | Jumlah percobaan ulang jika gagal |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Waktu pendaftaran tugas |

#### 3. Table `{usr8}_{prj8}_workflow_execution_logs`
Riwayat eksekusi logika bisnis.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | UUID v4 |
| `workflow_id` | UUID | NOT NULL | Referensi ID Workflow |
| `status` | TEXT | NOT NULL | Hasil eksekusi (`SUCCESS` / `FAILED`) |
| `execution_time_ms` | INTEGER | NOT NULL | Durasi pemrosesan dalam milidetik |
| `log_details` | JSONB | NULLABLE | Detail langkah eksekusi atau pesan kesalahan |
| `executed_at` | TIMESTAMPTZ | DEFAULT now() | Timestamp eksekusi |

> **Catatan Push to PROD:** aksi *Push to PROD* melakukan *clone struktur saja* (DDL) dari objek `{usr8}_{prj8}_*` pada `logic_dev`/`data_dev` ke `logic_prod`/`data_prod`. Data operasional tidak ikut disalin.

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
| **Database Engine** | Supabase PostgreSQL | Single cluster, 4 environment schemas (`logic_dev`, `data_dev`, `logic_prod`, `data_prod`) |
| **Authentication** | Supabase Auth (Google OAuth) | Google login, JWT-based session untuk RLS |
| **Tenant Isolation Engine** | OctaPush DAL (Data Access Layer) + Postgres RLS | Object Prefix Resolver (`{user8}_{prj8}_`) + Row Level Security policies berbasis klaim JWT |
| **Background Processing** | Supabase Edge Functions / pg_cron & Task Queue Tables | Cron Scheduler & Task Queue Worker |
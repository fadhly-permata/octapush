# FUNCTIONAL SPECIFICATION DOCUMENT (FSD)

**Project Name:** OctaPush Platform  
**Document Version:** 1.3.0  
**Status:** Approved / Baseline  
**Target Platform:** Cross-Platform (Web, Android, iOS)  

---

## 1. DOCUMENT CONTROL & REVISION HISTORY

| Version | Date | Author | Description of Changes |
|---|---|---|---|
| 1.0.0 | 25 Aug 2026 | Lead System Architect | Initial Functional Specification Document (FSD) created directly mapped to BRD v1.0.0 and PRD v1.4.0 (Theme Engine, Multi-Tenant Schema Resolver, Dual SQLite Engine, Dynamic Studio, and Workflow Engine). |
| 1.1.0 | 25 Aug 2026 | Lead System Architect | Migrasi database ke Supabase PostgreSQL (skema `logic_dev`, `data_dev`, `logic_prod`, `data_prod`), konvensi nama objek `{user8}_{prj8}_{object}`, Google Authentication, Project Management, dan Push to PROD. |
| 1.2.0 | 25 Aug 2026 | Lead System Architect | Penambahan spesifikasi: Schema Evolution & Migration (structural diff, form evolution, rollback), SQL Guard, session lifecycle, hard-delete cleanup, Generated App Distribution (end-user access), Supabase Storage attachment, quota enforcement, audit log & observability, backup/PITR. |
| 1.3.0 | 25 Aug 2026 | Lead System Architect | Penambahan spesifikasi: Security Hardening (§3.9 — sanitization, XSS, CSRF/CSP, anti-abuse), i18n 2 bahasa `id`/`en` (§3.10), Centralized Error Log `public.error_logs` + tracing/triage (§3.8.5), Realtime Sync & Collaboration + Template Marketplace (§3.11), dan Coding Standards & Exception Handling Policy (§7). |

---

## 2. SYSTEM ARCHITECTURE & COMPONENT TOPOLOGY

### 2.1 Technical Architecture Diagram

```text
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                       OctaPush Client Application                       │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ ┌──────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐ │
 │ │ Auth & Project Mgmt  │  │ Dynamic UI Studio   │  │ Runtime Render   │ │
 │ │ (Google Login, Push) │  │ (Chat & Preview)    │  │ (Forms & Engine) │ │
 │ └──────────┬───────────┘  └──────────┬──────────┘  └────────┬─────────┘ │
 │ ┌──────────────────────┐                                              │
 │ │ System Settings      │                                              │
 │ │ (Theme & AI Config)  │                                              │
 │ └──────────┬───────────┘                                              │
 └────────────┼─────────────────────────┬────────────────────────────────┘
              │                         │
              ▼                         ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                   OctaPush Core Controller & DAL                        │
 ├────────────────────────────┬────────────────────────────────────────────┤
 │ - Supabase Auth Session    │ - Object Prefix Resolver ({usr8}_{prj8}_)  │
 │ - Theme Context Provider   │ - Dynamic DDL / Query Builder Engine       │
 │ - AI Provider Service      │ - RLS-Aware Query Guard                    │
 │ - State Engine (Zustand)   │ - Workflow Runtime & Task Queue Worker     │
 └────────────┬───────────────┴────────────────────────┬───────────────────┘
               │                                        │
               ▼                                        ▼
 ┌───────────────────────────┐            ┌────────────────────────────────┐
 │ Supabase PostgreSQL       │            │ Supabase PostgreSQL            │
 │ Schema: public            │            │ Schemas: logic_dev, data_dev,  │
 │ - users, projects         │            │ logic_prod, data_prod          │
 │ - ai_configs              │            │ - "{usr8}_{prj8}_pages"        │
 │ - user_preferences        │            │ - "{usr8}_{prj8}_tbl_business" │
 │                           │            │ - "{usr8}_{prj8}_queue/logs"   │
 └───────────────────────────┘            └────────────────────────────────┘
```

---

## 3. DETAILED MODULE FUNCTIONAL SPECIFICATIONS

### 3.1 Module 1: Authentication, Project Management & Multi-Tenant Isolation

#### 3.1.1 Overview
Mekanisme ini bertugas menjamin (a) setiap pengguna terautentikasi melalui **Google Auth** (Supabase Auth), (b) setiap proyek memiliki identitas unik yang menjadi prefiks seluruh objek DB-nya, dan (c) isolasi data mutlak antar user/proyek pada skema `logic_dev`/`data_dev`/`logic_prod`/`data_prod`.

#### 3.1.2 Google Authentication Flow
1. Pengguna menekan tombol **Sign in with Google**; aplikasi memanggil `supabase.auth.signInWithOAuth({ provider: 'google' })`.
2. Setelah callback sukses, sesi JWT tersimpan dan berisi klaim `sub` (= `user_id`).
3. `UserService.ensureRegistered()` melakukan *upsert* ke `public.users`: jika `user_id` belum ada, sistem menerbitkan `user_short_uuid` CHAR(8) acak unik (contoh: `u1a2b3c4`) dan menyimpannya.

#### 3.1.3 Project Management Flow
1. Setelah login, pengguna masuk ke halaman **Project Management**: daftar proyek miliknya dari `public.projects WHERE user_id = :current_user_id AND is_deleted = false`.
2. **Create Project:** sistem memvalidasi nama, menerbitkan `project_uuid` CHAR(8) acak unik per user (contoh: `p9f8e7d6`), menyimpan `object_prefix = '{user_short_uuid}_{project_uuid}'`, lalu menjalankan provisioning:
   * Membuat tabel internal awal pada `logic_dev`: `{prefix}_generated_pages`, `{prefix}_workflows`, `{prefix}_page_schema_versions`.
   * Membuat tabel internal awal pada `data_dev`: `{prefix}_workflow_task_queue`, `{prefix}_workflow_execution_logs`.
   * Memasang kebijakan RLS pada semua objek baru dengan predikat kepemilikan via `public.projects`.
3. **Select Project:** `project_id` aktif disimpan pada state global (Zustand); seluruh operasi DAL berikutnya menggunakan `object_prefix` proyek ini.
4. **Delete Project:** soft-delete (`is_deleted = true`).

#### 3.1.4 Dev-to-Prod Promotion Flow (Push to PROD)
Push pertama melakukan *structure-only clone*; push berikutnya dieksekusi sebagai *structural migration* — spesifikasi lengkap di §3.6.
1. Pengguna menekan **Push to PROD** pada halaman Project Management.
2. Sistem memanggil RPC `public.push_project_to_prod(project_id)` (*security definer*) yang:
   * Memverifikasi pemilik `project_id` terhadap klaim JWT.
   * **Push pertama:** kloning struktur setiap objek `{prefix}_*` dari `logic_dev` → `logic_prod` dan `data_dev` → `data_prod` — DDL saja (tabel, view, function/procedure, constraint, index) tanpa data operasional.
   * **Re-push:** menghitung *structural diff* DEV vs PROD dan menerapkannya sebagai migration (lihat §3.6).
   * Meng-update `is_pushed_to_prod = true`, `prod_pushed_at = now()` pada `public.projects`.
3. Seluruh aksi promotion dicatat pada audit log (`public.audit_logs`).

#### 3.1.5 Multi-Tenant Object Isolation Rules
1. **Ownership Naming Convention:** seluruh objek DB milik aplikasi hasil generasi (table, store proc/function, view, dll.) wajib memakai format `{8_digit_user_short_uuid}_{8digit_project_uuid}_{objek_db_name}` (contoh: `u1a2b3c4_p9f8e7d6_tbl_penjualan`).
2. **Dynamic DAL Query Transformation:**
   * Semua kueri DDL/DML **wajib** melewati `QueryBuilderService`.
   * Setiap referensi tabel bisnis otomatis dispesifikasikan skema environment + prefix proyek aktif:
     * *Input Kueri Studio:* `SELECT * FROM tbl_penjualan;`
     * *Transformed Kueri DAL:* `SELECT * FROM "data_dev"."u1a2b3c4_p9f8e7d6_tbl_penjualan";`
3. **RLS Enforcement (sederhana & berperforma):**
   * Setiap objek `{prefix}_*` **wajib** memiliki kolom ownership terdenormalisasi `owner_user_id` (UUID) dan `project_id` (UUID) yang diisi saat provisioning/INSERT — **tanpa subquery join** ke `public.projects`.
   * Policy standar yang dipasang ke setiap objek:
     ```sql
     ALTER TABLE "data_dev"."{prefix}_tbl_x" ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "{prefix}_owner_only" ON "data_dev"."{prefix}_tbl_x"
       FOR ALL USING ("owner_user_id" = auth.uid())
       WITH CHECK ("owner_user_id" = auth.uid());
     ```
   * Kolom ownership ditulis otomatis oleh DAL (nilai dari JWT + proyek aktif), bukan dari payload klien; dilarang di-override oleh input user.
   * Kueri lintas-prefiks diblokir di level database (policy) maupun DAL. Validasi kepemilikan berat (join `public.projects`) hanya dipakai untuk operasi kontrol (member mgmt, promotion) yang jarang.
4. **Mandatory DAL Routing:** seluruh akses database oleh runtime aplikasi hasil generasi — environment DEV maupun PROD — wajib dirutekan melalui OctaPush DAL:
   * Klien hanya berkomunikasi dengan endpoint DAL (yang meneruskan JWT user ke Supabase).
   * Service key / connection string Supabase hanya tersimpan di sisi server DAL dan tidak pernah dibundel ke aplikasi klien.
   * Node `EXECUTE_SQL` pada Workflow Engine juga dieksekusi melalui DAL, bukan koneksi database langsung dari perangkat pengguna.
   * Upaya akses langsung ke Supabase dari aplikasi hasil generasi dianggap pelanggaran keamanan dan ditolak (tidak ada kredensial yang tersedia untuk itu).
5. **Connection Pooling:** DAL memakai PgBouncer *transaction mode*; prepared statements dihindari pada sesi panjang; ukuran pool dibatasi dan dipantau agar tidak terjadi *connection exhaustion*.
6. **Identifier Length Guard:** PostgreSQL membatasi identifier maksimal 63 karakter; karena prefix `{usr8}_{prj8}_` = 17 karakter, maka `objek_db_name` **wajib ≤ 46 karakter**. Saat generate/publish:
   * Nama objek > 46 karakter → AI diminta meringkas; bila tetap melampaui, DAL menerapkan *hash-truncate* deterministik (`{46-char-prefix}_{hash8}`) untuk menjamin unik.
   * Validasi dilakukan sebelum DDL dieksekusi (di generator dan DAL); constraint UNIQUE tetap menjadi safety net terakhir.

#### 3.1.6 Session Lifecycle
1. **Logout:** `supabase.auth.signOut()` menghapus sesi lokal + revoke refresh token di server.
2. **Auto Refresh:** `supabase.auth.onAuthStateChange` memicu refresh token otomatis sebelum expiry; kegagalan refresh → paksa redirect ke Login.
3. **Device/Session Revoke:** halaman Settings menampilkan daftar sesi aktif (`auth.sessions`); aksi revoke memanggil `admin.deleteSession` via Edge Function (security definer).

#### 3.1.7 Project Deletion & Cleanup Flow
1. **Soft Delete:** aksi hapus proyek menandai `is_deleted = true` + `deleted_at = now()`; proyek hilang dari list namun objek DB tetap ada.
2. **Grace Period:** minimal 30 hari; selama periode ini pemilik dapat restore.
3. **Hard Delete:** scheduled job (pg_cron harian) memproses proyek yang melewati grace period:
   * Enumerasi seluruh objek `{prefix}_*` di `logic_dev`, `data_dev`, `logic_prod`, `data_prod` (via `information_schema`/`pg_catalog`) dan DROP satu per satu dalam transaksi per skema.
   * Hapus attachment di Supabase Storage dengan prefix `{usr8}_{prj8}/`.
   * Hapus entri `public.projects` terkait (cascade ke registry lain).
   * Seluruh langkah tercatat di `public.audit_logs`.
4. Konfirmasi destruktif eksplisit (ketik nama proyek) diminta sebelum soft-delete.

---

### 3.2 Module 2: System Settings & Theme Engine

#### 3.2.1 Overview
Menyediakan manajemen konfigurasi preferensi visual adaptif (Light Mode, Dark Mode, dan Auto/System Default) yang berefek langsung pada seluruh komponen UI bawaan aplikasi dan komponen dinamis hasil *generate* AI.

#### 3.2.2 Functional Logic & State Flow
1. **Theme State Initialization:**
   * App membaca `theme_mode` dari `public.user_preferences` di Supabase.
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
   * API Key disandi menggunakan AES-256 pada Application Layer sebelum di-persist ke tabel `public.ai_configs` di Supabase.
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
  * Saat tombol **Publish** ditekan (environment DEV):
    1. Menyimpan metadata ke `{prefix}_generated_pages` & `{prefix}_workflows` pada `logic_dev`.
    2. Mengisolasi DDL dan mengeksekusi `CREATE TABLE IF NOT EXISTS "data_dev"."{prefix}_{target_table}"` — `target_table` logis otomatis diprefix-kan dengan `object_prefix` proyek aktif.
    3. Memasang kebijakan RLS berbasis klaim JWT pada tabel yang baru dibuat.

#### 3.4.3 Starter Use-Cases (Galeri Kasus Pakai)
1. **Konsep:** galeri use-case kurasi di dalam Studio. Bukan template artefak (tanpa clone struktur) — melainkan kumpulan *prompt siap kirim* berkualitas yang memandu AI menghasilkan aplikasi sesuai kasus pakai umum.
2. **Alur:** user menekan kartu use-case → chat input terisi `prompt_text` (locale aktif) → user dapat mengedit sebelum kirim → AI generate → alur normal (preview → publish).
3. **Data Model:** tabel `public.starter_use_cases`:
   | Column | Type | Description |
   |---|---|---|
   | `id` | UUID PK | |
   | `title` | TEXT | Judul (per locale) |
   | `description` | TEXT | Deskripsi singkat (per locale) |
   | `category` | TEXT | Kelompok (misal: `sales`, `education`, `inventory`, `hr`, `finance`) |
   | `icon` | TEXT | Nama ikon UI |
   | `prompt_text` | JSONB | `{ "id": "...", "en": "..." }` prompt siap kirim |
   | `is_active` | BOOLEAN | Tampil/tidak |
   | `sort_order` | INTEGER | Urutan tampil |
4. **Isi awal (contoh umum):** aplikasi penjualan/kasir, data siswa/akademik, inventori gudang, absensi karyawan, perpustakaan, booking/pemesanan, kas/keuangan mini — masing-masing bilingual `id`/`en`.
5. **Pengelolaan:** daftar dikelola sebagai data (seed/migration), bukan hardcode kode — mudah ditambah tanpa rilis ulang.

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
  Expression          terisolasi pada objek   Toast/Push Alert
  (True/False)        {usr8}_{prj8}_* di            │
         │            data_dev/data_prod           │
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────┐
  │           Write Log to workflow_execution_logs          │
  └─────────────────────────────────────────────────────────┘
```

#### 3.5.3 SQL Guard (Node `EXECUTE_SQL`)
Sebelum eksekusi, setiap statement `EXECUTE_SQL` wajib melewati `SqlGuardService` di sisi DAL:
1. **Parse & Whitelist Verb:** hanya `SELECT`, `INSERT`, `UPDATE`, `DELETE`. DDL/DCL (`DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `GRANT`, `REVOKE`, `COMMENT`) → ditolak (`ERR_SQL_008`).
2. **Single Statement:** multi-statement (pemisah `;`) ditolak.
3. **Object Prefix Validation:** seluruh identifier tabel/view/function yang direferensikan wajib berawalan `{usr8}_{prj8}_` milik proyek aktif; referensi ke objek prefiks lain atau schema lain (`public`, `information_schema`, `pg_catalog`) ditolak.
4. **Parameter Binding:** nilai payload hanya boleh masuk sebagai bound parameter (`:payload.x`), tidak pernah string-concatenation.
5. **Dry-run & Cost Guard (R5):** statement yang berpotensi memengaruhi banyak baris (UPDATE/DELETE tanpa `WHERE`, atau WHERE on non-indexed) wajib di-*preview* dengan `EXPLAIN` — estimasi baris terdampak dan cost ditampilkan ke builder untuk konfirmasi; melampaui ambang (misal perkiraan > 10.000 baris) ditolak tanpa konfirmasi eksplisit.
6. **Statement Timeout:** maksimal 10 detik per statement; pelanggaran menghentikan workflow dengan status `FAILED`.
7. Pelanggaran guard dicatat sebagai security event di `public.audit_logs` + log eksekusi `FAILED`.

---

### 3.6 Module 6: Schema Evolution & Dev-to-Prod Migration Engine

#### 3.6.1 Overview
Menangani evolusi struktur aplikasi hasil generasi setelah push pertama: perubahan form/objek di DEV diterapkan ke PROD sebagai migration terkontrol, bukan clone ulang.

#### 3.6.2 Structural Diff Algorithm
1. Snapshot struktur tiap environment disimpan pada `{prefix}_schema_snapshots` (`logic_dev`): JSON dump dari `pg_catalog` (kolom, tipe, constraint, index, view def, function signature) per objek.
2. Saat re-push, sistem membandingkan snapshot DEV terbaru vs snapshot PROD terakhir → menghasilkan daftar operasi:
   * `ADD_OBJECT`, `ADD_COLUMN` → aman (*auto-apply*).
   * `ALTER_COLUMN_TYPE`, `DROP_COLUMN`, `DROP_OBJECT`, `RENAME_*` → destruktif, wajib konfirmasi eksplisit + strategi data (misal: rename = `ALTER ... RENAME` + update referensi; drop column = data existing diarsipkan ke tabel `_archive`).
3. Ringkasan diff dirender di UI (objek baru/diubah/dihapus + badge risiko) sebelum eksekusi; user menyetujui per item atau keseluruhan.

#### 3.6.3 Migration Execution
1. **Project Lock:** saat push dimulai, sistem mengunci proyek (`public.projects.promotion_lock = now()`); seluruh operasi edit struktur DEV (publish, update form/workflow, DDL) ditolak (`ERR_MIG_017`) sampai push selesai atau timeout (misal 10 menit).
2. **Checksum Verification:** sebelum menerapkan diff, sistem memverifikasi bahwa snapshot DEV yang dijadikan dasar diff **belum berubah** (checksum snapshot masih sama); jika berubah selama proses → batal, user diminta menjalankan ulang push.
3. Operasi dieksekusi dalam satu transaksi per objek; urutan: dependency-aware (function sebelum trigger, tabel parent sebelum child FK).
4. Setiap eksekusi mencatat entri migration (`{prefix}_migration_history` di `logic_prod`): versi, checksum diff, status, durasi.
5. Sebelum eksekusi, snapshot struktur PROD saat ini disimpan → *rollback* = re-apply snapshot sebelumnya (atau reverse-DDL untuk perubahan aditif).
6. Data operasional PROD tidak pernah dimodifikasi oleh migration kecuali transformasi kolom yang secara eksplisit dikonfirmasi.
7. Setelah selesai/gagal, `promotion_lock` dibersihkan.

---

### 3.7 Module 7: Generated App Distribution & End-User Access

#### 3.7.1 Publishing Modes
| Mode | Auth End-User | Akses |
|---|---|---|
| `PRIVATE` | Builder login saja | Default; app hanya terlihat pemilik |
| `RESTRICTED` | Google Auth (end-user) | Siapa pun yang login via link dapat memakai runtime |
| `PUBLIC` | Tanpa login | Link publik; submit form anonim dengan rate limit ketat |

#### 3.7.2 Functional Flow
1. Builder menekan **Publish App** pada proyek ber-status `is_pushed_to_prod = true` dan memilih mode akses.
2. Sistem menerbitkan `app_slug` unik dan menyimpan konfigurasi distribusi (`public.app_distributions`: `project_id`, `mode`, `slug`, `created_at`, `revoked_at`).
3. **End-User Session:** sesi end-user dibuat lewat Supabase Auth sama seperti builder, namun JWT di-enrich klaim custom `access_scope = 'app_runtime'` + `project_id`; DAL menolak endpoint Studio untuk scope ini.
4. **Public Mode:** request anonim membawa context `anon` — DAL memakai service-side connection dengan RLS policy khusus anon yang hanya mengizinkan INSERT pada tabel form target; dilindungi captcha/rate limit.
5. **Anti-Abuse Khusus Mode Publik (R11):**
   * **Honeypot field:** setiap form publik menyertakan field tersembunyi (tidak terlihat user) — jika terisi bot → submit dibuang tanpa eksekusi.
   * **Kuota submit anonim:** per IP + device fingerprint (misal 10 submit/jam/IP), melebihi → blokir sementara + notifikasi builder.
   * **Moderation queue (opsional):** untuk konten publik yang disubmit, builder dapat mengaktifkan antrean moderasi sebelum data tampil/aktif.
6. Seluruh aktivitas end-user tetap melewati OctaPush DAL (aturan §3.1.5 #4).

---

### 3.8 Module 8: Storage, Quota & Observability

#### 3.8.1 File Attachment Storage
1. Field attachment pada form hasil generasi dipetakan ke Supabase Storage bucket `octapush-app-files`.
2. Path wajib berformat `{usr8}_{prj8}/{object_name}/{uuid}.{ext}` — upload melalui DAL yang memverifikasi kuota & kepemilikan; akses baca via signed URL berumur pendek.
3. Hard-delete proyek membersihkan prefix storage terkait (§3.1.7).

#### 3.8.2 Quota Enforcement
1. Tabel `public.usage_counters` (`user_id PK`, `projects_count`, `db_size_bytes`, `files_count`, `files_bytes`, `objects_count`, `updated_at`) — di-update event-driven + rekonsiliasi harian (pg_cron).
2. DAL memeriksa counter sebelum operasi create/publish/upload; pelanggaran → `ERR_QTA_009` dengan detail kuota yang terlampaui.
3. **Kuota objek per proyek (R12):** maksimal 200 objek dinamis per proyek (gabungan tabel, view, function, trigger, index di `logic_dev`+`data_dev`+`data_prod`); melebihi → DDL ditolak.
4. **Monitoring catalog (R12):** rekonsiliasi harian membandingkan `usage_counters.objects_count` dengan jumlah aktual di `pg_class` per prefix; anomali > 10% trigger alert.
5. **Proyek dormant (R12):** proyek tanpa aktivitas > 6 bulan (tidak ada Publish, edit, submit di DEV/PROD) ditandai `is_dormant = true`; objek dapat di-*freeze* (dicadangkan ke dump, dihapus dari skema, dikembalikan jika user re-aktivasi).
6. Rate limit DAL: token bucket per user/sesi (default: 60 req/menit untuk DML, 10 req/menit untuk DDL/promotion); pelanggaran → HTTP 429.

#### 3.8.3 Audit Log & Observability
1. `public.audit_logs` (append-only, RLS read-only untuk owner): `id`, `user_id`, `project_id`, `action` (`DDL_EXECUTE`, `PUSH_TO_PROD`, `MIGRATION_APPLY`, `MIGRATION_ROLLBACK`, `HARD_DELETE`, `RLS_REJECT`, `SQL_GUARD_REJECT`, `QUOTA_EXCEED`), `detail_jsonb`, `created_at`.
2. Dashboard metrik (builder-facing): latency DAL p50/p95, tingkat sukses/gagal workflow, jumlah RLS rejection, pemakaian kuota — bersumber dari `audit_logs` + `workflow_execution_logs`.

#### 3.8.4 Backup & Recovery
1. Supabase PITR aktif minimal 7 hari untuk seluruh klaster; retensi tambahan via logical dump mingguan `data_prod`.
2. Prosedur restore terdokumentasi: restore PITR ke branch/klaster staging → verifikasi → promosi. Uji restore dilakukan kuartalan.

#### 3.8.5 Centralized Error Log & Tracing (`public.error_logs`)
1. **Single Sink:** seluruh sumber error — client SDK, DAL, Workflow Engine, AI Provider Service, DB RPC — wajib melaporkan error ke `public.error_logs` melalui endpoint DAL `POST /errors` (rate-limited, payload disanitasi).
2. **Konteks Tracing Wajib:** setiap entri membawa `user_id`, `project_id`, `environment`, `source`, `severity`, `error_code` (mapping `ERR_*`), `message`, `stack_trace`, `fingerprint` (hash normalized message+stack), dan `context_jsonb` (page/node/endpoint/device/locale/request id).
3. **PII Scrubbing (R7):** sebelum insert, pipeline `ErrorLogService` menjalankan scrubber — pola sensitif (email, token/API key, password, no. identitas, nomor kartu) pada `message`, `stack_trace`, dan `context_jsonb` diganti `[REDACTED]`; payload request mentah **tidak pernah** ditulis utuh.
4. **Dedup & Sampling (R7):** error dengan `fingerprint` sama dalam jendela 5 menit di-agregasi — insert pertama, update counter `occurrence_count` + `last_seen_at` pada berikutnya; antarmuka tracing menampilkan jumlah kejadian, bukan ratusan baris identik.
5. **Tracing Flow:** dashboard tracing mengelompokkan entri per `fingerprint` → filter per user/project/severity/rentang waktu → drill-down detail konteks → aksi triage.
6. **Triage Lifecycle:** status `OPEN` → `INVESTIGATING` → `RESOLVED` | `IGNORED`; perubahan status + `resolution_note` tercatat (oleh builder untuk project-scoped error, oleh platform team untuk platform-scoped); alerting otomatis untuk spike `fingerprint` tertentu atau severity `FATAL`.
7. **Retention:** entri `RESOLVED`/`IGNORED` diarsipkan setelah 90 hari.

---

### 3.9 Module 9: Security Hardening (Anti-Cheat, XSS, SQL Injection, Abuse)

#### 3.9.1 Defense-in-Depth Layer Map
| Layer | Mekanisme | Cakupan |
|---|---|---|
| Database | RLS berbasis JWT + prefiks objek (§3.1.5) | Semua kueri |
| Query | SQL Guard (§3.5.3) | Node `EXECUTE_SQL` |
| Input | Sanitization & Validation Pipeline (§3.9.2) | Studio + generated app |
| Render | XSS Escaping di Dynamic Renderer (§3.9.3) | Generated app runtime |
| Transport/App | CSRF token + Security Headers (§3.9.4) | Endpoint mutating + web runtime |
| Behavior | Anti-Cheat & Anti-Abuse (§3.9.5) | Form submission & workflow |

#### 3.9.2 Input Sanitization & Validation Pipeline
1. **Server-side Revalidation:** seluruh payload divalidasi ulang di DAL/server meskipun sudah divalidasi di klien (*never trust client*) — tipe, panjang, range, enum, required.
2. **Sanitization:** string input dibersihkan dari kontrol karakter & tag berbahaya (whitelist-based sanitizer, bukan blacklist); nilai numerik/tanggal diparse ketat.
3. **File Upload:** validasi MIME type via magic bytes (bukan extension), maksimal ukuran per field, nama file dinormalisasi.
4. **Parameterized Queries:** semua akses DB via bound parameter — string concatenation dilarang di DAL maupun template workflow.

#### 3.9.3 XSS Protection di Dynamic Renderer
1. Renderer komponen dinamis **wajib** merender semua konten user sebagai teks/data (React default escaping) — penggunaan `dangerouslySetInnerHTML` / equivalent **dilarang** kecuali konten lolos sanitizer whitelist (DOMPurify-equivalent).
2. URL/href dari input user divalidasi scheme (`http`/`https` saja; blokir `javascript:`).
3. Web runtime memakai CSP ketat: `default-src 'self'`, tanpa `unsafe-inline` script.

#### 3.9.4 CSRF & Security Headers
1. Endpoint mutating (non-GET) DAL memverifikasi CSRF token double-submit atau SameSite=Strict cookie session.
2. Security headers pada app runtime web: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.

#### 3.9.5 Anti-Cheat & Anti-Abuse
1. **Velocity Check:** rate per IP/device/session untuk submit form publik (misal maksimal 10 submit/menit/IP); melebihi → challenge (captcha) atau blokir sementara.
2. **Business Revalidation:** kalkulasi bisnis-kritis (total, diskon, stok) dieksekusi/direkalkulasi server-side dari data mentah, bukan menerima angka jadi dari klien.
3. **Idempotency Key:** form submission membawa idempotency key untuk mencegah double-submit/replay.
4. Seluruh penolakan dicatat sebagai security event: `audit_logs` (`XSS_REJECT`, `ABUSE_REJECT`) + `error_logs` severity `WARN`.

#### 3.9.6 Threat Modeling Requirement (Input S2)
1. Sebelum rilis DAL v1, **wajib** dilakukan sesi *threat modeling* menggunakan kerangka STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) yang mencakup seluruh endpoint DAL dan surface generasi aplikasi.
2. Output wajib: dokumen STRIDE per endpoint (ancaman → mitigasi existing → gap → rekomendasi) dan *sign-off* oleh tim keamanan sebelum DAL v1 dianggap *production-ready*.
3. Threat modeling diulang setiap ada perubahan arsitektur yang signifikan (penambahan mode publik, realtime, kolaborasi multi-user).

---

### 3.10 Module 10: Internationalization (i18n)

#### 3.10.1 Locale Model
* Locale didukung (fase awal): `id` (Bahasa Indonesia — **default**) dan `en` (English). Konstanta `SUPPORTED_LOCALES = ['id', 'en']`.
* Fallback chain: locale aktif → `id`. Key yang hilang dirender apa adanya (`[missing_key]`) di mode development.

#### 3.10.2 Platform UI i18n
1. Studio/Project Management/Settings memakai `i18next` dengan resource bundle statis per locale; deteksi awal dari device locale, fallback `id`; switcher tersimpan di `public.user_preferences.locale`.

#### 3.10.3 Generated App i18n
1. **AI Generation Output (opsional):** blok tambahan pada JSON skema:
   ```json
   "i18n": {
     "default_locale": "id",
     "strings": {
       "no_faktur.label": { "id": "No Faktur", "en": "Invoice No." },
       "notify.success":    { "id": "Transaksi Berhasil", "en": "Transaction Saved" }
     }
   }
   ```
2. String dipersist ke `{usr8}_{prj8}_app_translations` (skema Logic): (`key`, `locale`, `value`) — builder dapat mengedit manual via Translation Editor.
3. Runtime resolution: label/pesan komponen dinamis dicari di translations sesuai locale end-user → fallback `id` → fallback raw key. Preferensi locale end-user disimpan lokal (client-side).
4. `LOCAL_NOTIFICATION` node mendukung `message_key` sebagai alternatif `message` literal.

#### 3.10.4 Timezone Policy
1. **Storage:** seluruh timestamp disimpan sebagai `TIMESTAMPTZ` (UTC) — tidak ada penyimpanan waktu lokal.
2. **Display:** konversi ke timezone end-user hanya dilakukan di layer render (klien); UI menampilkan waktu lokal device, tanpa menampilkan offset mentah.
3. **Business Logic (laporan, filter tanggal, scheduler):** memakai **timezone proyek** — kolom `public.projects.timezone` (default `Asia/Jakarta`) — sehingga agregasi harian/mingguan konsisten antar user tanpa bergantung timezone device masing-masing.
4. **Trigger `SCHEDULER`:** dihitung terhadap timezone proyek, bukan UTC mentah.
5. Konversi memakai library timezone-aware (`date-fns-tz` / `luxon`); aturan berlaku untuk platform UI maupun generated app.

---

### 3.11 Module 11: Realtime Sync, Collaboration & Template Marketplace

#### 3.11.1 Realtime Data Sync
1. **Mekanisme:** DB trigger (`AFTER INSERT/UPDATE/DELETE`) pada setiap objek `{prefix}_*` yang relevan → memanggil `realtime.broadcast_changes()` dengan payload berisi `project_id`, `action`, `table_name`, `key`, `fields_changed`. Klien subscribe ke channel `project:{project_id}`.
2. **Keunggulan vs Postgres Changes (watch langsung):** biaya tetap & prediktibel per broadcast, tidak bergantung pada jumlah tabel yang di-watch; scalable untuk ribuan objek dinamis; tidak ada *listener exhaustion* seperti Postgres Changes di skala besar.
3. **Fallback:** jika koneksi realtime terputus → polling ringan (GET endpoint DAL dengan `?since=last_known_ts`) + indikator offline; error tercatat (`ERR_RTM_014`).
4. **Keamanan:** channel realtime bersifat *private* — hanya user dengan JWT yang memiliki `project_id` (via `project_members` untuk kolaborasi, atau RLS ownership untuk runtime) dapat subscribe; payload broadcast tetap memuat `owner_user_id` yang diverifikasi di sisi klien.

#### 3.11.2 Multi-User Project Collaboration
1. Tabel `public.project_members` (`project_id`, `user_id`, `role` ∈ `owner|editor|viewer`, PK composite); undangan via email Google terdaftar.
2. RLS/DAL memvalidasi role: `viewer` = read-only Studio; `editor` = edit skema/form/workflow; `owner` = semua + member management + Push to PROD/hard-delete.
3. Presence: channel presence per project menampilkan kolaborator aktif di Studio (avatar list).
4. **Konflik Edit (R9):** v1 menggunakan *last-write-wins* yang eksplisit — saat editor membuka halaman yang sedang diedit editor lain, UI menampilkan *presence warning* ("sedang diedit oleh X"); saat menyimpan, sistem mengecek `current_version` halaman — jika berubah sejak dibuka, ditampilkan diff + konfirmasi overwrite sebelum disimpan. v2 (future): optimistic locking via kolom `version` pada `{prefix}_generated_pages` (simpan ditolak jika versi basi).

#### 3.11.3 Template Marketplace
1. **Ekspor:** builder mengekspor proyek sebagai template — snapshot `{prefix}_generated_pages`, `_workflows`, `_page_schema_versions`, `_app_translations` + metadata (nama, deskripsi, versi, `schema_version` = engine version saat ekspor, author, tags) → `public.templates` + `public.template_items`.
2. **Instalasi:** pengguna lain menginstal template saat membuat proyek baru → sistem clone struktur Logic template ke prefix proyek baru penerima (tanpa data operasional), lalu provisioning normal berjalan (queue/logs di `data_dev`).
3. **Version Guard (R10):** installer memverifikasi `templates.schema_version` — jika > versi engine saat ini, instalasi ditolak dengan pesan: "Template dibuat di versi OctaPush yang lebih baru. Silakan update aplikasi OctaPush terlebih dahulu." Jika versi lama, instalasi tetap berjalan dengan peringatan "Template ini dibuat di versi OctaPush {old}. Beberapa fitur mungkin tidak tersedia."
4. Visibilitas template: `public` (marketplace) atau `private` (hanya undangan); uninstall/delete template tidak memengaruhi proyek yang sudah terinstal.

---

## 4. DATABASE SCHEMA SPECIFICATIONS (DDL)

### 4.1 Schema `public` (Supabase PostgreSQL — Platform Registry)

```sql
-- Table: users (registry pengguna, sinkron dengan Supabase Auth)
CREATE TABLE IF NOT EXISTS "public"."users" (
  "user_id" UUID PRIMARY KEY REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "display_name" TEXT,
  "user_short_uuid" CHAR(8) NOT NULL UNIQUE CHECK ("user_short_uuid" ~ '^[0-9a-f]{8}$'),
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Table: projects (mapping user ↔ project + status environment)
CREATE TABLE IF NOT EXISTS "public"."projects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "public"."users"("user_id") ON DELETE CASCADE,
  "project_name" TEXT NOT NULL,
  "project_uuid" CHAR(8) NOT NULL CHECK ("project_uuid" ~ '^[0-9a-f]{8}$'),
  -- object_prefix dihitung via trigger BEFORE INSERT/UPDATE (join antar tabel
  -- tidak didukung generated column), lalu disimpan denormalized + UNIQUE:
  "object_prefix" TEXT NOT NULL UNIQUE,
  "is_pushed_to_prod" BOOLEAN DEFAULT false,
  "prod_pushed_at" TIMESTAMPTZ,
  "timezone" TEXT DEFAULT 'Asia/Jakarta', -- timezone proyek utk laporan/filter/scheduler (S6)
  "promotion_lock" TIMESTAMPTZ,           -- lock saat push/migration berjalan (R4)
  "is_deleted" BOOLEAN DEFAULT false,
  "deleted_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  UNIQUE ("user_id", "project_uuid")
);

-- Trigger: hitung & kunci object_prefix = users.user_short_uuid || '_' || project_uuid
-- CREATE FUNCTION public.set_object_prefix() ... BEFORE INSERT OR UPDATE ON public.projects
--   SELECT u.user_short_uuid INTO short FROM public.users u WHERE u.user_id = NEW.user_id;
--   NEW.object_prefix := short || '_' || NEW.project_uuid;

-- Table: app_distributions (mode akses app hasil generate)
CREATE TABLE IF NOT EXISTS "public"."app_distributions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
  "slug" TEXT NOT NULL UNIQUE,
  "mode" TEXT NOT NULL CHECK ("mode" IN ('PRIVATE','RESTRICTED','PUBLIC')),
  "revoked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Table: usage_counters (kuota per user, event-driven + rekonsiliasi harian)
CREATE TABLE IF NOT EXISTS "public"."usage_counters" (
  "user_id" UUID PRIMARY KEY REFERENCES "public"."users"("user_id") ON DELETE CASCADE,
  "projects_count" INTEGER DEFAULT 0,
  "db_size_bytes" BIGINT DEFAULT 0,
  "objects_count" BIGINT DEFAULT 0,   -- jumlah objek dinamis per user (R12)
  "files_count" BIGINT DEFAULT 0,
  "files_bytes" BIGINT DEFAULT 0,
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Table: audit_logs (append-only; no UPDATE/DELETE via revoke)
CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
  "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "project_id" UUID,
  "action" TEXT NOT NULL CHECK ("action" IN
    ('DDL_EXECUTE','PUSH_TO_PROD','MIGRATION_APPLY','MIGRATION_ROLLBACK',
     'HARD_DELETE','RLS_REJECT','SQL_GUARD_REJECT','QUOTA_EXCEED',
     'XSS_REJECT','ABUSE_REJECT')),
  "detail_jsonb" JSONB,
  "created_at" TIMESTAMPTZ DEFAULT now()
);
REVOKE UPDATE, DELETE ON "public"."audit_logs" FROM PUBLIC;

-- Table: project_members (multi-user collaboration per project)
CREATE TABLE IF NOT EXISTS "public"."project_members" (
  "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "public"."users"("user_id") ON DELETE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'viewer' CHECK ("role" IN ('owner','editor','viewer')),
  "invited_by" UUID REFERENCES "public"."users"("user_id"),
  "created_at" TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY ("project_id", "user_id")
);

-- Table: error_logs (centralized error sink untuk tracing & triage)
CREATE TABLE IF NOT EXISTS "public"."error_logs" (
  "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id" UUID,                          -- nullable utk anon/public app
  "project_id" UUID,                       -- nullable utk platform-level error
  "environment" TEXT NOT NULL DEFAULT 'DEV' CHECK ("environment" IN ('DEV','PROD','PLATFORM')),
  "source" TEXT NOT NULL CHECK ("source" IN ('CLIENT','DAL','WORKFLOW','AI_PROVIDER','DB')),
  "severity" TEXT NOT NULL DEFAULT 'ERROR' CHECK ("severity" IN ('DEBUG','INFO','WARN','ERROR','FATAL')),
  "error_code" TEXT,                       -- mapping ERR_* codes
  "message" TEXT NOT NULL,
  "stack_trace" TEXT,
  "fingerprint" TEXT NOT NULL,             -- hash(normalized message + stack top frame)
  "session_id" TEXT,
  "request_id" TEXT,
  "context_jsonb" JSONB,                   -- page/node/endpoint/device/locale dll.
  "status" TEXT NOT NULL DEFAULT 'OPEN' CHECK ("status" IN ('OPEN','INVESTIGATING','RESOLVED','IGNORED')),
  "occurrence_count" INTEGER DEFAULT 1,  -- dedup fingerprint (R7)
  "last_seen_at" TIMESTAMPTZ DEFAULT now(),
  "resolution_note" TEXT,
  "resolved_by" UUID,
  "resolved_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON "public"."error_logs" ("fingerprint", "created_at");
CREATE INDEX IF NOT EXISTS idx_error_logs_user_project ON "public"."error_logs" ("user_id", "project_id", "created_at");

-- Table: templates + template_items (marketplace)
CREATE TABLE IF NOT EXISTS "public"."templates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_user_id" UUID NOT NULL REFERENCES "public"."users"("user_id"),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "schema_version" TEXT NOT NULL,        -- engine version saat ekspor (R10)
  "tags" TEXT[] DEFAULT '{}',
  "visibility" TEXT NOT NULL DEFAULT 'private' CHECK ("visibility" IN ('public','private')),
  "revoked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."template_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL REFERENCES "public"."templates"("id") ON DELETE CASCADE,
  "item_type" TEXT NOT NULL CHECK ("item_type" IN ('PAGE','WORKFLOW','SCHEMA_VERSION','TRANSLATION')),
  "payload_json" JSONB NOT NULL
);

-- Table: starter_use_cases (galeri prompt siap kirim di Studio — S5)
CREATE TABLE IF NOT EXISTS "public"."starter_use_cases" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" JSONB NOT NULL,            -- { "id": "...", "en": "..." }
  "description" JSONB,
  "category" TEXT,
  "icon" TEXT,
  "prompt_text" JSONB NOT NULL,      -- { "id": "...", "en": "..." }
  "is_active" BOOLEAN DEFAULT true,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Table: ai_configs (user-level)
CREATE TABLE IF NOT EXISTS "public"."ai_configs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "provider_name" TEXT NOT NULL,
  "base_url" TEXT NOT NULL,
  "api_key" TEXT NOT NULL, -- encrypted (AES-256 application layer)
  "model_name" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT false,
  FOREIGN KEY("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE
);

-- Table: user_preferences (user-level)
CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
  "user_id" UUID PRIMARY KEY,
  "theme_mode" TEXT DEFAULT 'auto' CHECK ("theme_mode" IN ('light','dark','auto')),
  "locale" TEXT DEFAULT 'id' CHECK ("locale" IN ('id','en')), -- i18n platform UI
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE
);

-- RPC: Push to PROD (structure-only clone), security definer + verifikasi JWT owner
-- CREATE OR REPLACE FUNCTION "public"."push_project_to_prod"(p_project_id UUID) ...
```

> **Catatan:** `object_prefix` dihitung oleh trigger `set_object_prefix()` (join `users.user_short_uuid`) lalu disimpan denormalized dengan constraint UNIQUE — bukan generated column, karena PostgreSQL tidak mendukung subquery/join antar tabel di generated column.

---

### 4.2 Schemas `logic_dev` / `logic_prod` (Per-Project Design Artifacts)

Template DDL provisioning saat proyek baru dibuat (`{prefix}` = `{usr8}_{prj8}`, contoh `u1a2b3c4_p9f8e7d6`):

```sql
-- Table: {prefix}_generated_pages (di logic_dev; dikloning ke logic_prod saat Push to PROD)
CREATE TABLE IF NOT EXISTS "logic_dev"."{prefix}_generated_pages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "page_title" TEXT NOT NULL,
  "page_type" TEXT NOT NULL CHECK ("page_type" IN ('MASTER','TRANSACTION','REPORT')),
  "target_table" TEXT NOT NULL,
  "current_version" INTEGER DEFAULT 1,
  "is_published" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Table: {prefix}_workflows
CREATE TABLE IF NOT EXISTS "logic_dev"."{prefix}_workflows" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflow_name" TEXT NOT NULL,
  "trigger_type" TEXT NOT NULL CHECK ("trigger_type" IN ('FORM_EVENT','SCHEDULER','QUEUE','MANUAL')),
  "trigger_config" JSONB NOT NULL,
  "workflow_json" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Table: {prefix}_page_schema_versions (rollback versioning)
CREATE TABLE IF NOT EXISTS "logic_dev"."{prefix}_page_schema_versions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "page_id" UUID NOT NULL REFERENCES "logic_dev"."{prefix}_generated_pages"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "schema_json" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Table: {prefix}_app_translations (i18n: locale id/en, fallback id)
CREATE TABLE IF NOT EXISTS "logic_dev"."{prefix}_app_translations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL,
  "locale" TEXT NOT NULL CHECK ("locale" IN ('id','en')),
  "value" TEXT NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  UNIQUE ("key", "locale")
);

-- Table: {prefix}_schema_snapshots (structural diff untuk migration DEV↔PROD)
CREATE TABLE IF NOT EXISTS "logic_dev"."{prefix}_schema_snapshots" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "environment" TEXT NOT NULL CHECK ("environment" IN ('DEV','PROD')),
  "snapshot_json" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Table: {prefix}_migration_history (di logic_prod; hasil re-push/migration)
CREATE TABLE IF NOT EXISTS "logic_prod"."{prefix}_migration_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "diff_checksum" TEXT NOT NULL,
  "operations_json" JSONB NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('APPLIED','ROLLED_BACK','FAILED')),
  "duration_ms" INTEGER,
  "created_at" TIMESTAMPTZ DEFAULT now()
);
```

---

### 4.3 Schemas `data_dev` / `data_prod` (Per-Project Business Data)

Struktur dasar internal setiap proyek baru:

```sql
-- Template DDL untuk eksekusi pada environment DEV: "{prefix}" = "{usr8}_{prj8}"

CREATE TABLE IF NOT EXISTS "data_dev"."{prefix}_workflow_task_queue" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflow_id" UUID NOT NULL,
  "payload_json" JSONB NOT NULL,
  "status" TEXT DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
  "retry_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "data_dev"."{prefix}_workflow_execution_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflow_id" UUID NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('SUCCESS','FAILED')),
  "execution_time_ms" INTEGER NOT NULL,
  "log_details" JSONB,
  "executed_at" TIMESTAMPTZ DEFAULT now()
);

-- Contoh tabel bisnis dinamis hasil Publish (memuat kolom ownership terdenormalisasi):
-- CREATE TABLE IF NOT EXISTS "data_dev"."{prefix}_tbl_penjualan" (
--   "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   "owner_user_id" UUID NOT NULL,   -- ditulis DAL dari JWT, bukan payload
--   "project_id" UUID NOT NULL,      -- proyek aktif, bukan payload
--   ... kolom bisnis ...
-- );

-- RLS isolation template (wajib dipasang pada SETIAP objek {prefix}_*):
ALTER TABLE "data_dev"."{prefix}_tbl_penjualan" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "{prefix}_owner_only" ON "data_dev"."{prefix}_tbl_penjualan"
  FOR ALL USING ("owner_user_id" = auth.uid())
  WITH CHECK ("owner_user_id" = auth.uid());
```

> **Push to PROD:** seluruh objek `{prefix}_*` dari `logic_dev`/`data_dev` dikloning struktur (DDL saja) ke `logic_prod`/`data_prod` oleh RPC `public.push_project_to_prod`, termasuk replikasi kebijakan RLS. Data operasional tidak ikut disalin.

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
                      "enum": ["TextInput", "NumberInput", "SelectInput", "DatePicker", "SwitchInput", "FileInput"] 
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
                "message_key": { "type": "string", "description": "i18n key alternatif untuk message literal (locale: id/en, fallback id)" },
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
    },
    "i18n": {
      "type": "object",
      "description": "Opsional. Locale didukung: id (default), en.",
      "properties": {
        "default_locale": { "type": "string", "enum": ["id", "en"] },
        "strings": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "en": { "type": "string" }
            }
          }
        }
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
| `ERR_AUT_000` | Authentication | Sesi tidak valid / login Google dibatalkan / JWT expired | Mengarahkan pengguna kembali ke halaman Login; refresh token dicoba otomatis bila memungkinkan. |
| `ERR_SEC_001` | Multi-Tenant | `user_id` gagal dipetakan ke `user_short_uuid` pada `public.users` | System memicu auto-retry penerbitan short UUID dan upsert ulang. |
| `ERR_PRJ_005` | Project Management | Nama proyek kosong/duplikat atau gagal provisioning objek awal | Menampilkan alert di halaman Project Management; provisioning di-rollback (objek parsial dihapus). |
| `ERR_PRM_006` | Promotion | Push to PROD gagal (struktur DEV/PROD divergen atau RPC error) | Proses dihentikan sebelum commit; user diberi tahu untuk sinkronisasi ulang; audit log mencatat kegagalan. |
| `ERR_RLS_007` | Multi-Tenant | Akses ditolak RLS — percobaan konsumsi objek milik user/proyek lain | Diblokir di level database; dicatat sebagai security event; pesan generik "Akses ditolak" ke user. |
| `ERR_DAL_002` | Database | Eksekusi DML pada tabel bisnis yang belum di-publish | Menampilkan alert: "Tabel bisnis belum diinisialisasi. Silakan Publish halaman terlebih dahulu." |
| `ERR_AIC_003` | AI Provider | Timeout / Invalid API Key saat melakukan kueri LLM | Menampilkan banner error pada Studio Chat & mengizinkan konfigurasi ulang di Settings. |
| `ERR_WFE_004` | Workflow Engine | Evaluasi sintaks `CONDITION` invalid atau SQL Syntax error | Menghentikan eksekusi node, mencatat status `FAILED` ke `{prefix}_workflow_execution_logs`, dan mengirimkan notifikasi error ke user. |
| `ERR_SQL_008` | SQL Guard | Statement `EXECUTE_SQL` memuat verb terlarang (DDL/DCL), multi-statement, atau mereferensikan objek di luar prefiks proyek | Eksekusi diblokir sebelum menyentuh DB; dicatat sebagai `SQL_GUARD_REJECT` di `public.audit_logs`; pesan generik ke user. |
| `ERR_QTA_009` | Quota | Kuota terlampaui (jumlah proyek, ukuran DB, attachment, rate limit DAL) | Operasi ditolak dengan HTTP 429 / alert; dashboard menampilkan kuota yang terlampaui. |
| `ERR_MIG_010` | Migration | Re-push gagal: diff konflik, migration error, atau timeout | Transaksi per objek di-rollback; snapshot PROD tetap utuh; user diminta review ulang diff; tercatat di `{prefix}_migration_history`. |
| `ERR_MIG_017` | Migration | Proyek sedang di-lock oleh push/migration lain (promotion_lock aktif) | Operasi edit struktur DEV ditolak sementara; UI menampilkan indikator "sedang Push to PROD" + estimasi waktu. |
| `ERR_DST_011` | Distribution | Akses runtime oleh scope yang tidak sah (`access_scope ≠ app_runtime`) atau slug revoked | Endpoint runtime menolak request; dicatat sebagai security event di audit log. |
| `ERR_XSS_012` | Security Hardening | Input mengandung konten berbahaya (tag/script/scheme terlarang) atau MIME file tidak valid | Input ditolak/disanitasi; dicatat sebagai `XSS_REJECT`; pesan validasi ke user. |
| `ERR_ABU_013` | Security Hardening | Velocity/abuse check terlampaui (spam submit, replay tanpa idempotency key, automasi) | Challenge captcha / blokir sementara; dicatat sebagai `ABUSE_REJECT`. |
| `ERR_RTM_014` | Realtime | Koneksi Supabase Realtime gagal/terputus | Fallback polling ringan + indikator offline di UI; retry eksponensial. |
| `ERR_I18N_015` | Internationalization | Translation key/locale tidak ditemukan | Fallback ke locale default (`id`) → raw key; tidak menghentikan render. |
| `ERR_MKT_016` | Marketplace | Instalasi template gagal (template revoked, konflik objek, versi tidak kompatibel) | Instalasi dibatalkan sebelum commit; provisioning proyek baru di-rollback bersih. |

---

## 7. CODING STANDARDS & EXCEPTION HANDLING POLICY (MANDATORY TRY-CATCH)

Aturan ini mengikat **seluruh kode platform OctaPush** dan **seluruh artefak logika yang dihasilkan engine** (workflow runner templates, Edge Functions, DAL handlers).

### 7.1 Mandatory Rules
1. **Try-Catch Wajib:** setiap fungsi/service yang melakukan operasi berisiko (DB access, network call, file I/O, parsing, eksekusi workflow node) **wajib** membungkus operasinya dalam `try-catch`.
2. **No Empty Catch:** `catch` kosong atau yang hanya me-swallow error **dilarang**. Setiap catch minimal melakukan salah satu: (a) log ke Centralized Error Log lalu rethrow, atau (b) menangani secara eksplisit dengan fallback yang terdefinisi.
3. **Log Before Rethrow:** pola standar:
   ```typescript
   try {
     await dal.query(...);
   } catch (err) {
     await ErrorLogService.report(err, {
       project_id, environment, source: 'DAL',
       context: { endpoint, request_id },
     });
     throw new AppError('ERR_DAL_002', err); // typed rethrow
   }
   ```
4. **Typed Errors:** semua throw menggunakan kelas `AppError(error_code, cause)` — mapping ke tabel error codes §6; raw exception tidak boleh lolos ke boundary.
5. **Async Discipline:** operasi asinkron wajib di-`await` di dalam blok try; unhandled promise rejection diperlakukan sebagai bug P1.
6. **UI Boundary:** React tree dilindungi `ErrorBoundary` per route/per panel dinamis; crash panel tidak boleh menjatuhkan seluruh app.
7. **Workflow Nodes:** setiap node dieksekusi dalam try-catch individual; kegagalan node mencatat status `FAILED` + detail langkah ke `{prefix}_workflow_execution_logs` DAN `public.error_logs`.
8. **SQL Layer:** RPC/function PL/pgSQL yang ditulis engine memakai blok `EXCEPTION WHEN ... THEN` untuk menuliskan konteks error sebelum raise ulang.

### 7.2 Review & Enforcement Plan
1. **Static Analysis:** ESLint rules custom — melarang empty catch (`no-empty`), mewajibkan `AppError` pada throw (`no-throw-literal`), deteksi floating promise (`no-floating-promises`).
2. **CI Gate:** PR dengan pelanggaran rule di atas gagal lint/typecheck; tidak bisa di-merge.
3. **Runtime Safety Net:** global handler (`unhandledRejection`, `uncaughtException`, ErrorBoundary) sebagai lapisan terakhir — tetap wajib log ke `error_logs` sebelum graceful shutdown/recover.
4. Code review checklist memuat butir verifikasi try-catch & logging pada setiap PR.

### 7.3 Architecture Decision Records (ADR)
1. Setiap **keputusan arsitektur mayor** (pola isolasi tenant, strategi realtime, skema penamaan, pilihan library inti, dsb.) wajib dicatat sebagai ADR di folder `docs/adr/` repo dengan format: *Konteks → Keputusan → Konsekuensi*.
2. ADR bersifat *immutable*: keputusan yang dibatalkan tidak diedit, melainkan ditandai *superseded* oleh ADR baru.
3. Referensi ADR terkait dicantumkan pada PR yang mengimplementasikan perubahan arsitektural tersebut.
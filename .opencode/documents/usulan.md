# Usulan & Risk Register — Menunggu Diskusi

> Status: draft diskusi bersama. Item sudah dibahas: **S1 ✅ masuk PRD**, **S2 ⏸️ tunda (sedang didiskusikan)**.
> Item di bawah ini BELUM disetujui — menunggu konfirmasi satu-per-satu.

---

## SARAN

### S3. Load Test RLS + Dynamic DDL sebagai Gate Fase F1
- **Konteks:** risiko terbesar arsitektur (RLS overhead, ribuan objek dinamis) tidak bisa dipastikan di atas kertas.
- **Usulan konkret:**
  - BRD: NFR-PER-03 — benchmark gate: overhead RLS ≤ 20ms/query p95; simulasi provisioning 1000 proyek tanpa degradasi katalog.
  - PRD: acceptance criteria fase F1 wajib lulus load test tersebut.
  - Skenario test detail → dokumen QA terpisah saat eksekusi.
- **Kenapa:** satu-satunya cara memvalidasi desain multi-schema sebelum seluruh produk dibangun di atasnya.
- **Target:** BRD + PRD.

### S4. ADR (Architecture Decision Records)
- **Konteks:** keputusan seperti "prefix via trigger", "LWW collaboration" punya trade-off yang mudah dilupakan.
- **Usulan:** konvensi proses — setiap keputusan arsitektur besar dicatat sebagai ADR (context → decision → consequences). Disebut sekilas di FSD §7 (engineering policy); praktiknya jadi folder `docs/adr/` di repo.
- **Target:** FSD (sekilas) + konvensi repo.

### S5. Seed Templates Bawaan (3–5 template)
- **Konteks:** cold start UX — user baru tidak bisa prompt bagus dari nol.
- **Usulan:** template bawaan (form master, transaksi, laporan, dsb.) ter-bundel saat instalasi; sekaligus jadi contoh pola generasi yang benar.
- **Target:** PRD (Module 11 extension) + FSD §3.11.3 (seed provisioning).

### S6. Timezone Policy (UTC + render locale)
- **Konteks:** FSD hanya bilang `TIMESTAMPTZ` tanpa aturan render; bug timezone klasik pada generated app (laporan harian, filter tanggal).
- **Usulan:** semua timestamp disimpan UTC; konversi ke timezone/locale end-user hanya di layer render; filter/laporan harian memakai timezone proyek (bisa dikonfigurasi per project).
- **Target:** FSD (subsection baru) + PRD (satu bullet).

---

## RISIKO

| # | Risiko | Dampak | Mitigasi usulan | Target |
|---|---|---|---|---|
| R1 | Performa RLS — subquery join ke `public.projects` di tiap query | Latency naik drastis di skala | Denormalisasi kolom ownership (`owner_user_id`, `project_id`) langsung ke setiap objek `{prefix}_*`; policy sederhana `auth.uid() = owner_user_id`; index | FSD (§3.1.5 + DDL pattern) + BRD NFR-PER (overhead <20ms p95) |
| R2 | Batas identifier Postgres 63 karakter — prefix makan 17 char | DDL gagal / silent truncation & collision | Validasi panjang `objek_db_name` ≤ 46 char saat generate/publish; hash-truncate nama panjang | FSD (§3.1.5 rule + generator validation) + PRD bullet Module 2 |
| R3 | Postgres Changes realtime mahal & unreliable multi-tenant | Bill & latency realtime meledak | Ganti strategi: DB trigger → `realtime.broadcast_changes()`, channel per project | FSD §3.11.1 revisi |
| R4 | Konflik migration saat push (editor vs pusher) | Struktur PROD korup / diff stale | Project lock selama promotion (`promotion_lock` di `public.projects`); verifikasi checksum snapshot; error code `ERR_MIG_017` | FSD §3.6.3 + DDL |
| R5 | AI-generated SQL berbahaya/salah | Objek rusak, data loss | Dry-run: transaksi preview rollback + EXPLAIN sebelum commit DDL/DML; human confirmation untuk destruktif | FSD §3.5.3 + §3.6.2 |
| R6 | Connection pool exhaustion | "Too many connections" | PgBouncer transaction mode; no prepared statements; DAL single gateway (sudah sesuai desain) | FSD §3.1.5 rule #5 |
| R7 | Volume error log + PII bocor ke log | Biaya storage, masalah privasi | Scrub PII sebelum insert; dedup/sampling via fingerprint; retention 90 hari (sudah ada) | FSD §3.8.5 revisi + BRD NFR-SEC (PII tidak boleh mentah di log) |
| R8 | Vendor lock-in Supabase | Sulit migrasi provider | Prinsip portabilitas Postgres standar; hindari fitur eksotis; DAL abstraction (sudah ada) | BRD NFR-MNT tambahan saja |
| R9 | Kolaborasi konflik edit (LWW) | Perubahan hilang tanpa jejak | v1: LWW + presence warning eksplisit; v2: optimistic locking (`version` column per page) | FSD §3.11.2 revisi + PRD bullet |
| R10 | Template incompatible antar versi engine | Instalasi rusak | `schema_version` stamp di `public.templates`; installer tolak versi > engine current | FSD §3.11.3 + DDL |
| R11 | Public app abuse meski captcha | Spam data, biaya | Honeypot field; anon submit quota per IP+device fingerprint; moderation queue opsional | FSD §3.7.2 + PRD Module 8 bullet |
| R12 | Catalog bloat — puluhan ribu objek dinamis per skema | Slow pg_catalog, backup lama | Kuota jumlah objek per proyek (misal max 200); monitoring count; arsip proyek dormant | FSD §3.8.2 + BRD FR-QTA-01 update |

---

## Log Keputusan

| Item | Keputusan | Catatan |
|---|---|---|
| S1 Phasing MVP | ✅ Masuk PRD | Section baru "Implementation Phasing" F1–F5 |
| S2 Threat Modeling | ⏸️ Tunda / sedang didiskusi | User ingin bahas lebih dalam dulu |
| S3 Load Test Gate | ✅ Masuk BRD + PRD | NFR-PER-03 di BRD; acceptance gate fase F1 di PRD §7 — sudah diimplementasikan |

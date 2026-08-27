# Threat Model — DAL v1 (STRIDE)

**Mandat:** FSD §3.9.6 — sesi STRIDE wajib sebelum DAL v1 dianggap production-ready. Diulang tiap perubahan arsitektur besar (mode publik, realtime, kolaborasi).

**Scope:** seluruh endpoint DAL (`dal_exec_dynamic`, `push_project_to_prod`, runtime end-user), generator AI, Studio.

## Metodologi (STRIDE per endpoint)

| Kategori | Pertanyaan | Mitigasi existing |
|---|---|---|
| **Spoofing** | Apakah caller bisa berpura-pura jadi user lain? | JWT Supabase Auth; `auth.uid()` di semua policy; service key server-only |
| **Tampering** | Apakah payload/SQL bisa dimanipulasi? | SQL Guard (verb whitelist, prefix check, single-stmt); param binding; server-side revalidation |
| **Repudiation** | Apakah aksi bisa disangkal? | `audit_logs` append-only (REVOKE UPDATE/DELETE); `error_logs` fingerprint |
| **Information Disclosure** | Apakah data tenant lain bocor? | RLS `owner_user_id = auth.uid()`; DAL prefix resolver blokir cross-prefix; PII scrub di error log |
| **Denial of Service** | Apakah quota/pool bisa habis? | `usage_counters` + rate limit token bucket (60 DML/menit, 10 DDL/menit); PgBouncer transaction mode; max 200 objek/proyek |
| **Elevation of Privilege** | Apakah user bisa akses PROD/DDL langsung? | PROD hanya via `push_project_to_prod` (security definer + owner check); kredensial tidak di client |

## Endpoint: `dal_exec_dynamic(p_sql, p_params)`

- **Threat:** SQL injection via crafted `p_sql`.
  - *Mitigasi existing:* SQL Guard di app-layer + defensive check di RPC (FORBIDDEN_TOKENS, `;` rejection).
  - *Gap:* RPC saat ini hanya validasi verb; eksekusi nyata belum diikat ke prefix di level PL/pgSQL. **Tindakan:** route seluruh eksekusi melalui QueryBuilder + `EXECUTE format` dengan identifier terqualifikasi, bukan string mentah.
- **Threat:** cross-tenant read via `information_schema` reference.
  - *Mitigasi:* SQL Guard menolak `pg_*`/`information_schema`; RLS berlapis.

## Endpoint: `push_project_to_prod(p_project_id)`

- **Threat:** user A push proyek user B.
  - *Mitigasi:* `auth.uid()` owner check sebelum clone. OK.
- **Threat:** DEV/PROD divergen saat push.
  - *Mitigasi:* `promotion_lock` (FSD §3.6.3) — belum di-lock di function. **Tindakan:** set `promotion_lock` di awal, cek konflik sebelum clone.

## Sign-off

- [ ] DAL v1: STRIDE review selesai & gap tertutup
- [ ] Re-evaluasi saat fitur publik/realtime/kolaborasi masuk (F3/F5)

> Status: MANDAT MASUK FSD (S2 ✅). Dokumen ini adalah hasil sesi threat modeling; eksekusi perbaikan gap dilakukan sebelum DAL v1 release.

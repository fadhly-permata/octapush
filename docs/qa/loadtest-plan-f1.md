# Load-Test Plan — F1 Acceptance Gate (NFR-PER-03)

**Target:** sebelum F2 dimulai, sistem wajib lulus benchmark simulasi beban penuh (BRD §5.2, S3).

## Acceptance Criteria

| Metrik | Ambang | Cara ukur |
|---|---|---|
| RLS overhead | ≤ 20 ms tambahan pada p95 untuk query by-PK | A/B query dengan/tanpa policy, ukur delta p95 |
| Katalog 1000 proyek | degradasi < 10% vs baseline 10 proyek | list projects latency rata-rata |
| 50 provisioning paralel | selesai < 30 detik, tanpa deadlock | jalankan 50 `provision_project` konkuren |

## Skenario (k6)

1. **Provisioning burst** — 50 VU masing-masing buat proyek baru (`provision_project(prefix)` + DDL 6 tabel). Assert < 30s, 0 error, 0 deadlock (`pg_locks`).
2. **RLS by-PK latency** — 200 VU baca `data_dev.{prefix}_tbl_x WHERE id = :pk`. Ukur p95 dengan policy ON vs OFF, delta ≤ 20ms.
3. **Catalog listing** — 1000 proyek terprovision; 50 VU list projects. Latency rata-rata degradasi < 10% vs 10 proyek.
4. **DAL concurrency** — 100 VU eksekusi `dal_exec_dynamic` SELECT/INSERT pada tabel terisolasi. Monitor connection pool (PgBouncer transaction mode).

## Pre-cond
- Supabase lokal (`supabase start`) dengan migrasi 0001–0003 diterapkan.
- `usage_counters`, RLS policies aktif.
- Seed 1000 proyek via script (`scripts/seed-loadtest.ts`).

## Output
- Laporan `docs/qa/loadtest-result-f1.md` (p95, throughput, error rate, lock events).
- Gate F2 hanya dibuka jika semua ambang lulus; jika gagal → tuning RLS/identifier/pool sebelum lanjut.

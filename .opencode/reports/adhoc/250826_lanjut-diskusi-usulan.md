# Report: Lanjut Diskusi Usulan (S4 dst.)

- Tanggal: 25/08/2026
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

"lanjut yuk obrolan kita.." — melanjutkan diskusi item di `usulan.md` dari titik terakhir (S4 ADR).

## Rencana Aksi

1. Baca `usulan.md` untuk state terkini.
2. Lanjut konfirmasi satu-per-satu: S4–S6 lalu R1–R12.
3. Implementasi yang disetujui ke BRD/PRD/FSD.

## Yang Telah Dilakukan

Konfirmasi & implementasi item usulan (dari `usulan.md`) satu-per-satu:

- **S4 ADR** ✅ → FSD §7.3
- **S5 Starter Use-Cases** ✅ → PRD Module 5, FSD §3.4.3, DDL `public.starter_use_cases`
- **S6 Timezone** ✅ → FSD §3.10.4, PRD Module 10, DDL `projects.timezone`
- **R1 RLS Performa** ✅ → FSD §3.1.5 (denormalisasi ownership, policy sederhana, pooling)
- **R2 Identifier Length** ✅ → FSD §3.1.5, PRD Module 2
- **R3 Realtime Strategy** ✅ → FSD §3.11.1 (broadcast-based)
- **R4 Migration Conflict** ✅ → FSD §3.6.3, DDL `promotion_lock`, ERR_MIG_017
- **R5 SQL Berbahaya** ✅ → FSD §3.5.3 (dry-run EXPLAIN)
- **R6 Pool Exhaustion** ✅ → ter-cover R1
- **R7 Error Log PII** ✅ → FSD §3.8.5, DDL `occurrence_count`, BRD NFR-SEC-06
- **R8 Vendor Lock-in** ✅ → BRD NFR-MNT-05
- **R9 Konflik Edit** ✅ → FSD §3.11.2, PRD Module 11
- **R10 Template Version** ✅ → FSD §3.11.3, DDL `templates.schema_version`
- **R11 Public Abuse** ✅ → FSD §3.7.2, PRD Module 8
- **R12 Catalog Bloat** ✅ → FSD §3.8.2, DDL `usage_counters.objects_count`, BRD FR-QTA-01

S2 ⏸️ tetap tunda (tidak masuk dokumen).

## Status Akhir

Selesai. Seluruh item usulan (kecuali S2 yang ditunda) terimplementasi di BRD/PRD/FSD. Dikomit & di-push ke repo.

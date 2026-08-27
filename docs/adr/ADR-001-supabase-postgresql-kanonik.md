# ADR-001: Kanonik Data Architecture — Supabase PostgreSQL

- Status: Accepted
- Tanggal: 27/08/2026
- Supersedes: —

## Konteks

Proyek OctaPush awalnya dideskripsikan dengan arsitektur Dual SQLite (`system_metadata.db` + `app_data.db`) di README dan prompt agent, sementara dokumen kanonik (BRD v1.3.0, PRD v1.7.0, FSD v1.3.0, usulan.md) sudah bermigrasi ke Supabase PostgreSQL multi-schema (4 skema: logic/data × dev/prod). Konflik ini memblokir seluruh stack, dependensi, DB layer, dan fase pembangunan. Diputuskan satu arsitektur kanonik sebelum development dimulai.

## Keputusan

Gunakan **Supabase PostgreSQL** sebagai arsitektur data kanonik.

- Skema: 4-schema `logic`/`data` × `dev`/`prod` sesuai FSD.
- Auth: Supabase Auth (Google OAuth).
- Realtime: DB trigger → `realtime.broadcast_changes()` dengan channel per project (FSD §3.11.1).
- Backend: DAL server-side + Supabase Edge Functions/RPC (FSD §3.1–3.6).
- Multi-tenant: RLS + UUID schema isolation, batas identifier ≤ 46 char (FSD mitigasi R1/R2/R12).
- Deployment: dev → preview → production promotion.

## Konsekuensi

Positif:
- Konsisten dengan BRD/PRD/FSD/usulan — tidak ada rework dokumen.
- RLS bawaan Supabase memperkuat isolasi multi-tenant.
- Realtime + Auth + Storage terkelola, portabilitas Postgres standar (NFR-MNT-05).

Negatif / trade-off:
- Arsitektur local-first/offline (Dual SQLite) dibatalkan — butuh koneksi backend untuk data.
- Vendor lock-in sebagian; mitigasi via DAL abstraction + prinsip Postgres standar.
- README dan prompt yang masih menyebut "Dual SQLite"/expo-sqlite wajib disinkronkan.
- RLS overhead & katalog bloat perlu divalidasi load-test (NFR-PER-03) sebelum gate S1.

## Referensi

- FSD §7.3 (mandat ADR)
- BRD v1.3.0, PRD v1.7.0, FSD v1.3.0, usulan.md (dokumen kanonik)

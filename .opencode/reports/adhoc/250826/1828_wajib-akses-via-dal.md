# Report: Wajib Akses Via DAL

- Tanggal: 25/08/2026
- Jam: 18:28
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

Runtime aplikasi hasil generate HARUS selalu mengakses database melalui DAL OctaPush — tidak boleh akses langsung ke Supabase (data_dev/data_prod) dengan kredensial sendiri/anon key.

## Rencana Aksi

1. Update BRD (FR-SEC-03 + NFR-SEC).
2. Update PRD (Module 2 isolation bullets).
3. Update FSD (§3.1.5 isolation rules).

## Yang Telah Dilakukan

- **BRD.MD:** FR-SEC-03 diubah menjadi "Mandatory DAL Access" (semua akses DEV/PROD wajib via OctaPush DAL, dilarang kredensial langsung); FR-SEC-04 baru untuk isolasi DAL+RLS; NFR-SEC-05 baru (service key hanya di sisi server DAL).
- **PRD.MD:** Module 2 ditambah bullet "Mandatory DAL Routing".
- **FSD.MD:** §3.1.5 ditambah rule #4 "Mandatory DAL Routing" — klien hanya ke endpoint DAL, service key server-side only, node EXECUTE_SQL juga via DAL.

## Status Akhir

Selesai. Ketiga dokumen kini konsisten: runtime aplikasi hasil generate tidak memiliki jalur akses langsung ke Supabase; seluruh query (termasuk EXECUTE_SQL di workflow engine) dirutekan melalui OctaPush DAL yang meneruskan JWT user.

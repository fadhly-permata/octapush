# Report: setup-supabase-online

- Tanggal: 28/08/2026
- Jam: 13:33
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

User pilih pakai Supabase online (bukan Docker lokal), beri URL `https://uylunbabcudjpcphzchw.supabase.co` + anon key + service role key. Minta setup proyek online.

## Rencana Aksi

1. Simpan kredensial ke `.env` lokal (jangan commit).
2. Install + login Supabase CLI, link ke project `uylunbabcudjpcphzchw`.
3. Jalankan migration `0001`–`0004` ke project online.
4. Deploy Edge Function `dal-exec-dynamic`.
5. Verifikasi skema `logic_dev`/`data_dev`/`logic_prod`/`data_prod` + RLS aktif.
6. (Opsional) config Google OAuth — cek dulu kalau butuh.

## Yang Telah Dilakukan

- (dalam proses)

## Status Akhir

- (dalam proses)

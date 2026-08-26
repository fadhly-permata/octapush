# Report: ubah-struktur-report

- Tanggal: 27/08/2026
- Jam: 05:45
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

1. Benerin 2 report yang jam-nya salah (UTC vs WIB).
2. Update rule `request-reports.md`: filename sebutkan jam saja, folder berdasarkan tanggal request.

## Rencana Aksi

1. Update rule file: struktur baru `.opencode/reports/{type}/{ddmmyy}/{hhmm}_{desc}.md`
2. Migrasi 2 report jam-salah ke folder tanggal WIB (`20260827`) + tambah field Jam
3. Verifikasi

## Yang Telah Dilakukan

- Update `.opencode/rules/request-reports.md`: struktur baru `.opencode/reports/{type}/{ddmmyy}/{hhmm}_{desc}.md` — folder=tanggal, filename=jam+deskripsi
- Template report sekarang ada field `Jam: {hh:mm}`
- Tambah note timezone: pakai `date` polos, jangan override `TZ=`
- Migrasi 2 report jam-salah → `.opencode/reports/adhoc/20260827/{0341,0356}_*.md`, Tanggal dikoreksi ke 27/08/2026 + field Jam ditambah
- Migrasi 19 report lama → folder `{240826,250826,260826}/`, filename `{hhmm}_{desc}.md`, field Jam ditambahkan (jam diambil dari filename/git history)
- Root `adhoc/` bersih

## Status Akhir

Selesai. Semua report (baru + lama) struktur konsisten, siap commit & push.

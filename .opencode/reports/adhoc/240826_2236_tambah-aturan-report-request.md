# Report: tambah-aturan-report-request

- Tanggal: 24/08/2026
- Request type: adhoc
- Status: Selesai

## Permintaan User

"buat file rules yang akan selalu menuliskan file report untuk setiap request selesai dikerjakan. Simpan di `.opencode/reports/{request_type}/{filename}`, `{request_type}` = nama command atau `adhoc`, `{filename}` = `{ddmmyy}_{hhmm}_{short_desc}.md`. Isi report: permintaan user, rencana aksi, status + yang telah dilakukan. Penulisan di awal dan akhir request. Bahasa Indonesia."

## Rencana Aksi

1. Baca `AGENTS.md` project yang ada.
2. Tambah section "Request Reports" berisi aturan lokasi, format nama file, template isi, prosedur awal/akhir request.
3. Buat folder report + tulis report untuk request ini sebagai contoh pertama penerapan rule.

## Yang Telah Dilakukan

- Baca `AGENTS.md` project (23 baris, berisi caveman ultra + verification).
- Edit `AGENTS.md` → tambah section `## Request Reports (wajib, selalu)` lengkap: path `.opencode/reports/{request_type}/{ddmmyy}_{hhmm}_{short_desc}.md`, definisi `{request_type}` (command name / `adhoc`), format filename, template Markdown Bahasa Indonesia, prosedur 5 langkah (awal = status "Dalam Pengerjaan", akhir = update file sama, batal = "Gagal/Sebagian").
- Buat file report ini di `.opencode/reports/adhoc/240826_2236_tambah-aturan-report-request.md`.

## Status Akhir

Selesai. Rule report aktif untuk semua request berikutnya di project ini via `AGENTS.md` project. Catatan: rule lahir di tengah sesi, jadi report request ini ditulis final langsung (awal+akhir digabung). Report request sebelumnya tidak ada karena rule baru dibuat sekarang.

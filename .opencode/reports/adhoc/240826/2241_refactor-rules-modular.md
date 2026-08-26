# Report: refactor-rules-modular

- Tanggal: 24/08/2026
- Jam: 22:41
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

Review dua poin:
1. Jangan menumpuk semua rules di `AGENTS.md` — sulit di-maintain. Simpan sebagai file modular (folder rules), bukan satu file campuran.
2. Tambah rule bahasa: semua dokumen agentic (commands/rules/skills/dll) ditulis dalam Bahasa Inggris, KECUALI file reports (Bahasa Indonesia). Komunikasi ke user selalu Bahasa Indonesia. Point ini juga dituliskan sebagai rule.

## Rencana Aksi

1. Buat `.opencode/rules/caveman-ultra.md` — pindahkan isi caveman dari `AGENTS.md`.
2. Buat `.opencode/rules/request-reports.md` — pindahkan isi aturan report.
3. Buat `.opencode/rules/language-policy.md` — rule bahasa baru.
4. Tipiskan `AGENTS.md` jadi index pendek.
5. Buat `opencode.json` project dengan glob `instructions: [".opencode/rules/*.md"]`.
6. Update report ini di akhir.

## Yang Telah Dilakukan

- Buat `.opencode/rules/caveman-ultra.md` — isi caveman ultra dipindah dari `AGENTS.md`, teks asli dipertahankan.
- Buat `.opencode/rules/request-reports.md` — aturan report dipindah, penjelasan Bahasa Inggris + template report tetap Bahasa Indonesia.
- Buat `.opencode/rules/language-policy.md` — rule baru: dokumen agentic = English, reports = Indonesia, chat ke user = Indonesia, kode/commit = English normal.
- Tulis ulang `AGENTS.md` jadi index pendek (tabel 3 rules + instruksi jangan menambah rule langsung di file ini).
- Buat `opencode.json` project dengan `"instructions": [".opencode/rules/*.md"]` agar ketiga rule termuat otomatis tiap sesi.

## Status Akhir

Selesai. Rules kini modular: satu topik = satu file di `.opencode/rules/`, `AGENTS.md` hanya index. Rule bahasa baru aktif. Catatan: perubahan `opencode.json` + file rules baru baru ter-load penuh setelah restart sesi opencode berikutnya.

# Report: ubah-rule-report-pure-qa

- Tanggal: 27/08/2026
- Jam: 07:39
- Request type: adhoc
- Status: Selesai

## Permintaan User

User minta memodifikasi rule penulisan report (`.opencode/rules/request-reports.md`): jika request hanya pertanyaan dan tidak ada aksi apa pun selain tanya-jawab, maka tidak perlu menulis report.

## Rencana Aksi

1. Edit `.opencode/rules/request-reports.md` — tambahkan pengecualian pure Q&A di section Exceptions.
2. Update procedure point 4 (sebelumnya: Q&A tetap dapat report).

## Yang Telah Dilakukan

1. Edit `.opencode/rules/request-reports.md`:
   - Title: "mandatory, every request" → "mandatory, except exceptions below"
   - Section Exceptions: tambah pengecualian pure Q&A (no repo action → no report)
   - Procedure point 4: "Q&A tetap dapat report" → "skip report jika pure Q&A"
   - Commit/push pengecualian: konsisten format bullet + sub-bullet
2. Edit `AGENTS.md` rule index: tambah "(except pure Q&A & commit/push)" pada deskripsi request-reports.

## Status Akhir

Selesai. Rule report sekarang: pure Q&A dan commit/push skip report. Semua request lain (ada aksi repo) tetap wajib report.

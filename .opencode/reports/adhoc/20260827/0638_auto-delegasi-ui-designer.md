# Report: auto-delegasi-ui-designer

- Tanggal: 27/08/2026
- Jam: 06:38
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

Bisa gak dibuat otomatis load agent ui-designer ketika main agent butuh desain halaman?

## Rencana Aksi

1. Jawab feasibility + mekanisme
2. Tawarin solusi: delegation rule

## Yang Telah Dilakukan

- Jawab: auto-load via delegation rule, bukan trigger native
- Buat `.opencode/rules/delegate-ui-designer.md` — wajibkan main agent spawn `ui-designer` untuk task desain/UI sebelum nulis kode UI
- Rule ter-load tiap session via `instructions` di `opencode.json`

## Status Akhir

Selesai.
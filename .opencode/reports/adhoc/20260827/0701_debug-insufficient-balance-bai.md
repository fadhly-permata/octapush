# Report: debug-insufficient-balance-bai

- Tanggal: 27/08/2026
- Jam: 07:01
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

Pas pakai model provider b.ai, muncul "Insufficient Balance" padahal pakai model unlimited.

## Rencana Aksi

1. Cek config opencode.jsonc (key, baseURL, model)
2. Test API langsung (non-stream + stream + list models)
3. Diagnosa penyebab

## Yang Telah Dilakukan

- Baca `~/.config/opencode/opencode.jsonc` — key & baseURL benar
- Test curl non-stream: HTTP 200, balasan normal
- Test curl stream: HTTP 200, model `deepseek-v4-flash-0731` (alias)
- List `/v1/models`: `deepseek-v4-flash` ada (canonical)
- Semua test sukses → config & key FUNGSI sekarang

## Status Akhir

Selesai. Config terbukti benar & key jalan (HTTP 200 di 3 test).

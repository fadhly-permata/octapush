# Report: buat-command-reload-opencode-files

- Tanggal: 26/08/2026
- Request type: adhoc
- Status: Gagal/Sebagian

## Permintaan User

Buat command `/reload-opencode-files` agar tidak perlu restart opencode setiap kali membuat/mengubah file commands, skills, atau rules.

## Rencana Aksi

1. Verifikasi apakah opencode punya mekanisme reload config saat runtime.
2. Jika ada, buat command `.opencode/commands/reload-opencode-files.md`.

## Yang Telah Dilakukan

- Riset: opencode memuat semua config (opencode.json, instructions/rules, agents, commands, skills) SEKALI saat startup dan tidak ada hook/API/plugin untuk memicu reload di tengah sesi.
- Plugin hook `config(cfg)` hanya jalan sekali saat init — tidak bisa dipakai untuk reload.
- Bahkan command baru sendiri baru ter-deteksi setelah restart, jadi `/reload-opencode-files` pun tidak akan berfungsi pada sesi yang sama saat dibuat.

## Status Akhir

Gagal — fitur reload runtime tidak tersedia di opencode. Satu-satunya cara tetap quit + restart opencode setelah mengubah file config/commands/skills/rules. Tidak dibuat command palsu yang menyesatkan.

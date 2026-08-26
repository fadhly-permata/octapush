# Report: buat-command-agent-gen

- Tanggal: 27/08/2026
- Jam: 06:25
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

Buat command `/agent-gen` untuk generate agent opencode. Diskusiin dulu kemampuan tiap agent sebelum di-generate.

## Rencana Aksi

1. Baca command existing buat referensi gaya
2. Buat `.opencode/commands/agent-gen.md`
3. Verifikasi

## Yang Telah Dilakukan

- Baca command `revise-master-plan.md` buat referensi gaya
- Buat `.opencode/commands/agent-gen.md`
- Command punya 2 fase: diskusi (7 pertanyaan: name, purpose, mode, model, permissions, description, prompt) + generate file `.opencode/agent/<name>.md`
- Frontmatter template sesuai skema opencode (description wajib, mode subagent default, model wajib prefix provider)

## Status Akhir

Selesai. Jalankan `/agent-gen ui-designer` buat tes.
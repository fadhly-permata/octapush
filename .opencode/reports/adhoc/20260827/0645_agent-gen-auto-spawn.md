# Report: agent-gen-auto-spawn

- Tanggal: 27/08/2026
- Jam: 06:45
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

Modifikasi `/agent-gen` supaya selalu auto-spawn subagent yang dibutuhkan (bikin delegation rule juga setiap generate agent).

## Rencana Aksi

1. Update `.opencode/commands/agent-gen.md`: tambah langkah generate delegation rule `.opencode/rules/delegate-<name>.md`
2. Verifikasi

## Yang Telah Dilakukan

- Update `.opencode/commands/agent-gen.md`: tambah sub-section "Delegation rule (auto-spawn wiring)" di Generation phase
- Setiap generate agent, /agent-gen sekarang juga bikin `.opencode/rules/delegate-<name>.md` dengan template trigger + procedure + boundaries
- Output sekarang menampilkan agent file + delegation rule file
- Skip delegation rule untuk mode `primary`

## Status Akhir

Selesai. Mulai sekarang /agent-gen selalu bikin 2 file: agent + delegation rule → auto-spawn.
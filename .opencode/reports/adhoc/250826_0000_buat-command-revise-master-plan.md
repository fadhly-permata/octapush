# Report: buat-command-revise-master-plan

- Tanggal: 26/08/2026
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

Buat command opencode `/revise-master-plan <deskripsi perubahan>` untuk merevisi PRD.MD, FSD.MD, BRD.MD di `.opencode/documents/`.

## Rencana Aksi

1. Cek lokasi dokumen target.
2. Buat file command `.opencode/commands/revise-master-plan.md` sesuai format opencode (frontmatter + template + $ARGUMENTS).

## Yang Telah Dilakukan

- Verifikasi lokasi dokumen: `.opencode/documents/{BRD,PRD,FSD}.MD`.
- Buat `.opencode/commands/revise-master-plan.md`: frontmatter (description), template berisi prosedur revisi 3 dokumen + `$ARGUMENTS` untuk input user.
- Command belum bisa dites di sesi ini — perlu restart opencode.

## Status Akhir

Selesai. Pakai: `/revise-master-plan Tambahkan fitur bla...bla...`. Restart opencode dulu agar command ter-load.

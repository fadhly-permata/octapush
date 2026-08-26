# Report: rollback-hard-ke-f36d863

- Tanggal: 25/08/2026
- Jam: 00:00
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

"rollback dong ke commit hash ini: f36d863398413b93f6c10892b1a276cf8abc0b5e, Hapus aja seluruh sejarah perubahan setelah commit tersebut."

## Rencana Aksi

1. Cek `git log` + `git status` untuk identifikasi commit yang akan dihapus.
2. Konfirmasi ke user (aksi irreversible).
3. Jalankan `git reset --hard f36d863398413b93f6c10892b1a276cf8abc0b5e`.
4. Verifikasi hasil dengan `git log`.

## Yang Telah Dilakukan

- Identifikasi 4 commit setelah `f36d863` via `git log --oneline -15`: `52ae0bc`, `ed83f41`, `4ab31f2`, `14e3cb2`.
- Konfirmasi ke user → user pilih "Ya, reset hard".
- Jalankan `git reset --hard f36d863398413b93f6c10892b1a276cf8abc0b5e`.
- Verifikasi: `git log --oneline -5` menunjukkan HEAD = `f36d863`, history bersih.

## Status Akhir

Selesai. Repo di-reset ke `f36d863`, 4 commit setelahnya (termasuk feat M0-M3.1) dihapus permanen dari branch saat ini. Catatan: jika pernah di-push, remote masih punya commit lama — perlu force push bila mau sinkron.

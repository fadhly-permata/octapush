# Report: pm-preview-web

- Tanggal: 27/08/2026
- Jam: 08:20
- Request type: adhoc
- Status: Selesai

> **Update akhir:** deploy berhasil via EAS Hosting.

- `npm install` gagal di sdcard (EACCES symlink) → install sukses di `$HOME/octapush-build` (support symlink).
- Fix serangkaian error: deps web, `@octapush/*` perlu `dist` (build packages via node tsc), missing `workflow.ts`, import path DAL, unused params, `owner` field app.json, LD_PRELOAD untuk shebang `/usr/bin/env`.
- `expo export --platform web` sukses → dist (index/studio/settings html).
- Android build: kena kuota Free plan habis bulan ini (reset 1 Sep).
- `eas deploy` sukses → preview URL live.

## Hasil

- Preview URL: https://octapush-preview--46ful5s5v8.expo.app
- Dashboard: https://expo.dev/projects/22a150e8-37d6-4113-a841-67a1436c34a2/hosting/deployments
- Prod (selanjutnya): `eas deploy --prod`

## Permintaan User

User minta preview aplikasi: "bisa dilakukan preview dulu gak? run via web aja, informasikan url nya".

## Rencana Aksi

1. Tambah deps web di apps/client (react-dom, react-native-web, @expo/metro-runtime).
2. `npm install` root workspace.
3. Jalankan `expo start --web` (dev server).
4. Cek port aktif, informasikan URL ke user.

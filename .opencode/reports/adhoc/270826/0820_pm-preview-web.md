# Report: pm-preview-web

- Tanggal: 27/08/2026
- Jam: 08:20
- Request type: adhoc
- Status: Dalam Pengerjaan

## Permintaan User

User minta preview aplikasi: "bisa dilakukan preview dulu gak? run via web aja, informasikan url nya".

## Rencana Aksi

1. Tambah deps web di apps/client (react-dom, react-native-web, @expo/metro-runtime).
2. `npm install` root workspace.
3. Jalankan `expo start --web` (dev server).
4. Cek port aktif, informasikan URL ke user.

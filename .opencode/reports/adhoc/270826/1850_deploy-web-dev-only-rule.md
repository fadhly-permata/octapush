# Report: deploy-web-dev-only-rule

- Tanggal: 27/08/2026
- Jam: 18:50
- Request type: adhoc
- Status: Selesai

## Yang Telah Dilakukan

- Buat `.opencode/rules/deploy-policy.md` (English):
  - Deploy hanya web (static SPA via `expo export --platform web`)
  - Environment DEV (preview) saja — `eas deploy` tanpa `--prod`
  - Hosting hanya Expo.dev (EAS Hosting), via `eas deploy --non-interactive --dev-domain <name>`
  - Forbidden: `eas deploy --prod`, `eas build -p android/ios` (quota Free plan), host lain, `expo start` publik
  - Pengecualian: dev lokal, web export lokal
  - Enforcement: CI tanpa `--prod`/`-p android`, verifikasi branch sebelum deploy manual
- Commit + push rule + report.

## Status Akhir

Selesai. Rule deployment aktif (auto-load via `opencode.json` instructions). Repo ter-push.

## Permintaan User

"push git aja, dan buat rule, deploy cuma boleh ke web envi dev pada expo.dev" — push repo + buat rule deployment: hanya boleh web, environment dev, di expo.dev.

## Rencana Aksi

1. Buat rule `.opencode/rules/deploy-policy.md` (English): deploy hanya web + env DEV di expo.dev.
2. Commit + push rule + report.
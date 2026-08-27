# QA Plan — Sprint Gates S1–S5

**Ref:** FSD §7.2 (coding standards gate), BRD NFR, PRD §7 (phasing).

## Gate Checklist

### S1 — F1 Foundation
- [ ] Google Auth login + session lifecycle (FR-AUT-01/02/03)
- [ ] Project create/select/soft-delete + provisioning 6 tabel internal (FR-PRJ-01/02)
- [ ] DAL: prefix resolver + SQL Guard + QueryBuilder unit tests
- [ ] RLS policies terpasang & terverifikasi (cross-tenant rejection test)
- [ ] **Load-test NFR-PER-03 lulus** (lihat `loadtest-plan-f1.md`)

### S2 — F2 Generation Studio (DEV)
- [ ] AI Provider configurator + encryption + test connection (FR-AIC-01/02/03)
- [ ] Dual-pane Studio + live preview theme-aware (FR-STU-01/03)
- [ ] Publish → DDL ke DEV + RLS (FR-STU-02)
- [ ] Try-catch + error_logs pipeline end-to-end (NFR-MNT-04)
- [ ] End-to-end: prompt → form → publish → submit data (isolation penuh)

### S3 — F3 Production & Distribution
- [ ] Push to PROD structure clone (FR-PRJ-03)
- [ ] Distribution modes PRIVATE/RESTRICTED/PUBLIC (FR-DST-01/02)
- [ ] Centralized error log dashboard + triage (FR-ERR-01..03)

### S4 — F4 Security & i18n
- [ ] Sanitization/XSS/CSRF/security headers (FR-SEC-06/07, FSD §3.9)
- [ ] Anti-abuse velocity check (FSD §3.9.5)
- [ ] i18n id/en platform UI + generated app (FR-I18N-01..04)
- [ ] Quota enforcement (FR-QTA-01)
- [ ] Internal security checklist lulus + kedua locale end-to-end

### S5 — F5 Ecosystem
- [ ] Schema Evolution migration re-push (FR-MIG-01..04)
- [ ] Realtime Sync (FR-RTM-01)
- [ ] Multi-user collaboration roles (FR-COL-01)
- [ ] Template Marketplace (FR-MKT-01)

## Lint / Typecheck Gate
Setiap PR wajib lulus `npm run lint` (ESLint custom: no-empty, no-throw-literal, no-floating-promises) + `npm run typecheck` (TS strict). CI menolak merge jika gagal (FSD §7.2).

## Test Stack
- Unit/Integration: Jest + React Native Testing Library
- Web E2E: Playwright
- Mobile E2E: Maestro/Detox
- Load: k6 (lihat `loadtest-plan-f1.md`)

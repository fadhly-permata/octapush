# 🐙 OctaPush

**OctaPush** is an open-source, cross-platform **AI-Driven Dynamic UI, Form Generator & Workflow Engine** built with React Native (Expo) and TypeScript. It allows developers and businesses to turn plain text prompts into fully functional **Master Pages**, **Transaction Forms**, **Reports**, and **Custom Decision Workflows** in seconds with full theme support (**Dark, Light, & System Auto**) and **Multi-Tenant Data Isolation**.

---

## ✨ Key Features

* **🔒 Multi-Tenant Schema Isolation:** Securely separates each user/project's app artifacts and business data using a canonical `object_prefix` (`{8digit_user_short_uuid}_{8digit_project_uuid}`) naming convention mapped via `public.projects`, enforced by Row Level Security (RLS) based on JWT claims — preventing data leakage between tenants.
* **🎨 Adaptive Theme Engine:** Seamlessly toggle between **Light**, **Dark**, or **Auto (System Default)** modes across all platforms and dynamically generated components.
* **🤖 Multi-Provider AI Engine:** Connect seamlessly to OpenRouter, HuggingFace, OpenAI, or local proxies (Ollama, LiteLLM).
* **🖥️ Interactive Live Studio:** Features a dual-pane workspace with a real-time UI preview and contextual AI chat refinement loop.
* **🐘 Supabase PostgreSQL Multi-Schema Architecture:**
  * **4-schema layout** (`logic`/`data` × `dev`/`prod`) — isolates shared platform registry (`public`), AI configurations, UI schemas, and workflows from tenant business data (canonical per [ADR-001](docs/adr/ADR-001-supabase-postgresql-kanonik.md)).
  * **Multi-tenant isolation** via RLS + `object_prefix` naming (`{usr8}_{prj8}_*`), with Supabase Auth (Google OAuth), Realtime, Storage, and Edge Functions.
* **🔄 Event-Driven Workflow Engine:** Execute automated business logic triggered by form events (`ON_SUBMIT`, `ON_CHANGE`), background cron schedulers, or server-side task queues.
* **📱 Cross-Platform Support:** Single codebase for Web (SPA/PWA), Android (APK/AAB), and iOS (IPA).

---

## 🛠️ Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│               OctaPush Generation Studio                │
└────────────────────────────┬────────────────────────────┘
                             │
  [User Prompt / Refinement] ─┼─> [Configured AI Provider]
                             │            │
                             │            ▼
                             │   [UI + Workflow Schema (JSON)]
                             │            │
                             │            ▼
  [Live Interactive Preview] <┼─── [Sandbox Memory Engine]
                              │
                              ▼ (User Approves "Publish" / "Push to PROD")
┌─────────────────────────────────────────────────────────┐
│           OctaPush DAL (Data Access Layer)              │
│   Object Prefix Resolver + SQL Guard + RLS-aware query  │
└────────────────────────────┬────────────────────────────┘
                              │
┌────────────────────────────┴────────────────────────────┐
│          Supabase PostgreSQL (Single Cluster)           │
├──────────────────────────┬──────────────────────────────┤
│ public: users, projects, │ logic_dev: {usr8}_{prj8}_    │
│ ai_configs, preferences, │   pages, workflows, versions │
│ distributions, audit,    ├──────────────────────────────┤
│ errors, templates, ...   │ data_dev: {usr8}_{prj8}_     │
│                          │   tbl_business, queue, logs  │
├──────────────────────────┴──────────────────────────────┤
│ logic_prod / data_prod: structure-only clone via Push   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│            OctaPush Workflow Engine                     │
│ (Form Triggers | Cron Scheduler | Server-Side Queues)   │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

* **Core Framework:** React Native / Expo (SDK 51+)
* **Languages:** TypeScript
* **Backend & Database:** Supabase PostgreSQL (Auth, Realtime, Storage, Edge Functions)
* **Tenant Security:** RLS + Object Prefix Resolver (`{usr8}_{prj8}_`), enforced via OctaPush DAL (Data Access Layer)
* **Theme & UI System:** React Native Paper / Gluestack UI + `useColorScheme` Hook
* **State Management:** Zustand
* **Background Tasks:** Supabase Edge Functions / server-side cron & task queues

---

## 🗺️ Development Roadmap

Canonical requirements & specs live in the master plan (`.opencode/documents/`): [BRD](.opencode/documents/BRD.MD), [PRD](.opencode/documents/PRD.MD), [FSD](.opencode/documents/FSD.MD). Build follows the PRD implementation phasing (F1–F5), gated by acceptance criteria:

| Phase | Scope | Gate |
|---|---|---|
| **F1 — Foundation** | Google Auth, Project Mgmt, OctaPush DAL, RLS + object prefix provisioning | Pass NFR-PER-03 load benchmark (RLS overhead ≤ 20ms p95; 1000 projects; 50 parallel provisioning < 30s) |
| **F2 — Generation Studio (DEV)** | AI Provider Configurator, dual-pane Studio, Publish to DEV, Theme Engine, SQL Guard, try-catch + error log pipeline | End-to-end prompt → form → publish → submit on DEV with full isolation |
| **F3 — Production & Distribution** | Push to PROD (structure clone), Generated App Distribution, Centralized Error Log dashboard & triage | Published app usable by end-users via DAL |
| **F4 — Security Hardening & i18n** | Sanitization/XSS/CSRF/headers, anti-abuse velocity check, i18n `id`/`en`, quota enforcement | Pass internal security checklist; both locales end-to-end |
| **F5 — Ecosystem** | Schema Evolution & Migration, Realtime Sync, Collaboration, Template Marketplace | Safe re-push migration; multi-user collaboration verified |

> Status: documentation complete (BRD v1.3.0, PRD v1.7.0, FSD v1.3.0), implementation in progress on `feat/foundation-f1` (F1).
# 🐙 OctaPush

**OctaPush** is an open-source, cross-platform **AI-Driven Dynamic UI, Form Generator & Workflow Engine** built with React Native (Expo) and TypeScript. It allows developers and businesses to turn plain text prompts into fully functional **Master Pages**, **Transaction Forms**, **Reports**, and **Custom Decision Workflows** in seconds with full theme support (**Dark, Light, & System Auto**) and **Multi-Tenant Data Isolation**.

---

## ✨ Key Features

* **🔒 Multi-Tenant Schema Isolation:** Securely separates user application databases using random UUID-based database schemas, mapped via `public.user_schema_mappings` to prevent data leakage.
* **🎨 Adaptive Theme Engine:** Seamlessly toggle between **Light**, **Dark**, or **Auto (System Default)** modes across all platforms and dynamically generated components.
* **🤖 Multi-Provider AI Engine:** Connect seamlessly to OpenRouter, HuggingFace, OpenAI, or local proxies (Ollama, LiteLLM).
* **🖥️ Interactive Live Studio:** Features a dual-pane workspace with a real-time UI preview and contextual AI chat refinement loop.
* **🐘 Supabase PostgreSQL Multi-Schema Architecture:**
  * **4-schema layout** (`logic`/`data` × `dev`/`prod`) — isolates shared metadata, AI configurations, UI schemas, and workflows from tenant business data.
  * **Multi-tenant isolation** via RLS + random UUID-based schemas, with Supabase Auth (Google OAuth), Realtime, Storage, and Edge Functions.
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
                              ▼ (User Approves & Clicks "Publish")
┌─────────────────────────────────────────────────────────┐
│                   Database Storage                      │
├────────────────────────────┬────────────────────────────┤
│ Supabase PostgreSQL        │ Supabase PostgreSQL        │
│ 4-Schema Layout            │ Tenant Schema [UUID_A]     │
│ - logic/dev, data/dev      │   └─ Dynamic DDL Tables    │
│ - logic/prod, data/prod    │ Tenant Schema [UUID_B]     │
│   (metadata, AI configs,   │   └─ Dynamic DDL Tables    │
│   UI schemas, workflows)   │   (RLS-isolated per user)  │
└────────────────────────────┴────────────────────────────┘
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
* **Tenant Security:** RLS + UUID v4 Schema Mapper
* **Theme & UI System:** React Native Paper / Gluestack UI + `useColorScheme` Hook
* **State Management:** Zustand
* **Background Tasks:** Supabase Edge Functions / server-side cron & task queues
# 🐙 OctaPush

**OctaPush** is an open-source, cross-platform **AI-Driven Dynamic UI, Form Generator & Workflow Engine** built with React Native (Expo) and TypeScript. It allows developers and businesses to turn plain text prompts into fully functional **Master Pages**, **Transaction Forms**, **Reports**, and **Custom Decision Workflows** in seconds with full theme support (**Dark, Light, & System Auto**) and **Multi-Tenant Data Isolation**.

---

## ✨ Key Features

* **🔒 Multi-Tenant Schema Isolation:** Securely separates user application databases using random UUID-based database schemas, mapped via `public.user_schema_mappings` to prevent data leakage.
* **🎨 Adaptive Theme Engine:** Seamlessly toggle between **Light**, **Dark**, or **Auto (System Default)** modes across all platforms and dynamically generated components.
* **🤖 Multi-Provider AI Engine:** Connect seamlessly to OpenRouter, HuggingFace, OpenAI, or local proxies (Ollama, LiteLLM).
* **🖥️ Interactive Live Studio:** Features a dual-pane workspace with a real-time UI preview and contextual AI chat refinement loop.
* **💾 Local-First & Dual SQLite Architecture:**
  * `system_metadata.db` — Isolates user mapping schema, AI configurations, preferences, UI schemas, and workflows.
  * `app_data.db` — Stores isolated user application operational business data across unique UUID schemas.
* **🔄 Event-Driven Workflow Engine:** Execute automated business logic triggered by form events (`ON_SUBMIT`, `ON_CHANGE`), background cron schedulers, or local task queues.
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
│ DB 1: system_metadata.db   │ DB 2: app_data.db          │
│ - Public: Schema Mappings  │ - User Schema [UUID_A]     │
│ - AI Configs & Preferences │   └─ Dynamic DDL Tables    │
│ - Page & Workflow Schemas  │ - User Schema [UUID_B]     │
│ - Triggers & Cron Rules    │   └─ Dynamic DDL Tables    │
└────────────────────────────┴────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│              OctaPush Workflow Engine                   │
│ (Form Triggers | Cron Scheduler | Task Queue Executor)  │
└────────────────────────────┴────────────────────────────┘
```

---

## 🚀 Tech Stack

* **Core Framework:** React Native / Expo (SDK 51+)
* **Languages:** TypeScript
* **Tenant Security:** UUID v4 Schema Mapper
* **Theme & UI System:** React Native Paper / Gluestack UI + `useColorScheme` Hook
* **State Management:** Zustand
* **Local Storage:** `expo-sqlite` (Dual connection support)
* **Background Tasks:** `expo-task-manager` & `expo-background-fetch`
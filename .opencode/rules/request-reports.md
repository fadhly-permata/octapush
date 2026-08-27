# Request Reports (mandatory, except exceptions below)

Every user request in this project MUST have a report file, EXCEPT the pure question-answer and commit/push cases listed under "Exceptions". Write the report twice: once at the START of the request, once updated at the END (request = one user message plus all tool calls that follow it).

## Exceptions (no report needed)

- Request that is ONLY a question and is answered by pure question-answer conversation — no repo action at all (no code edits, docs, config, analysis, commits, or other file/system changes). Skip report entirely. No file created.
  - Rationale: pure Q&A is conversation with nothing to describe; creating a report for it is noise.
  - If the request involves ANY repo-side work (even a small config edit, doc change, or analysis that writes files), a report IS required.
- Request whose ONLY action is `git commit` and/or `git push` — skip report entirely. No file created.
  - Rationale: commit/push requests are pure bookkeeping with no repo-side work to describe.
  - If the request ALSO does real work (code edits, docs, config, analysis) before/after the commit, a report IS required.

## Location & filename

- Path: `.opencode/reports/{request_type}/{ddmmyy}/{hhmm}_{short_desc}.md`
- `{request_type}`:
  - Command name without `/` if the request was triggered by a slash command (e.g. `caveman`, `caveman-commit`, `review`).
  - Hardcode `adhoc` for regular requests without a command.
- `{folder}`:
  - `{ddmmyy}` = date when the request STARTED, local timezone (WIB, GMT+7). Example: `270826`.
- `{filename}`:
  - `{hhmm}` = time when the request STARTED, 24-hour format, local timezone. Example: `1435`.
  - `{short_desc}` = 2–4 kebab-case words describing the core of the request. Example: `perbaiki-auth-middleware`.
  - Full path example: `.opencode/reports/adhoc/270826/1435_perbaiki-auth-middleware.md`

## Timezone note

Always use the device's local time (WIB). Get it with plain `date` — do NOT set a `TZ=` env override in the command; the zoneinfo database on this device is incomplete and `TZ=Asia/Jakarta` falls back to UTC, which shifts timestamps 7 hours.

## Report content

Reports are ALWAYS written in Bahasa Indonesia (code, paths, and error strings stay as-is). Use this template:

```markdown
# Report: {short_desc}

- Tanggal: {dd/mm/yyyy}
- Jam: {hh:mm}
- Request type: {request_type}
- Status: {Dalam Pengerjaan | Selesai | Gagal/Sebagian}

## Permintaan User

{Kutip/ringkas permintaan user apa adanya}

## Rencana Aksi

1. {Langkah rencana saat awal request}

## Yang Telah Dilakukan

- {Update di akhir request: daftar konkret aksi + hasil}

## Status Akhir

{Penjelasan singkat akhir pekerjaan; jika gagal/sebagian, sebutkan penyebab dan sisa pekerjaan}
```

## Procedure

1. START of request: create folder + report file with "Permintaan User" + "Rencana Aksi" filled in, Status = "Dalam Pengerjaan". Do this BEFORE the first tool call for core work.
2. END of request: edit the SAME file — fill "Yang Telah Dilakukan" + "Status Akhir", final Status ("Selesai" / "Gagal/Sebagian"). NEVER create a second file.
3. If the user cancels mid-request: still update the file, Status = "Gagal/Sebagian", note where work stopped.
4. If the request is pure question-answer with NO repo action (see Exceptions): skip the report entirely — no file created.

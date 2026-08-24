# Request Reports (mandatory, every request)

Every user request in this project MUST have a report file. Write the report twice: once at the START of the request, once updated at the END (request = one user message plus all tool calls that follow it).

## Location & filename

- Path: `.opencode/reports/{request_type}/{ddmmyy}_{hhmm}_{short_desc}.md`
- `{request_type}`:
  - Command name without `/` if the request was triggered by a slash command (e.g. `caveman`, `caveman-commit`, `review`).
  - Hardcode `adhoc` for regular requests without a command.
- `{filename}`:
  - `{ddmmyy}_{hhmm}` = date + time when the request STARTED, 24-hour format, local timezone. Example: `240826_1435`.
  - `{short_desc}` = 2–4 kebab-case words describing the core of the request. Example: `perbaiki-auth-middleware`.
  - Full path example: `.opencode/reports/adhoc/240826_1435_perbaiki-auth-middleware.md`

## Report content

Reports are ALWAYS written in Bahasa Indonesia (code, paths, and error strings stay as-is). Use this template:

```markdown
# Report: {short_desc}

- Tanggal: {dd/mm/yyyy}
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
4. Pure question-and-answer requests with no repo action STILL get a report — every request is reported.

# Language Script Enforcement — English & Indonesian only

Every file in this repository (code, SQL, config, docs, reports, comments,
commit messages, PR titles) MUST be written using **Latin script only**.

## Allowed

- English (`en`)
- Indonesian (`id`)
- Latin script characters plus standard EN/ID diacritics.
- Emoji are allowed (they are not language script; used as UI glyphs/icons).

## Forbidden

Any non-Latin language script anywhere in the repository, including:

| Script | Examples |
|---|---|
| Chinese / CJK | 中文, 汉字 |
| Japanese | 日本語, ひらがな, カタカナ |
| Korean / Hangul | 한국어 |
| Cyrillic | Привет |
| Arabic | مرحبا |
| Devanagari / Indic | नमस्ते |
| Any other non-Latin script | — |

## Why

- Mixed scripts break rendering, font fallback, search, and i18n pipelines.
- This project supports only `id` and `en` locales (FR-I18N-01). Non-Latin
  content is never part of the product surface.

## Enforcement (manual verification)

Before committing, run (from repo root):

```bash
grep -rnP "[\x{4E00}-\x{9FFF}\x{3040}-\x{30FF}\x{AC00}-\x{D7AF}\x{0400}-\x{04FF}\x{0600}-\x{06FF}\x{0900}-\x{097F}\x{0370}-\x{03FF}\x{0590}-\x{05FF}]" \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
  --include='*.json' --include='*.sql' --include='*.md' --include='*.html' \
  --include='*.yml' --include='*.yaml' --include='*.toml' . | grep -v node_modules | grep -v '\.git/'
```

Any match = violation. Fix or remove the offending text before commit.

## Exceptions

- Never. Content in other scripts is not required by this project.
- If a future locale outside `id`/`en` is added, update `language-policy.md` and
  this rule FIRST (BRD/PRD/FSD revision via `revise-master-plan`), then allow
  only that specific script in dedicated locale resource files.

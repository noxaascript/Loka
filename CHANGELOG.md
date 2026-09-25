# Changelog

All notable changes to Loka are documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/)  
Versioning: `0.0.0-beta.YYYYMMDD.hash`

---

## [0.0.0-beta.20260924] — 2026-09-24

### Added
- **Tunnel auto-start** — cloudflared launches automatically on server boot, no manual click needed
- **Update checker** — polls npm registry every 30 minutes; shows in terminal, sidebar badge, and Home card
- **Custom dialog system** — replaces browser `confirm()`, `prompt()`, `alert()` with glass-styled modal
- **Sidebar overlay** — click anywhere (mobile) or press ESC to close sidebar
- **Smooth sidebar animation** — 350ms cubic-bezier slide transition
- **Loka logo** — PNG logo in sidebar + favicon in browser tab
- **Version pill** — displays current version in sidebar with full tooltip
- **Colored brand logos** — sourced from Simple Icons + SVGL, cached locally in `lib/ui/icons/`
- **Multi-platform binaries** — cloudflared mirror on GitHub Releases (Windows/macOS/Linux), auto-download on `npm install`
- **Tunnel URL notifications** — toast alert when tunnel URL changes
- **Localhost password** — optional password protection for the dashboard

### Fixed
- **Provider subtitle** — changed from `p.type` to domain + model count (was showing "OPENAI" for all)
- **Sidebar update button** — replaced `<a href="/cli">` with proper button that triggers update
- **Regular Providers section** — restored on `/providers` page
- **OpenAI & Groq logos** — now black in light mode, visible on white background
- **Hide menu button** — removed from sidebar footer
- **API key auth** — `/api/keys/delete` was not accepting auth correctly
- **Corrupted config clients** — auto-filters clients with `name: {}` (Promise not awaited bug)
- **Global error handler** — server no longer crashes on async route errors

### Changed
- **Default theme** — light mode (was dark)
- **Background** — silver gradient + animated blobs (purple/pink/blue)
- **Glass effect** — backdrop-filter blur 24px on cards, modal, sidebar
- **Accent colors** — purple → pink gradient
- **Sidebar layout** — compact 220px with MAIN + SYSTEM sections
- **Config location** — moved to `~/.config/loka/loka.json` for consistency across folders

### Technical
- **Auto-refresh OAuth tokens** — background refresh every 5 minutes
- **Tunnel state** — persisted to `~/.config/loka/tunnel.json`, auto-resumes on restart
- **Update checker backend** — `lib/updater.js` + `/api/update/*` endpoints

### Removed
- **Provider `together`** — removed from config
- **Emoji 🌿 in sidebar** — replaced with PNG logo
- **Browser `confirm()` dialogs** — all replaced with custom dialog

---

## [0.0.0-beta.20260923.684e122] — 2026-09-23

### Added
- **New OAuth providers** — Anthropic OAuth, Antigravity, Kimi, Kilo, Cursor, Qoder, CodeBuddy, Cline, ClinePass, MiMo
- **Free-tier providers** — OpenRouter, Google AI Studio, Groq, Mistral, Cerebras, Cloudflare Workers AI, GitHub Models, HuggingFace, Cohere, SambaNova, OpenCode Zen
- **CLI Connector** — detects Claude Code, Codex CLI, OpenCode, Gemini CLI + Configure button
- **Import Models** — auto-fetch model list from provider `/v1/models` endpoint
- **Combo editor** — UI for managing fallback chains
- **Update checker backend** — `lib/updater.js` + `/api/update/*` endpoints

### Fixed
- **Combo delete validation** — no longer wipes all combos on delete
- **Cloudflared auto-download** — binary cached at `~/.config/loka/bin/`
- **Router fallback** — fatal provider errors no longer crash the server
- **Config auto-reload** — hot-reload `loka.json` without restart

### Changed
- **OAuth providers** separated from Regular providers on `/providers`
- **Model lists** updated to latest (GPT-5.6, Claude Sonnet 4.5, Grok 4.3)
- **API key format** — generates `sk-xxx` (OpenAI-compatible) using crypto random

### Technical
- **RTK Token Saver** — compresses tool output (git diff, grep, ls, json) before sending to LLM
- **Config validator** — checks providers without id/type/baseUrl/models
- **Multi API key** per provider — automatic round-robin

---

## [0.0.0-beta.20260922] — 2026-09-22

### Added
- **First beta release** — base router with providers: OpenAI Codex, Anthropic, GitHub Copilot, Google Gemini CLI
- **API Key providers**: Groq, xAI, DeepSeek, Mistral, OpenRouter, Together, Fireworks, Perplexity, Cerebras
- **Dashboard UI** — Home, Providers, Combos, API Keys, Usage, Logs, Settings
- **OpenAI-compatible API**:
  - `POST /v1/chat/completions`
  - `POST /v1/messages` (Anthropic format)
  - `POST /v1/embeddings`
  - `GET /v1/models`
- **Combo fallback** — automatic provider chain when the first one fails
- **Streaming support** — SSE for OpenAI-compatible providers
- **Config file** — `loka.json` at project root

### Core Features
- **Router engine** — plans route based on `weight` + `ready` status
- **Provider cooldown** — failed providers are skipped temporarily
- **Circuit breaker** — 3 consecutive failures → cooldown
- **Cache** — response cache with configurable TTL
- **Rate limit** — sliding window per client key
- **Logs** — structured NDJSON at `data/logs.ndjson`
- **Stats** — usage tracking per provider + client

---

## [0.0.0-beta.fix] / [0.0.0-beta.fix.1] — 2026-09-22

### Fixed
- **Empty config** on first install
- **Missing dependencies** in some files
- **Typos** in several endpoints

---

## [0.0.0-beta] — 2026-09-21 (initial)

### Initial Release
- **Core concept** — one endpoint for all AI providers
- **Project structure**:
  - `index.js` — entry point
  - `lib/server.js` — HTTP server
  - `lib/router.js` — routing engine
  - `lib/config.js` — config loader
  - `lib/auth.js` — client authentication
- **Initial providers**: Groq, Gemini, Claude, OpenAI Codex
- **Minimal dashboard** — provider list + connect button

---

## Legend

| Icon | Category |
|------|----------|
| ✨ | New feature |
| 🐛 | Bug fix |
| 🎨 | UI/UX change |
| 🔧 | Technical change |
| 🗑 | Removed feature |
| ⚠️ | Breaking change |

---

## Installation

```bash
# Stable version
npm install -g loka-ai-router@latest

# Latest beta
npm install -g loka-ai-router@beta

# Specific version
npm install -g loka-ai-router@0.0.0-beta.20260924
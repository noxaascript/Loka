# 🌿 Loka AI Router

**Satu endpoint untuk semua provider AI.** Self-hosted, tanpa telemetry, OAuth + API key.

> 🌐 **Bahasa:** [English](README.md) · [Bahasa Indonesia](README.id.md) · [Español](README.es.md) · [한국어](README.ko.md)

Loka adalah router AI lokal yang menyatukan OpenAI, Anthropic, Gemini, Groq, DeepSeek, dan 15+ provider lain ke satu endpoint OpenAI-compatible. Cocok untuk dipakai dengan Claude Code, Codex CLI, OpenCode, Cursor, Cline, atau aplikasi apa pun yang support OpenAI API.

---

## ✨ Fitur

- **OpenAI-compatible API** — `/v1/chat/completions`, `/v1/messages`, `/v1/models`
- **OAuth multi-provider** — Codex, Claude, Gemini CLI, GitHub Copilot (device flow)
- **15+ provider API key** — Groq, xAI, DeepSeek, Mistral, OpenRouter, Together, Fireworks, Perplexity, Cerebras, xKiro, dan lain-lain
- **Combo fallback** — rantai provider otomatis kalau yang pertama gagal
- **Cloudflare Tunnel** — expose ke internet dalam 1 klik, gratis
- **CLI Connector** — auto-config Claude Code, Codex CLI, OpenCode, Gemini CLI
- **RTK Token Saver** — kompres output tool 20–40% sebelum kirim ke LLM
- **Dashboard lokal** — kelola semua dari browser
- **Zero telemetry** — semua data tersimpan di komputer kamu
- **Cache + rate limit** — built-in, tinggal aktifkan

---

## 🚀 Mulai Cepat

### Install

```bash
npm install -g loka-ai-router
```

Atau tanpa install:

```bash
npx loka-ai-router
```

### Jalankan

```bash
loka
```

Buka http://localhost:1455 di browser.

### Setup pertama kali

- Buka halaman Providers
- **OAuth Providers** — klik provider → Connect OAuth (login sekali, selesai)
- **Regular Providers** — klik provider → Add API Key → paste key dari console provider
- Klik **Test** di model untuk verifikasi

### Pakai di aplikasi lain

- **Base URL:** <http://localhost:1455/v1>
- **API Key:** ambil dari halaman API Keys di dashboard
- **Model:** pilih dari daftar di halaman Providers

## 📋 Daftar Provider

### OAuth (login via browser)

| Provider | Model |
|---|---|
| OpenAI Codex | gpt-5.6, gpt-5.5, gpt-5.4 |
| Anthropic | claude-opus-4-5, claude-sonnet-4-5 |
| Google Gemini CLI | gemini-2.5-pro, gemini-2.5-flash |
| GitHub Copilot | gpt-5, claude-sonnet-4-5 |

### API Key

| Provider | Daftar di |
|---|---|
| Groq | <console.groq.com/keys> |
| xAI | <console.x.ai> |
| DeepSeek | <platform.deepseek.com> |
| Mistral | <console.mistral.ai> |
| OpenRouter | <openrouter.ai/keys> |
| Together | <api.together.ai> |
| Fireworks | <fireworks.ai> |
| Perplexity | <perplexity.ai> |
| Cerebras | <cloud.cerebras.ai> |
| xKiro | <xkiro.com> |
| Ollama | Lokal, gratis, tanpa key |

Semua provider API key support **Import Models** — fetch daftar model lengkap otomatis.

## 🔌 CLI Connector

Halaman CLI Connector mendeteksi CLI AI yang terinstall di komputer dan otomatis menulis config-nya.

CLI yang didukung:

- Claude Code
- Codex CLI
- OpenCode
- Gemini CLI

Cara pakai:

1. Install CLI dulu (panduan muncul otomatis kalau belum terinstall)
2. Buka `/cli` di dashboard
3. Klik **Configure for Loka**
4. Pilih endpoint, model, atau combo
5. Selesai — CLI sekarang ngarah ke Loka

## 🌐 Tunnel

Halaman Tunnel untuk expose Loka ke internet tanpa buka router:

- **Local Network** — akses dari device lain di WiFi yang sama
- **Cloudflare Tunnel** — URL publik HTTPS, gratis, 1 klik setup
- **Ngrok** — alternatif, butuh akun

## ⚙️ Konfigurasi

Semua config ada di `loka.json`:

```json
{
  "port": 1455,
  "host": "0.0.0.0",
  "cooldownMs": 60000,
  "maxRetries": 2,
  "rtk": { "enabled": true },
  "cache": { "enabled": true, "ttlMs": 300000 },
  "rateLimit": { "enabled": true, "maxRequests": 120 }
}
```

Edit via dashboard halaman Settings, atau langsung file-nya.

## 🛠️ Development

```bash
git clone https://github.com/noxaascript/Loka.git
cd Loka
npm install
npm run dev
```

Buka http://localhost:1455.

## 📄 Struktur

```text
loka/
├── index.js              # Entry point
├── setup.mjs             # Installer + launcher
├── loka.json             # Config
├── lib/
│   ├── server.js         # HTTP server
│   ├── router.js         # Routing engine
│   ├── api/              # Endpoints
│   ├── oauth/            # OAuth providers
│   ├── upstream/         # Provider callers
│   ├── translate/        # Format converters
│   ├── tools/            # RTK, compactor
│   └── ui/               # Dashboard pages
└── data/                 # Logs, stats, cache
```

## ⚠️ Catatan

- **OAuth Anthropic** — pakai subscription Claude Pro/Max. Penggunaan di luar Claude Code melanggar ToS Anthropic. Pakai dengan risiko sendiri.
- **OAuth Codex** — butuh akun ChatGPT Plus/Pro.
- **xAI OAuth** — diblokir Cloudflare untuk bare HTTP. Pakai API key.
- **RTK** — bisa dipakai tanpa config tambahan, tapi optimal kalau kamu pakai tool calling.

## 🤝 Kontribusi

Pull request, issue, dan feedback sangat diterima. Buka issue di [GitHub](https://github.com/noxaascript/Loka/issues) atau fork repo-nya.

## 📜 License

MIT © 2026 Loka Contributors

## 🌟 Credit

- Icon set: [lobe-icons](https://github.com/lobehub/lobe-icons)
- Cloudflare Tunnel: [cloudflared](https://github.com/cloudflare/cloudflared)
- Provider API references dari komunitas open source
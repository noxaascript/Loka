# 🌿 Loka AI Router

**One endpoint for all AI providers.** Self-hosted, zero telemetry, OAuth + API key.

> 🌐 **Languages:** [English](README.md) · [Bahasa Indonesia](README.id.md) · [Español](README.es.md) · [한국어](README.ko.md)

Loka is a local AI router that unifies OpenAI, Anthropic, Gemini, Groq, DeepSeek, and 15+ other providers into a single OpenAI-compatible endpoint. Works with Claude Code, Codex CLI, OpenCode, Cursor, Cline, or any app that supports the OpenAI API.

---

## ✨ Features

- **OpenAI-compatible API** — `/v1/chat/completions`, `/v1/messages`, `/v1/models`
- **Multi-provider OAuth** — Codex, Claude, Gemini CLI, GitHub Copilot (device flow)
- **15+ API key providers** — Groq, xAI, DeepSeek, Mistral, OpenRouter, Together, Fireworks, Perplexity, Cerebras, xKiro, and more
- **Combo fallback** — automatic provider chain when the first one fails
- **Cloudflare Tunnel** — expose to the internet in one click, free
- **CLI Connector** — auto-configure Claude Code, Codex CLI, OpenCode, Gemini CLI
- **RTK Token Saver** — compress tool output by 20–40% before sending to LLM
- **Local dashboard** — manage everything from the browser
- **Zero telemetry** — all data stays on your machine
- **Cache + rate limit** — built in, just enable it

---

## 🚀 Quick Start

### Install

```bash
npm install -g loka-ai-router

Or without installing:

bash
npx loka-ai-router
Run
bash
loka
Open http://localhost:1455 in your browser.

First-time setup
Open the Providers page

OAuth Providers — click a provider → Connect OAuth (log in once, done)

Regular Providers — click a provider → Add API Key → paste key from the provider console

Click Test on a model to verify

Use in other apps
Base URL: http://localhost:1455/v1

API Key: from the API Keys page in the dashboard

Model: pick from the list on the Providers page

📋 Providers
OAuth (browser login)
Provider	Models
OpenAI Codex	gpt-5.6, gpt-5.5, gpt-5.4
Anthropic	claude-opus-4-5, claude-sonnet-4-5
Google Gemini CLI	gemini-2.5-pro, gemini-2.5-flash
GitHub Copilot	gpt-5, claude-sonnet-4-5
API Key
Provider	Get key at
Groq	console.groq.com/keys
xAI	console.x.ai
DeepSeek	platform.deepseek.com
Mistral	console.mistral.ai
OpenRouter	openrouter.ai/keys
Together	api.together.ai
Fireworks	fireworks.ai
Perplexity	perplexity.ai
Cerebras	cloud.cerebras.ai
xKiro	xkiro.com
Ollama	Local, free, no key needed
All API key providers support Import Models — fetch the full model list automatically.

🔌 CLI Connector
The CLI Connector page detects AI CLIs installed on your machine and writes their config automatically.

Supported:

Claude Code

Codex CLI

OpenCode

Gemini CLI

How to use:

Install the CLI first (guide shown automatically if not installed)

Open /cli in the dashboard

Click Configure for Loka

Pick endpoint, model, or combo

Done — the CLI now points to Loka

🌐 Tunnel
The Tunnel page exposes Loka to the internet without opening your router:

Local Network — access from another device on the same WiFi

Cloudflare Tunnel — free public HTTPS URL, one-click setup

Ngrok — alternative, requires an account

⚙️ Configuration
Everything lives in loka.json:

json
{
  "port": 1455,
  "host": "0.0.0.0",
  "cooldownMs": 60000,
  "maxRetries": 2,
  "rtk": { "enabled": true },
  "cache": { "enabled": true, "ttlMs": 300000 },
  "rateLimit": { "enabled": true, "maxRequests": 120 }
}
Edit via the Settings page in the dashboard, or edit the file directly.

🛠️ Development
bash
git clone https://github.com/noxaascript/Loka.git
cd Loka
npm install
npm run dev
Open http://localhost:1455.

📄 Structure
text
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
⚠️ Notes
Anthropic OAuth — uses your Claude Pro/Max subscription. Using it outside Claude Code violates Anthropic's ToS. Use at your own risk.

Codex OAuth — requires a ChatGPT Plus/Pro account.

xAI OAuth — blocked by Cloudflare for bare HTTP. Use an API key instead.

RTK — works out of the box, but shines when you use tool calling.

🤝 Contributing
PRs, issues, and feedback are welcome. Open an issue at GitHub or fork the repo.

📜 License
MIT © 2026 Loka Contributors

🌟 Credits
Icon set: lobe-icons

Cloudflare Tunnel: cloudflared

Provider API references from the open-source community

# 🌿 Loka AI Router

**Un solo endpoint para todos los proveedores de IA.** Autoalojado, sin telemetría, OAuth + clave API.

> 🌐 **Idiomas:** [English](README.md) · [Bahasa Indonesia](README.id.md) · [Español](README.es.md) · [한국어](README.ko.md)

Loka es un enrutador de IA local que unifica OpenAI, Anthropic, Gemini, Groq, DeepSeek y más de 15 proveedores en un único endpoint compatible con OpenAI. Funciona con Claude Code, Codex CLI, OpenCode, Cursor, Cline o cualquier aplicación que soporte la API de OpenAI.

---

## ✨ Características

- **API compatible con OpenAI** — `/v1/chat/completions`, `/v1/messages`, `/v1/models`
- **OAuth multiproveedor** — Codex, Claude, Gemini CLI, GitHub Copilot (device flow)
- **Más de 15 proveedores con clave API** — Groq, xAI, DeepSeek, Mistral, OpenRouter, Together, Fireworks, Perplexity, Cerebras, xKiro y más
- **Combo con fallback** — cadena automática de proveedores si el primero falla
- **Cloudflare Tunnel** — expón a internet en un clic, gratis
- **CLI Connector** — configura automáticamente Claude Code, Codex CLI, OpenCode, Gemini CLI
- **RTK Token Saver** — comprime la salida de herramientas un 20–40% antes de enviarla al LLM
- **Panel local** — gestiona todo desde el navegador
- **Cero telemetría** — todos los datos permanecen en tu equipo
- **Caché + límite de peticiones** — integrado, solo actívalo

---

## 🚀 Inicio rápido

### Instalar

```bash
npm install -g loka-ai-router
```

O sin instalar:

```bash
npx loka-ai-router
```

### Ejecutar

```bash
loka
```

Abre http://localhost:1455 en tu navegador.

### Configuración inicial

- Abre la página Providers
- **OAuth Providers** — haz clic en un proveedor → Connect OAuth (inicia sesión una vez, listo)
- **Regular Providers** — haz clic en un proveedor → Add API Key → pega la clave de la consola del proveedor
- Haz clic en **Test** en un modelo para verificar

### Usar en otras aplicaciones

- **Base URL:** <http://localhost:1455/v1>
- **API Key:** desde la página API Keys en el panel
- **Model:** elige de la lista en la página Providers

## 📋 Proveedores

### OAuth (inicio de sesión en el navegador)

| Proveedor | Modelos |
|---|---|
| OpenAI Codex | gpt-5.6, gpt-5.5, gpt-5.4 |
| Anthropic | claude-opus-4-5, claude-sonnet-4-5 |
| Google Gemini CLI | gemini-2.5-pro, gemini-2.5-flash |
| GitHub Copilot | gpt-5, claude-sonnet-4-5 |

### Clave API

| Proveedor | Obtén la clave en |
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
| Ollama | Local, gratis, sin clave |

Todos los proveedores con clave API admiten **Import Models** — descarga la lista completa de modelos automáticamente.

## 🔌 CLI Connector

La página CLI Connector detecta las CLI de IA instaladas en tu equipo y escribe su configuración automáticamente.

Compatible con:

- Claude Code
- Codex CLI
- OpenCode
- Gemini CLI

Cómo usar:

1. Instala primero la CLI (la guía aparece automáticamente si no está instalada)
2. Abre `/cli` en el panel
3. Haz clic en **Configure for Loka**
4. Elige endpoint, modelo o combo
5. Listo — la CLI ahora apunta a Loka

## 🌐 Túnel

La página Tunnel expone Loka a internet sin abrir el router:

- **Red local** — acceso desde otro dispositivo en la misma WiFi
- **Cloudflare Tunnel** — URL pública HTTPS, gratis, configuración en un clic
- **Ngrok** — alternativa, requiere cuenta

## ⚙️ Configuración

Todo vive en `loka.json`:

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

Edita desde la página Settings en el panel, o edita el archivo directamente.

## 🛠️ Desarrollo

```bash
git clone https://github.com/noxaascript/Loka.git
cd Loka
npm install
npm run dev
```

Abre http://localhost:1455.

## 📄 Estructura

```text
loka/
├── index.js              # Punto de entrada
├── setup.mjs             # Instalador + lanzador
├── loka.json             # Configuración
├── lib/
│   ├── server.js         # Servidor HTTP
│   ├── router.js         # Motor de enrutamiento
│   ├── api/              # Endpoints
│   ├── oauth/            # Proveedores OAuth
│   ├── upstream/         # Llamadas a proveedores
│   ├── translate/        # Conversores de formato
│   ├── tools/            # RTK, compactor
│   └── ui/               # Páginas del panel
└── data/                 # Logs, estadísticas, caché
```

## ⚠️ Notas

- **OAuth de Anthropic** — usa tu suscripción Claude Pro/Max. Usarlo fuera de Claude Code viola los ToS de Anthropic. Úsalo bajo tu propio riesgo.
- **OAuth de Codex** — requiere una cuenta ChatGPT Plus/Pro.
- **OAuth de xAI** — bloqueado por Cloudflare para HTTP directo. Usa una clave API.
- **RTK** — funciona sin configuración, pero brilla cuando usas tool calling.

## 🤝 Contribuir

PRs, issues y feedback son bienvenidos. Abre un issue en [GitHub](https://github.com/noxaascript/Loka/issues) o haz un fork del repositorio.

## 📜 Licencia

MIT © 2026 Loka Contributors

## 🌟 Créditos

- Iconos: [lobe-icons](https://github.com/lobehub/lobe-icons)
- Cloudflare Tunnel: [cloudflared](https://github.com/cloudflare/cloudflared)
- Referencias de API de proveedores de la comunidad open-source
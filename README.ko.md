# 🌿 Loka AI Router

**모든 AI 제공자를 위한 단일 엔드포인트.** 셀프 호스팅, 텔레메트리 없음, OAuth + API 키.

> 🌐 **언어:** [English](README.md) · [Bahasa Indonesia](README.id.md) · [Español](README.es.md) · [한국어](README.ko.md)

Loka는 OpenAI, Anthropic, Gemini, Groq, DeepSeek 및 15개 이상의 제공자를 OpenAI 호환 단일 엔드포인트로 통합하는 로컬 AI 라우터입니다. Claude Code, Codex CLI, OpenCode, Cursor, Cline 또는 OpenAI API를 지원하는 모든 앱과 함께 사용할 수 있습니다.

---

## ✨ 기능

- **OpenAI 호환 API** — `/v1/chat/completions`, `/v1/messages`, `/v1/models`
- **다중 제공자 OAuth** — Codex, Claude, Gemini CLI, GitHub Copilot (device flow)
- **15개 이상의 API 키 제공자** — Groq, xAI, DeepSeek, Mistral, OpenRouter, Together, Fireworks, Perplexity, Cerebras, xKiro 등
- **Combo 폴백** — 첫 제공자가 실패하면 자동으로 다음 제공자로
- **Cloudflare Tunnel** — 클릭 한 번으로 인터넷에 노출, 무료
- **CLI Connector** — Claude Code, Codex CLI, OpenCode, Gemini CLI 자동 설정
- **RTK Token Saver** — LLM에 보내기 전 도구 출력을 20–40% 압축
- **로컬 대시보드** — 브라우저에서 모든 것을 관리
- **제로 텔레메트리** — 모든 데이터는 당신의 컴퓨터에 저장됩니다
- **캐시 + 속도 제한** — 내장, 활성화만 하면 됨

---

## 🚀 빠른 시작

### 설치

```bash
npm install -g loka-ai-router

설치 없이:

bash
npx loka-ai-router
실행
bash
loka
브라우저에서 http://localhost:1455 를 엽니다.

최초 설정
Providers 페이지 열기

OAuth Providers — 제공자 클릭 → Connect OAuth (한 번 로그인하면 끝)

Regular Providers — 제공자 클릭 → Add API Key → 제공자 콘솔에서 복사한 키 붙여넣기

모델에서 Test 클릭하여 확인

다른 앱에서 사용
Base URL: http://localhost:1455/v1

API Key: 대시보드의 API Keys 페이지에서 확인

Model: Providers 페이지의 목록에서 선택

📋 제공자 목록
OAuth (브라우저 로그인)
제공자	모델
OpenAI Codex	gpt-5.6, gpt-5.5, gpt-5.4
Anthropic	claude-opus-4-5, claude-sonnet-4-5
Google Gemini CLI	gemini-2.5-pro, gemini-2.5-flash
GitHub Copilot	gpt-5, claude-sonnet-4-5
API 키
제공자	키 발급
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
Ollama	로컬, 무료, 키 불필요
모든 API 키 제공자는 Import Models 를 지원합니다 — 전체 모델 목록을 자동으로 가져옵니다.

🔌 CLI Connector
CLI Connector 페이지는 컴퓨터에 설치된 AI CLI를 감지하고 자동으로 설정을 작성합니다.

지원:

Claude Code

Codex CLI

OpenCode

Gemini CLI

사용법:

먼저 CLI 설치 (설치되지 않은 경우 가이드가 자동으로 표시됨)

대시보드에서 /cli 열기

Configure for Loka 클릭

엔드포인트, 모델 또는 콤보 선택

완료 — CLI가 이제 Loka를 가리킵니다

🌐 터널
Tunnel 페이지는 라우터를 열지 않고 Loka를 인터넷에 노출합니다:

로컬 네트워크 — 같은 WiFi의 다른 기기에서 접근

Cloudflare Tunnel — 무료 공개 HTTPS URL, 원클릭 설정

Ngrok — 대안, 계정 필요

⚙️ 설정
모든 설정은 loka.json 에 있습니다:

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
대시보드의 Settings 페이지에서 편집하거나 파일을 직접 편집합니다.

🛠️ 개발
bash
git clone https://github.com/noxaascript/Loka.git
cd Loka
npm install
npm run dev
http://localhost:1455 를 엽니다.

📄 구조
text
loka/
├── index.js              # 진입점
├── setup.mjs             # 설치 프로그램 + 런처
├── loka.json             # 설정
├── lib/
│   ├── server.js         # HTTP 서버
│   ├── router.js         # 라우팅 엔진
│   ├── api/              # 엔드포인트
│   ├── oauth/            # OAuth 제공자
│   ├── upstream/         # 제공자 호출
│   ├── translate/        # 형식 변환기
│   ├── tools/            # RTK, 컴팩터
│   └── ui/               # 대시보드 페이지
└── data/                 # 로그, 통계, 캐시
⚠️ 주의사항
Anthropic OAuth — Claude Pro/Max 구독을 사용합니다. Claude Code 외부에서 사용하면 Anthropic의 ToS를 위반합니다. 본인 책임하에 사용하세요.

Codex OAuth — ChatGPT Plus/Pro 계정이 필요합니다.

xAI OAuth — 일반 HTTP는 Cloudflare에 의해 차단됩니다. API 키를 사용하세요.

RTK — 별도 설정 없이 작동하지만, tool calling과 함께 사용할 때 진가를 발휘합니다.

🤝 기여
PR, 이슈, 피드백을 환영합니다. GitHub 에 이슈를 열거나 저장소를 포크하세요.

📜 라이선스
MIT © 2026 Loka Contributors

🌟 크레딧
아이콘 세트: lobe-icons

Cloudflare Tunnel: cloudflared

제공자 API 참고자료는 오픈소스 커뮤니티에서 가져왔습니다
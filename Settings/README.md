# KNOT Vault

> **K**now · **N**ote · **O**utput · **T**ransform

지식을 **알고(Know)** → **기록하고(Note)** → **산출하고(Output)** → **변환한다(Transform)**

매듭(Knot)처럼 흩어진 생각을 단단하게 엮는 Obsidian AI 플러그인 생태계 + 스타터 볼트입니다.  
Claude, Gemini, Codex(GPT) 3가지 AI를 옵시디언 안에서 바로 쓸 수 있습니다.

---

## 플러그인 3종 소개

### 🟠 Claude Obsidian
**Anthropic Claude** AI와 대화하는 플러그인입니다.

- Extended Thinking(사고 단계) 지원 — Low / Medium / High / Max
- 핀 노트 영구 저장 — 재시작 후에도 유지
- 슬래시(/) 커맨드 메뉴
- 작업 타임라인 — 응답 진행 단계 실시간 표시
- 지원 모델: Sonnet 4.6 / Opus 4.6 / Opus 4.7
- API 키: [Anthropic Console](https://console.anthropic.com/settings/keys)에서 발급 (유료)
- 저장소: [parkjikoon-hub/claude-obsidian](https://github.com/parkjikoon-hub/claude-obsidian)

### 🔵 Gemini Obsidian
**Google Gemini** AI와 대화하는 플러그인입니다.

- **무료로 시작 가능** — Gemini Flash 모델 무료 한도 제공
- Thinking 모드 지원 — Low / Medium / High
- 핀 노트 영구 저장 — 재시작 후에도 유지
- 슬래시(/) 커맨드 메뉴 (번역 기능 강화)
- 지원 모델: Gemini 2.5 Flash / 2.5 Pro
- API 키: [Google AI Studio](https://aistudio.google.com/apikey)에서 무료 발급
- 저장소: [parkjikoon-hub/gemini-obsidian](https://github.com/parkjikoon-hub/gemini-obsidian)

### 🟢 Codex Obsidian
**OpenAI GPT**와 대화하는 플러그인입니다.

- Reasoning Effort 지원 — Low / Medium / High
- 핀 노트 영구 저장 — 재시작 후에도 유지
- 슬래시(/) 커맨드 메뉴 (코드 생성 특화)
- 스트리밍 실시간 출력
- 지원 모델: GPT-4o / o3 / o4-mini
- API 키: [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급 (유료)
- 저장소: [parkjikoon-hub/codex-obsidian](https://github.com/parkjikoon-hub/codex-obsidian)

---

## 3가지 플러그인 공통 기능

| 기능 | 설명 |
|------|------|
| 📌 **핀 노트 영구 저장** | 핀 고정 노트가 옵시디언 재시작 후에도 유지 |
| ⚡ **슬래시(/) 커맨드** | 입력창에서 `/` 입력 → 요약·분석·저장 등 빠른 실행 |
| ⏱️ **작업 타임라인** | 응답 중 "컨텍스트 수집 → API 호출 → 완료" 단계 표시 |
| 📎 **노트 컨텍스트** | 현재 열린 노트를 AI에게 자동 전달 |
| 💾 **노트 자동 생성** | 대화 내용을 KNOT 프론트매터 포함 노트로 저장 |

---

## 슬래시(/) 커맨드 공통 목록

| 커맨드 | 동작 |
|--------|------|
| `/요약` | 현재 노트 핵심 요약 |
| `/분석` | 깊이 있는 분석 + 인사이트 |
| `/기획서` | 대화를 기획서 형식으로 변환 |
| `/회의록` | 대화를 회의록으로 정리 |
| `/액션` | 할 일 체크리스트 추출 |
| `/저장` | 대화를 옵시디언 노트로 저장 |
| `/번역` | 현재 노트 한→영 번역 |
| `/초기화` | 대화 초기화 |

---

## Vault 구조

```
KNOT-vault/
│
├── Inbox/
│   ├── ideas/          ← 아이디어·PRD 초안 보관
│   └── raw/            ← 외부 자료 (기사·논문·링크) 임시 보관
│
├── Projects/
│   ├── DEV/            ← 개발 프로젝트 설계·산출물
│   ├── RND/            ← 연구·기획 프로젝트
│   └── BIZ/            ← 업무·비즈니스 프로젝트
│
├── Knowledge/          ← AI가 관리하는 개인 지식 위키
│   └── CLAUDE.md       ← 위키 스키마 (구조 정의)
│
├── Notes/              ← 단순 메모·뉴스 정리
│
├── References/         ← 외부 참고자료 보관
│   ├── data/
│   ├── docs/
│   ├── images/
│   ├── papers/
│   └── reports/
│
├── Settings/
│   ├── START HERE.md   ← 여기서 시작하세요
│   ├── README.md       ← 이 파일
│   └── Guides/         ← 초보자 가이드
│
└── .obsidian/
    └── plugins/
        ├── claude-obsidian/
        ├── gemini-obsidian/
        └── codex-obsidian/
```

---

## 빠른 시작

### 1단계 — API 키 준비

| 플러그인 | API 키 발급처 | 비용 |
|----------|--------------|------|
| Claude Obsidian | [Anthropic Console](https://console.anthropic.com/settings/keys) | 유료 |
| Gemini Obsidian | [Google AI Studio](https://aistudio.google.com/apikey) | **무료 한도** |
| Codex Obsidian | [OpenAI Platform](https://platform.openai.com/api-keys) | 유료 |

> 처음이라면 **Gemini Obsidian**부터 시작하세요 — 무료로 바로 사용할 수 있습니다.

### 2단계 — 플러그인 활성화

1. 옵시디언 **설정(⚙️) → 커뮤니티 플러그인**
2. 사용할 플러그인 **활성화**
3. 플러그인 이름 옆 **⚙️** 클릭 → API 키 입력

### 3단계 — 첫 대화

1. 왼쪽 사이드바 아이콘 클릭 (🤖 / ✨ / 💻)
2. 노트를 열고 입력창에 `/요약` 입력
3. Enter로 전송

---

## 키 입력 방식

| 키 | 동작 |
|----|------|
| `Enter` | 메시지 전송 |
| `Shift+Enter` / `Ctrl+Enter` | 줄바꿈 |
| `/` | 슬래시 커맨드 메뉴 열기 |
| `↑` `↓` | 슬래시 메뉴에서 항목 이동 |
| `Esc` | 슬래시 메뉴 닫기 |

---

## 상세 가이드

설치부터 활용까지 자세한 내용은 `Settings/Guides/` 폴더를 참고하세요.

- `Settings/START HERE.md` — 전체 설치 순서
- `Settings/Guides/첫날-5분-실습.md` — 설치 후 바로 해볼 것
- `Settings/Guides/AI에게-잘-물어보는-법.md` — AI 활용 팁
- `Settings/Guides/막힐-때-해결-가이드.md` — 문제 해결

---

## 라이선스

MIT License

---

Made with ❤️ by [KNOT](https://github.com/parkjikoon-hub)

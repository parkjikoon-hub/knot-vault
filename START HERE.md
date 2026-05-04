# KNOT-vault 시작 가이드

> **K**now · **N**ote · **O**utput · **T**ransform
> 알고 → 기록하고 → 산출하고 → 변환한다

---

## KNOT-vault란?

옵시디언(Obsidian)에서 **Claude · Gemini · Codex** AI를 바로 연동해서
대화 내용을 자동으로 노트로 저장하고 관리하는 환경입니다.

---

## 폴더 구조 (한눈에)

```
KNOT-vault/
├── 📥 Inbox/        새로 들어온 정보를 임시로 보관
├── 📝 Notes/        내가 직접 쓴 노트
├── 🤖 AI/           AI와 나눈 대화·산출물
│   ├── Claude/      Claude와의 대화
│   ├── Gemini/      Gemini와의 대화
│   └── Codex/       Codex와의 대화
├── 📚 References/   참고자료·웹 클리핑
├── 🗂️ Projects/    진행 중인 프로젝트
├── 📤 Outputs/      완성된 결과물·기획서·보고서
├── 📖 Guides/       설치·사용 방법 안내
└── ⚙️ Settings/    템플릿·설정
```

---

## AI 플러그인 사용 방법

### 1. Claude Obsidian (Claude AI)
- 왼쪽 사이드바 **Claude 아이콘** 클릭
- 설정 → Claude Obsidian → API 키 입력 불필요 (Claude Code와 연동)

### 2. Gemini Obsidian (Google Gemini)
- 왼쪽 사이드바 **✨ 아이콘** 클릭
- 설정 → Gemini Obsidian → **Gemini API 키** 입력 필요
- API 키 발급: https://aistudio.google.com

### 3. Codex Obsidian (OpenAI Codex)
- 왼쪽 사이드바 **💻 아이콘** 클릭
- Codex CLI 설치 필요: `npm install -g @openai/codex@latest`

---

## 처음 시작하는 순서

1. 이 문서를 읽는다 ✅
2. 설정 → 커뮤니티 플러그인 → 제한 모드 해제
3. 사용할 AI 플러그인 활성화
4. API 키 입력 (Gemini만 필요)
5. AI 아이콘 클릭 → 대화 시작!

---

## 더 자세한 안내

- [[Guides/Obsidian-Code-설치가이드]] — Claude 플러그인 설치 상세 가이드
- [[Guides/Gemini-Obsidian-가이드]] — Gemini 플러그인 사용법
- [[Guides/Codex-Obsidian-가이드]] — Codex 플러그인 사용법

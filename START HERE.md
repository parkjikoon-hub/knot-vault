# KNOT-vault 시작 가이드

> **K**now · **N**ote · **O**utput · **T**ransform
> 알고 → 기록하고 → 산출하고 → 변환한다

**이 문서 하나만 따라하면 AI와 함께하는 노트 환경이 완성됩니다.**
처음 설치하는 분도 순서대로 따라하시면 됩니다.

---

## KNOT-vault가 뭔가요?

**옵시디언(Obsidian)** 이라는 무료 노트 앱 안에서
**Claude · Gemini · Codex** AI와 바로 대화하고,
대화 내용이 자동으로 노트로 저장되는 환경입니다.

쉽게 말하면 → **"AI 채팅창 + 자동 노트 정리"** 가 한 앱 안에 있는 것입니다.

---

## 전체 설치 순서 (한눈에)

```
1단계. 옵시디언 설치
2단계. KNOT-vault 받기
3단계. 옵시디언에서 KNOT-vault 열기
4단계. 플러그인 활성화
5단계. 사용할 AI 연결하기
```

---

## 1단계. 옵시디언 설치

옵시디언은 무료 노트 앱입니다.

1. 인터넷 브라우저에서 **https://obsidian.md** 접속
2. 가운데 파란 버튼 **"Get Obsidian for Windows"** 클릭
3. 다운로드된 파일 실행 → 설치 완료
4. 옵시디언 실행 (바탕화면 아이콘 더블클릭)

> Mac 사용자: "Get Obsidian for Mac" 버튼을 클릭하세요.

---

## 2단계. KNOT-vault 받기

KNOT-vault는 미리 세팅된 노트 폴더입니다. AI 플러그인이 이미 포함되어 있습니다.

1. **https://github.com/parkjikoon-hub/knot-vault** 접속
2. 초록색 **"Code"** 버튼 클릭
3. **"Download ZIP"** 클릭
4. 다운로드된 `knot-vault-master.zip` 파일을 찾아서
5. **압축 풀기** (파일 우클릭 → "압축 풀기")
6. 압축 풀린 폴더를 원하는 위치로 이동
   - 추천 위치: `C:\Users\내이름\Documents\KNOT-vault`

---

## 3단계. 옵시디언에서 KNOT-vault 열기

1. 옵시디언 실행
2. 첫 화면에서 **"폴더에서 열기(Open folder as vault)"** 클릭
3. 아까 압축 풀은 **KNOT-vault 폴더** 선택
4. **"신뢰(Trust)"** 버튼 클릭

> 왼쪽에 폴더 목록이 보이면 성공입니다!

---

## 4단계. 플러그인 활성화

KNOT-vault를 열면 AI 플러그인이 이미 들어있습니다.
아래 순서로 활성화해주세요.

1. 왼쪽 아래 **톱니바퀴(⚙️) 아이콘** 클릭 → 설정 열기
2. 왼쪽 메뉴에서 **"커뮤니티 플러그인"** 클릭
3. **"제한 모드 해제"** 버튼 클릭 → "켜기" 확인
4. 아래 플러그인 목록에서 사용할 것의 **토글 스위치를 ON** 으로 변경

| 플러그인 이름 | 용도 | 필요한 것 |
|--------------|------|-----------|
| **Claude Obsidian** | Claude AI 연동 | Claude Code 설치 필요 |
| **Gemini Obsidian** | Google Gemini 연동 | API 키 필요 (무료) |
| **Codex Obsidian** | OpenAI Codex 연동 | Codex CLI 설치 필요 |
| **Dataview** | 노트 자동 목록 | 없음 |
| **Templater** | 노트 템플릿 | 없음 |

> 처음에는 **Gemini Obsidian** 하나만 켜고 시작하는 것을 추천합니다.
> Gemini는 무료로 바로 사용할 수 있어서 가장 쉽습니다.

---

## 5단계. 사용할 AI 연결하기

아래 셋 중 하나를 선택해서 연결하세요.
**Gemini가 가장 쉽고 무료**이므로 처음 시작하는 분께 추천합니다.

---

### ✨ Gemini 연결하기 (추천 — 무료)

**API 키 발급:**

1. **https://aistudio.google.com** 접속
2. 구글 계정으로 로그인
3. 왼쪽 메뉴 **"Get API key"** 클릭
4. **"Create API key"** 클릭
5. 화면에 나오는 긴 문자열 복사 (`AIza...` 로 시작)

**API 키 입력:**

1. 옵시디언 설정(⚙️) 클릭
2. 왼쪽 메뉴 맨 아래 **"Gemini Obsidian"** 클릭
3. **"API 키"** 칸에 복사한 키 붙여넣기
4. 설정 창 닫기

**사용 시작:**
왼쪽 사이드바에서 **✨ 반짝이 아이콘** 클릭 → 채팅창 열림!

---

### 🤖 Claude 연결하기

Claude는 Claude Code CLI가 설치되어 있어야 합니다.

1. **https://claude.ai/code** 접속 → 설치 안내 따라하기
2. 설치 완료 후 옵시디언에서 **Claude Obsidian** 플러그인 활성화
3. 왼쪽 사이드바 **Claude 아이콘** 클릭

> 자세한 설치 방법: [[Guides/Claude-Obsidian-가이드]]

---

### 💻 Codex 연결하기

Codex는 Node.js와 Codex CLI가 필요합니다.

1. **https://nodejs.org** 접속 → LTS 버전 다운로드 및 설치
2. 설치 완료 후 윈도우 검색창에서 **"PowerShell"** 검색 → 실행
3. 아래 명령어 입력 후 Enter:
   ```
   npm install -g @openai/codex@latest
   ```
4. 설치 완료 후 옵시디언에서 **Codex Obsidian** 플러그인 활성화

> 자세한 설치 방법: [[Guides/Codex-Obsidian-가이드]]

---

## 자주 묻는 질문

**Q. 플러그인이 목록에 안 보여요.**
A. 설정 → 커뮤니티 플러그인 → "제한 모드 해제"를 먼저 해주세요.

**Q. API 키가 뭔가요?**
A. AI 서비스를 사용하기 위한 비밀번호 같은 것입니다. 무료로 발급받을 수 있습니다.

**Q. 노트는 어디에 저장되나요?**
A. AI와 대화하다가 "저장해줘"라고 입력하면 `AI/Gemini/` (또는 Claude, Codex) 폴더에 자동 저장됩니다.

**Q. 인터넷이 없어도 사용할 수 있나요?**
A. 옵시디언 자체는 오프라인 사용 가능하지만, AI 기능은 인터넷 연결이 필요합니다.

---

## 폴더 구조 설명

```
KNOT-vault/
├── Inbox/        새로 들어온 정보 임시 보관 (나중에 정리할 것들)
├── Notes/        내가 직접 쓴 노트
├── AI/
│   ├── Claude/   Claude와의 대화가 저장되는 곳
│   ├── Gemini/   Gemini와의 대화가 저장되는 곳
│   └── Codex/    Codex와의 대화가 저장되는 곳
├── References/   참고자료, 웹에서 저장한 글
├── Projects/     진행 중인 프로젝트 관련 노트
├── Outputs/      완성된 기획서, 보고서, 결과물
├── Guides/       설치 및 사용 방법 안내 (이 폴더)
└── Settings/     템플릿 등 설정 파일
```

---

더 궁금한 점이 있으면 [[Guides/Gemini-Obsidian-가이드]] 를 참고하세요.

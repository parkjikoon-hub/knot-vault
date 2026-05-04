# Claude Obsidian 사용 가이드

> Anthropic Claude AI를 옵시디언 안에서 바로 사용하는 플러그인
> Claude Code CLI가 설치되어 있어야 합니다.

---

## 시작 전 확인

- [ ] 옵시디언이 설치되어 있다
- [ ] KNOT-vault를 옵시디언에서 열었다
- [ ] Node.js가 설치되어 있다 (아래 방법 참고)
- [ ] Claude Code CLI가 설치되어 있다 (아래 방법 참고)

---

## STEP 1. Node.js 설치

Node.js는 Claude Code를 실행하기 위해 필요한 프로그램입니다.
이미 설치되어 있다면 STEP 2로 넘어가세요.

**설치 확인 방법:**
1. 윈도우 검색창(돋보기 아이콘)에서 **"PowerShell"** 검색 → 실행
2. 아래 입력 후 Enter:
   ```
   node --version
   ```
3. `v20.x.x` 처럼 숫자가 나오면 이미 설치됨 → STEP 2로 이동

**설치 방법:**
1. **https://nodejs.org** 접속
2. 왼쪽 버튼 **"LTS"** 클릭해서 다운로드
3. 다운로드된 파일 실행 → 계속 "Next" 클릭해서 설치
4. 설치 완료 후 PowerShell 다시 열어서 `node --version` 확인

---

## STEP 2. Claude Code 설치

1. PowerShell을 열어서 아래 명령어 입력 후 Enter:
   ```
   npm install -g @anthropic-ai/claude-code
   ```
2. 설치가 완료될 때까지 기다립니다 (1~2분)
3. 아래 명령어로 설치 확인:
   ```
   claude --version
   ```
4. 버전 숫자가 나오면 설치 성공

**Claude 로그인:**
```
claude
```
입력 후 Enter → 브라우저가 열리면 Anthropic 계정으로 로그인

---

## STEP 3. 플러그인 활성화

1. 옵시디언 설정(⚙️) → **"커뮤니티 플러그인"**
2. **"제한 모드 해제"** 클릭
3. **"Claude Obsidian"** 토글 **ON**

---

## STEP 4. 사용 시작!

왼쪽 사이드바에서 **Claude 아이콘** 클릭
→ 오른쪽에 Claude 채팅창이 열립니다

Claude Code가 실행 중이면 자동으로 연동됩니다.

---

## 주요 기능

| 기능 | 사용 방법 |
|------|---------|
| AI 채팅 | 채팅창에서 질문 입력 |
| 파일 읽기·쓰기 | "이 파일 읽어줘", "노트 만들어줘" |
| 현재 노트 분석 | 노트 열고 "분석해줘" 입력 |
| 노트 저장 | "저장해줘" 입력 시 자동 저장 |

---

## 자주 묻는 질문

**Q. "Claude를 찾을 수 없습니다" 오류가 나요**
A. Claude Code가 설치되어 있는지 확인하세요. PowerShell에서 `claude --version`을 입력해보세요.

**Q. Claude는 유료인가요?**
A. Claude.ai 계정이 필요합니다. 무료 플랜도 있지만 사용량 제한이 있습니다.

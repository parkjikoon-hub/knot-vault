---
type: documentation
aliases:
  - Obsidian Code 설치 가이드
description: Obsidian Code 플러그인(Claude Code 연동) Windows 설치 전체 가이드. 회사 PC 등 새 환경에서 재설치할 때 참고.
author:
  - "[[박지군]]"
date created: 2026-05-04
date modified: 2026-05-04
tags:
  - obsidian
  - claude-code
  - 설치가이드
---

# Obsidian Code 설치 가이드 (Windows)

> Claude Code를 옵시디언 사이드바 채팅창으로 띄워서 사용하는 플러그인 설치 가이드.
> 새 PC에서 처음 설치할 때 이 문서를 순서대로 따라가면 됩니다.

---

## 사전 조건

아래 두 가지가 먼저 설치되어 있어야 합니다.

### 1. Node.js 설치

- 설치 확인: 터미널에서 `node --version` 실행
- 없으면 https://nodejs.org 에서 LTS 버전 설치

### 2. Claude Code CLI 설치 및 인증

```bash
npm install -g @anthropic-ai/claude-code
claude
```

`claude` 실행 후 브라우저가 열리면 Anthropic 계정으로 로그인해서 인증 완료.

- 설치 확인: `claude --version` → 버전 번호가 나오면 OK

---

## Step 1 — BRAT 플러그인 설치

BRAT는 공식 마켓에 없는 베타 플러그인을 설치해주는 도우미입니다.

1. 옵시디언 **설정(톱니바퀴)** → **커뮤니티 플러그인** → **커뮤니티 플러그인 탐색**
2. 검색창에 `BRAT` 입력
3. **Obsidian42 - BRAT** 설치 및 활성화

---

## Step 2 — Obsidian Code 플러그인 설치

1. `Ctrl+P` → `BRAT: Add a beta plugin` 입력 후 선택
2. Repository 입력창에 아래 URL 입력:
   ```
   https://github.com/reallygood83/obsidian-code
   ```
3. **Select a version...** 클릭 → `latest` 선택
4. **Add plugin** 클릭 → 설치 완료
5. **설정 → 커뮤니티 플러그인** 에서 **Obsidian Code** 활성화

---

## Step 3 — CLI 경로 설정 (핵심)

> Windows에서는 반드시 이 단계를 해야 합니다. 안 하면 `spawn EINVAL` 오류가 납니다.

### 3-1. settings.json 파일 직접 수정

옵시디언을 **완전히 닫은 상태**에서 아래 파일을 엽니다:

```
{볼트경로}\.claude\settings.json
```

예시 (이 PC 기준):
```
C:\Users\admin\Obsidian\CMDS-vault\.claude\settings.json
```

### 3-2. claudeCliPath 값 수정

파일 안에 `claudeCliPath` 항목을 찾아서 아래 경로로 변경합니다:

```json
"claudeCliPath": "C:\\Users\\사용자명\\AppData\\Roaming\\npm\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe"
```

> **주의**: `사용자명` 부분을 실제 Windows 계정명으로 바꾸세요.
> 터미널에서 `where claude` 실행하면 경로 확인 가능.

### 3-3. main.js 패치 (Windows signal 버그 수정)

플러그인 파일:
```
{볼트경로}\.obsidian\plugins\cc-obsidian\main.js
```

파일에서 아래 코드를 찾아서:

```js
const childProcess = (0, import_child_process.spawn)(command, args, {
  cwd: cwd2,
  stdio: ["pipe", "pipe", stderrMode],
  signal,
  env,
  windowsHide: true
});
```

아래 코드로 교체합니다:

```js
const spawnOpts = {
  cwd: cwd2,
  stdio: ["pipe", "pipe", stderrMode],
  env,
  windowsHide: true
};
if (signal && process.platform !== "win32") {
  spawnOpts.signal = signal;
}
const childProcess = (0, import_child_process.spawn)(command, args, spawnOpts);
```

> **이유**: Windows에서 `AbortSignal`을 `spawn`에 직접 넘기면 `EINVAL` 오류가 납니다.
> 플러그인이 업데이트되면 이 패치가 필요 없어질 수 있습니다.

---

## Step 4 — obsidian-skills 스킬 설치

Claude Code가 옵시디언 문법을 정확하게 이해하도록 스킬을 설치합니다.

볼트 루트에서 터미널 실행 후:

```bash
mkdir -p .claude/skills/obsidian-markdown/references
mkdir -p .claude/skills/obsidian-bases/references
mkdir -p .claude/skills/json-canvas/references
mkdir -p .claude/skills/obsidian-cli
mkdir -p .claude/skills/defuddle

BASE="https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills"

curl -s "$BASE/obsidian-markdown/SKILL.md" -o .claude/skills/obsidian-markdown/SKILL.md
curl -s "$BASE/obsidian-markdown/references/CALLOUTS.md" -o .claude/skills/obsidian-markdown/references/CALLOUTS.md
curl -s "$BASE/obsidian-markdown/references/EMBEDS.md" -o .claude/skills/obsidian-markdown/references/EMBEDS.md
curl -s "$BASE/obsidian-markdown/references/PROPERTIES.md" -o .claude/skills/obsidian-markdown/references/PROPERTIES.md
curl -s "$BASE/obsidian-bases/SKILL.md" -o .claude/skills/obsidian-bases/SKILL.md
curl -s "$BASE/obsidian-bases/references/FUNCTIONS_REFERENCE.md" -o .claude/skills/obsidian-bases/references/FUNCTIONS_REFERENCE.md
curl -s "$BASE/json-canvas/SKILL.md" -o .claude/skills/json-canvas/SKILL.md
curl -s "$BASE/json-canvas/references/EXAMPLES.md" -o .claude/skills/json-canvas/references/EXAMPLES.md
curl -s "$BASE/obsidian-cli/SKILL.md" -o .claude/skills/obsidian-cli/SKILL.md
curl -s "$BASE/defuddle/SKILL.md" -o .claude/skills/defuddle/SKILL.md
```

---

## Step 5 — 옵시디언 재시작 후 확인

1. 옵시디언 실행
2. 오른쪽 사이드바에 **Obsidian Code** 채팅창이 열려 있으면 성공
3. 입력창에 `안녕` 입력해서 응답이 오면 완료

---

## 사용법 요약

| 기능 | 방법 |
|------|------|
| 채팅창 열기 | 왼쪽 사이드바 별(✳) 아이콘 클릭 |
| 현재 노트 첨부 | 자동 첨부됨 (하단에 파일명 표시) |
| 다른 파일 첨부 | `@파일명` 입력 |
| 파일 고정 | 파일 태그 옆 핀(푸) 아이콘 클릭 |
| 권한 모드 변경 | 우측 하단 `AUTO` 토글 |
| 대화 기록 | 우측 상단 시계 아이콘 |

### 권한 모드

- **AUTO** — 클로드가 파일을 자동으로 읽고 씀 (편리함)
- **Safe** — 파일 건드리기 전 매번 허락 요청 (안전)
- **Plan** — 계획만 보여주고 실행 안 함 (검토용)

---

## 트러블슈팅

### `Failed to spawn Claude Code process: spawn ... ENOENT`
→ Claude Code CLI가 설치되지 않았거나 경로가 틀림
→ `where claude` 로 경로 확인 후 `claudeCliPath` 수정

### `spawn EINVAL`
→ main.js 패치(Step 3-3)가 안 된 것
→ 옵시디언 닫고 패치 후 재시작

### 설정이 저장이 안 됨
→ 반드시 옵시디언을 **완전히 닫은 상태**에서 파일 수정
→ 실행 중에 수정하면 재시작 시 덮어써짐

---

## 관련 저장소

- Obsidian Code 플러그인: https://github.com/reallygood83/obsidian-code
- obsidian-skills: https://github.com/kepano/obsidian-skills

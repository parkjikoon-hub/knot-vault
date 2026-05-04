---
type: note
aliases:
  - Claude Obsidian 연동
  - CMDS 활용 가이드
description: Step-by-step guide for connecting Claude Code to Obsidian via MCP (Local REST API), and how to use the CMDS Process system (Connect→Merge→Develop→Share) with slash commands. Reference when setting up AI-Obsidian integration or learning CMDS workflows.
author:
  - "[[박지군]]"
date created: 2026-04-30
date modified: 2026-04-30
tags:
  - Claude
  - Obsidian
  - MCP
  - CMDS
  - 연동
  - 설정
status: completed
---

# Claude ↔ Obsidian 연동 가이드 & CMDS 활용법

> 이 문서는 Claude Code와 Obsidian을 MCP로 연동하는 전 과정과, CMDS 시스템을 실제로 활용하는 방법을 담고 있습니다.

---

## 1부: Claude ↔ Obsidian 연동 설정

### 연동 구조 이해

```
Claude Code (AI)
      ↕ MCP (Model Context Protocol)
Obsidian Local REST API 플러그인
      ↕
CMDS-vault (노트 보관함)
```

비유: Claude가 보관함 밖에서 일하다가, MCP 연결 후에는 **보관함 안에 들어와 직접 노트를 읽고 쓸 수 있게** 됩니다.

---

### Step 1 — Obsidian Local REST API 플러그인 설치

1. Obsidian 실행
2. **설정(⚙️)** → **커뮤니티 플러그인** → 제한 모드 끄기
3. **플러그인 탐색** → `Local REST API` 검색 → 설치 → 활성화
4. 설정 화면에서 **API 키 복사** (copy 링크 클릭)
5. **Enable Non-encrypted (HTTP) Server** 토글 켜기

> 포트 기본값: `27124` (HTTP), `27125` (HTTPS)

---

### Step 2 — `.mcp.json` 파일 생성

홈 디렉토리(`C:\Users\{사용자명}\`)에 `.mcp.json` 파일 생성:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "mcp-obsidian", "C:\\Users\\admin\\Obsidian\\CMDS-vault"],
      "env": {
        "OBSIDIAN_API_KEY": "여기에_복사한_API_키_붙여넣기",
        "OBSIDIAN_HOST": "http://127.0.0.1:27124"
      }
    }
  }
}
```

> **중요**: `CMDS-vault` 경로와 API 키는 본인 환경에 맞게 수정하세요.

---

### Step 3 — 연결 확인

터미널에서 아래 명령어 실행:

```bash
claude mcp list
```

결과에서 아래처럼 나오면 성공:

```
obsidian: npx -y mcp-obsidian ... - ✓ Connected
```

> **주의**: Obsidian 앱이 실행 중이어야 연결됩니다.

---

### 연동 후 가능한 것들

| 기능 | 예시 명령 |
|------|---------|
| 노트 생성 | "오늘 배운 내용을 Obsidian에 노트로 저장해줘" |
| 노트 검색 | "vault에서 AI 관련 노트 찾아줘" |
| 노트 수정 | "CMDS-Head-Quarter.md에 새 링크 추가해줘" |
| 내용 요약 저장 | "이 대화 내용을 요약해서 보관함에 넣어줘" |

---

### 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `Failed to connect` | Obsidian 앱이 꺼져 있음 | Obsidian 실행 후 재시도 |
| API 오류 | HTTP 토글이 꺼져 있음 | Local REST API 설정에서 HTTP 활성화 |
| 목록에 obsidian 없음 | `.mcp.json` 위치 오류 | 홈 디렉토리(`~`)에 파일 위치 확인 |

---

## 2부: CMDS 시스템 활용법

> CMDS 활용법 전체 내용은 별도 파일을 참고하세요.
> → [[CMDS-시스템-활용법]]

---

## 3부: Claude + Obsidian + CMDS 통합 워크플로우

### 실제 시나리오: AI 관련 기사를 노트로 만들기

```
1. 기사 URL을 Claude에게 전달
      ↓
2. Claude가 내용 요약 + frontmatter 생성
      ↓
3. MCP를 통해 CMDS-vault에 직접 저장
      ↓
4. /connect 로 100번대 Theme에 분류
      ↓
5. 나중에 /merge 로 관련 노트들과 합성
```

### Claude에게 직접 요청하는 방법

```
"이 내용을 요약해서 Obsidian CMDS-vault에 노트로 저장해줘.
 CMDS frontmatter 규칙 지켜서 만들어줘."
```

---

## 참고 링크

- CMDS 공식 사이트: https://system.cmdspace.work
- GitHub 저장소: https://github.com/johnfkoo951/cmds-system-files
- mcp-obsidian 패키지: https://www.npmjs.com/package/mcp-obsidian

---

*작성일: 2026-04-30 | Claude Code + CMDS-vault 세션 기록*

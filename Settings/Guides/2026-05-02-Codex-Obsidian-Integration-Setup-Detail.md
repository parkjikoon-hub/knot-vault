---
type: note
aliases:
  - "Codex Obsidian Integration Setup Detail"
description: "Codex-generated software planning or development note from the PhD paper workspace. Reference this when reviewing program design, implementation plans, or automation tasks."
author:
  - "[[Ji Koon Park]]"
date created: 2026-05-02T22:59
date modified: 2026-05-02T22:59
tags:
  - Codex
  - program
  - automation
status: completed
sourceWorkspace: "C:\Users\admin\PhD paper"
createdBy: "Codex"
category: "program"
---

# Codex Obsidian Integration Setup Detail

# Codex-Obsidian 연동 설정 상세 문서

## 1. 문서 목적

이 문서는 Codex와 Obsidian `CMDS-vault`를 연결하여, Codex와 함께 작성한 논문, 프로그램 개발 계획, 정부과제 기획서, 연구과제 아이디어, 회의 기록, 조사자료 등을 Obsidian에 자동으로 생성하고 저장하기 위해 현재까지 설정한 내용을 정리한 운영 문서입니다.

이 문서는 다음 상황에서 참고합니다.

- Codex가 만든 문서를 Obsidian에 저장하고 싶을 때
- 저장 위치와 카테고리 기준이 헷갈릴 때
- 새 문서 작성자가 누구로 들어가는지 확인할 때
- 다른 컴퓨터나 새 Codex 세션에서 같은 연동 방식을 이어가고 싶을 때

## 2. 현재 연결된 경로

[확인된 사실: 로컬 파일 시스템 확인 결과]

현재 Codex 작업 폴더는 다음입니다.

```text
C:\Users\admin\PhD paper
```

현재 연결된 Obsidian vault는 다음입니다.

```text
C:\Users\admin\Obsidian\CMDS-vault
```

Codex 산출물은 Obsidian vault 안의 다음 폴더에 저장하도록 설정했습니다.

```text
C:\Users\admin\Obsidian\CMDS-vault\00. Inbox\03. AI Agent\03-5. Codex (Windows)
```

이 위치는 Codex가 만든 문서가 바로 최종 지식 노트로 섞이지 않고, 먼저 검토 가능한 임시 작업함에 들어가도록 하기 위한 구조입니다.

## 3. 현재 생성된 Codex 전용 하위 폴더

[확인된 사실: 로컬 파일 시스템 확인 결과]

다음 6개 하위 폴더를 만들었습니다.

```text
paper
program-development
proposal-rnd
meeting-worklog
research
general
```

각 폴더의 의미는 다음과 같습니다.

| 폴더 | 저장 대상 |
|---|---|
| `paper` | 논문 초안, 연구 설계, 통계 검증, 학술 원고 |
| `program-development` | 프로그램 개발 계획, 자동화 도구, 코드 설명, 시스템 설계 |
| `proposal-rnd` | 정부과제 기획서, R&D 사업계획서, 사업화 전략 |
| `meeting-worklog` | 회의록, 업무 협의, 실행계획, 지시사항 정리 |
| `research` | 자료 조사, 문헌 검토, 정책·시장·기술 조사 |
| `general` | 기타 아이디어, 메모, 아직 분류가 애매한 문서 |

## 4. 작성자 자동 입력 설정

[확인된 사실: `Save-CodexToObsidian.ps1` 설정 확인]

앞으로 Codex가 Obsidian에 저장하는 새 문서의 작성자는 다음으로 자동 입력됩니다.

```yaml
author:
  - "[[Ji Koon Park]]"
```

한글 작성자명은 다음 기준으로 문서화했습니다.

```text
Ji Koon Park (박지군)
```

## 5. 현재 만든 설정 파일

[확인된 사실: 작업 폴더 파일 생성 결과]

Codex 작업 폴더 안에 다음 파일을 만들었습니다.

```text
C:\Users\admin\PhD paper\AGENTS.md
C:\Users\admin\PhD paper\tools\obsidian\Save-CodexToObsidian.ps1
C:\Users\admin\PhD paper\tools\obsidian\CODEX_OBSIDIAN_AUTOSAVE.md
```

각 파일의 역할은 다음과 같습니다.

| 파일 | 역할 |
|---|---|
| `AGENTS.md` | Codex가 이 작업 폴더에서 따라야 할 기본 지침. 한국어 답변, 출처 구분, Obsidian 저장 규칙, 작성자 기준 포함 |
| `Save-CodexToObsidian.ps1` | Codex 산출물을 Obsidian vault에 Markdown 노트로 저장하는 PowerShell 스크립트 |
| `CODEX_OBSIDIAN_AUTOSAVE.md` | 자동 저장 운영 가이드 원본 문서 |

## 6. 자동 저장 스크립트 사용 방식

Codex가 문서를 Obsidian에 저장할 때 기본적으로 다음 스크립트를 사용합니다.

```powershell
.\tools\obsidian\Save-CodexToObsidian.ps1 -Category proposal -Title "RND Proposal Draft" -SourcePath ".\output\proposal.md"
```

주요 옵션은 다음과 같습니다.

| 옵션 | 의미 |
|---|---|
| `-Category` | 저장 분류. `paper`, `program`, `proposal`, `meeting`, `research`, `general` 중 하나 |
| `-Title` | Obsidian에 저장될 문서 제목 |
| `-SourcePath` | 저장할 Markdown 원본 파일 경로 |
| `-Status` | 문서 상태. `inProgress`, `completed` 등 |
| `-VaultPath` | Obsidian vault 경로. 기본값은 `C:\Users\admin\Obsidian\CMDS-vault` |

## 7. 저장되는 노트의 기본 형식

Codex가 저장하는 Obsidian 노트에는 자동으로 다음과 같은 YAML frontmatter가 붙습니다.

```yaml
---
type: note
aliases:
  - "문서 제목"
description: "English machine-readable description for LLM relevance."
author:
  - "[[Ji Koon Park]]"
date created: 2026-05-02T22:42
date modified: 2026-05-02T22:42
tags:
  - Codex
status: inProgress
sourceWorkspace: "C:\Users\admin\PhD paper"
createdBy: "Codex"
category: "proposal"
---
```

여기서 중요한 값은 다음입니다.

| 항목 | 의미 |
|---|---|
| `author` | 항상 `[[Ji Koon Park]]`으로 입력 |
| `createdBy` | 문서를 생성한 도구. 기본값은 `Codex` |
| `sourceWorkspace` | 원래 작업이 이루어진 폴더 |
| `category` | Codex 저장 분류 |
| `status` | 문서 진행 상태 |

## 8. 현재 설정의 운영 방식

[운영 제안]

현재 구조는 다음 흐름으로 쓰는 것이 가장 좋습니다.

```text
Codex와 문서 작성
  ↓
작업 폴더에 원본 Markdown 생성
  ↓
Save-CodexToObsidian.ps1 실행
  ↓
Obsidian Codex Inbox에 자동 저장
  ↓
나중에 CMDS 분류에 따라 정리·승격
```

이 방식의 장점은 다음과 같습니다.

- Codex 결과물이 Obsidian에 바로 누적됩니다.
- 최종본과 초안을 구분할 수 있습니다.
- 나중에 CMDS 번호 체계에 맞게 천천히 재분류할 수 있습니다.
- 논문, 프로그램, 정부과제, 아이디어를 한 곳에서 검색할 수 있습니다.

## 9. 주의사항

[확인된 사실: Windows PowerShell 실행 중 확인한 문제]

처음에는 한글 폴더명을 자동 생성하려 했으나 Windows PowerShell 인코딩 문제로 폴더명이 깨질 수 있음을 확인했습니다. 그래서 실제 저장 폴더명은 안정성을 위해 영어로 두었습니다.

단, 문서 본문과 제목에는 한글을 사용할 수 있습니다.

## 10. 앞으로 Codex에게 요청하는 방법

아래처럼 말하면 됩니다.

```text
이 내용을 Obsidian에 proposal로 저장해줘.
```

```text
방금 작성한 프로그램 개발 계획을 Obsidian에 program으로 저장해줘.
```

```text
이 논문 통계 검증 내용을 paper로 저장해줘.
```

```text
오늘 회의 내용을 meeting으로 저장해줘.
```

## 11. 다음 개선 가능 사항

[운영 제안]

앞으로 더 발전시키려면 다음을 추가할 수 있습니다.

- `CMDS:`와 `index:` 값을 저장 시점에 자동 입력
- `501 Obsidian`, `520 ChatGPT`, `493 Scripts` 등 세부 CMDS 분류 자동 추천
- 문서 제목을 한글로 입력해도 파일명이 안정적으로 만들어지도록 별도 slug 생성 규칙 추가
- 최종본은 `800 Outputs`로 승격하는 별도 명령 추가
- 연구과제별 프로젝트 폴더 자동 생성



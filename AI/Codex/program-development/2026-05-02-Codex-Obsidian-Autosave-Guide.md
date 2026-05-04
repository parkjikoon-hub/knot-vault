---
type: note
aliases:
  - "Codex Obsidian Autosave Guide"
description: "Codex-generated software planning or development note from the PhD paper workspace. Reference this when reviewing program design, implementation plans, or automation tasks."
author:
  - "[[Ji Koon Park]]"
date created: 2026-05-02T22:42
date modified: 2026-05-02T22:42
tags:
  - Codex
  - program
  - automation
status: completed
sourceWorkspace: "C:\Users\admin\PhD paper"
createdBy: "Codex"
category: "program"
---

# Codex Obsidian Autosave Guide

# Codex-Obsidian 자동 저장 운영 가이드

## 목적

Codex와 함께 작성한 논문, 프로그램 개발 계획, 정부과제 기획서, 회의록, 조사자료를 Obsidian `CMDS-vault`에 Markdown 노트로 저장하기 위한 운영 규칙입니다.

## 저장 위치

기본 vault:

```text
C:\Users\admin\Obsidian\CMDS-vault
```

Codex 전용 저장 폴더:

```text
00. Inbox\03. AI Agent\03-5. Codex (Windows)
```

하위 분류:

```text
paper
program-development
proposal-rnd
meeting-worklog
research
general
```

## 사용 방법

Codex에게 다음처럼 요청하면 됩니다.

```text
이 내용을 Obsidian에 proposal로 저장해줘.
```

또는 특정 파일을 저장할 때:

```powershell
.\tools\obsidian\Save-CodexToObsidian.ps1 -Category proposal -Title "진주시 R&D 과제 기획 초안" -SourcePath ".\output\proposal.md"
```

## 분류 기준

| Category | 저장 대상 |
|---|---|
| `paper` | 논문, 학술 원고, 연구 설계, 통계 검증 |
| `program` | 프로그램 개발 계획, 코드 구조, 자동화 도구 |
| `proposal` | 정부과제, R&D 사업계획서, 기획서 |
| `meeting` | 회의록, 업무 지시, 협의 내용 |
| `research` | 자료 조사, 문헌 검토, 시장/정책 조사 |
| `general` | 기타 보관 가치가 있는 산출물 |

## Codex에게 요청하는 문장 예시

```text
오늘 논의한 프로그램 개발 계획을 Obsidian에 program으로 저장해줘.
```

```text
방금 작성한 정부과제 기획서 초안을 Obsidian에 proposal로 저장해줘.
```

```text
이 논문 통계 검증 결과를 Obsidian에 paper로 저장해줘.
```

## 운영 원칙

- 최종본 또는 재사용 가치가 있는 중간 산출물만 저장합니다.
- 저장되는 노트에는 YAML frontmatter를 붙입니다.
- `description`은 Obsidian 내 AI 검색과 재활용을 위해 영어로 작성합니다.
- 출처가 필요한 정책, 통계, 법령 정보는 사용자 지침에 맞춰 `[출처: ...]` 또는 `[산출근거: ...]`로 구분합니다.


형태)
```

#### 📚 독서 노트 템플릿

```markdown
---
promptId: book-note
name: 독서 노트 생성
description: 책 정보를 기반으로 독서 노트를 생성합니다
commands:
  - generate
---

다음 책에 대한 독서 노트를 작성해주세요:

제목: {{title}}
내용/메모: {{selection}}

## 작성 포함 사항:
1. 책 핵심 주제
2. 주요 인사이트 (3-5개)
3. 인상 깊은 구절 분석
4. 실생활 적용 방안
5. 관련 도서 추천
```

#### 🔄 텍스트 리라이팅 템플릿

```markdown
---
promptId: rewrite
name: 텍스트 다듬기
description: 선택한 텍스트를 더 명확하고 자연스럽게 다듬습니다
commands:
  - generate
---

다음 텍스트를 더 명확하고 자연스러운 한국어로 다듬어주세요.
원래 의미를 유지하면서 가독성을 높여주세요.

원문:
{{selection}}

다듬어진 텍스트:
```

#### 🏗️ MOC (Map of Content) 생성 템플릿

```markdown
---
promptId: moc-generator
name: MOC 생성기
description: 주제에 대한 Map of Content를 생성합니다
commands:
  - generate
---

다음 주제에 대한 Map of Content(MOC)를 옵시디언 형식으로 생성해주세요:

주제: {{selection}}

## 규칙:
- [[위키링크]] 형식 사용
- 카테고리별로 분류
- 각 링크에 간단한 설명 추가
- 학습 순서 제안 포함
```

### 4.4 템플릿 변수 레퍼런스

| 변수 | 설명 |
|------|------|
| `{{selection}}` | 현재 선택된 텍스트 |
| `{{content}}` | 현재 노트의 전체 내용 |
| `{{title}}` | 현재 노트의 제목 |
| `{{tg_selection}}` | Text Generator 전용 선택 텍스트 |
| `{{keys}}` | frontmatter의 키 값들 |
| `{{folder}}` | 현재 파일이 위치한 폴더 |

---

## 5. 고급 활용법

### 5.1 Frontmatter 메타데이터 활용

노트의 frontmatter 정보를 프롬프트에 자동으로 포함시킬 수 있습니다.

```markdown
---
title: 프로젝트 기획서
category: business
audience: 경영진
tone: formal
---

# 프로젝트 기획서
<!-- 템플릿에서 {{title}}, 기타 frontmatter 키를 참조 가능 -->
```

### 5.2 컨텍스트 설정 (Context)

```
Settings → Text Generator → Context
```

- **Include frontmatter**: ✅ (메타데이터 포함)
- **Include headings**: ✅ (제목 구조 포함)
- **Include children** (Starred blocks): ✅ (하위 블록 포함)
- **Include highlights**: ✅ (하이라이트된 텍스트 포함)
- **Include starred blocks**: ✅ (별표 블록 포함)

### 5.3 Starred Blocks (⭐ 블록) 활용

특정 블록에 별표를 달아 AI에게 항상 컨텍스트로 제공할 수 있습니다.

```markdown
<!-- 이 블록에 별표를 달면 항상 컨텍스트에 포함됨 -->
> [!important] 프로젝트 컨텍스트 ⭐
> - 프로젝트명: AI 도입 전략
> - 기간: 2024.01 ~ 2024.06
> - 팀: 디지털혁신팀
```

### 5.4 시스템 프롬프트 커스터마이징

```
Settings → Text Generator → Prompts → System Prompt
```

```
당신은 옵시디언 노트 작성을 돕는 한국어 AI 어시스턴트입니다.
항상 마크다운 형식으로 답변하고, [[위키링크]]를 적극 활용하세요.
답변은 구조적이고 간결하게 작성하세요.
```

---

## 6. 실전 워크플로우 예시

### 6.1 제텔카스텐(Zettelkasten) 워크플로우

```
1. 원본 자료 붙여넣기
   ↓
2. [요약 템플릿] 으로 핵심 추출 (Ctrl+Shift+J)
   ↓
3. [아토믹 노트 분리 템플릿] 으로 개별 노트 생성
   ↓
4. [링크 제안 템플릿] 으로 기존 노트와 연결점 파악
   ↓
5. 수동으로 검토 및 위키링크 연결
```

### 6.2 회의록 → 액션아이템 워크플로우

```markdown
<!-- 1단계: 회의 내용 기록 -->
# 2024-01-15 주간회의

참석자: 김팀장, 이과장, 박대리
...회의 내용...

<!-- 2단계: 선택 후 아래 템플릿 적용 -->
```념 설명 템플릿] - 어려운 개념 쉽게 풀어쓰기
   ↓
3. [퀴즈 생성 템플릿] - 복습용 문제 자동 생성
   ↓
4. [연결 노트 템플릿] - 관련 개념과 링크 제안
```

---

## 7. 커맨드 팔레트 활용

`Ctrl/Cmd + P
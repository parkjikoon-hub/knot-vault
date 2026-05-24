---
type: documentation
aliases:
  - Claude Obsidian 문서 분류 운영
  - Claude 카테고리 관리
  - Claude 저장 규칙
description: Operational guide for Ji Koon Park on how Claude (Claude Code) categorizes, saves, and manages all co-created documents into Obsidian CMDS-vault. Mirrors the Codex (Windows) category structure. Reference when asking Claude to save any document to Obsidian.
author:
  - "[[박지군]]"
date created: 2026-05-02
date modified: 2026-05-02
tags:
  - Claude
  - Obsidian
  - 카테고리
  - 문서관리
  - MCP
  - 자동저장
status: active
createdBy: Claude
---

# Claude → Obsidian 문서 분류 및 카테고리 관리 운영 가이드

> **박지군과 Claude가 함께 만드는 모든 문서를 Obsidian CMDS-vault에 체계적으로 저장·분류하기 위한 운영 매뉴얼입니다.**
> Codex (Windows) 분류 체계와 동일한 방식으로 설계되었습니다.

---

## 1. 문서 목적

이 문서는 Claude와 함께 작성하는 다양한 산출물을 Obsidian에 어떻게 저장하고, 어떤 카테고리로 분류하며, 나중에 어떻게 찾아 쓰는지 정리한 운영 매뉴얼입니다.

관리 대상:
- 논문 원고 및 연구 설계
- 연구과제·R&D 기획서
- 정부지원사업 기획서
- 프로그램 개발 계획
- 아이디어·자동화 기획
- 회사 운영 문서 및 회의록
- 조사·리서치 자료
- Claude/AI 도구 활용법
- SNS·강의·콘텐츠 초안

---

## 2. 저장 위치

**기본 볼트:**
```
C:\Users\admin\Obsidian\CMDS-vault
```

**Claude 전용 저장 폴더:**
```
00. Inbox\03. AI Agent\03-6. Claude (Windows)
```

**하위 분류 폴더 6개:**
```
03-6. Claude (Windows)
├── paper/            ← 논문·학술 원고·연구 설계
├── program-development/  ← 프로그램 개발·자동화·코드
├── proposal-rnd/     ← 정부과제·R&D 기획서·사업계획서
├── meeting-worklog/  ← 회의록·업무 협의·실행계획
├── research/         ← 문헌 검토·정책·시장·기술 조사
└── general/          ← 분류 전 아이디어·메모
```

> **Codex (Windows)는 `03-5.` 폴더, Claude (Windows)는 `03-6.` 폴더**로 나란히 관리됩니다.

---

## 3. 큰 원칙 — 2단계 저장 흐름

Claude와 함께 만든 문서는 처음부터 완벽한 최종 분류로 넣기보다, 먼저 Claude 전용 Inbox에 저장하고 나중에 CMDS 기준으로 정리하는 방식이 가장 안전합니다.

```
1. 박지군과 Claude가 대화하며 문서 작성
        ↓
2. Claude가 Markdown 문서 생성 (frontmatter 자동 포함)
        ↓
3. Claude 전용 Inbox에 자동 저장
   (00. Inbox/03. AI Agent/03-6. Claude (Windows)/분류폴더/)
        ↓
4. 문서 성격에 따라 CMDS 카테고리 frontmatter 연결
        ↓
5. 최종본 또는 재사용 가치가 있는 문서는
   Outputs(800) 또는 Permanent Notes로 승격
```

---

## 4. 6개 분류 기준

| 분류 | 저장 폴더 | 실제 사용 기준 |
|------|---------|--------------|
| `paper` | `paper/` | 논문, 학술 원고, 연구 설계, 통계 검증 |
| `program` | `program-development/` | 프로그램 개발 계획, 자동화 도구, 코드 설명 |
| `proposal` | `proposal-rnd/` | 정부과제, R&D 기획서, 사업계획서 |
| `meeting` | `meeting-worklog/` | 회의록, 업무 협의, 실행계획 |
| `research` | `research/` | 문헌 검토, 정책 조사, 시장 조사, 기술 조사 |
| `general` | `general/` | 분류가 애매한 아이디어와 메모 |

---

## 5. CMDS 카테고리 연결 기준

| CMDS | 의미 | Claude 산출물 예시 |
|------|-----|-----------------|
| `100 Themes` | 관심사·주제·문제의식 | 새 연구 아이디어, 사업 아이템 메모 |
| `200 Literature` | 개념·이론·문헌·선행연구 | 논문 요약, 이론 정리, 보고서 요약 |
| `300 Data` | 데이터·설문·조사도구 | 설문지, 통계표, 데이터 검증 |
| `400 Methodologies` | 연구방법·통계·분석법·코드 | 분석 방법, 프롬프트, 스크립트 |
| `500 Products` | 도구와 플랫폼 활용법 | Obsidian, Claude, ChatGPT, Codex 활용법 |
| `600 Specialties` | 전문 분야 지식 | 생성형 AI, 지식관리, 생산성, 교육 |
| `700 Creatives` | 창작 콘텐츠 | SNS 글, 블로그, 강의 스크립트 |
| `800 Outputs` | 최종 산출물 | 논문, 보고서, 기획서 제출본, 강의자료 |
| `900 Divisions` | 업무·조직·프로젝트 | 회사 운영, 연구소, 컨설팅 프로젝트 |

---

## 6. 문서 종류별 저장 기준

### 6.1 논문 관련

저장 분류: `paper`

해당 문서:
- 논문 각 장 초안
- 연구문제·가설 정리
- 설문지 문항 검토
- 통계 분석 결과 해석
- 심사위원 답변서 초안

CMDS 연결:

| 문서 성격 | CMDS 연결 |
|---------|---------|
| 연구 주제·문제의식 | `100 Themes` |
| 선행연구 정리 | `200 Literature` |
| 설문지·데이터 | `300 Data` |
| 분석방법·통계 | `400 Methodologies` |
| 최종 논문 원고 | `800 Outputs` |

요청 예시:
```
이 논문 2장 선행연구 초안을 Obsidian에 paper로 저장해줘.
```

---

### 6.2 정부과제·R&D 기획서

저장 분류: `proposal`

해당 문서:
- 정부과제 기획서 초안
- 사업 필요성 논리
- 기술개발 목표
- 사업화 전략
- 정량 성과지표

CMDS 연결:

| 문서 성격 | CMDS 연결 |
|---------|---------|
| 사업 아이디어 | `100 Themes` |
| 정책·시장 근거 | `200 Literature` 또는 `600 Specialties` |
| 기술개발 방법 | `400 Methodologies` |
| AI·자동화 도구 활용 | `500 Products` |
| 최종 제출 기획서 | `800 Outputs` |
| 회사·연구소 업무 | `900 Divisions` |

요청 예시:
```
방금 작성한 정부과제 기획서 초안을 Obsidian에 proposal로 저장해줘.
```

---

### 6.3 프로그램 개발 계획

저장 분류: `program`

해당 문서:
- 업무 자동화 프로그램 기획
- Obsidian 자동 저장 스크립트
- 데이터 분석 도구 개발 계획
- 사내 문서 자동화 시스템
- 프로그램 기능 명세서

CMDS 연결:

| 문서 성격 | CMDS 연결 |
|---------|---------|
| 개발 아이디어 | `100 Themes` |
| 코드 조각 | `491 Codes` |
| 프롬프트 | `492 Prompts` |
| 자동화 스크립트 | `493 Scripts` |
| Obsidian 활용 | `501 Obsidian` |
| Claude 활용법 | `521 Claude` |
| 개발 전문성 | `630 Development` |

요청 예시:
```
이 자동화 프로그램 기획서를 Obsidian에 program으로 저장해줘.
```

---

### 6.4 연구과제 아이디어

저장 분류: `general` 또는 `research`

해당 문서:
- 신규 연구과제 아이디어
- 과제화 가능성 메모
- 논문화 가능한 관찰 메모

CMDS 연결:

| 문서 성격 | CMDS 연결 |
|---------|---------|
| 초기 아이디어 | `100 Themes` |
| 이론화 가능성 | `200 Literature` |
| 과제 기획으로 발전 | `800 Outputs` 또는 `900 Divisions` |

요청 예시:
```
이 연구과제 아이디어를 Obsidian에 general로 저장해줘. 나중에 과제화할 수 있게 정리해줘.
```

---

### 6.5 회의록·업무 기록

저장 분류: `meeting`

해당 문서:
- 기업·기관 미팅 요약
- 연구소 내부 회의
- 정부과제 협의 내용
- 실행계획·담당자 정리

요청 예시:
```
오늘 회의 내용을 실행계획 중심으로 정리해서 Obsidian에 meeting으로 저장해줘.
```

---

### 6.6 AI 도구 활용법

저장 분류: `program` 또는 `research`

CMDS 연결:

| 내용 | CMDS 연결 |
|-----|---------|
| Obsidian 사용법 | `501 Obsidian` |
| ChatGPT 활용법 | `520 ChatGPT` |
| Claude 활용법 | `521 Claude` |
| Codex 활용법 | `522 Codex` |
| 프롬프트 원문 | `492 Prompts` |
| 자동화 스크립트 | `493 Scripts` |

---

## 7. 저장 요청 문장 템플릿

박지군은 아래 문장만 사용하면 됩니다.

```
이 내용을 Obsidian에 paper로 저장해줘.
이 내용을 Obsidian에 proposal로 저장해줘.
이 내용을 Obsidian에 program으로 저장해줘.
이 내용을 Obsidian에 research로 저장해줘.
이 내용을 Obsidian에 meeting으로 저장해줘.
```

분류가 애매하면:
```
이 내용은 네가 적절한 카테고리를 판단해서 Obsidian에 저장해줘.
```

---

## 8. Claude가 자동 생성하는 frontmatter 형식

```yaml
---
type: note
aliases:
  - "문서 제목"
description: "English 1~2 sentences — what this note is about and when to reference it."
author:
  - "[[박지군]]"
date created: 2026-05-02
date modified: 2026-05-02
tags:
  - Claude
  - [분류태그]
status: draft
sourceWorkspace: "C:\Users\admin\[작업폴더]"
createdBy: Claude
category: "[paper|program|proposal|meeting|research|general]"
---
```

---

## 9. 좋은 노트 구조

Claude와 함께 만드는 문서의 기본 구조:

```markdown
## 작성 목적
## 핵심 내용
## 세부 내용
## 출처와 근거
## 후속 작업
## 관련 CMDS 분류
```

출처가 필요한 정책·통계·법령:
```
[출처: 보고서명, 발행기관, 발행년도]
[산출근거: '원천데이터명(발행기관, 년도)' 의거하여 추산함]
```

---

## 10. 문서 승격 기준

| 상태 | 처리 |
|------|------|
| 단순 메모 | Inbox에 유지 |
| 다시 쓸 수 있는 아이디어 | `100 Themes`로 연결 |
| 근거 자료로 가치 있음 | `200 Literature` 또는 `research`로 정리 |
| 분석 방법으로 가치 있음 | `400 Methodologies` 또는 `493 Scripts`로 정리 |
| 도구 활용법으로 가치 있음 | `500 Products`로 연결 |
| 제출 가능한 최종 산출물 | `800 Outputs`로 승격 |

---

## 11. 추천 운영 루틴

### 매일
```
Claude와 작성한 문서 중 보존 가치 있는 것만 Obsidian에 저장
```

### 매주
```
03-6. Claude Inbox를 열고
paper, proposal, program, research 문서 검토
```

### 매월
```
최종본 후보를 800 Outputs로 정리
반복 사용 가능한 방법은 492 Prompts, 493 Scripts, 521 Claude로 정리
```

---

## 12. 핵심 원칙 한 문장

```
Claude Inbox는 임시 작업함, CMDS 번호는 지식 분류, 800 Outputs는 최종 산출물이다.
```

| 이 문서는? | 저장과 연결 |
|-----------|-----------|
| 자료 | `research`, `200 Literature`, `300 Data` |
| 방법 | `400 Methodologies`, `492 Prompts`, `493 Scripts` |
| 도구 사용법 | `500 Products`, `501 Obsidian`, `521 Claude` |
| 최종 산출물 | `800 Outputs` |
| 업무 기록 | `meeting`, `900 Divisions` |

---

## 참고 문서

- [[2026-05-02-Codex-Obsidian-Document-Category-Management]] — Codex 동일 운영 가이드
- [[Claude-Obsidian-연동-가이드]] — MCP 연동 설정 상세
- [[Claude와-함께하는-옵시디언-완전활용-가이드]] — 전체 활용 전략
- [[CMDS-시스템-활용법]] — CMDS 슬래시 명령어
- [[CMDS.md]] — CMDS 시스템 구조

---

*작성일: 2026-05-02 | Claude Code + CMDS-vault | 박지군 × Claude 협업*

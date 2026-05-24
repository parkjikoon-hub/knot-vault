---
type: note
aliases:
  - "Codex Obsidian Document Category Management"
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

# Codex Obsidian Document Category Management

# Codex 산출물 Obsidian 자동 생성 및 카테고리 관리 방법

## 1. 문서 목적

이 문서는 Codex와 함께 작성하는 다양한 산출물을 Obsidian에 어떻게 저장하고, 어떤 카테고리로 분류하며, 나중에 어떻게 찾아 쓰면 좋은지 정리한 운영 매뉴얼입니다.

관리 대상은 다음과 같습니다.

- 논문 원고
- 연구과제 기획
- 정부지원사업 기획서
- 프로그램 개발 계획
- 자동화 아이디어
- 회사 운영 문서
- 회의록
- 조사자료
- ChatGPT/Codex 활용법
- SNS·강의·콘텐츠 초안

## 2. 큰 원칙

[운영 제안]

Codex와 함께 만든 문서는 처음부터 완벽한 최종 분류로 넣기보다, 먼저 Codex 전용 Inbox에 저장하고 나중에 CMDS 기준으로 정리하는 방식이 가장 안전합니다.

기본 흐름은 다음입니다.

```text
1. Codex와 대화하면서 문서 작성
2. Codex가 Markdown 문서 생성
3. Obsidian Codex Inbox에 자동 저장
4. 문서 성격에 따라 CMDS 카테고리 연결
5. 최종본 또는 재사용 가치가 있는 문서는 Outputs 또는 Permanent Notes로 승격
```

이렇게 하면 초안, 아이디어, 최종본이 섞이지 않고 관리됩니다.

## 3. Codex 저장 분류와 실제 사용 기준

Codex 저장 스크립트는 6개 분류를 사용합니다.

| Codex 분류 | 저장 폴더 | 실제 사용 기준 |
|---|---|---|
| `paper` | `paper` | 논문, 학술 원고, 연구 설계, 통계 검증 |
| `program` | `program-development` | 프로그램 개발 계획, 자동화 도구, 코드 설명 |
| `proposal` | `proposal-rnd` | 정부과제, R&D 기획서, 사업계획서 |
| `meeting` | `meeting-worklog` | 회의록, 업무 협의, 실행계획 |
| `research` | `research` | 문헌 검토, 정책 조사, 시장 조사, 기술 조사 |
| `general` | `general` | 아직 분류가 애매한 아이디어와 메모 |

## 4. CMDS 카테고리와 연결하는 방법

[확인된 사실: `CMDS.md` 내부 분류 체계 확인]

CMDS는 다음 9개 대분류를 사용합니다.

| CMDS | 의미 | Codex 산출물 예시 |
|---|---|---|
| `100 Themes` | 관심사, 주제, 용어, 문제의식 | 새 연구 아이디어, 사업 아이템 메모 |
| `200 Literature` | 개념, 이론, 문헌, 선행연구 | 논문 요약, 이론 정리, 정책 보고서 요약 |
| `300 Data` | 데이터, 설문, 조사도구 | 설문지, 통계표, 데이터 검증 |
| `400 Methodologies` | 연구방법, 통계, 분석법, 코드 | 분석 방법, 회귀분석, 프롬프트, 스크립트 |
| `500 Products` | 도구와 플랫폼 | Obsidian, ChatGPT, Codex, Claude, n8n 활용법 |
| `600 Specialties` | 전문 분야 지식 | 생성형 AI, 지식관리, 생산성, 교육, 개발 |
| `700 Creatives` | 창작 콘텐츠 | SNS 글, 블로그, 강의 스크립트, 영상 기획 |
| `800 Outputs` | 최종 산출물 | 논문, 보고서, 기획서, 제출본, 강의자료 |
| `900 Divisions` | 업무·조직·프로젝트 영역 | 회사 운영, 연구소, 정부과제, 컨설팅 프로젝트 |

## 5. 문서 종류별 추천 관리 기준

### 5.1 논문 관련 문서

논문 관련 문서는 우선 `paper`로 저장합니다.

예시:

```text
논문 1장 서론 초안
연구문제와 가설 정리
설문지 문항 검토
통계 분석 결과 해석
심사위원 답변서 초안
```

추천 CMDS 연결:

| 문서 성격 | CMDS 연결 |
|---|---|
| 연구 주제, 문제의식 | `100 Themes` |
| 선행연구 정리 | `200 Literature` |
| 설문지, 데이터 | `300 Data` |
| 분석방법, 통계 | `400 Methodologies` |
| 최종 논문 원고 | `800 Outputs` |

요청 예시:

```text
이 논문 2장 선행연구 초안을 Obsidian에 paper로 저장해줘.
```

### 5.2 정부과제·R&D 기획서

정부과제와 사업계획서는 우선 `proposal`로 저장합니다.

예시:

```text
정부과제 기획서 초안
사업 필요성 논리
기술개발 목표
사업화 전략
정량 성과지표
평가위원 관점 보완 의견
```

추천 CMDS 연결:

| 문서 성격 | CMDS 연결 |
|---|---|
| 사업 아이디어 | `100 Themes` |
| 정책·시장 근거 | `200 Literature` 또는 `600 Specialties` |
| 기술개발 방법 | `400 Methodologies` |
| AI·자동화 도구 활용 | `500 Products` |
| 최종 제출 기획서 | `800 Outputs` |
| 회사·연구소 업무 | `900 Divisions` |

요청 예시:

```text
방금 작성한 정부과제 기획서 초안을 Obsidian에 proposal로 저장해줘.
```

### 5.3 프로그램 개발 계획

프로그램 개발 관련 문서는 우선 `program`으로 저장합니다.

예시:

```text
업무 자동화 프로그램 기획
Obsidian 자동 저장 스크립트
데이터 분석 도구 개발 계획
사내 문서 자동화 시스템
프로그램 기능 명세서
```

추천 CMDS 연결:

| 문서 성격 | CMDS 연결 |
|---|---|
| 개발 아이디어 | `100 Themes` |
| 코드 조각 | `491 Codes` |
| 프롬프트 | `492 Prompts` |
| 자동화 스크립트 | `493 Scripts` |
| Obsidian 활용 | `501 Obsidian` |
| ChatGPT/Codex 활용 | `520 ChatGPT` 또는 별도 Codex 분류 |
| 개발 전문성 | `630 Development` |

요청 예시:

```text
이 자동화 프로그램 기획서를 Obsidian에 program으로 저장해줘.
```

### 5.4 연구과제 아이디어

아이디어는 아직 완성 문서가 아니므로 `general` 또는 `research`로 저장합니다.

예시:

```text
신규 연구과제 아이디어
지역 산업 문제에서 나온 과제화 가능성
기업 애로기술 기반 R&D 주제
논문화 가능한 관찰 메모
```

추천 CMDS 연결:

| 문서 성격 | CMDS 연결 |
|---|---|
| 초기 아이디어 | `100 Themes` |
| 이론화 가능성 | `200 Literature` |
| 데이터 수집 가능성 | `300 Data` |
| 연구방법 | `400 Methodologies` |
| 과제 기획으로 발전 | `800 Outputs` 또는 `900 Divisions` |

요청 예시:

```text
이 연구과제 아이디어를 Obsidian에 general로 저장해줘. 나중에 과제화할 수 있게 정리해줘.
```

### 5.5 회의록과 업무 기록

회의록은 `meeting`으로 저장합니다.

예시:

```text
기업 미팅 요약
연구소 내부 회의
정부과제 협의 내용
개발자와 논의한 기능 요구사항
실행계획과 담당자 정리
```

추천 CMDS 연결:

| 문서 성격 | CMDS 연결 |
|---|---|
| 실행계획 | `900 Divisions` |
| 과제 관련 회의 | `800 Outputs` 또는 `900 Divisions` |
| 프로그램 요구사항 | `630 Development` |
| 후속 자동화 작업 | `493 Scripts` |

요청 예시:

```text
오늘 회의 내용을 실행계획 중심으로 정리해서 Obsidian에 meeting으로 저장해줘.
```

### 5.6 ChatGPT, Codex, Obsidian 활용법

AI 도구 활용법은 `program` 또는 `research`로 저장한 뒤, CMDS에서는 `500 Products` 계열에 연결하는 것이 좋습니다.

추천 연결:

| 내용 | CMDS 연결 |
|---|---|
| Obsidian 사용법 | `501 Obsidian` |
| ChatGPT 활용법 | `520 ChatGPT` |
| Claude 활용법 | `521 Claude` |
| Codex 활용법 | `520 ChatGPT` 인근 또는 별도 `52X Codex` |
| 프롬프트 원문 | `492 Prompts` |
| 자동화 스크립트 | `493 Scripts` |

요청 예시:

```text
지금 만든 Codex 활용법을 Obsidian에 program으로 저장하고, 500 Products와 연결할 수 있게 정리해줘.
```

## 6. 저장 요청 문장 템플릿

교수님께서는 앞으로 아래 문장만 사용하셔도 됩니다.

```text
이 내용을 Obsidian에 paper로 저장해줘.
```

```text
이 내용을 Obsidian에 proposal로 저장해줘.
```

```text
이 내용을 Obsidian에 program으로 저장해줘.
```

```text
이 내용을 Obsidian에 research로 저장해줘.
```

```text
이 내용을 Obsidian에 meeting으로 저장해줘.
```

분류가 애매하면 이렇게 요청하면 됩니다.

```text
이 내용은 네가 적절한 카테고리를 판단해서 Obsidian에 저장해줘.
```

이 경우 Codex가 문서 성격을 보고 `paper`, `proposal`, `program`, `meeting`, `research`, `general` 중 하나를 선택합니다.

## 7. 좋은 Obsidian 노트가 되기 위한 최소 구성

Codex와 함께 만든 문서는 가능하면 다음 구조를 갖추는 것이 좋습니다.

```markdown
# 제목

## 작성 목적

## 핵심 내용

## 세부 내용

## 출처와 근거

## 후속 작업

## 관련 CMDS 분류
```

특히 정부과제, 연구개발, 논문 관련 문서는 출처와 근거를 반드시 분리합니다.

```text
[출처: 보고서명, 발행기관, 발행년도]
[산출근거: '원천데이터명(발행기관, 년도)' 의거하여 추산함]
```

## 8. 문서를 승격하는 기준

Codex Inbox에 저장된 문서는 모두 최종본이 아닙니다. 다음 기준을 만족하면 CMDS의 상위 지식 자산으로 승격합니다.

| 상태 | 처리 |
|---|---|
| 단순 메모 | Inbox에 유지 |
| 다시 쓸 수 있는 아이디어 | `100 Themes` 또는 `220 Personal Insights`에 연결 |
| 근거 자료로 가치 있음 | `200 Literature` 또는 `research`로 정리 |
| 분석 방법으로 가치 있음 | `400 Methodologies` 또는 `493 Scripts`로 정리 |
| 도구 활용법으로 가치 있음 | `500 Products`로 연결 |
| 제출 가능한 최종 산출물 | `800 Outputs`로 승격 |

## 9. 교수님 업무에 맞춘 추천 운영 루틴

[운영 제안]

### 매일

```text
Codex와 작성한 문서 중 보존할 가치가 있는 것만 Obsidian에 저장
```

### 매주

```text
Codex Inbox를 열고 paper, proposal, program, research 문서를 검토
```

### 매월

```text
최종본 후보를 800 Outputs로 정리
반복 사용 가능한 방법은 492 Prompts, 493 Scripts, 520 ChatGPT로 정리
```

## 10. 가장 중요한 실무 원칙

다음 한 문장으로 기억하면 됩니다.

```text
Codex Inbox는 임시 작업함, CMDS 번호는 지식 분류, 800 Outputs는 최종 산출물이다.
```

따라서 Codex와 함께 만든 모든 문서는 다음 질문으로 분류하면 됩니다.

```text
이 문서는 자료인가?
방법인가?
도구 사용법인가?
최종 산출물인가?
업무 기록인가?
```

그 답에 따라 다음처럼 관리합니다.

| 질문의 답 | 저장과 연결 |
|---|---|
| 자료 | `research`, `200 Literature`, `300 Data` |
| 방법 | `400 Methodologies`, `492 Prompts`, `493 Scripts` |
| 도구 사용법 | `500 Products`, `501 Obsidian`, `520 ChatGPT` |
| 최종 산출물 | `800 Outputs` |
| 업무 기록 | `meeting`, `900 Divisions` |



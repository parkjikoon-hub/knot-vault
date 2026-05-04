---
type: documentation
aliases:
  - "Claude Cowork Bible"
  - "Claude Cowork 유튜브 상세 분석"
  - "클로드 코워크 바이블"
description: "Detailed beginner-focused study note on Claude Cowork based on official Anthropic documentation and public tutorial material. Use this when setting up Claude Cowork, understanding its UI, or building repeatable non-coding AI workflows."
author:
  - "[[Ji Koon Park]]"
date created: 2026-05-05
date modified: 2026-05-05
tags:
  - Claude
  - Cowork
  - YouTube
  - tutorial
  - workflow
status: completed
sourceWorkspace: "C:\\Users\\admin\\Obsidian\\CMDS-vault"
createdBy: "Codex"
category: "program"
---

# Claude Cowork 코워크 바이블

> 대상 링크: https://youtu.be/xOtoiSRiZWQ?si=LvPfV0eA42gZNNCg
>
> 이 문서는 **클로드 코워크를 처음 배우는 초보자**가 영상 흐름을 따라가며 실제로 사용할 수 있도록 만든 실전 학습 노트이다.
>
> **중요한 검증 메모**
>
> - 이 문서는 사용자가 준 유튜브 링크를 기준으로 작성되었으나, 현재 세션에서는 **해당 영상의 직접 자막 원문과 전체 프레임을 안정적으로 추출하지 못했다**.
> - 따라서 아래 내용은 **Anthropic 공식 문서, 공식 튜토리얼, 공개 리뷰/튜토리얼 자료**를 교차검증하여 영상의 설명 흐름과 화면 구성을 최대한 충실하게 재구성하고, 초보자용으로 대폭 보강한 결과물이다.
> - 즉, 아래에는 두 층이 섞여 있다.
> 	- **공인된 팩트**: Claude/Anthropic 공식 문서에 명시된 내용
> 	- **정책적 가공 및 재구성**: 초보자 학습을 위해 화면 흐름, 사용 전략, 실습 순서를 해석하여 정리한 내용

## 1. 이 문서를 어떻게 읽어야 하는가

이 문서는 단순한 영상 요약이 아니다. 오히려 다음 3가지를 동시에 달성하도록 설계했다.

1. 영상에서 말하고자 하는 핵심을 구조적으로 해체한다.
2. 초보자가 실제 화면에서 무엇을 눌러야 하는지까지 이해하게 만든다.
3. 영상에서 생략되기 쉬운 위험, 권한, 폴더 설계, 프롬프트 설계까지 보강한다.

즉, 이 문서의 목표는 **“영상을 보고 감탄하는 수준”이 아니라, “내 컴퓨터에서 바로 재현하는 수준”**이다.

---

## 2. 먼저 한 문장으로 정리하면

Claude Cowork는 **채팅형 AI가 아니라, 사용자의 데스크톱 환경에서 파일·폴더·앱·웹 자료를 실제 작업 단위로 처리하는 에이전트형 업무 모드**이다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

더 쉽게 말하면:

- 일반 Chat은 “답변”을 준다.
- Claude Code는 “개발 작업”을 수행한다.
- Claude Cowork는 “비개발 업무를 대신 처리하는 디지털 동료”에 가깝다. [출처: Claude Cowork by Anthropic, Anthropic, 2026]

---

## 3. 이 영상이 본질적으로 보여주려는 메시지

이 계열의 Claude Cowork 영상들은 거의 공통적으로 아래 메시지를 전달한다.

### 3-1. ChatGPT/Claude Chat처럼 대화만 하는 시대에서 벗어난다

기존 AI 사용 방식은 대체로 아래와 같았다.

- 질문한다
- 답을 받는다
- 사람이 다시 파일을 열고
- 사람이 직접 복사하고 붙이고
- 사람이 다시 정리한다

Cowork는 이 흐름을 바꾼다.

- 결과를 말한다
- 필요한 폴더/자료/도구 접근 권한을 준다
- Claude가 계획을 세운다
- Claude가 하위 작업을 병렬로 처리한다
- 최종 산출물을 파일로 돌려준다

[출처: Claude Cowork by Anthropic, Anthropic, 2026]

### 3-2. “프롬프트 잘 치는 사람”보다 “업무 시스템을 잘 설계하는 사람”이 유리해진다

Cowork의 핵심은 예쁜 문장을 쓰는 것이 아니다. 핵심은 다음 네 가지다.

- 어떤 폴더를 연결할 것인가
- 어떤 지시문을 상시로 줄 것인가
- 어떤 프로젝트로 분리할 것인가
- 어떤 작업을 반복 자동화할 것인가

[출처: Customize Claude Cowork, Claude, 2026]

### 3-3. 초보자에게 오히려 더 유리할 수 있다

Cowork는 Claude Code와 같은 에이전트 구조를 사용하지만, 터미널 없이 Claude Desktop 안에서 쓸 수 있다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

즉:

- 코딩 지식이 적어도 쓸 수 있다
- 대신 폴더 구조, 파일 정리, 업무 정의가 중요하다

이 점 때문에 교수, 연구자, 연구소장, 평가위원, 기획자, 행정 담당자 같은 **문서·데이터·보고서 중심의 지식노동자**에게 특히 강력하다. [출처: Claude Cowork by Anthropic, Anthropic, 2026]

---

## 4. 공인된 팩트만 먼저 정리

아래는 해석이 아니라, 현재 확인된 공식 정보만 추려 놓은 것이다.

### 4-1. 현재 사용 가능 범위

- Claude Cowork는 유료 플랜(Pro, Max, Team, Enterprise)에서 사용 가능하다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]
- macOS와 Windows용 Claude Desktop에서 사용한다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]
- 최신 Windows용 Claude 앱이 필요하다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]
- 웹 브라우저용 일반 Claude 화면이나 순수 모바일 앱만으로는 Cowork를 직접 돌리는 구조가 아니다. 다만 Pro/Max는 휴대폰에서 작업을 보내고 데스크톱 쪽에서 실행되게 할 수 있다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

### 4-2. 핵심 기능

- 로컬 파일 직접 읽기/쓰기 [출처: Get started with Claude Cowork, Claude Help Center, 2026]
- 하위 작업 분해 및 병렬 처리 [출처: Get started with Claude Cowork, Claude Help Center, 2026]
- Excel, PowerPoint, 문서 등 전문 산출물 생성 [출처: Get started with Claude Cowork, Claude Help Center, 2026]
- 장시간 작업 [출처: Get started with Claude Cowork, Claude Help Center, 2026]
- 일정 기반 반복 작업(Scheduled tasks) [출처: Get started with Claude Cowork, Claude Help Center, 2026]
- 프로젝트 단위 작업 공간(파일, 링크, 지시문, 메모리 포함) [출처: Get started with Claude Cowork, Claude Help Center, 2026]

### 4-3. 작업 실행 방식

Cowork는 작업 시작 시 대체로 다음 흐름으로 움직인다.

1. 요청 분석
2. 계획 생성
3. 복잡 작업의 하위 분해
4. 필요 시 병렬 워크스트림 실행
5. 파일 시스템에 결과물 전달

[출처: Get started with Claude Cowork, Claude Help Center, 2026]

### 4-4. 권한과 안전

- Claude는 사용자가 연결한 폴더 범위 안에서만 파일을 읽고 쓸 수 있다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]
- 파일 영구 삭제는 명시적 허가가 필요하다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]
- 민감정보가 있는 로컬 파일 접근은 피하는 것이 권장된다. [출처: Use Claude Cowork safely, Claude Help Center, 2026]
- 신뢰하지 않는 사이트, MCP, 플러그인 사용은 위험하다. [출처: Use Claude Cowork safely, Claude Help Center, 2026]
- 프롬프트 인젝션 가능성을 주의해야 한다. [출처: Use Claude Cowork safely, Claude Help Center, 2026]

---

## 5. 화면 기준으로 재구성한 “영상 따라하기” 전체 흐름

아래는 초보자가 실제 영상에서 보게 될 가능성이 큰 화면 흐름을, 공식 문서를 토대로 재구성한 것이다.

[산출근거: 'Get started with Claude Cowork(Claude Help Center, 2026)', 'Organize your tasks with projects in Claude Cowork(Claude Help Center, 2026)', 'Customize Claude Cowork(Claude, 2026)', 'Use plugins in Cowork(Claude Help Center, 2026)', 'I tested Claude Cowork — and it feels more like a coworker than a chatbot(Tom's Guide, 2026)'를 대조하여 재구성함]

### 5-1. 첫 화면: Chat / Code / Cowork의 모드 구분

영상 초반에는 보통 Claude Desktop 왼쪽 또는 상단에서 **모드 선택기**가 강조된다.

초보자가 이해해야 할 포인트:

- `Chat`: 질문-응답 중심
- `Code`: 개발/코딩 중심
- `Cowork`: 실제 작업 수행 중심

이 차이를 모르면 Cowork를 단순 채팅처럼 사용하게 된다.

### 5-2. Cowork 탭으로 전환

공식 문서에 따르면 Claude Desktop에서 Cowork 탭을 눌러 “Tasks” 모드로 전환한다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

초보자 해석:

- 여기서부터는 “대화”보다 “업무 지시” 관점으로 생각해야 한다.
- 질문보다 **결과물 중심 지시**가 더 적합하다.

예:

- 나쁜 지시: “이 영수증들 뭐야?”
- 좋은 지시: “이 폴더의 영수증 사진을 읽고 월별 경비정산 엑셀로 정리해줘.”

### 5-3. 작업 입력창: 해야 할 일을 결과 기준으로 말한다

영상에서 보이는 가장 중요한 행동은 입력창에 자연어로 업무를 적는 부분이다.

Cowork는 “무엇을 알고 싶은지”보다 “무엇을 완성하고 싶은지”를 명확히 적을수록 강하다.

좋은 구조:

1. 목표
2. 입력 자료
3. 원하는 출력 형식
4. 제외 조건
5. 검토 기준

예시:

```text
이 폴더 안의 PDF, DOCX, 메모 파일을 모두 읽고
중복을 제거한 뒤
‘주제별 요약’, ‘핵심 인용’, ‘실행 과제’ 3개 섹션으로
한국어 보고서 문서를 만들어줘.
애매한 내용은 별도 검토 목록으로 남겨줘.
```

### 5-4. 폴더/파일 연결

영상에서 매우 중요한 장면은 Claude에게 어떤 폴더를 보게 할지 지정하는 부분이다.

공식 문서상 Cowork는 연결된 폴더의 파일을 읽고 쓸 수 있다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

초보자 핵심:

- 처음부터 `내 문서 전체`, `바탕화면 전체`를 주지 말 것
- **작업 전용 폴더**를 따로 만들고 그 폴더만 연결할 것

권장 폴더 예시:

```text
Claude-Work/
├─ 01_inbox/
├─ 02_sources/
├─ 03_working/
├─ 04_outputs/
└─ 99_archive/
```

이 구조가 좋은 이유:

- Claude가 볼 범위를 좁힐 수 있다
- 실수 위험이 낮아진다
- 작업 재현성이 높아진다

[출처: Use Claude Cowork safely, Claude Help Center, 2026]
[산출근거: 공식 안전 가이드의 “전용 작업 폴더 사용 권장”을 실제 운영 구조로 구체화함]

### 5-5. Claude의 계획 제시 화면

Cowork는 바로 실행하지 않고 먼저 계획을 제시한다는 점이 핵심이다. [출처: I tested Claude Cowork — and it feels more like a coworker than a chatbot, Tom's Guide, 2026]

이 단계에서 초보자가 꼭 확인해야 할 것:

- 어떤 파일을 읽을 예정인가
- 어떤 방식으로 분류/수정할 예정인가
- 삭제나 이동이 포함되는가
- 결과 파일은 어디에 저장되는가

이 장면은 영상에서 “와, 스스로 계획 세우네”로 보일 수 있지만, 실제론 **가장 중요한 검토 지점**이다.

### 5-6. 승인 후 실행

공식 리뷰 자료에 따르면 사용자는 계획을 승인, 수정, 취소할 수 있다. [출처: I tested Claude Cowork — and it feels more like a coworker than a chatbot, Tom's Guide, 2026]

초보자 규칙:

- 익숙하지 않은 첫 작업은 반드시 `Ask before acting` 성격으로 사용
- 처음부터 무정지 자동 실행 습관 금지

공식 문서에도 승인 방식은 두 가지로 설명된다.

- `Ask before acting`: 각 행동 전 승인
- `Act without asking`: 더 빠르지만 더 위험

[출처: Get started with Claude Cowork, Claude Help Center, 2026]

### 5-7. 진행 상황 표시

영상 중간에는 보통 Claude가 현재 무엇을 하는지, 어떤 하위 작업을 돌리는지, 얼마나 진행되었는지 보여주는 장면이 나온다.

공식 문서상 Cowork는 진행 표시, 접근 방식의 가시성, 중간 개입, 병렬 작업을 지원한다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

초보자 해석:

- “생각 중”이 아니라 실제 작업 중이다
- 오래 걸리는 것은 비정상이 아니라 정상일 수 있다
- 중간에 방향을 바꾸고 싶으면 추가 지시를 넣을 수 있다

### 5-8. 최종 결과물 생성

Cowork의 강점은 텍스트 답변이 아니라 **실제 파일 산출물**이다.

예:

- `.xlsx`
- `.pptx`
- `.docx`
- 정리된 폴더 구조
- 분석 보고서

[출처: Get started with Claude Cowork, Claude Help Center, 2026]

영상에서 이 장면은 대개 “결과물이 생겼다” 수준으로 지나가지만, 실제로는 여기서 다음 점검이 필요하다.

- 파일이 정말 열리는가
- 엑셀 수식이 작동하는가
- 슬라이드가 발표 가능한 구조인가
- 문서 논리가 맞는가
- 출처와 추론이 구분되는가

---

## 6. 초보자 기준으로 본 Cowork UI 해석

아래 표는 영상에 나오는 화면 요소를 초보자 관점에서 다시 해석한 것이다.

| 화면 요소 | 초보자가 보는 모습 | 실제 의미 |
|---|---|---|
| Cowork 탭 | 그냥 메뉴 하나 | 대화형 AI에서 작업형 AI로 넘어가는 스위치 |
| Task 입력창 | 채팅창 | 작업 명세서 입력창 |
| 폴더 연결 | 파일 첨부 | Claude의 작업 범위와 권한 범위를 정하는 장치 |
| Plan / Approach | 중간 설명 | 실행 전 검수 포인트 |
| Progress | 로딩 | 실제 하위 작업과 병렬 작업 진행 상태 |
| Projects | 폴더 모음 | 반복 업무용 독립 작업 공간 |
| Global instructions | 설정 텍스트 | 모든 세션에 적용되는 작업 원칙 |
| Customize | 꾸미기 메뉴 | 커넥터, 플러그인, 스킬을 관리하는 운영 센터 |
| Scheduled | 예약 기능 | 반복 자동화의 핵심 |

[산출근거: 'Get started with Claude Cowork(Claude Help Center, 2026)', 'Organize your tasks with projects in Claude Cowork(Claude Help Center, 2026)', 'Customize Claude Cowork(Claude, 2026)'를 바탕으로 초보자 이해용으로 재해석함]

---

## 7. Claude Cowork를 제대로 쓰려면 꼭 알아야 할 7개 개념

### 7-1. Projects

Projects는 관련 작업을 한 공간으로 묶는 기능이다. 각 프로젝트는 자체 파일, 지시문, 일정 작업, 컨텍스트, 메모리를 가질 수 있다. [출처: Organize your tasks with projects in Claude Cowork, Claude Help Center, 2026]

초보자용 해석:

- “연구 프로젝트 A”
- “회사 사업계획서”
- “유튜브 콘텐츠 제작”
- “정부과제 평가 메모 정리”

이런 식으로 업무 단위별로 분리하는 것이 좋다.

### 7-2. Memory

프로젝트 메모리는 같은 프로젝트 안에서 Claude가 이전 작업 맥락을 기억하는 기능이다. [출처: Organize your tasks with projects in Claude Cowork, Claude Help Center, 2026]

의미:

- 반복 지시를 줄일 수 있다
- 같은 톤, 같은 형식, 같은 기준을 유지하기 쉬워진다

### 7-3. Global instructions

모든 Cowork 세션에 적용되는 상시 지시문이다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

여기에 넣기 좋은 것:

- 항상 한국어로 작성
- 표보다 서술을 우선
- 출처와 해석을 구분
- 연구자/평가위원 관점 유지

### 7-4. Folder instructions

특정 폴더를 선택했을 때 그 폴더 문맥에 맞는 추가 규칙을 주는 방식이다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

예:

- 이 폴더는 정부과제 제안서 초안 모음
- 파일명 유지
- 삭제 금지
- 표는 한글 보고서 형식으로 정리

### 7-5. Connectors

커넥터는 Slack, Microsoft 365, Jira 같은 외부 시스템과 Cowork를 연결한다. [출처: Customize Claude Cowork, Claude, 2026]

즉:

- 자료를 읽어오기만 하는 게 아니라
- 경우에 따라 다시 쓰기(write-back)도 가능하다

### 7-6. Plugins

플러그인은 스킬, 커넥터, 서브에이전트를 역할별 패키지로 묶은 것이다. [출처: How to customize plugins in Claude Cowork, Claude, 2026]

예:

- 마케팅용 플러그인
- 법무용 플러그인
- 재무용 플러그인

초보자는 처음부터 만들기보다 **설치 후 커스터마이즈**가 현실적이다.

### 7-7. Scheduled tasks

반복 작업을 매일/매주/매월 자동 실행하게 하는 기능이다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

예:

- 매주 금요일 연구 노트 요약
- 매월 영수증 폴더 경비정산
- 매일 다운로드 폴더 정리

---

## 8. 영상에서 특히 중요하게 봐야 할 장면별 학습 포인트

### 장면 A. “Cowork is for non-technical work”

이 장면의 진짜 의미는 “코딩 못해도 된다”가 아니다.

정확한 의미는:

- 터미널은 몰라도 된다
- 대신 업무 정의는 명확해야 한다
- 파일 구조와 산출물 기준은 더 중요하다

[출처: Claude Cowork by Anthropic, Anthropic, 2026]
[산출근거: 비개발 친화성 설명을 초보자 사용 조건으로 확장 해석함]

### 장면 B. “It creates a plan first”

이 장면을 단순히 똑똑해 보이는 데모로 보면 안 된다.

이것은 사실상:

- 오작동 방지 장치
- 책임 분담 지점
- 작업 범위 검수 단계

이다.

따라서 승인 전에는 반드시:

- 삭제 포함 여부
- 외부 전송 여부
- 산출물 저장 위치
- 분류 기준

을 확인해야 한다.

### 장면 C. “It can work in parallel”

병렬 작업은 화려한 기능이 아니라, Cowork의 본질에 가깝다.

예를 들어:

- A 파일군 분류
- B 파일군 요약
- 웹 자료 검색
- 결과 보고서 초안 작성

을 분리해 동시에 처리할 수 있다는 뜻이다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

이 기능이 중요한 이유는, 사용자가 직접 탭을 오가며 조합하던 일을 Cowork가 작업 흐름으로 묶어 준다는 데 있다.

### 장면 D. “It writes real outputs”

영상에서 결과 파일이 생성되는 장면은 사실상 Cowork와 일반 챗봇의 경계선이다.

여기서 꼭 기억할 점:

- 결과 파일이 생겼다고 끝난 것이 아니다
- 파일이 **작동 가능하고 제출 가능하며 재사용 가능해야** 진짜 완성이다

즉, 산출물의 품질 검수 루틴이 필수다.

---

## 9. 초보자를 위한 실전 사용 순서

아래 순서대로 시작하면 시행착오를 크게 줄일 수 있다.

### 1단계. 앱 준비

- Claude Desktop 최신 버전 설치
- Cowork readiness check 실행
- 유료 플랜 상태 확인

[출처: Get started with Claude Cowork, Claude Help Center, 2026]

### 2단계. Claude 전용 작업 폴더 만들기

추천:

```text
D:\ClaudeWork\01_test_project
```

여기에 연습용 샘플 파일만 넣는다.

### 3단계. Global instructions 최소 설정

예시:

```text
항상 한국어로 작성하라.
출처와 해석을 구분하라.
중요 결정은 먼저 요약하고, 그 다음 세부 근거를 제시하라.
삭제나 이동이 필요한 경우 먼저 계획에서 명시하라.
```

[출처: Get started with Claude Cowork, Claude Help Center, 2026]
[산출근거: 사용자 작업 성향에 맞춰 글로벌 지시문 예시를 보강함]

### 4단계. 첫 번째 작업은 절대 간단하게

추천 첫 작업:

```text
이 폴더의 파일 목록을 읽고
파일 종류별로 분류 계획만 먼저 제시해줘.
아직 실제 이동이나 이름 변경은 하지 마.
```

이유:

- Claude의 판단 방식을 본다
- 폴더 구조를 파악한다
- 위험 없이 검토 습관을 만든다

### 5단계. 두 번째 작업에서 실제 실행

```text
방금 제안한 계획대로 실행해줘.
단, 파일 삭제는 하지 말고 새 하위 폴더만 만들어 정리해줘.
정리 결과를 마지막에 표로 요약해줘.
```

### 6단계. Projects로 승격

첫 테스트가 성공하면, 비슷한 반복 업무는 프로젝트로 만든다.

예:

- `Research Synthesis`
- `Grant Proposal Drafting`
- `Lecture Material Builder`
- `YouTube Content System`

### 7단계. Scheduled tasks 추가

프로젝트가 안정화되면 `/schedule`을 써서 반복 자동화한다. [출처: Get started with Claude Cowork, Claude Help Center, 2026]

---

## 10. 초보자가 가장 많이 실패하는 방식

### 실패 1. 너무 큰 폴더를 한 번에 연결

문제:

- 관계없는 파일까지 읽음
- 민감정보 위험 증가
- 결과가 산만해짐

대안:

- 작업 전용 폴더만 연결

### 실패 2. 질문형 프롬프트 사용

문제:

- Cowork를 Chat처럼 쓰게 됨
- 실행보다 설명만 길어짐

대안:

- 결과물 중심 지시로 바꿀 것

### 실패 3. 승인 단계 대충 넘김

문제:

- 파일 이동/수정 범위를 모르고 실행

대안:

- 계획 확인을 습관화

### 실패 4. 민감 폴더 연결

문제:

- 개인정보, 재무자료, 로그인 관련 파일 노출 위험

대안:

- 별도 전용 폴더
- 백업 유지

[출처: Use Claude Cowork safely, Claude Help Center, 2026]

### 실패 5. 첫날부터 플러그인/커넥터를 과도하게 붙임

문제:

- 어디서 문제가 생기는지 추적 불가

대안:

- 로컬 폴더 기반 단일 업무부터 검증
- 그 뒤 커넥터, 플러그인 확장

[산출근거: 공식 기능 범위와 안전 가이드를 기반으로 초기 도입 전략을 정리함]

---

## 11. 사용자(박지군님)에게 특히 맞는 Cowork 활용 시나리오

### 11-1. 정부과제 기획 자료 정리

입력:

- PDF 공고문
- 과거 제안서
- 메모 파일
- 정책 자료

출력:

- 핵심 요구사항 표
- 평가 포인트 요약
- 차별화 전략 메모

### 11-2. 평가위원용 검토 정리

입력:

- 제안서 초안
- 평가 기준표
- 검토 메모

출력:

- 강점/약점 구조화 문서
- 질의사항 목록
- 수정 요청 포인트

### 11-3. 교수형 강의 자료 제작

입력:

- 논문 PDF
- 수업 메모
- 과거 슬라이드

출력:

- 강의안 초안
- 발표 슬라이드
- 학생용 핵심 요약

### 11-4. 유튜브/SNS 콘텐츠 정리

입력:

- 영상 대본
- 핵심 아이디어 메모
- 참고 링크

출력:

- 블로그형 정리
- 카드뉴스용 문장
- 강의형 설명 원고

---

## 12. 바로 써먹는 Cowork 프롬프트 템플릿

### 템플릿 A. 폴더 정리

```text
이 폴더의 모든 파일을 검토하고
파일 종류와 주제 기준으로 정리 계획을 먼저 제시해줘.
삭제는 하지 말고, 중복 가능성이 있는 파일은 따로 표시해줘.
내가 승인하면 그 다음 실제 정리를 실행해줘.
```

### 템플릿 B. 연구자료 종합

```text
이 폴더의 PDF, DOCX, TXT 파일을 모두 읽고
핵심 주제, 반복되는 주장, 중요한 데이터, 실무적 시사점을 정리해줘.
최종 산출물은 한국어 보고서 문서로 만들고
‘핵심 요약 / 세부 분석 / 바로 실행할 항목’ 구조로 작성해줘.
```

### 템플릿 C. 사업계획서 초안

```text
이 폴더의 참고자료를 바탕으로
사업 배경, 문제 정의, 해결방안, 기대효과, 추진일정을 포함한
초안 문서를 작성해줘.
불확실한 정보는 추정하지 말고 ‘추가 확인 필요’ 섹션에 분리해줘.
```

### 템플릿 D. 영상 분석 노트 만들기

```text
이 폴더의 영상 대본과 메모를 바탕으로
초보자도 따라할 수 있는 학습 노트를 작성해줘.
단순 요약이 아니라
핵심 개념, 실제 사용 순서, 실수 포인트, 실습 예시까지 포함해줘.
```

---

## 13. 플러그인과 커넥터는 언제 붙이는가

정답은 **기본 작업 루틴이 검증된 뒤**다.

### 먼저 붙이면 좋은 것

- Google Drive / Microsoft 365 계열 자료 저장소
- Slack 같은 협업 도구
- 자주 쓰는 문서 흐름과 직결된 시스템

[출처: Customize Claude Cowork, Claude, 2026]

### 나중에 붙여야 하는 것

- 쓰기 권한이 강한 도구
- 민감정보를 다루는 시스템
- 잘 모르는 MCP/플러그인

[출처: Use Claude Cowork safely, Claude Help Center, 2026]

### 중요한 점

플러그인은 “멋진 부가기능”이 아니라 **업무 역할 패키지**다. 공식 문서에 따르면 플러그인은 스킬, 커넥터, 서브에이전트를 하나로 묶는다. [출처: How to customize plugins in Claude Cowork, Claude, 2026]

따라서 초보자라면:

1. 먼저 기본 Cowork로 수동 작업 흐름 검증
2. 그다음 플러그인 설치
3. 마지막에 커스터마이즈

순서가 맞다.

---

## 14. 프로젝트 설계 예시: “Claude Cowork for Government R&D”

이건 박지군님에게 특히 맞는 예시 구조다.

### 프로젝트 이름

`Government-RnD-Workbench`

### 프로젝트 지시문 예시

```text
항상 한국어로 작성하라.
정부과제 평가위원 관점과 연구기획 관점을 함께 반영하라.
근거가 분명한 내용은 출처와 함께 제시하라.
불확실하거나 추정이 필요한 내용은 별도로 구분하라.
표현은 간결하되 심사 문서 품질을 유지하라.
```

### 연결 폴더 예시

```text
Government-RnD-Workbench/
├─ 01_notices
├─ 02_reference_proposals
├─ 03_review_memos
├─ 04_drafts
└─ 05_outputs
```

### 예약 작업 예시

- 매주 월요일: 신규 공고문 요약
- 매주 금요일: 진행 중 초안 비교 정리
- 월말: 검토 메모 종합 보고서

[산출근거: 공식 Projects/Scheduled tasks 기능을 사용자의 실제 업무 맥락에 맞게 설계함]

---

## 15. 안전 가이드: 반드시 지켜야 할 운영 원칙

### 원칙 1. 민감자료와 일반자료를 분리

재무, 인사, 개인정보, 계정정보가 들어간 파일은 별도 보관하고 Cowork 범위에서 제외하는 것이 안전하다. [출처: Use Claude Cowork safely, Claude Help Center, 2026]

### 원칙 2. 처음에는 읽기 중심 작업부터

예:

- 분류 계획 제시
- 요약
- 비교표 작성
- 초안 생성

정리, 이동, 이름 변경, 삭제는 나중에.

### 원칙 3. 모르는 플러그인/MCP는 바로 쓰지 않기

공식 안전 가이드는 신뢰 가능한 MCP 사용을 강조한다. [출처: Use Claude Cowork safely, Claude Help Center, 2026]

### 원칙 4. 결과 파일은 항상 사람이 최종 검토

특히:

- 수치
- 법/규정 표현
- 심사 논리
- 표 서식
- 파일명 체계

는 사람이 마지막 책임을 져야 한다.

### 원칙 5. 작업 로그보다 산출물 검증이 더 중요

Claude가 “잘했다”고 보여도,

- 파일이 깨졌는지
- 수식이 틀렸는지
- 누락이 있는지

는 꼭 직접 확인해야 한다.

---

## 16. 이 영상을 본 뒤 바로 해볼 첫 실습 3개

### 실습 1. 다운로드 폴더 정리 연습

목표:

- Cowork의 계획 생성과 실행 흐름 익히기

### 실습 2. 논문/보고서 3개 종합 요약

목표:

- 다중 문서 분석 능력 체험

### 실습 3. 반복 작업 예약

목표:

- `/schedule` 개념 체득

가장 쉬운 예:

```text
매주 금요일 오후 5시에
이 프로젝트 폴더의 신규 파일을 확인하고
‘이번 주 추가 자료 요약.md’를 만들어줘.
```

---

## 17. 핵심 결론

Claude Cowork를 잘 쓰는 사람은 프롬프트 천재가 아니라 **업무 구조 설계자**다.

정확히는:

- 폴더를 잘 나누고
- 지시문을 잘 설계하고
- 프로젝트를 잘 분리하고
- 반복 작업을 잘 자동화하는 사람

이 유리하다.

이 점에서 Cowork는 단순 AI 채팅이 아니라, **개인용 디지털 운영체제에 가까운 업무 에이전트**로 보는 편이 맞다. [산출근거: 공식 기능 설명과 튜토리얼 구조를 종합한 해석]

---

## 18. 참고 근거

### 공식 자료

- Claude Cowork by Anthropic  
  https://www.anthropic.com/product/claude-cowork

- Get started with Claude Cowork  
  https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork

- Organize your tasks with projects in Claude Cowork  
  https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork

- Customize Claude Cowork  
  https://claude.com/resources/tutorials/customize-claude-cowork

- How to customize plugins in Claude Cowork  
  https://claude.com/resources/tutorials/how-to-customize-plugins-in-cowork

- Use Claude Cowork safely  
  https://support.claude.com/en/articles/13364135-use-claude-cowork-safely

### 보조 자료

- I tested Claude Cowork — and it feels more like a coworker than a chatbot  
  https://www.tomsguide.com/ai/i-tested-claude-cowork-anthropics-new-ai-feels-more-like-a-coworker-than-a-chatbot

---

## 19. 다음에 바로 이어서 하면 좋은 작업

이 문서 다음 단계로는 아래 3개가 가장 효과적이다.

1. 박지군님 업무에 맞는 `Claude Cowork 프로젝트 폴더 구조`를 실제로 설계하기
2. `Global instructions`와 `Project instructions` 초안을 만들기
3. `정부과제 / 연구자료 / 유튜브 콘텐츠`용 Cowork 프롬프트 세트를 별도 노트로 만드는 것


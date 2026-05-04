---
type: documentation
aliases:
  - Claude 옵시디언 활용 가이드
  - Claude CMDS 활용법
  - 박지군 Claude 워크플로우
description: Comprehensive guide for Ji Koon Park on how to maximize Obsidian CMDS-vault with Claude Code as an AI partner. Covers daily workflows, project management, idea development, research, and automatic note creation patterns.
author:
  - "[[박지군]]"
date created: 2026-05-02
date modified: 2026-05-02
tags:
  - Claude
  - Obsidian
  - CMDS
  - 워크플로우
  - 활용가이드
  - AI파트너
status: active
CMDS: "[[📚 601 Knowledge Management]]"
index: "[[🏛 CMDS Head Quarter]]"
---

# Claude와 함께하는 옵시디언 완전 활용 가이드

> **이 문서는 박지군과 Claude(AI 동반자)가 함께 옵시디언을 최고로 잘 활용하기 위한 실전 설명서입니다.**
> Claude Code + MCP + CMDS-vault가 연결된 환경을 기준으로 작성되었습니다.

---

## 1. 지금 이 환경이 무엇인가?

### 전체 구조 한눈에 보기

```
박지군 (사람)
    ↕ 대화
Claude Code (AI 동반자)
    ↕ MCP 연결 (mcp-obsidian)
옵시디언 Local REST API
    ↕
CMDS-vault (지식 보관함)
    C:\Users\admin\Obsidian\CMDS-vault
```

### 이것이 가능하게 된 것의 의미

일반적인 AI 사용:
- Claude에게 물어보고 → 답변을 **직접 복사해서** 옵시디언에 붙여넣기

지금 박지군의 환경:
- Claude에게 말하면 → **옵시디언에 파일이 자동으로 생성됨**
- 중간에 사람이 개입할 필요 없음

---

## 2. Claude와 함께할 수 있는 것들

### 📌 카테고리별 활용 시나리오

#### 기획서 & 프로젝트

```
"[프로젝트명] 기획서를 작성해서 옵시디언에 저장해줘"
"지금까지 기획한 내용을 정리해서 900번 Divisions 폴더에 넣어줘"
"이 프로젝트의 단계별 로드맵을 노트로 만들어줘"
```

→ 저장 위치: `900 Divisions` 또는 `500 Products`

#### 연구과제 & 논문

```
"이 주제로 연구 계획서를 작성해서 저장해줘"
"논문 요약을 CMDS frontmatter 형식으로 만들어줘"
"관련 논문 3편을 하나의 Literature 노트로 합쳐줘"
```

→ 저장 위치: `200 Literature` 또는 `300 Data`

#### 아이디어 & 영감

```
"방금 떠오른 아이디어를 빠르게 저장해줘"
"이 유튜브 내용을 요약해서 Theme 노트로 만들어줘"
"오늘 읽은 기사를 100번대에 저장해줘"
```

→ 저장 위치: `100 Themes` (가장 빠른 수집)

#### 프로그램 & 도구 개발

```
"이 프로그램 기획서를 작성해서 저장해줘"
"코드 설명서와 사용법을 노트로 만들어줘"
"이 도구의 활용법을 500번대 Products에 저장해줘"
```

→ 저장 위치: `500 Products` 또는 `400 Methodologies`

#### 강의 & 콘텐츠

```
"이 주제로 강의 커리큘럼을 만들어서 저장해줘"
"블로그 글을 작성해서 700번 Creatives에 넣어줘"
"세미나 발표자료 개요를 노트로 저장해줘"
```

→ 저장 위치: `700 Creatives` 또는 `800 Outputs`

---

## 3. 노트가 자동 생성되는 방법

### Claude가 노트를 만들 때 하는 일

1. **frontmatter 자동 작성** — type, aliases, description, author, 날짜, tags 자동 생성
2. **카테고리 분류** — 내용을 보고 100~900번 중 적합한 곳 판단
3. **파일 저장** — MCP를 통해 옵시디언 볼트에 직접 업로드
4. **위키링크 연결** — 관련 기존 노트와 연결 고리 추가

### 자동 생성 노트 예시

```yaml
---
type: project
aliases:
  - AI 교육 플랫폼 기획
description: Project plan for AI education platform targeting Korean university students. Covers curriculum design, technology stack, and implementation timeline.
author:
  - "[[박지군]]"
date created: 2026-05-02
date modified: 2026-05-02
tags:
  - 프로젝트
  - AI교육
  - 기획
status: in-progress
CMDS: "[[🏢 901 Education Division]]"
index: "[[🏛 CMDS Head Quarter]]"
---
```

---

## 4. CMDS 9개 카테고리 — 무엇을 어디에 넣을까?

| 번호 | 카테고리 | Claude에게 이렇게 말하면 됨 |
|------|---------|--------------------------|
| **100** | Themes — 관심사·개념 수집 | "아이디어 빠르게 저장", "기사 요약 저장" |
| **200** | Literature — 외부 지식 내재화 | "논문 요약", "책 리뷰", "여러 노트 합치기" |
| **300** | Data — 데이터·설문·리서치 | "설문 결과 정리", "통계 자료 저장" |
| **400** | Methodologies — 방법론·코드 | "분석 방법 정리", "프롬프트 저장" |
| **500** | Products — 도구 사용법 | "앱 사용법 정리", "Claude 활용법 저장" |
| **600** | Specialties — 전문 분야 지식 | "생성 AI 동향", "지식관리 이론" |
| **700** | Creatives — 창작 콘텐츠 | "블로그 글", "SNS 게시물", "유튜브 스크립트" |
| **800** | Outputs — 최종 산출물 | "강의자료", "보고서", "컨설팅 문서" |
| **900** | Divisions — 프로젝트·부서 | "팀 운영", "프로젝트 관리" |

---

## 5. 실전 대화 패턴 — 이렇게 말하면 된다

### 가장 강력한 요청 방식

#### ① 내용 + 저장 위치 지정
```
"[내용]을 [카테고리번호]번에 CMDS 형식으로 저장해줘"

예: "오늘 읽은 AI 교육 관련 기사를 200번 Literature에 저장해줘"
예: "이 앱 기획서를 900번 Divisions에 저장해줘"
```

#### ② 내용만 말하고 분류는 Claude에게 맡기기
```
"이 내용을 적절한 카테고리에 노트로 저장해줘"
→ Claude가 내용을 보고 가장 적합한 카테고리 선택

예: "방금 생각난 온라인 강의 플랫폼 아이디어를 저장해줘"
→ Claude가 판단: 기획 단계면 100번, 구체화되면 900번
```

#### ③ 대화 내용 전체를 노트로
```
"지금까지 대화한 내용을 요약해서 옵시디언에 노트로 저장해줘"
"이번 세션에서 기획한 내용을 정리해서 저장해줘"
```

#### ④ 여러 노트 합치기
```
"AI 관련으로 저장된 노트들을 하나의 깊은 글로 합쳐줘"
"지난 달 아이디어들을 하나의 프로젝트 기획서로 통합해줘"
```

---

## 6. 함께 만들 수 있는 문서 유형

### 기획 문서
- 서비스 기획서
- 연구 계획서
- 프로젝트 로드맵
- 사업 계획서 초안
- 강의 커리큘럼

### 지식 정리 문서
- 논문·책 요약
- 세미나·강의 노트
- 개념 정리 (위키 스타일)
- 트렌드 분석 보고서
- 비교 분석표

### 창작 콘텐츠
- 블로그 글
- 뉴스레터
- SNS 게시물 시리즈
- 유튜브 스크립트
- 발표 자료 개요

### 운영 문서
- 프로젝트 진행 일지
- 회의 메모
- 아이디어 백로그
- 체크리스트
- 템플릿

---

## 7. Claude가 파일을 저장할 때 지키는 규칙

### frontmatter 필수 7개 항목

```yaml
type: note          # 노트 유형 (note/project/literature/documentation 등)
aliases: []         # 다른 이름으로 불릴 수 있는 별칭
description: ""     # 영어 1~2문장 (AI가 이 노트 언제 참고할지 힌트)
author:
  - "[[박지군]]"   # 항상 이 형식 고정
date created: 날짜
date modified: 날짜
tags: []            # 관련 태그
```

### 파일 저장 위치

현재 볼트 최상위에 파일이 저장됩니다.
폴더 구조가 만들어지면 해당 폴더 안에 저장할 수 있습니다.

---

## 8. 세션 시작 루틴 — 매번 이렇게 시작하면 좋다

```
1. 옵시디언 실행 (CMDS-vault 열기)
2. Claude Code 실행
3. 아래 중 하나로 시작:
   - "오늘 할 일이 있어, [내용] 관련 노트 만들어줘"
   - "볼트에서 [주제] 관련 노트 찾아줘"
   - "지난번에 [내용] 기획했는데 이어서 발전시켜줘"
```

---

## 9. 자주 묻는 질문

**Q. Claude가 만든 노트가 옵시디언에 바로 보이나요?**
A. 네. MCP를 통해 직접 파일로 저장되므로 옵시디언을 새로고침하면 바로 보입니다.

**Q. 옵시디언이 꺼져 있으면 안 되나요?**
A. 반드시 옵시디언이 실행 중이어야 합니다. Local REST API 서버가 옵시디언 안에서 작동하기 때문입니다.

**Q. 저장된 파일을 Claude가 다시 읽을 수 있나요?**
A. 네. 볼트의 모든 파일을 읽고 내용을 파악해서 답변하거나 수정할 수 있습니다.

**Q. 기존 노트를 Claude가 수정할 수 있나요?**
A. 네. "CMDS.md의 내용을 수정해줘" 같이 요청하면 해당 파일을 읽고 수정해서 다시 저장합니다.

---

## 10. 참고 문서

- [[Claude-Obsidian-연동-가이드]] — MCP 연동 설정 상세
- [[Claude-Obsidian-자동저장-워크플로우]] — 자동저장 실전 워크플로우
- [[CMDS-시스템-활용법]] — CMDS 슬래시 명령어 전체 목록
- [[CMDS.md]] — CMDS 시스템 철학과 구조
- [[CMDS-Guide.md]] — 노트 작성 규칙과 템플릿

---

*작성일: 2026-05-02 | Claude Code + CMDS-vault 세션 | 박지군 × Claude 협업*

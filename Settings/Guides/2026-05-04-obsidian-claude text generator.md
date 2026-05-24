
텍스트 제너레이트 플러그인을 이용해서 옵시디언 연동 문서 작성을 하는 방법을 상세히 정리해줘

 # Obsidian Text Generator 플러그인으로 Claude 연동 문서 작성 가이드

## 1. 개요

Text Generator 플러그인은 Obsidian 내에서 AI(Claude, GPT 등)를 직접 호출하여 텍스트를 생성·편집·확장할 수 있게 해주는 커뮤니티 플러그인입니다.

---

## 2. 설치 및 초기 설정

### 2.1 플러그인 설치

1. Obsidian 열기 → **Settings(설정)** → **Community plugins(커뮤니티 플러그인)**
2. **Browse(찾아보기)** 클릭 → 검색창에 `Text Generator` 입력
3. **Text Generator** (by nhaouari) 선택 → **Install(설치)** → **Enable(활성화)**

### 2.2 API 키 발급

| 제공자 | 발급 경로 | 비고 |
|--------|-----------|------|
| **Anthropic (Claude)** | [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key | Claude 3.5 Sonnet, Claude 3 Opus 등 사용 가능 |
| OpenAI (GPT) | platform.openai.com → API Keys | 대안으로 사용 가능 |

### 2.3 플러그인 설정 (Claude 연동)

```
Settings → Text Generator → Provider 설정
```

1. **Provider(제공자)**: `Anthropic` 선택
2. **API Key**: 발급받은 Anthropic API 키 붙여넣기
3. **Model**: 원하는 모델 선택
   - `claude-sonnet-4-20250514` (추천 - 빠르고 우수)
   - `claude-3-opus-20240229` (최고 품질)
   - `claude-3-haiku-20240307` (빠르고 저렴)
4. **Max Tokens**: 기본 `4096` (필요시 조절)
5. **Temperature**: `0.7` (창의적 글쓰기) / `0.3` (정확한 정보)

---

## 3. 기본 사용법

### 3.1 핵심 단축키

| 단축키 | 기능 | 설명 |
|--------|------|------|
| `Ctrl/Cmd + J` | **Generate Text** | 커서 위치 또는 선택 텍스트 기반으로 텍스트 생성 |
| `Ctrl/Cmd + Shift + J` | **Generate Text (with template)** | 템플릿을 지정하여 생성 |
| `Ctrl/Cmd + Alt + J` | **Generate Text (modal)** | 모달 창에서 프롬프트 직접 입력 |

### 3.2 기본 워크플로우

#### 방법 1: 커서 뒤에 이어서 생성

```markdown
# 인공지능의 역사

인공지능은 1956년 다트머스 회의에서 시작되었다.
← 여기에 커서를 놓고 Ctrl+J 누르면 이어서 작성됨
```

#### 방법 2: 선택 텍스트 기반 생성

```markdown
<!-- 아래 텍스트를 드래그로 선택한 후 Ctrl+J -->
다음 주제에 대해 자세히 설명해줘: 양자 컴퓨팅의 원리
```

#### 방법 3: 프롬프트 모달 사용

`Ctrl+Alt+J` → 모달 창에 직접 프롬프트 입력 → 결과가 현재 문서에 삽입

---

## 4. 템플릿 시스템 (핵심 기능)

### 4.1 템플릿 폴더 설정

```
Settings → Text Generator → Template Folder → "textgenerator/templates" 지정
```

### 4.2 템플릿 작성법

템플릿은 **Handlebars 문법**과 **YAML frontmatter**를 사용합니다.

#### 기본 템플릿 구조

```markdown
---
promptId: my-template-01
name: 블로그 글 작성
description: 주제를 입력하면 블로그 글을 생성합니다
author: myname
tags: writing, blog
version: 1.0.0
commands:
  - generate
---

당신은 전문 블로그 작가입니다.

다음 내용을 바탕으로 블로그 글을 작성해주세요:

{{selection}}

## 작성 규칙:
- 한국어로 작성
- 마크다운 형식 사용
- 소제목 포함
- 2000자 내외
```

### 4.3 실용 템플릿 예시 모음

#### 📝 노트 요약 템플릿

```markdown
---
promptId: summarize-note
name: 노트 요약
description: 현재 노트 내용을 요약합니다
commands:
  - generate
---

다음 노트 내용을 핵심 포인트 중심으로 요약해주세요:

{{content}}

## 요약 형식:
- **핵심 요약** (3줄 이내)
- **주요 포인트** (불릿 리스트)
- **키워드** (태그 형태)
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
```

**회의록 정리 템플릿:**

```markdown
---
promptId: meeting-to-action
name: 회의록 → 액션아이템
commands:
  - generate
---

다음 회의 내용에서 액션아이템을 추출해주세요:

{{selection}}

## 출력 형식:
### 📋 회의 요약
(3줄 요약)

### ✅ 액션아이템
- [ ] [담당자] 할 일 내용 (마감: MM/DD)

### 📌 결정 사항
- 결정 내용

### ❓ 미결 사항
- 추후 논의 필요 사항
```

### 6.3 학습 노트 워크플로우

```
1. 강의/책 내용을 노트에 기록
   ↓
2. [개념 설명 템플릿] - 어려운 개념 쉽게 풀어쓰기
   ↓
3. [퀴즈 생성 템플릿] - 복습용 문제 자동 생성
   ↓
4. [연결 노트 템플릿] - 관련 개념과 링크 제안
```

---

## 7. 커맨드 팔레트 활용

`Ctrl/Cmd + P` 로 커맨드 팔레트를 열고 `Text Generator`를 검색하면 사용 가능한 모든 명령어가 표시됩니다:

| 명령어 | 설명 |
|--------|------|
| `Text Generator: Generate Text` | 기본 텍스트 생성 |
| `Text Generator: Generate Text (with Modal)` | 모달로 프롬프트 입력 |
| `Text Generator: Generate Text (with Template)` | 템플릿 선택하여 생성 |
| `Text Generator: Insert Template` | 템플릿 내용만 삽입 |
| `Text Generator: Create Template` | 새 템플릿 생성 |
| `Text Generator: Set Max Tokens` | 최대 토큰 수 변경 |
| `Text Generator: Set Model` | 모델 변경 |
| `Text Generator: Package Manager` | 템플릿 패키지 관리 |

---

## 8. 패키지 매니저 (커뮤니티 템플릿)

### 8.1 커뮤니티 템플릿 설치

```
커맨드 팔레트 → "Text Generator: Package Manager" → Browse
```

다른 사용자들이 만든 템플릿 패키지를 검색하고 설치할 수 있습니다:

- **Default Templates**: 기본 제공 템플릿 세트
- **Academic Writing**: 학술 글쓰기 템플릿
- **Creative Writing**: 창작 글쓰기 템플릿
- 기타 커뮤니티 제작 패키지

### 8.2 나만의 패키지 만들기

템플릿 폴더에 여러 템플릿을 만들고, `package.json` 파일을 추가하여 패키지로 관리할 수 있습니다.

---

## 9. 팁 & 트러블슈팅

### 9.1 효과적인 사용 팁

```markdown
✅ DO:
- 프롬프트에 구체적인 출력 형식을 명시하기
- 마크다운 형식으로 출력하도록 지시하기
- [[위키링크]] 사용을 프롬프트에 포함하기
- Temperature를 용도에 맞게 조절하기
- 자주 쓰는 프롬프트는 반드시 템플릿으로 저장하기

❌ DON'T:
- 너무 긴 노트 전체를 컨텍스트로 보내기 (토큰 낭비)
- AI 생성 결과를 검증 없이 그대로 사용하기
- API 키를 공유 Vault에 그대로 두기
```

### 9.2 비용 관리

```
Settings → Text Generator → Max Tokens
```

| 모델 | 입력 비용 (1M 토큰) | 출력 비용 (1M 토큰) | 권장 용도 |
|------|---------------------|---------------------|-----------|
| Claude 3 Haiku | $0.25 | $1.25 | 간단한 요약, 분류 |
| Claude 3.5 Sonnet | $3.00 | $15.00 | 일반 문서 작성 (추천) |
| Claude 3 Opus | $15.00 | $75.00 | 복잡한 분석, 고품질 글 |

### 9.3 자주 발생하는 문제

| 문제 | 해결 방법 |
|------|-----------|
| API 연결 실패 | API 키 확인, Provider 설정 재확인 |
| 응답이 잘림 | Max Tokens 값 증가 (4096 → 8192) |
| 한국어가 깨짐 | 시스템 프롬프트에 "한국어로 답변" 명시 |
| 템플릿이 안 보임 | 템플릿 폴더 경로 확인, 파일 확장자 `.md` 확인 |
| 응답이 너무 느림 | 더 가벼운 모델(Haiku)로 변경 |
| 컨텍스트 누락 | Context 설정에서 필요한 항목 활성화 |

---

## 10. 추천 초기 설정 요약

```yaml
# 권장 초기 설정
Provider: Anthropic
Model: claude-sonnet-4-20250514
Max Tokens: 4096
Temperature: 0.5
System Prompt: |
  당신은 옵시디언 기반 지식 관리를 돕는 AI 어시스턴트입니다.
  - 항상 한국어로 답변합니다
  - 마크다운 형식을 사용합
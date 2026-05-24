---
type: note
aliases:
  - kepano obsidian-skills
  - Obsidian Agent Skills 가이드
  - obsidian-skills 최대 활용
description: "Comprehensive analysis and maximum utilization guide for kepano/obsidian-skills GitHub repository. Covers all 5 AI agent skills (obsidian-markdown, obsidian-cli, obsidian-bases, json-canvas, defuddle) with installation, usage patterns, and CMDS workflow integration. Reference when setting up Claude Code skills for Obsidian vault or maximizing AI-Obsidian integration."
author:
  - "[[박지군]]"
date created: 2026-05-04
date modified: 2026-05-04
tags:
  - obsidian
  - claude-code
  - ai-agent
  - skills
  - kepano
  - pkm
  - tool-guide
status: completed
---

# kepano/obsidian-skills 완전 분석 & 최대 활용 가이드

> **저장소**: https://github.com/kepano/obsidian-skills
> **제작자**: Steph Ango (kepano) — Obsidian CEO
> **라이선스**: MIT
> **인기도**: ⭐ 28,500+ stars, 1,900+ forks (2026-05 기준)
> **버전**: 1.0.1

---

## 1. 이 저장소가 무엇인가?

`kepano/obsidian-skills`는 **AI 에이전트(Claude Code, Codex CLI 등)가 Obsidian 볼트를 더 잘 다룰 수 있도록 가르치는 스킬(Skill) 모음집**이다.

Obsidian의 CEO인 Steph Ango(kepano)가 직접 만든 공식 스킬 패키지로, **Agent Skills 규격**을 따르기 때문에 Claude Code뿐만 아니라 다양한 AI 코딩 에이전트와 호환된다.

### 핵심 개념: Agent Skills란?

```
Agent Skill = AI 에이전트에게 "이 도구는 이렇게 쓰는 거야"를 알려주는 SKILL.md 파일
```

- AI는 기본적으로 Obsidian 고유 문법(wikilink, callout, base 파일 등)을 완벽히 알지 못함
- 스킬 파일을 로드하면 AI가 해당 도구의 규칙과 패턴을 명확히 인지하고 올바르게 작동
- `.claude/skills/` 폴더에 설치하면 Claude Code가 자동으로 참조

---

## 2. 저장소 구조

```
kepano/obsidian-skills/
├── .claude-plugin/
│   ├── marketplace.json      ← 마켓플레이스 등록 정보
│   └── plugin.json           ← 패키지 메타데이터
├── skills/
│   ├── obsidian-markdown/
│   │   ├── SKILL.md          ← 핵심 스킬 정의
│   │   └── references/
│   │       ├── CALLOUTS.md   ← 콜아웃 타입 전체 목록
│   │       ├── EMBEDS.md     ← 임베드 문법
│   │       └── PROPERTIES.md ← 프로퍼티/frontmatter 규칙
│   ├── obsidian-cli/
│   │   └── SKILL.md          ← CLI 명령어 스킬 정의
│   ├── obsidian-bases/
│   │   ├── SKILL.md          ← Bases 스킬 정의
│   │   └── references/
│   │       └── FUNCTIONS_REFERENCE.md ← 수식 함수 완전 참조
│   ├── json-canvas/
│   │   ├── SKILL.md          ← Canvas 스킬 정의
│   │   └── references/
│   │       └── EXAMPLES.md   ← Canvas 예제 파일
│   └── defuddle/
│       └── SKILL.md          ← 웹 클리핑 스킬 정의
├── LICENSE
└── README.md
```

---

## 3. 포함된 5가지 스킬 상세 분석

### 3-1. `obsidian-markdown` — Obsidian 전용 마크다운

**목적**: Claude Code가 Obsidian 고유 문법을 정확히 사용하여 노트를 생성/편집하게 한다.

**커버하는 내용**:

- **위키링크 (Wikilinks)**
	- 기본: `[[노트 이름]]`
	- 별칭 표시: `[[노트 이름|표시할 텍스트]]`
	- 헤딩 링크: `[[노트 이름#섹션]]`
	- 블록 링크: `[[노트 이름^block-id]]`
	- 임베드: `![[노트 이름]]`, `![[이미지.png|300]]`

- **콜아웃 (Callouts)**

	```markdown
	> [!note] 제목
	> 내용

	> [!warning]- 접힌 상태로 시작
	> 이 내용은 숨겨져 있음

	> [!tip]+ 펼쳐진 상태로 시작
	> 이 내용은 보임
	```

	지원 타입: `note`, `info`, `tip`, `warning`, `danger`, `success`, `question`, `abstract`, `todo`, `bug`, `example`, `quote` 등 13종 + 커스텀 CSS 확장 가능

- **Properties (YAML Frontmatter)**
	- 텍스트, 숫자, 체크박스, 날짜, 날짜+시간, 리스트, 링크 타입 지원
	- `tags`, `aliases`, `cssclasses`는 Obsidian 기본 내장 필드

- **기타 특수 문법**
	- 주석 (렌더링 안 됨): `%% 숨겨진 메모 %%`
	- 텍스트 하이라이트: `==강조됨==`
	- LaTeX 수식: `$E=mc^2$`, `$$\sum_{i=1}^{n} i$$`
	- Mermaid 다이어그램, 각주 등

**왜 이 스킬이 중요한가?**
- AI가 `[[노트]]` 대신 `[노트](노트.md)` 식 마크다운 링크를 쓰는 실수를 방지
- 콜아웃 문법을 정확히 알아야 올바른 노트 생성 가능
- CMDS 볼트의 frontmatter 규칙과 시너지 극대화

---

### 3-2. `obsidian-cli` — 터미널에서 Obsidian 직접 제어

**목적**: Claude Code가 실행 중인 Obsidian 앱을 터미널 명령어로 직접 조작할 수 있게 한다.

**요구사항**: Obsidian 1.12+ (Early Access), Settings → General → CLI 활성화

**핵심 명령어 카테고리**:

#### 읽기 & 검색

```bash
# 노트 내용 읽기
obsidian read file="노트 이름"

# 볼트 전체 검색 (Obsidian 인덱스 기반, 빠름)
obsidian search query="검색어" limit=10 format=json

# 태그 통계 (가장 많이 쓴 태그 확인)
obsidian tags all counts sort=count

# 프로퍼티 통계
obsidian properties all counts sort=count

# 백링크 조회 (누가 이 노트를 참조하나?)
obsidian backlinks file="노트 이름" counts

# 아웃라인 보기
obsidian outline file="노트 이름" format=tree
```

#### 생성 & 편집

```bash
# 템플릿으로 노트 생성 (가장 강력한 기능)
obsidian create name="새 노트" template="Template_00. Basic Note" silent

# 노트 끝에 내용 추가
obsidian append file="노트 이름" content="추가할 내용"

# 노트 앞에 내용 삽입 (frontmatter 뒤)
obsidian prepend file="노트 이름" content="삽입할 내용"

# 데일리 노트에 태스크 추가
obsidian daily:append content="- [ ] 할일" silent

# 프로퍼티 설정
obsidian property:set name="status" value="completed" file="노트 이름"
obsidian property:remove name="불필요한필드" file="노트 이름"
```

#### 볼트 분석

```bash
# 볼트 전체 파일 수
obsidian vault info=files

# 고아 노트 (아무것도 링크하지 않는 노트)
obsidian orphans total

# 미해결 링크 (없는 노트로 향하는 링크)
obsidian unresolved verbose

# 아웃링크 없는 노트 (지식 그물망의 끝점)
obsidian deadends total
```

#### 개발자 도구

```bash
# JavaScript 실행 (app.vault API 직접 접근 가능!)
obsidian eval code="app.vault.getFiles().length"

# 플러그인 리로드
obsidian plugin:reload id=my-plugin-id

# 개발 중 에러 확인
obsidian dev:errors
obsidian dev:console level=error

# 스크린샷
obsidian dev:screenshot path=screenshot.png

# 모바일 에뮬레이션 테스트
obsidian dev:mobile
```

**멀티 볼트**: `obsidian vault=볼트이름 read file="노트"` 형식으로 특정 볼트 지정 가능

---

### 3-3. `obsidian-bases` — 데이터베이스형 뷰 (.base 파일)

**목적**: Claude Code가 `.base` 파일(Obsidian의 내장 데이터베이스 뷰 기능)을 정확하게 생성/편집하게 한다.

**Obsidian Bases란?** 노트들의 프로퍼티를 스프레드시트처럼 테이블·카드·리스트·맵으로 보여주는 기능 (Obsidian 1.8+ 기본 포함).

**기본 스키마 구조**:

```yaml
# 파일: 나의-태스크-트래커.base
filters:
  and:
    - type: "note"
    - status: { ne: "archived" }
    - tags: { contains: "project" }

formulas:
  days_remaining: "(date(due) - today()).days"
  is_overdue: "date(due) < today()"

views:
  - type: table
    name: "전체 보기"
    sort:
      - property: due
        direction: asc
    columns:
      - file
      - status
      - due
      - days_remaining

  - type: cards
    name: "카드 보기"
    cardSize: medium
```

**필터 문법**:

```yaml
# AND 조건
filters:
  and:
    - status: { eq: "inProgress" }
    - due: { lt: "2026-12-31" }

# OR 조건
filters:
  or:
    - tags: { contains: "urgent" }
    - priority: { eq: "high" }

# 복합 조건 (AND 안에 OR)
filters:
  and:
    - type: "note"
    - or:
        - status: { eq: "inProgress" }
        - status: { eq: "unread" }
```

**주요 수식 함수** (FUNCTIONS_REFERENCE.md 기반):

| 함수 | 설명 | 예시 |
|------|------|------|
| `today()` | 오늘 날짜 | `"today()"` |
| `now()` | 현재 날짜+시간 | `"now()"` |
| `date("2026-01-01")` | 문자열→날짜 변환 | |
| `(date1 - date2).days` | 날짜 차이(일) | `"(date(due) - today()).days"` |
| `if(조건, 참, 거짓)` | 조건부 | `"if(status == 'completed', '✅', '⏳')"` |
| `file.name` | 노트 파일명 | |
| `file.ctime` | 생성 시간 | `"(now() - file.ctime).days"` |
| `file.inFolder("경로")` | 폴더 필터 | |
| `file.hasTag("태그")` | 태그 확인 | |

> **⚠️ 중요**: Duration 타입은 `.round()` 직접 사용 불가. `.days.round(0)` 처럼 숫자 필드에 먼저 접근한 뒤 적용해야 함.

**뷰 타입**: `table` | `cards` | `list` | `map`

---

### 3-4. `json-canvas` — 시각적 캔버스 (.canvas 파일)

**목적**: Claude Code가 Obsidian Canvas 파일을 코드로 생성하고 편집할 수 있게 한다.

**Canvas란?** 노트들을 무한 화이트보드 위에 배치하고 연결하는 Obsidian의 시각적 사고 도구.

**JSON 구조**:

```json
{
  "nodes": [
    {
      "id": "a1b2c3d4e5f6a1b2",
      "type": "text",
      "text": "# 아이디어\n여기에 내용",
      "x": 0,
      "y": 0,
      "width": 250,
      "height": 150
    },
    {
      "id": "b2c3d4e5f6a1b2c3",
      "type": "file",
      "file": "30. Permanent Notes/주요-개념.md",
      "x": 350,
      "y": 0,
      "width": 250,
      "height": 200
    },
    {
      "id": "c3d4e5f6a1b2c3d4",
      "type": "link",
      "url": "https://obsidian.md",
      "x": 0,
      "y": 250,
      "width": 250,
      "height": 100
    },
    {
      "id": "d4e5f6a1b2c3d4e5",
      "type": "group",
      "label": "관련 노트 그룹",
      "x": -50,
      "y": -50,
      "width": 700,
      "height": 450
    }
  ],
  "edges": [
    {
      "id": "e5f6a1b2c3d4e5f6",
      "fromNode": "a1b2c3d4e5f6a1b2",
      "toNode": "b2c3d4e5f6a1b2c3",
      "label": "연결"
    }
  ]
}
```

**노드 타입 4가지**:

| 타입 | 용도 | 필수 필드 |
|------|------|----------|
| `text` | 인라인 마크다운 텍스트 | `text` |
| `file` | 볼트 내 노트/파일 참조 | `file` (볼트 기준 상대경로) |
| `link` | 외부 URL | `url` |
| `group` | 다른 노드들을 담는 컨테이너 | `label` (선택) |

**핵심 규칙**:
- ID는 16자리 16진수 (예: `a1b2c3d4e5f6a1b2`)
- 좌표는 음수 가능 (캔버스는 무한 확장)
- 노드 간격: 50~100px 권장
- Edge의 `fromNode`, `toNode`는 반드시 존재하는 노드 ID여야 함

---

### 3-5. `defuddle` — 웹 페이지 클린 추출 CLI

**목적**: 웹 페이지에서 광고·네비게이션·사이드바를 제거하고 핵심 내용만 마크다운으로 추출하여 AI 토큰 소비를 대폭 줄인다.

**기본 사용법**:

```bash
# 마크다운으로 추출 (권장)
defuddle parse https://example.com/article --md

# JSON으로 추출 (HTML + 마크다운 모두 포함)
defuddle parse https://example.com/article --json

# 특정 메타데이터만 추출
defuddle parse https://example.com/article -p title
defuddle parse https://example.com/article -p description
defuddle parse https://example.com/article -p domain
```

**언제 사용하나**:

| 상황 | 도구 | 이유 |
|------|------|------|
| 일반 웹 페이지, 블로그, 문서 사이트 | `defuddle` ✅ | 클린 추출, 토큰 절약 |
| `.md` 로 끝나는 URL | `WebFetch` | 이미 마크다운 형식 |
| 바이너리/이미지/API | 다른 도구 | defuddle 미지원 |

**Claude Code에서의 활용**: 웹 리서치 시 WebFetch 대신 defuddle을 기본으로 사용하면 컨텍스트 창을 훨씬 효율적으로 사용할 수 있다.

---

## 4. 설치 방법

### 방법 1: Claude Code 마켓플레이스 (권장)

```bash
# Claude Code 내에서
/plugin marketplace add obsidian
```

### 방법 2: npx 자동 설치

```bash
# Claude Code용
npx skills add https://github.com/kepano/obsidian-skills

# Codex CLI용
npx skills add --codex https://github.com/kepano/obsidian-skills

# OpenCode용
npx skills add --opencode https://github.com/kepano/obsidian-skills
```

### 방법 3: 수동 설치 (Claude Code)

```bash
# 저장소 클론
git clone https://github.com/kepano/obsidian-skills.git

# 스킬 파일을 Claude Code 스킬 폴더로 복사
# (볼트 루트 기준)
cp -r kepano-obsidian-skills/skills/* .claude/skills/

# 또는 특정 스킬만 선택적으로 복사
cp -r kepano-obsidian-skills/skills/obsidian-markdown .claude/skills/
cp -r kepano-obsidian-skills/skills/obsidian-cli .claude/skills/
```

설치 후 `.claude/skills/` 구조:

```
.claude/skills/
├── obsidian-markdown/
│   ├── SKILL.md
│   └── references/
│       ├── CALLOUTS.md
│       ├── EMBEDS.md
│       └── PROPERTIES.md
├── obsidian-cli/
│   └── SKILL.md
├── obsidian-bases/
│   ├── SKILL.md
│   └── references/
│       └── FUNCTIONS_REFERENCE.md
├── json-canvas/
│   ├── SKILL.md
│   └── references/
│       └── EXAMPLES.md
└── defuddle/
    └── SKILL.md
```

---

## 5. 최대 활용 전략 (CMDS 워크플로우 통합)

### 5-1. 스킬 조합 매트릭스

| 작업 목표 | 사용 스킬 조합 | 시너지 포인트 |
|-----------|--------------|-------------|
| 웹 리서치 → 노트화 | defuddle + obsidian-markdown | 웹 내용을 바로 Obsidian 문법 노트로 |
| 볼트 분석 대시보드 | obsidian-cli + obsidian-bases | CLI로 데이터 수집 → Bases로 시각화 |
| 프로젝트 맵 작성 | obsidian-cli + json-canvas | 관련 노트 검색 → Canvas로 연결 시각화 |
| 지식 합성 노트 | obsidian-markdown + obsidian-cli | 여러 노트 읽기 → 고품질 마크다운 생성 |
| 전체 볼트 워크플로우 | 5개 스킬 전체 | 완전 자동화 PKM 사이클 |

### 5-2. CMDS Process별 활용

#### 🔗 Connect (연결) — 새 아이디어 포착

```
defuddle parse <웹 URL> --md
  → obsidian-markdown으로 노트 생성
  → obsidian-cli create name="새 주제" template="Template_00. Basic Note"
  → 100 Themes (📚 102 Topics) 카테고리에 저장
```

#### 🔀 Merge (합성) — 지식 통합

```
obsidian-cli search query="관련 키워드" format=json
  → 관련 노트 목록 수집
obsidian-cli read file="노트1" + read file="노트2"
  → obsidian-markdown으로 합성 Literature 노트 작성
  → 200 Literature (📚 220 Personal Insights) 카테고리에 저장
```

#### 🛠 Develop (개발) — 도구 & 코드

```
obsidian-cli eval code="..."
  → 플러그인 개발 시 즉시 테스트
obsidian-bases로 프로젝트 진행 트래커 .base 파일 생성
json-canvas로 시스템 아키텍처 다이어그램 자동 생성
```

#### 📤 Share (공유) — 외부 산출물

```
obsidian-cli outline file="합성 노트" format=tree
  → 구조 확인 후 발표자료 변환
obsidian-cli search query="프로젝트명"
  → 관련 노트 수집 → 보고서/슬라이드 자동 생성
```

### 5-3. 고급 활용 패턴

#### 패턴 A: 자동 볼트 건강 점검

```bash
# 고아 노트 확인
obsidian orphans total

# 미해결 링크 (빈 노트 생성 원인)
obsidian unresolved verbose

# frontmatter 없는 노트 찾기 (obsidian-cli eval 활용)
obsidian eval code="app.vault.getMarkdownFiles().filter(f => !app.metadataCache.getFileCache(f)?.frontmatter).map(f => f.path)"
```

#### 패턴 B: 동적 Bases 대시보드

읽기 리스트 트래커:

```yaml
# 파일: 독서-트래커.base
filters:
  and:
    - type: { eq: "books" }
    - status: { ne: "archived" }
formulas:
  독서율: "if(status == 'completed', '✅ 완독', if(status == 'reading', '📖 읽는 중', '⏳ 대기'))"
  경과일: "(now() - file.ctime).days.round(0)"
views:
  - type: cards
    name: "현재 독서"
    filters:
      status: { eq: "reading" }
  - type: table
    name: "전체 목록"
    sort:
      - property: file.ctime
        direction: desc
```

#### 패턴 C: 프로젝트 Canvas 자동 생성

AI가 관련 노트를 검색하고 자동으로 Canvas 연결 맵을 생성:

```
1. obsidian-cli search query="프로젝트명" → 관련 노트 경로 수집
2. json-canvas 스킬로 각 노트를 file 노드로 변환
3. 논리적 연결 관계에 따라 edges 자동 추가
4. .canvas 파일로 저장 → Obsidian에서 즉시 시각화
```

### 5-4. 토큰 효율 최적화

| 상황 | 기존 방식 | 스킬 사용 시 | 절약 |
|------|---------|------------|------|
| 웹 페이지 읽기 | WebFetch (전체 HTML) | defuddle (핵심만) | ~70% 토큰 절약 |
| 노트 검색 | Grep 전체 스캔 | obsidian-cli search | Obsidian 인덱스 활용, 정확도 ↑ |
| 볼트 구조 파악 | 수동 Glob | obsidian-cli outline | 계층 구조 즉시 파악 |

---

## 6. 이 볼트(CMDS)에서의 통합 적용

### 현재 이미 사용 중인 스킬 (확인됨)

볼트의 `.obsidian/plugins/obsidian-gemini/prompts/bundled-skills/` 에 다음이 설치됨:
- `obsidian-bases` ✅
- `obsidian-cli` ✅ (Gemini용)

### 추가 설치 권장 스킬 (Claude Code용)

`.claude/skills/` 폴더에 추가 설치 권장:
- `obsidian-markdown` — CMDS frontmatter 규칙과 시너지, 노트 품질 향상
- `defuddle` — 웹 리서치 시 컨텍스트 절약 (현재 이미 `.claude/skills/defuddle`로 활성화됨)
- `json-canvas` — 시각적 지식 맵 자동 생성

### CMDS 볼트 규칙과의 조화

| kepano 스킬 제공 | CMDS 볼트 추가 규칙 |
|----------------|-------------------|
| Wikilink 기본 문법 | 이모지 프리픽스 포함 정확한 링크 (예: `[[📚 501 Obsidian]]`) |
| Frontmatter 기본 타입 | 7개 필수 필드 + `description` 영어 작성 |
| 들여쓰기 일반 규칙 | YAML: 2스페이스, 본문: 탭 |
| Callout 기본 타입 | 커스텀 CSS callout 스타일 적용 |

---

## 7. 주의사항 & 트러블슈팅

### 자주 발생하는 오류

**Bases 수식 오류**:

```yaml
# ❌ 잘못된 예 (Duration에 직접 round 사용)
"(date(due) - today()).round(0)"

# ✅ 올바른 예 (숫자 필드 먼저 접근)
"(date(due) - today()).days.round(0)"
```

**Canvas ID 중복**:

```
# ID는 반드시 고유해야 함
# 16자리 16진수 생성 방법
python -c "import secrets; print(secrets.token_hex(8))"
```

**obsidian-cli 미작동 시 체크리스트**:
1. Obsidian 앱이 실행 중인가?
2. Settings → General → CLI 활성화되어 있는가?
3. Obsidian 버전이 1.12 이상인가?

### defuddle 설치 확인

```bash
# 설치 여부 확인
defuddle --version

# 설치되지 않은 경우
npm install -g defuddle
```

---

## 8. 참고 링크

- **공식 저장소**: https://github.com/kepano/obsidian-skills
- **Agent Skills 규격**: https://agentskills.dev
- **Obsidian CLI 공식 가이드**: https://help.obsidian.md/cli
- **JSON Canvas 스펙**: https://jsoncanvas.org/spec/1.0/
- **Steph Ango 블로그**: https://stephango.com
- **CMDS 볼트 obsidian-cli 가이드**: [[Obsidian CLI]]
- **CMDS Obsidian 카테고리**: [[📚 501 Obsidian]]

---

*이 문서는 2026-05-04 기준 kepano/obsidian-skills v1.0.1을 분석하여 작성되었음. Claude Code (Windows) — general 폴더.*

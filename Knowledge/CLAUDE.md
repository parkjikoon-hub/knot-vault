# LLM Wiki — 개인 개발 지식 베이스

## 개요
이 위키는 바이브 코딩을 통해 프로그램을 개발하면서 자연스럽게 쌓이는 개발 지식을 체계적으로 관리하는 개인 지식 베이스입니다.
사용자는 비개발자이며, 실제 프로젝트를 진행하면서 하나씩 배워가는 방식으로 지식을 축적합니다.

## 디렉토리 구조

```
KNOT-vault/
├── Inbox/
│   └── raw/                # 원본 자료 투입구 (사람이 넣음, /wiki-ingest 대상)
│                           # 처리 완료 후 삭제 또는 References/로 이동
└── Knowledge/              # LLM이 생성·관리하는 위키 페이지 (이 폴더)
    ├── CLAUDE.md           # 이 파일 (스키마)
    ├── index.md            # 전체 목차
    ├── log.md              # 변경 이력
    ├── dev-knowledge/      # 개발 지식 위키 페이지들
    │   ├── concepts/       # 개념 페이지 (Git, API, 환경변수 등)
    │   ├── tools/          # 도구 페이지 (VS Code, GitHub, Vercel 등)
    │   ├── processes/      # 프로세스 페이지 (배포 흐름, 개발 순서 등)
    │   └── troubleshooting/ # 문제 해결 기록
    ├── dialogue/           # 철학·신학 대화 기록
    └── science/            # 과학 지식 (biology, cosmology, physics 등)
```

## 위키 페이지 규칙

### 페이지 형식
모든 위키 페이지는 다음 형식을 따릅니다:

```markdown
---
title: 페이지 제목
category: concepts | tools | processes | troubleshooting
tags: [관련 태그들]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [원본 자료가 있으면 경로]
---

# 제목

## 한 줄 요약
비개발자도 바로 이해할 수 있는 한 줄 설명 (비유 활용)

## 상세 설명
더 자세한 내용

## 관련 페이지
- [[다른 페이지 링크]]

## 실제 사용 예시
프로젝트에서 실제로 어떻게 쓰였는지
```

### 작성 원칙
1. **비개발자 눈높이**: 모든 설명은 비유와 쉬운 말로 작성
2. **실제 경험 기반**: 추상적 이론보다 프로젝트에서 겪은 실제 사례 중심
3. **교차 참조**: 관련 페이지끼리 `[[링크]]` 형식으로 연결
4. **점진적 심화**: 처음엔 간단하게, 나중에 같은 개념을 다시 만나면 내용 보강

### 카테고리별 가이드

**concepts/ (개념)**
- 개발 용어, 프로그래밍 개념 설명
- 예: git.md, api.md, environment-variables.md, database.md

**tools/ (도구)**
- 사용하는 도구의 역할과 기본 사용법
- 예: vscode.md, github.md, vercel.md, neon-db.md, claude-code.md

**processes/ (프로세스)**
- 개발 작업의 전체 흐름을 순서대로 설명
- 예: deployment-flow.md, git-workflow.md, project-setup.md

**troubleshooting/ (트러블슈팅)**
- 증상 → 원인 → 해결 형식으로 기록
- 예: vercel-deploy-error.md, git-merge-conflict.md

## 사용 가능한 명령어
- `/wiki-ingest` — `Inbox/raw/` 폴더의 자료 또는 웹 링크를 위키에 반영 → 처리 후 raw 파일 삭제
- `/wiki-update` — 세션에서 배운 내용을 위키에 기록 (가장 자주 사용)
- `/wiki-query` — 위키에 쌓인 지식 기반으로 질문/검색
- `/wiki-lint` — 위키 상태 점검 및 정리 (모순, 고아 페이지, 누락 체크)

## 분야 추가 방법
새로운 분야를 추가하려면:
1. `Knowledge/새분야명/` 폴더 생성 (필요시 하위 카테고리 포함)
2. `index.md`에 새 분야 섹션 추가
3. 원본 자료는 `Inbox/raw/`에 넣고 `/wiki-ingest` 실행

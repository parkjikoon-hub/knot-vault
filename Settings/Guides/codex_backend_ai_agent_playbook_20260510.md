# Codex 백엔드 AI 에이전트 문서 안내

작성일: 2026-05-10

이 문서는 기존 단일 문서를 `주제별 실무 문서`로 재구성한 안내문입니다.

## 문서 구성

1. `01_codex_backend_ai_agent_benefits_20260510.md`
`Codex`를 백엔드 AI 에이전트로 활용할 때의 장점, 효과, 한계, 적용 원칙

2. `02_existing_project_codex_integration_guide_20260510.md`
기존 프로그램에 `Codex`를 붙이는 방법, 점검 순서, Claude Code/Codex/Gemini 지시문

3. `03_new_project_ai_agent_build_guide_20260510.md`
신규 프로젝트를 처음부터 AI 에이전트 계층과 함께 설계·개발하는 방법

4. `04_studycapture_codex_application_plan_20260510.md`
현재 개발 중인 `StudyCapture`에 실제로 적용하기 위한 전용 실행 문서

## 이번 개정에서 반영한 핵심 보정 사항

1. `Skill`은 중요하지만 `앱 백엔드 자체`와 동일하지 않음
2. `Codex`는 모델 자체라기보다 `AI 작업 실행 엔진`으로 이해하는 것이 더 정확함
3. 코드 분석만으로 설계하지 말고, 실제 CLI 도움말·실행 결과·환경 제약을 반드시 실측 검증해야 함
4. 기존 프로젝트에는 실시간 처리 경로보다 `저장 직전 추천`, `후처리`, `분류`, `분석` 단계부터 붙이는 것이 안전함

## 확인에 사용한 근거

- `Codex CLI`는 로컬에서 실행되는 코딩 에이전트임. [출처: README.md, openai/codex GitHub, 2026 확인]
- `codex exec`는 비대화형 실행 방식임. [출처: codex-rs/README.md, openai/codex GitHub, 2026 확인]
- `codex app-server`는 외부 인터페이스를 구동하기 위한 JSON-RPC 기반 인터페이스임. [출처: codex-rs/app-server/README.md, openai/codex GitHub, 2026 확인]
- Skills는 공식 구조 안에 존재하지만, 앱 연동 계층과는 별도 기능층임. [출처: codex-rs/app-server/README.md, openai/codex GitHub, 2026 확인]
- 현재 로컬 설치 환경에서 `codex.cmd --help`, `codex.cmd exec --help`는 정상 확인되었고, `exec --json` 실실행은 권한 문제로 실패함. [출처: 로컬 Codex CLI 실측, 2026-05-10]

## 읽는 순서 권장

1. 장점과 판단 기준이 필요하면 `01`
2. 이미 만든 프로그램에 붙이려면 `02`
3. 새 프로그램을 처음부터 제대로 설계하려면 `03`
4. 바로 `StudyCapture`에 적용하려면 `04`

---
type: note
aliases:
  - Claude PPT 가이드
  - Paperlogy PPT 방법론
description: A detailed guide on how to create professional PPT presentations using Claude's Design System and Artifacts, based on Paperlogy's methodology.
author:
  - "[[박지군]]"
date created: 2026-05-02
date modified: 2026-05-02
tags:
  - PPT
  - Claude
  - Paperlogy
  - DesignSystem
  - Automation
---

# Claude를 활용한 고품질 PPT 제작 가이드 (Paperlogy 분석)

> 이 문서는 Paperlogy의 "Today, Claude Killed PPT" 영상을 분석하여, Claude AI를 활용해 전문가 수준의 프레젠테이션을 제작하는 단계를 정리한 가이드입니다.

---

## 核心 철학: 디자인 시스템 구축
	기존의 경직된 템플릿 방식에서 벗어나, Claude 내부에 **디자인 시스템(Design System)**을 구축하는 것이 핵심입니다. Claude의 'Projects'와 'Artifacts' 기능을 활용하여 일관성 있고 정보 밀도가 높은 슬라이드를 생성합니다.

---

## 단계별 제작 프로세스

### 1단계: 디자인 시스템 프롬프트 설정
	AI가 임의로 디자인하지 않도록 시각적 규칙을 정의하는 'Design System Prompt'를 제공해야 합니다.
	*	**폰트:** 특정 전문 폰트 지정 (예: Pretendard)
	*	**화면 비율:** 16:9 고정
	*	**일관성:** 챕터명, 제목, 소제목의 좌표를 모든 슬라이드에서 동일하게 유지하도록 지시
	*	**정보 밀도:** 슬라이드 하단에 의미 있는 데이터와 설명을 채워 '비어 보이는' 느낌을 제거
	*	**언어:** 논리적 정확도를 위해 시스템 프롬프트는 영어로 작성하는 것이 유리함

### 2단계: Claude Projects 지식 업로드
	Claude의 프로젝트 기능을 사용하여 브랜드 자산을 학습시킵니다.
	*	**로고:** 기업 로고 파일 업로드
	*	**폰트 파일:** CSS 또는 폰트 참조 파일 제공
	*	**브랜드 컬러:** 프로젝트 지침에 기본 및 보조 색상의 Hex 코드를 정의

### 3단계: 콘텐츠 구조화 (PDF/Text 활용)
	슬라이드를 하나씩 쓰는 대신, 원천 데이터(예: NotebookLM에서 생성된 PDF 등)를 Claude에 입력합니다.
	*	**핵심 포인트:** AI PPT가 실패하는 이유는 깊이가 없기 때문입니다. 원문 자료를 먼저 분석하게 한 뒤, [Chapter -> Title -> Subtitle -> Body]의 논리적 흐름으로 구조화합니다.

### 4단계: Artifacts를 활용한 시각화 생성
	Claude의 Artifacts UI를 통해 React/Tailwind 코드를 실시간 디자인으로 렌더링합니다.
	*	**표지 슬라이드:** 중앙 로고, 굵은 제목, 최소한의 푸터
	*	**목차 슬라이드:** 명확한 계층 구조의 번호 매기기 목록
	*	**본문 슬라이드:** 좌측 상단 제목, 그 아래 소제목, 본문은 그리드나 컬럼으로 나누어 높은 정보 밀도 유지
	*	**팁:** "수정사항을 적용하기 전에 Artifacts로 시각적 레이아웃을 먼저 보여줘"라고 요청하십시오.

### 5단계: PPT 내보내기 및 정밀 조정
	Claude가 생성한 디자인 로직을 실제 PowerPoint 파일로 옮깁니다.
	*	**수동 방식:** Claude가 제안한 좌표와 텍스트 구조를 PPT 마스터 슬라이드에 복사
	*	**자동 방식:** Claude에게 해당 디자인을 바탕으로 **VBA 매크로** 또는 **Python(python-pptx)** 코드를 생성해달라고 요청하여 .pptx 파일을 자동 생성

---

## 주요 나레이션 및 발표 포인트
	이 방법론을 소개하거나 활용할 때 강조해야 할 핵심 포인트입니다.
	1.	**"템플릿의 종말":** 경직된 템플릿 대신 유동적이고 확장 가능한 디자인 시스템이 우선입니다.
	2.	**"밀도가 곧 품질이다":** 컨설팅 펌(BCG/McKinsey) 스타일에서 빈 공간은 통찰의 부족으로 간주될 수 있습니다. Claude는 이 공간을 지능적으로 채워줍니다.
	3.	**"논리 우선, 디자인 후순위":** Claude는 강력한 논리 엔진입니다. 시각적 요소 이전에 논리적 전개가 타당한지 먼저 검증하십시오.
	4.	**"10분의 법칙":** 디자인 시스템이 세팅된 프로젝트에서는 30페이지 분량의 전문 덱을 10분 내에 생성할 수 있습니다.

---

## Paperlogy 마스터 프롬프트 예시
	> "I am writing a prompt to create a PPT in Claude. Revise my prompt to reflect these rules: Use only Pretendard font. Use the 'Brandlogy' logo. Output only in 16:9. Ensure Chapter, Title, and Subtitle are in fixed positions. Ensure high content density in the body without cluttering. Keep the prompt language in English."

---
*분석 및 작성: 2026-05-02 | Gemini Scribe (CMDS 시스템 준수)*

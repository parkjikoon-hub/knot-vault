---
type: "web-clip"
title: "Claude Code /ultrareview 기능 업데이트 — 병합 직전 버그 잡는 멀티 에이전트 코드 리뷰"
author:
  - "AI시대작가"
  - "editor_소연"
site: "지피터스 GPTers"
domain: "gpters.org"
source_url: "https://www.gpters.org/dev/post/claude-code-ultrareview-feature-UWK5luot9rupZ0n"
published: 2026-04-23
clipped: 2026-05-04
status: "unprocessed"
clip_source: "obsidian-web-clipper"
capture_mode: "selection-only"
clip_tags: "CMDS, webclip, selection"
---
# Claude Code /ultrareview 기능 업데이트 — 병합 직전 버그 잡는 멀티 에이전트 코드 리뷰

> [!info] Source
> - **Title:** Claude Code /ultrareview 기능 업데이트 — 병합 직전 버그 잡는 멀티 에이전트 코드 리뷰
> - **Author:** AI시대작가, editor_소연
> - **Site:** 지피터스 GPTers
> - **Domain:** gpters.org
> - **URL:** https://www.gpters.org/dev/post/claude-code-ultrareview-feature-UWK5luot9rupZ0n
> - **Published:** 2026-04-23
> - **Clipped:** 2026-05-04
> - **Capture Mode:** Selection only

---

## 1. 핵심 요약

- `/ultrareview`는 Claude Code v2.1.86에서 도입된 멀티 에이전트 코드 리뷰 명령어로, 원격 클라우드 샌드박스에서 여러 리뷰어 에이전트가 병렬로 버그를 찾아내고 **독립 재현·검증 후에만 리포트**에 포함시켜 거짓 양성을 줄인다.
- 로컬 `/review`(수 초~수 분, 단일 패스)와 달리 `/ultrareview`는 5~10분 소요되지만 로컬 자원을 쓰지 않으며, 터미널을 꺼도 클라우드에서 계속 실행되고 `/tasks`로 진행 상황을 추적할 수 있다.
- `/ultrareview <PR번호>` 형태로 GitHub PR을 직접 clone해 검사할 수 있어, 로컬 체크아웃 없이 타인의 PR 검토나 대용량 모노레포의 번들 에러 우회에 유용하다.
- Pro/Max 플랜은 2026-05-05까지 3회 무료이며 이후 1회당 $5~$20이 extra usage로 청구되므로, **\"PR당 1회, 병합 직전에만\"** 사용하는 팀 컨벤션을 명시해 비용을 관리하는 것이 중요하다.
- API 키 단독 로그인, Amazon Bedrock·Vertex AI·Foundry 경유, Zero Data Retention 조직, v2.1.85 이하 버전에서는 실행이 불가하며, 반드시 Claude.ai 계정 인증과 v2.1.86 이상이 필요하다.

---

## 2. 선택 원문

> 아래 영역은 웹페이지에서 마우스로 드래그 선택한 본문만 저장합니다.  
> 관계없는 추천글, 사이드바, 페이지 전체 HTML이 섞이는 것을 막기 위해 `content`, `body`, `main`, `article` 자동 추출은 사용하지 않습니다.

## Claude Code 업데이트

Claude Code v2.1.86에 `/ultrareview`가 붙었습니다. 내 로컬 터미널에서 몇 초 만에 도는 `/review`와 달리, 이건 **클라우드 샌드박스에서 멀티 에이전트가 5~10분간 독립 검증**하는 심층 리뷰예요. 스타일 지적을 빼고 **실제 버그만** 짚어줍니다. 이 글에서 뭐가 다른지, 언제 쓰고 언제 쓰지 말아야 하는지, 실전 워크플로우까지 정리했습니다.

![클로드 코드 울트라 리뷰](https://tribe-s3-production.imgix.net/rM7Zx7TSkEe4zZGji56AD?auto=compress,format)

ALT

클로드 코드 울트라 리뷰

## /ultrareview가 뭔가요?

`/ultrareview`**는 Claude Code가 원격 클라우드 샌드박스에서 여러 리뷰어 에이전트를 병렬로 돌려 PR/브랜치 버그를 찾아내는 멀티 에이전트 코드 리뷰 명령어입니다.** Claude Code v2.1.86(2026년 4월 16일, Opus 4.7과 함께 출시)부터 쓸 수 있는 리서치 프리뷰 기능이에요.

로컬 `/review`가 단일 패스로 빠르게 훑는다면, `/ultrareview`는 여러 에이전트가 로직·엣지케이스·보안·성능을 각각 다른 각도에서 검토하고, **발견한 모든 이슈를 독립적으로 재현·검증한 뒤에만 리포트**합니다. 그래서 결과물이 "스타일 참견"이 거의 없고 실제 버그로 수렴해요.

## 핵심 기능

1. **멀티 에이전트 병렬 검증**: 여러 리뷰어 에이전트가 동시에 변경을 훑어서 단일 패스 리뷰가 놓치기 쉬운 상호작용 버그를 잡아냅니다.
2. **독립 재현 기반 리포트**: 모든 발견 이슈를 자동으로 재현·검증한 뒤에만 리포트에 포함합니다. 거짓 양성(false positive)이 크게 줄어듭니다.
3. **로컬 자원 0 사용**: 리뷰는 원격 샌드박스에서 돌아가서 내 터미널은 계속 다른 작업에 쓸 수 있어요. 터미널을 꺼도 클라우드에서 계속 돕니다.
4. **GitHub PR 원격 clone**: 리포가 너무 커서 번들 업로드가 안 되는 경우 `/ultrareview 1234` 형태로 PR 번호만 넘기면 샌드박스가 GitHub에서 직접 clone해서 검사합니다.

## 이렇게 써보세요 — 실전 활용법

### 활용 1: 로컬 브랜치 diff 검토

가장 기본 형태입니다. 아무 인자 없이 실행하면 현재 브랜치와 기본 브랜치(main 등) 간의 diff를 원격 샌드박스에 업로드해서 검증합니다. 스테이징·커밋 안 된 작업 트리 변경까지 포함돼요.

```
/ultrareview
```

실행 직전에 Claude Code가 **리뷰 범위(파일·라인 수), 남은 무료 횟수, 예상 비용**을 보여주는 확인 다이얼로그를 띄웁니다. 확인 누르면 백그라운드로 넘어가고 터미널은 그대로 씁니다.

### 활용 2: GitHub PR을 원격에서 직접 검토

PR 번호를 인자로 넘기면, 내 로컬 상태가 아니라 **샌드박스가 GitHub에서 PR을 직접 clone해서 검사**합니다.

```
/ultrareview 1234
```

이 방식의 이점이 크게 두 가지예요.

- **내 로컬에 해당 브랜치를 체크아웃하지 않아도 됨** — 다른 사람 PR을 훑어볼 때 유용
- **리포가 너무 커서 번들 에러가 날 때 우회** — 큰 모노레포에서 "bundle too large" 뜨면 PR 모드로 바로 전환

전제 조건은 하나, 리포에 `github.com` 리모트가 연결돼 있어야 합니다.

### 활용 3: 병합 직전 워크플로우에 끼워 넣기

이게 가장 추천하는 패턴이에요. `/review`와 `/ultrareview`를 **역할이 다른 도구**로 보고 한 사이클에 같이 씁니다.

1. **개발 중**: `/review`를 반복 실행 (몇 초~수 분, 로컬, 일반 사용량)
2. **PR 초안 작성 후 GitHub에 푸시**
3. **병합 직전**: `/ultrareview <PR번호>` **1회만** 실행
4. `/tasks`로 진행 상황 확인하면서 다른 작업 병행
5. 완료 알림이 오면 파일 위치·문제 설명을 보고 수정

팀 운영 팁 하나 더 드리자면, **"PR당** `/ultrareview` **1회, 병합 직전에만"**이라는 규칙을 두면 월 비용 예측이 쉬워집니다. 매 커밋마다 돌리면 $5~$20이 쌓여서 금방 체감 나빠져요.

## /review vs /ultrareview 한눈 비교

항목

`/review`

`/ultrareview`

실행 위치

내 로컬

클라우드 샌드박스

검증 방식

단일 패스

다중 에이전트 + 독립 재현·검증

소요 시간

수 초~수 분

약 5~10분

로컬 자원

소모

거의 없음 (다른 작업 가능)

비용

일반 사용량

무료 3회, 이후 $5~$20/회

GitHub PR 인자

미지원

`/ultrareview <PR번호>` 지원

주 용도

반복 개발 중 빠른 체크

병합 직전 심층 검증

한 줄 정리: **"/review는 일상, /ultrareview는 병합 게이트."**

## 백그라운드 실행과 /tasks로 추적

리뷰 하나당 보통 5~10분이 걸려요. 그 시간 동안 터미널을 붙잡고 있을 필요가 없습니다.

- **세션 유지 없음**: 터미널을 닫아도 클라우드에서 계속 돌아갑니다.
- `/tasks` **명령어**: 진행 중·완료된 리뷰 목록 확인, 상세 열람, 중단 가능
- **중단 시 주의**: 중단하면 클라우드 세션이 아카이브되고 **부분 결과는 반환되지 않아요**. 시작할지 말지는 처음에 판단하는 게 낫습니다.
- **완료 알림**: 검증된 발견 사항이 세션 알림으로 뜨고, 각 항목에 파일 위치 + 문제 설명이 들어있어서 바로 Claude에게 수정을 맡길 수 있습니다.

## 요금 & 무료 쿼터

`/ultrareview`는 플랜에 포함된 일반 사용량이 아니라 **extra usage(추가 사용량)**에 청구되는 프리미엄 기능입니다.

플랜

무료 횟수

이후

Pro

**3회 무료 (2026-05-05까지)**

extra usage 청구

Max

**3회 무료 (2026-05-05까지)**

extra usage 청구

Team / Enterprise

없음

extra usage 청구

알아두실 포인트:

- 무료 3회는 **계정당 1회성 할당**이에요. 갱신 없고 2026-05-05에 만료됩니다.
- 이후 1회 리뷰당 보통 **$5~$20** (변경 규모에 비례)
- **extra usage가 꺼져 있으면** 유료 리뷰 실행이 차단되고 청구 설정 페이지로 리다이렉트됩니다. `/extra-usage`로 미리 확인/켜두는 게 깔끔해요.

---

## ⚠️ 이런 경우엔 쓸 수 없어요

`/ultrareview`가 Claude.ai 계정 기반 클라우드 인프라에서 돌기 때문에, 아래 환경에서는 아예 실행이 안 됩니다.

- **API 키만으로 로그인한 경우** → `/login`으로 Claude.ai 계정 인증 필수
- **Amazon Bedrock / Google Cloud Vertex AI / Microsoft Foundry 경유 사용자**
- **Zero Data Retention(ZDR)이 켜진 조직 계정**
- **Claude Code v2.1.85 이하** — 버전 업데이트 먼저

## 자주 묻는 질문

### /ultrareview는 무료인가요?

Pro/Max 플랜은 **2026-05-05까지 3회 무료**로 제공돼요. 이후에는 1회당 $5~$20(변경 규모 비례)가 extra usage로 청구됩니다. Team/Enterprise 플랜은 처음부터 유료예요.

### /review와 /ultrareview 중 뭘 써야 하나요?

개발하면서 반복 체크할 때는 `/review`가 정답이에요. 빠르고 로컬에서 바로 돕니다. 큰 리팩토링 PR을 main에 머지하기 직전처럼 "한 번만 제대로 확인하고 싶을 때"가 `/ultrareview`의 자리입니다. 둘이 경쟁 관계가 아니라 역할 분담이에요.

### 리뷰 시작하려면 뭐가 필요하나요?

Claude Code v2.1.86 이상, Claude.ai 계정(API 키 로그인 불가), 리포가 git 저장소일 것 — 이 세 가지입니다. PR 모드(`/ultrareview 1234`)를 쓰려면 `github.com` 리모트가 연결돼 있어야 하고요.

### 리뷰가 너무 오래 걸리거나 잘못된 것 같을 때 중단할 수 있나요?

`/tasks`에서 진행 중인 리뷰를 중단할 수 있어요. 단, 중단하면 클라우드 세션이 아카이브되고 **부분 결과는 반환되지 않습니다**. 시작 전에 리뷰 규모를 확인 다이얼로그에서 꼭 보세요.

### Amazon Bedrock이나 Vertex AI로 쓰고 있어도 가능한가요?

안타깝지만 불가능합니다. `/ultrareview`는 Claude.ai 계정 기반 인프라가 필요해서 Bedrock, Vertex AI, Microsoft Foundry 경유 사용자는 쓸 수 없어요. ZDR(Zero Data Retention)이 켜진 조직도 마찬가지입니다.

## 💡 Insight

`/ultrareview`가 진짜 의미 있는 지점은 **"로컬 CPU로 감당 못 하던 리뷰 깊이를 클라우드가 대신해준다"**는 구조 자체예요. 지금까지 PR 리뷰 자동화는 CodeRabbit, Greptile처럼 외부 서비스를 붙이거나, 로컬에서 에이전트 여러 개를 동시에 돌려야 했는데 둘 다 마찰이 있었죠. Claude Code가 슬래시 커맨드 하나로 이 경험을 내재화한 건 개발자 툴체인 관점에서 큰 변곡점이라고 봐요.

다만 **"3회 무료 → $5~$20"라는 요금 구조**는 Q2에 꼭 관리하셔야 합니다. 한국 개발팀 관점에서는 "PR당 1회, 병합 직전에만"이 월 비용 예측의 유일한 방어선이에요. 주니어가 습관처럼 매 커밋마다 돌리기 시작하면 월말 청구서가 순식간에 불어납니다. 팀 컨벤션에 명시해두는 걸 추천드려요.

한 가지 더, `/ultrareview`는 **병합 전 게이트**지 **디버깅 도구가 아니라는 점**도 중요해요. 이미 장애가 난 코드를 "왜 안 될까요" 물어보려고 쓰면 5~10분 기다린 끝에 "코드 변경이 없어요" 같은 엉뚱한 답만 나올 수 있어요. 디버깅은 `/review`나 일반 대화로, `/ultrareview`는 "진짜 괜찮겠지?"를 확인하는 마지막 관문으로 — 이렇게 역할을 구분해서 쓰시면 비용도 시간도 최적입니다.

---

원문: [https://code.claude.com/docs/en/ultrareview](https://code.claude.com/docs/en/ultrareview)

---

## 3. 내 메모

- 

---

## 4. 관련 노트

- 

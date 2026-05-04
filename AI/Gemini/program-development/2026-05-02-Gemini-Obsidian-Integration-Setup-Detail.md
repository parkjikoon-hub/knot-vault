---
type: note
aliases:
  - Gemini-Obsidian 연동 가이드
description: 제미나이(Gemini)와 옵시디언(Obsidian)을 연동하기 위해 진행한 플러그인 설치 및 환경 설정 과정 상세 기록
author:
  - "[[박지군]]"
date created: 2026-05-02
date modified: 2026-05-02
tags:
  - Gemini
  - Obsidian
  - Plugin
  - Setup
CMDS:
index:
status: completed
---

# Gemini - Obsidian 연동 설정 가이드

본 문서는 인공지능 동반자인 Gemini와 옵시디언(Obsidian)을 원활하게 연동하기 위해 진행한 설정 과정을 상세히 기록한 문서입니다. 이를 통해 언제든 연동 환경을 다시 구축하거나 문제를 해결할 수 있습니다.

## 1. 연동의 목적
Obsidian 내에서 직접 Gemini 인공지능을 호출하여 글을 다듬거나, 아이디어를 확장하고, 문서 초안을 작성하기 위해 `obsidian-gemini` (Gemini Scribe) 플러그인을 로컬에 설치하고 연동했습니다.

## 2. 플러그인 수동 설치 과정
공식 커뮤니티 플러그인 목록에 없는 개발 버전이나 최신 버전의 플러그인을 사용하기 위해 GitHub에서 직접 코드를 내려받아 빌드하는 방식을 취했습니다.

1. **저장소 복제 (Git Clone)**
   터미널을 통해 현재 사용 중인 볼트(`CMDS-vault`)의 플러그인 폴더에 Gemini Scribe 플러그인 저장소를 직접 복제했습니다.
   ```bash
   git clone https://github.com/allenhutchison/obsidian-gemini.git "C:\Users\admin\Obsidian\CMDS-vault\.obsidian\plugins\obsidian-gemini"
   ```

2. **의존성 설치 및 빌드 (NPM)**
   다운로드된 소스 코드를 옵시디언이 인식할 수 있는 형태로 컴파일(빌드)했습니다.
   ```bash
   npm install --prefix "C:\Users\admin\Obsidian\CMDS-vault\.obsidian\plugins\obsidian-gemini"
   npm run build --prefix "C:\Users\admin\Obsidian\CMDS-vault\.obsidian\plugins\obsidian-gemini"
   ```

## 3. 옵시디언 내부 설정
플러그인 파일이 정상적으로 준비된 후, 옵시디언 앱 내에서 활성화를 진행했습니다.

1. **안전 모드(Safe Mode) 해제**: `설정(Settings)` > `커뮤니티 플러그인`에서 안전 모드를 비활성화하여 외부 플러그인 실행을 허용했습니다.
2. **플러그인 활성화**: 설치된 플러그인 목록을 새로고침한 뒤, **`Gemini Scribe`** 플러그인의 스위치를 켜서 활성화했습니다.
3. **API 키 설정**: 플러그인 세부 설정 화면에서 [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급받은 **Gemini API Key**를 입력하여 통신을 연결했습니다.

## 4. AI 동반자(Gemini) 협업 기본 규칙 설정
추가로, AI와 함께 기획서나 서류를 작성할 때 작성자 이름이 자동으로 일관되게 기록되도록 볼트의 AI 시스템 파일(`CLAUDE.md`)에 규칙을 추가했습니다.

- **한글 표기**: "박지군"
- **영문 표기**: "Ji Koon Park"
- **옵시디언 속성**: 메타데이터의 `author` 항목에는 항상 `[[박지군]]` 형식을 기본값으로 사용하도록 영구 설정되었습니다.

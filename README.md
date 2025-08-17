# Mock Fox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/The-Plain-OSS/mock-fox?color=blue)](https://github.com/The-Plain-OSS/mock-fox/releases)
[![Platform](https://img.shields.io/badge/platform-macOS%20|%20Windows-lightgrey)]()

---

**API 명세 작성부터 실행 가능한 Mock 서버 생성까지, 단 한 번의 클릭으로.**

Mock Fox는 기획자, 디자이너, 개발자 누구나 **직관적인 인터페이스**를 통해  
RESTful API 명세를 작성하고, 클릭 한 번으로 **실행 가능한 로컬 Mock 서버**를 빌드할 수 있는  
**로컬 퍼스트(Local-first) 오픈소스 데스크톱 애플리케이션**입니다.

복잡한 환경 구성, 서버 비용, 별도의 런타임 설치는 필요 없습니다.  
**아이디어 → 명세 → Mock 서버 실행**을 하루 안에 끝낼 수 있습니다.

---

## 주요 기능

- 한 번의 클릭으로 실행 가능한(.exe) Mock 서버 생성 (Go 기반 컴파일)
- API 명세 HTML 문서 자동 생성 (공유용)
- 독립 실행 파일(.exe) 출력 – 별도 런타임 불필요
- 프로젝트/버전/엔드포인트 관리 기능 제공
- 직관적 엔드포인트 편집기 (Method, Path, Query, Header, Body, Response JSON)
- macOS, Windows, Linux 지원
- 코드 작성 경험이 없는 사용자도 활용 가능한 단순한 UI
- 100% 오프라인 동작 – 외부 서비스 의존 없음

---

## 설치 방법

### 1. 사전 빌드된 바이너리 다운로드

[Releases](https://github.com/The-Plain-OSS/mock-fox/releases) 페이지에서  
운영체제에 맞는 실행 파일을 내려받아 바로 실행하세요.

### 2. 소스코드에서 빌드

#### 요구 사항

- Go 1.22 이상
- Node.js LTS 버전
- Electron

```bash
git clone https://github.com/The-Plain-OSS/mock-fox.git
cd mock-fox
npm install
npm start
```

---

## 사용법

1. Mock Fox 실행
2. 좌측 사이드바에서 프로젝트 이름, 버전, 엔드포인트 관리
3. 우측 패널에서 Method, Path, Query, Header, Body, Response 설정
4. **"Mock 서버 생성"** 버튼 클릭 → 실행 파일(EXE/APP) 자동 생성
5. 생성된 Mock 서버를 실행하여 테스트

---

## 왜 Mock Fox인가?

- 누구나 사용할 수 있는 API/Mock 서버 작성 도구
- 네트워크나 서버 비용 없이 동작하는 Local-first 구조
- 기획-개발-QA를 병렬로 진행하여 개발 사이클 단축
- 별도 환경 구성 없이 더블클릭만으로 서버 실행 가능

Mock Fox는 단순한 **API 문서 도구**가 아니라,  
**개발 사이클을 혁신적으로 단축하는 새로운 워크플로우 도구**입니다.

---

## 기술 스택

- **Electron** – 크로스플랫폼 데스크톱 UI
- **Go** – Mock 서버 런타임
- **HTML / CSS / JavaScript** – 프론트엔드 UI
- **Tailwind CSS** – UI 스타일링

---

## 향후 로드맵

- [ ] OpenAPI / Swagger / Postman 100% 호환성
- [ ] 고급 테스트 시뮬레이션 (지연, 오류 코드, 인증 흐름)
- [ ] 다양한 산업군 플러그인 (게임, IoT, AI 등)
- [ ] CLI / WebAssembly 버전 제공
- [ ] CI/CD 파이프라인 연동

로드맵은 [Issues](https://github.com/The-Plain-OSS/mock-fox/issues)에서 확인하거나 직접 제안할 수 있습니다.

---

## 라이선스

MIT License  
자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 기여 방법

Mock Fox는 열린 협업을 지향합니다.  
이슈 보고, 기능 제안, PR 제출 모두 환영합니다.

1. 이슈 또는 기능 요청 작성
2. Fork → 브랜치 생성 → 수정 → PR 제출
3. 코드 리뷰 후 병합

---

**Maintainer**: [xhae000@gmail.com](mailto:xhae000@gmail.com)

> Mock Fox — Easy to API!

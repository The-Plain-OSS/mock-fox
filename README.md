# Mock Fox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-R2.0.0-blue.svg)]()
[![Platform](https://img.shields.io/badge/platform-macOS%20|%20Windows-lightgrey)]()
[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron-9feaf9.svg)](https://www.electronjs.org/)

[English](#english) | [한국어](#korean)

---

## English

**Design REST APIs and generate standalone mock servers with a single click.**

<<<<<<< HEAD
Mock Fox is a local-first desktop app for designing RESTful API specifications and generating executable mock servers. No cloud dependencies, no runtime installations, no complex setup—just design your API and click to build.
=======
- **한 번의 클릭으로 실행 가능한 Mock 서버 생성**
- **API 명세 HTML 문서 자동 생성** (공유 및 문서화용)
- **독립 실행 파일(.exe) 출력** – 별도 런타임 불필요
- **아주 쉬운 엔드포인트 정의**
- **오픈소스 API 템플릿**
>>>>>>> 9b6d4340b682ea933d9f308bd28e269593f17041

**Note**: The UI is currently available in Korean only. English localization is in progress.

### Key Features

#### Core Capabilities

- **One-Click Mock Server** - Generates standalone Go executables
- **Auto-Generated API Docs** - Exports specifications as shareable HTML
- **Zero Dependencies** - Outputs native binaries (.exe/.app) that run anywhere
- **Endpoint Editor** - Configure methods, paths, queries, headers, and responses
- **Auto-Save** - Work is saved automatically

#### Advanced Features

- **Templates** - Start quickly with pre-built API examples
- **Version Control** - Track changes and roll back when needed
- **Code Mode** - JSON auto-formatting and validation
- **Response Scenarios** - Configure multiple response examples per endpoint
- **cURL Generation** - Auto-generated cURL commands for testing
- **Keyboard Shortcuts** - Efficient keyboard-driven workflow

#### Platform Support

- **macOS** (Intel & Apple Silicon)
- **Windows** (x64)
- **Fully Offline** - No internet connection required

### Installation

#### Pre-Built Binaries (Recommended)

**[Download Latest Release](https://github.com/The-Plain-OSS/mock-fox/releases)**

- **Windows**: Download `Mock-Fox-R2.0.0.exe` and run directly
- **macOS**: Coming soon

##### Windows Setup

1. Download `Mock-Fox-*.exe` from releases
2. Save to any folder
3. Double-click to run (Windows SmartScreen may warn: click "More info" → "Run anyway")
4. No installation required

#### Build from Source

**Requirements**: Node.js 18.x LTS or higher

```bash
# Clone repository
git clone https://github.com/The-Plain-OSS/mock-fox.git
cd mock-fox

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build:mac    # macOS
npm run build:win    # Windows
```

### Quick Start

#### Basic Workflow

1. **Create Project**
   - Launch Mock Fox and create a new project
   - Set project name, version, and description

2. **Design Endpoints**
   - Add endpoints with the "+" button
   - Select HTTP method (GET, POST, PUT, DELETE, PATCH)
   - Configure path, query parameters, headers, and request/response bodies

3. **Generate Mock Server**
   - Click **"Generate Mock Server"**
   - Choose output location
   - Executable (.exe/.app) is generated automatically
   - Run the server by double-clicking the file

4. **Export Documentation**
   - Click **"Export API Spec"**
   - HTML documentation is generated for sharing with your team

#### Advanced Usage

##### Using Templates

```
1. Click the Sample button
2. Choose a template (User API, Product API, etc.)
3. Endpoints populate automatically
```

##### Version Management

```
1. Go to Project → Version Control
2. Save the current state as a new version
3. Restore to any previous version
```

##### Keyboard Shortcuts

- `Ctrl/Cmd + S`: Save project
- `Ctrl/Cmd + N`: Add new endpoint
- `↑/↓`: Navigate between endpoints
- `F2`: Rename endpoint

### Template Ecosystem

Mock Fox includes a growing library of API templates maintained by the community.

#### Available Templates

- **User Management API** - Registration, authentication, profile management
- **E-commerce API** - Products, orders, payments
- **Blog API** - Posts, comments, categories
- **Todo API** - Task management
- **File Upload API** - File upload and management

#### Contributing Templates

We welcome contributions to expand the template library.

##### What We're Looking For

1. **Industry-Specific Templates**
   - Gaming API (players, items, leaderboards)
   - IoT API (devices, sensors, controls)
   - Financial API (accounts, transactions)
   - Healthcare API (patients, appointments, prescriptions)

2. **Template Improvements**
   - More realistic data structures
   - Additional use cases
   - Better error handling examples

3. **Localized Templates**
   - Korea-specific payment systems (KakaoPay, NaverPay)
   - Region-specific e-commerce APIs
   - Global shipping APIs

##### Submission Guidelines

- Production-ready structure
- Minimum 5 endpoints
- Mix of HTTP methods
- Realistic sample data
- Error response cases included

##### Review Process

1. Submit template proposal via GitHub Issues
2. Community discussion and feedback
3. Code review
4. Merge to main branch
5. Included in next release

**Template contributors are recognized in the project's Contributors list.**

### Architecture

#### Tech Stack

- **Frontend**: Electron + HTML/CSS/JavaScript + Tailwind CSS
- **Backend**: Go (mock server runtime)
- **Storage**: LocalStorage (local-first design)
- **Build**: Electron Builder + Go Compiler

#### How It Works

```
┌─────────────────┐
│  Mock Fox UI    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Endpoint Design │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Go Code Gen     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Go Compilation  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Executable File │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Standalone Mock │
│     Server      │
└─────────────────┘
```

1. **Design**: User designs API endpoints in the UI
2. **Code Generation**: Generates Go HTTP server code
3. **Compilation**: Compiles code into executable binary
4. **Deployment**: Standalone mock server ready to run

### Why Mock Fox?

#### Design Goals

- **Accessible** - Intuitive interface, no coding required
- **Independent** - No cloud services or external dependencies
- **Efficient** - Enables parallel workflows for planning, development, and QA
- **Portable** - Generated servers run anywhere without setup

#### Comparison

| Feature                  | Mock Fox              | Traditional Tools     |
| ------------------------ | --------------------- | --------------------- |
| **Executable Output**    | ✅ Single click       | ❌ Manual setup       |
| **Offline Mode**         | ✅ Fully local        | ❌ Cloud-dependent    |
| **Runtime Dependencies** | ✅ None               | ❌ Node.js/Python     |
| **Distribution**         | ✅ Share binary file  | ❌ Share environment  |
| **Non-Dev Friendly**     | ✅ GUI-based          | ❌ Code/config-based  |

Mock Fox bridges the gap between API design tools and mock server frameworks by combining both into a single workflow.

### Contributing

We welcome bug reports, feature requests, and pull requests.

#### Contribution Process

1. **Create Issue** - Report bugs or propose features
2. **Fork & Branch** - Fork the repo and create a feature branch
3. **Develop & Test** - Test thoroughly before submitting
4. **Pull Request** - Submit with a clear description
5. **Code Review** - Work with maintainers on review
6. **Merge** - Merged after approval

#### Development Setup

```bash
git clone https://github.com/The-Plain-OSS/mock-fox.git
cd mock-fox
npm install
npm start  # Run development server
```

#### Code Style

- **JavaScript**: ES6+ syntax
- **CSS**: Tailwind CSS preferred
- **Commits**: Conventional Commits recommended

### Roadmap

- **English UI** - Full internationalization
- **Built-in API Tester** - Test endpoints directly in the app
- **WebSocket Support** - Real-time communication endpoints
- **GraphQL Support** - GraphQL schema design and mocking
- **Optional Cloud Sync** - Backup while maintaining local-first approach
- **Collaborative Editing** - Team collaboration features

### Team

**Lead Maintainer**: [Woojin Kim](mailto:xhae000@gmail.com)
**Contributors**: [Full List](https://github.com/The-Plain-OSS/mock-fox/graphs/contributors)

### License

MIT License - see [LICENSE](LICENSE) for details.

---

## Korean

**REST API를 설계하고, 클릭 한 번으로 독립 실행 가능한 Mock 서버를 생성합니다.**

Mock Fox는 RESTful API 명세를 작성하고 실행 가능한 Mock 서버를 생성하는 로컬 퍼스트 데스크톱 애플리케이션입니다. 클라우드 의존성, 런타임 설치, 복잡한 설정 없이 API를 설계하고 빌드할 수 있습니다.

**참고**: UI는 현재 한국어만 지원합니다. 영문 UI는 개발 중입니다.

### 주요 기능

#### 핵심 기능

- **한 번의 클릭으로 Mock 서버 생성** - Go 기반 독립 실행 파일 생성
- **API 문서 자동 생성** - 공유 가능한 HTML 형식의 명세서
- **제로 의존성** - 어디서든 실행 가능한 네이티브 바이너리(.exe/.app)
- **엔드포인트 편집기** - Method, Path, Query, Header, Response 설정
- **자동 저장** - 작업 내용 자동 저장

#### 고급 기능

- **템플릿** - 미리 만들어진 API 예제로 빠른 시작
- **버전 관리** - 변경 이력 추적 및 롤백
- **코드 모드** - JSON 자동 포맷팅 및 검증
- **응답 시나리오** - 엔드포인트당 여러 응답 예시 설정
- **cURL 생성** - 테스트용 cURL 명령어 자동 생성
- **키보드 단축키** - 효율적인 키보드 중심 워크플로우

#### 플랫폼 지원

- **macOS** (Intel & Apple Silicon)
- **Windows** (x64)
- **완전 오프라인** - 인터넷 연결 불필요

### 설치 방법

#### 사전 빌드된 바이너리 (권장)

**[최신 릴리즈 다운로드](https://github.com/The-Plain-OSS/mock-fox/releases)**

- **Windows**: `Mock-Fox-R2.0.0.exe` 다운로드 후 바로 실행
- **macOS**: 준비 중

##### Windows 설치

1. 릴리즈에서 `Mock-Fox-*.exe` 다운로드
2. 원하는 폴더에 저장
3. 더블클릭으로 실행 (Windows SmartScreen 경고 시 "추가 정보" → "실행" 클릭)
4. 별도 설치 과정 없음

#### 소스코드에서 빌드

**요구 사항**: Node.js 18.x LTS 이상

```bash
# 저장소 클론
git clone https://github.com/The-Plain-OSS/mock-fox.git
cd mock-fox

# 의존성 설치
npm install

# 개발 모드 실행
npm start

# 배포용 빌드
npm run build:mac    # macOS
npm run build:win    # Windows
```

### 빠른 시작

#### 기본 사용법

1. **프로젝트 생성**
   - Mock Fox 실행 후 새 프로젝트 생성
   - 프로젝트명, 버전, 설명 입력

2. **엔드포인트 설계**
   - "+" 버튼으로 엔드포인트 추가
   - HTTP 메서드 선택 (GET, POST, PUT, DELETE, PATCH)
   - 경로, 쿼리 파라미터, 헤더, 요청/응답 Body 설정

3. **Mock 서버 생성**
   - **"Mock 서버 생성"** 버튼 클릭
   - 저장 위치 선택
   - 실행 파일(.exe/.app) 자동 생성
   - 생성된 파일을 더블클릭하여 서버 실행

4. **문서 내보내기**
   - **"API 명세서 내보내기"** 버튼 클릭
   - 팀 공유용 HTML 문서 생성

#### 고급 사용법

##### 템플릿 사용

```
1. 샘플 버튼 클릭
2. 템플릿 선택 (User API, Product API 등)
3. 엔드포인트 자동 생성
```

##### 버전 관리

```
1. 프로젝트 → 버전 관리
2. 현재 상태를 새 버전으로 저장
3. 이전 버전으로 복원 가능
```

##### 키보드 단축키

- `Ctrl/Cmd + S`: 프로젝트 저장
- `Ctrl/Cmd + N`: 엔드포인트 추가
- `↑/↓`: 엔드포인트 간 이동
- `F2`: 엔드포인트 이름 변경

### 템플릿 생태계

Mock Fox는 커뮤니티가 관리하는 API 템플릿 라이브러리를 제공합니다.

#### 제공되는 템플릿

- **User Management API** - 회원가입, 인증, 프로필 관리
- **E-commerce API** - 상품, 주문, 결제
- **Blog API** - 게시글, 댓글, 카테고리
- **Todo API** - 할 일 관리
- **File Upload API** - 파일 업로드 및 관리

#### 템플릿 기여하기

템플릿 라이브러리 확장을 위한 기여를 환영합니다.

##### 필요한 템플릿

1. **산업별 템플릿**
   - 게임 API (플레이어, 아이템, 리더보드)
   - IoT API (디바이스, 센서, 제어)
   - 금융 API (계좌, 거래)
   - 헬스케어 API (환자, 진료, 처방)

2. **템플릿 개선**
   - 더 실제적인 데이터 구조
   - 추가 사용 사례
   - 에러 처리 예시 개선

3. **지역화 템플릿**
   - 한국형 결제 시스템 (카카오페이, 네이버페이)
   - 지역별 쇼핑몰 API
   - 글로벌 배송 API

##### 제출 가이드라인

- 실무에서 사용 가능한 구조
- 최소 5개 이상의 엔드포인트
- 다양한 HTTP 메서드 사용
- 현실적인 샘플 데이터
- 에러 응답 케이스 포함

##### 리뷰 과정

1. GitHub Issues에 템플릿 제안
2. 커뮤니티 토론 및 피드백
3. 코드 리뷰
4. 메인 브랜치 병합
5. 다음 릴리즈에 포함

**템플릿 기여자는 프로젝트 Contributors 목록에 등재됩니다.**

### 아키텍처

#### 기술 스택

- **Frontend**: Electron + HTML/CSS/JavaScript + Tailwind CSS
- **Backend**: Go (Mock 서버 런타임)
- **Storage**: LocalStorage (로컬 퍼스트 설계)
- **Build**: Electron Builder + Go Compiler

#### 작동 원리

```
┌─────────────────┐
│  Mock Fox UI    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 엔드포인트 설계  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Go 코드 생성   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Go 컴파일     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   실행 파일     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  독립 Mock 서버 │
└─────────────────┘
```

1. **설계**: UI에서 API 엔드포인트 설계
2. **코드 생성**: Go HTTP 서버 코드 생성
3. **컴파일**: 실행 가능한 바이너리로 컴파일
4. **배포**: 독립 실행 가능한 Mock 서버 완성

### 왜 Mock Fox인가?

#### 설계 목표

- **접근성** - 코딩 없이 사용 가능한 직관적 인터페이스
- **독립성** - 클라우드 서비스, 외부 의존성 없음
- **효율성** - 기획, 개발, QA 병렬 진행 가능
- **이식성** - 생성된 서버는 어디서든 실행 가능

#### 비교

| 기능             | Mock Fox            | 기존 도구           |
| ---------------- | ------------------- | ------------------- |
| **실행 파일**    | ✅ 원클릭 생성      | ❌ 수동 설정        |
| **오프라인 모드** | ✅ 완전 로컬        | ❌ 클라우드 의존    |
| **런타임 의존성** | ✅ 없음             | ❌ Node.js/Python   |
| **배포**         | ✅ 바이너리 공유    | ❌ 환경 공유        |
| **비개발자 친화** | ✅ GUI 기반         | ❌ 코드/설정 기반   |

Mock Fox는 API 설계 도구와 Mock 서버 프레임워크 사이의 간격을 하나의 워크플로우로 연결합니다.

### 기여 방법

버그 리포트, 기능 제안, PR을 환영합니다.

#### 기여 과정

1. **이슈 생성** - 버그 리포트 또는 기능 제안
2. **Fork & Branch** - 저장소 Fork 후 기능 브랜치 생성
3. **개발 & 테스트** - 제출 전 충분한 테스트
4. **Pull Request** - 명확한 설명과 함께 PR 제출
5. **코드 리뷰** - 메인테이너와 리뷰 진행
6. **머지** - 승인 후 병합

#### 개발 환경 설정

```bash
git clone https://github.com/The-Plain-OSS/mock-fox.git
cd mock-fox
npm install
npm start  # 개발 서버 실행
```

#### 코드 스타일

- **JavaScript**: ES6+ 문법
- **CSS**: Tailwind CSS 우선 사용
- **커밋**: Conventional Commits 권장

### 로드맵

- **영문 UI** - 완전한 국제화
- **내장 API 테스터** - 앱 내에서 엔드포인트 테스트
- **WebSocket 지원** - 실시간 통신 엔드포인트
- **GraphQL 지원** - GraphQL 스키마 설계 및 Mock
- **선택적 클라우드 동기화** - 로컬 퍼스트 유지하며 백업
- **협업 편집** - 팀 협업 기능

### 팀

**Lead Maintainer**: [Woojin Kim](mailto:xhae000@gmail.com)
**Contributors**: [전체 목록](https://github.com/The-Plain-OSS/mock-fox/graphs/contributors)

### 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 참조

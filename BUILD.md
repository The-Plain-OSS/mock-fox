# 빌드 가이드

## Windows 포터블 실행파일 빌드

### 사전 요구사항
- **Node.js** 18.x LTS 이상
- **Go** 1.22+ (Mock 서버 컴파일용)
- **Windows** 환경 (또는 Windows VM)

### 로컬 빌드 과정

1. **의존성 설치**
```bash
npm install
```

2. **Go 리소스 준비**
```bash
# resources/windows-amd64 디렉토리에 Go 툴체인 복사
# (개발 환경에서는 시스템 Go를 사용)
```

3. **Windows 포터블 실행파일 빌드**
```bash
npm run build:win:release
```

4. **빌드 결과 확인**
- `dist/Mock-Fox-R2.0.0.exe` 파일 생성 확인
- 실행파일 크기: 약 200-300MB (Go 런타임 포함)

### GitHub 릴리즈 업로드

#### 자동 릴리즈 (GitHub Actions)
1. 버전 태그 생성:
```bash
git tag v2.0.0
git push origin v2.0.0
```

2. GitHub Actions가 자동으로:
   - Windows 포터블 실행파일 빌드
   - GitHub 릴리즈 생성
   - 실행파일 업로드

#### 수동 릴리즈
1. 로컬에서 빌드:
```bash
npm run build:win:release
```

2. GitHub 릴리즈 페이지에서:
   - 새 릴리즈 생성
   - `dist/Mock-Fox-*.exe` 파일 업로드
   - 릴리즈 노트 작성

### 사용자 사용 가이드

실행파일을 다운로드한 사용자는:

1. `Mock-Fox-R2.0.0.exe` 다운로드
2. 원하는 폴더에 저장 (예: 바탕화면, Documents 등)
3. 더블클릭으로 바로 실행
4. **설치 불필요** - 포터블 애플리케이션

### 빌드 결과물

- **실행파일**: `Mock-Fox-R2.0.0.exe` (~250MB)
- **포터블**: 별도 설치 없이 바로 실행
- **시스템 요구사항**: Windows 10 x64 이상

### 문제 해결

#### 빌드 실패 시
1. Node.js/Go 버전 확인
2. `node_modules` 삭제 후 재설치
3. Windows Defender 실시간 보호 일시 해제

#### 실행파일 실행 안됨
1. Windows SmartScreen 경고 - "추가 정보" → "실행" 선택
2. 바이러스 백신 소프트웨어 예외 처리 추가

### 배포 체크리스트

- [ ] 로컬에서 빌드 테스트 완료
- [ ] 실행파일 실행 및 앱 기동 확인
- [ ] Mock 서버 생성 기능 동작 확인
- [ ] 릴리즈 노트 작성
- [ ] GitHub 릴리즈 업로드
- [ ] README.md 다운로드 링크 업데이트
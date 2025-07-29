// Electron 앱 런타임 (Go 연동 포함)                

// 메인 프로세스 (백엔드)

// 1. 필요한 모듈 불러오기 
const { app, BrowserWindow } = require("electron");
const path = require("path");

// 2. 애플리케이션 창 생성하기
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
}

// 3. 앱 실행 준비 및 창 생성 호출
app.whenReady().then(createWindow);

// 4. 렌더러로부터 데이터 수신 준비
const { ipcMain } = require("electron");

ipcMain.on("save-spec", (event, data) => {
  console.log("명세 수신됨:", data);
  // → 여기서 Go 코드 실행하거나 파일로 저장 가능
  // 1. 수신한 'data'를 기반으로 Go 소스코드(.go 파일) 문자열을 생성.
  // 2. Node.js의 'fs' 모듈을 사용해 이 문자열을 실제 .go 파일로 저장.
  // 3. Node.js의 'child_process' 모듈을 사용해 'go build' 명령어를 실행.
});


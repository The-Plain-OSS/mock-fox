import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  win.loadFile("index.html");
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

// --------- 1) 내장 Go 툴체인 경로/환경 설정 ---------
function pickGoFolder() {
  // resources/go/<platform-arch>
  // win32: windows-amd64 / windows-arm64
  // darwin: darwin-amd64 / darwin-arm64
  const plat = process.platform;
  const arch = process.arch; // 'x64' | 'arm64' ...
  let key = null;
  if (plat === "win32") key = arch === "arm64" ? "windows-arm64" : "windows-amd64";
  else if (plat === "darwin") key = arch === "arm64" ? "darwin-arm64" : "darwin-amd64";
  else throw new Error(`unsupported platform: ${plat}/${arch}`);
  return key;
}

function getBundledGoEnv(targetOS, targetArch) {
  const root = app.isPackaged ? process.resourcesPath : process.cwd();
  const folder = pickGoFolder(); // 현재 OS에서 돌아갈 go 실행 파일 경로
  const goRoot = path.join(root, "resources", "go", folder);
  const env = { ...process.env };
  env.GOROOT = goRoot;
  env.GOPATH = path.join(app.getPath("userData"), "gopath");
  env.PATH = `${path.join(goRoot, "bin")}${path.delimiter}${env.PATH}`;
  env.CGO_ENABLED = "0";
  env.GOOS = targetOS;     // 빌드 대상으로 지정 (windows|darwin|linux)
  env.GOARCH = targetArch; // amd64|arm64
  return env;
}

// --------- 2) 입력 스펙 → Go main 코드 생성 ---------
function generateGoMain(projectName, endpointsRaw) {
  // method+path 중복은 마지막으로 정의된 것만 반영
  const map = new Map();
  for (const ep of endpointsRaw || []) {
    const key = `${(ep.method || "GET").toUpperCase()} ${ep.path || "/"}`;
    map.set(key, ep);
  }
  const endpoints = [...map.values()];
  const spec = endpoints.map(ep => ({
    id: ep.id,
    method: (ep.method || "GET").toUpperCase(),
    path: ep.path || "/",
    description: ep.description || "",
    headers: ep.headers || {},
    responses: Array.isArray(ep.responses) ? ep.responses : null,
    responseStatus: typeof ep.responseStatus === "number" ? ep.responseStatus : 200,
    responseBody: ep.responseBody ?? null
  }));

  const specJson = JSON.stringify(spec);

  return `
package main

import (
  "encoding/json"
  "fmt"
  "log"
  "net/http"
)

type Resp struct {
  Status      int         \`json:"status"\`
  ContentType string      \`json:"contentType"\`
  Desc        string      \`json:"desc"\`
  Body        interface{} \`json:"body"\`
}

type EP struct {
  ID            string                 \`json:"id"\`
  Method        string                 \`json:"method"\`
  Path          string                 \`json:"path"\`
  Description   string                 \`json:"description"\`
  Headers       map[string]string      \`json:"headers"\`
  Responses     []Resp                 \`json:"responses"\`     // 신형(여러 응답)
  ResponseStatus int                   \`json:"responseStatus"\` // 구형(단일 응답)
  ResponseBody   interface{}           \`json:"responseBody"\`   // 구형(단일 응답)
}

func main() {
  var eps []EP
  _ = json.Unmarshal([]byte(${JSON.stringify(specJson)}), &eps)

  mux := http.NewServeMux()

  for _, e := range eps {
    ep := e // 클로저 캡처 방지
    mux.HandleFunc(ep.Path, func(w http.ResponseWriter, r *http.Request) {
      if r.Method != ep.Method {
        w.WriteHeader(http.StatusMethodNotAllowed)
        return
      }

      // 헤더 기본
      ct := "application/json"
      if ep.Headers != nil {
        if v, ok := ep.Headers["Content-Type"]; ok && v != "" {
          ct = v
        }
        for k, v := range ep.Headers {
          if k == "Content-Type" { continue }
          w.Header().Set(k, v)
        }
      }
      w.Header().Set("Content-Type", ct)

      // 신형: responses[]가 있으면 첫 번째를 사용 (필요하면 규칙 확장)
      if len(ep.Responses) > 0 {
        w.WriteHeader(ep.Responses[0].Status)
        if ep.Responses[0].Body != nil {
          _ = json.NewEncoder(w).Encode(ep.Responses[0].Body)
        }
        return
      }

      // 구형: 단일 responseStatus/responseBody
      status := ep.ResponseStatus
      if status == 0 { status = 200 }
      w.WriteHeader(status)
      if ep.ResponseBody != nil {
        _ = json.NewEncoder(w).Encode(ep.ResponseBody)
      }
    })
  }

  addr := ":8080"
  log.Printf("${projectName || "mock-server"} listening on %s\\n", addr)
  log.Fatal(http.ListenAndServe(addr, mux))
}
`.trim();
}

// --------- 3) 빌드 핸들러 (렌더러에서 ipc.send('build-mock', ...) 호출)
// linux는 지원하지 않음. ---------
ipcMain.on("build-mock", async (event, payload) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  try {
    const projectName = payload?.projectName || "mock-server";
    const endpoints = payload?.endpoints || [];

    // 저장 위치 먼저 물어봄
    const targetOS = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "darwin" : "linux";
    const targetArch = process.arch === "arm64" ? "arm64" : "amd64";
    const defaultName = projectName + (targetOS === "windows" ? ".exe" : "");
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "생성된 실행 파일 저장",
      defaultPath: defaultName,
    });
    
    if (canceled || !filePath) {
      event.sender.send("build-mock:done", { ok: false, err: "사용자 취소" });
      return;
    }

    // temp 폴더에 go.mod / main.go 생성
    const work = mkdtempSync(path.join(tmpdir(), "mockbuild-"));
    const goMod = `module local/generated\n\ngo 1.22\n`;
    const goMain = generateGoMain(projectName, endpoints);
    writeFileSync(path.join(work, "go.mod"), goMod);
    writeFileSync(path.join(work, "main.go"), goMain);

    // 내장 go 환경 구성 (현재 OS에서 실행 가능한 go 바이너리를 사용해 타겟 OS/ARCH로 빌드)
    const env = getBundledGoEnv(targetOS, targetArch);

    // go build
    const args = ["build", "-o", filePath, "."];
    const out = await run("go", args, { cwd: work, env });

    event.sender.send("build-mock:done", { ok: true, path: filePath });
  } catch (err) {
    event.sender.send("build-mock:done", { ok: false, err: String(err?.message || err) });
  }
});

function run(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, opts);
    let stderr = "";
    p.stderr.on("data", d => (stderr += d.toString()));
    p.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(stderr || `${cmd} exit ${code}`));
    });
  });
}

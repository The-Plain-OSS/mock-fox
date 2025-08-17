import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "assets/fox-logo.png"), 
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  // createDescriptionWindow() // TODO: remove it
  win.loadFile("index.html");
}

let descriptionWindow;
let lastBuiltPath = "";
let lastBuiltPort = "8080";

function createDescriptionWindow(ctx = {}) {
  const mainWindow = BrowserWindow.getAllWindows()[0];

  descriptionWindow = new BrowserWindow({
    width: 800,
    height: 680,
    modal: true,
        icon: path.join(__dirname, "assets/fox-logo.png"), 

    parent: mainWindow,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  const q = {
    path: ctx.path || lastBuiltPath || "",
    port: String(ctx.port || lastBuiltPort || ""),
  };

  descriptionWindow.loadFile(path.join(__dirname, "description.html"), { query: q });

  descriptionWindow.on("closed", () => {
    descriptionWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // IPC 리스너 
  
  /* --------- 3) 빌드 핸들러 (렌더러에서 ipc.send('build-mock', ...) 호출) --------- */
  // linux 비지원: 안전하게 차단
  ipcMain.on("build-mock", async (event, payload) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
      if (process.platform !== "win32" && process.platform !== "darwin") {
        event.sender.send("build-mock:done", { ok: false, err: "현재 OS는 지원하지 않습니다." });
        return;
      }

      const projectName = payload?.projectName || "mock-server";
      const endpoints = payload?.endpoints || [];

      // 저장 위치 먼저 물어봄
      const targetOS = process.platform === "win32" ? "windows" : "darwin";
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
      await runGo(["version"], { env }); // sanity check
      await runGo(["build", "-o", filePath, "."], { cwd: work, env });

      lastBuiltPath = filePath;
      lastBuiltPort = "8080"; // generateGoMain()의 기본 포트와 일치
      event.sender.send("build-mock:done", { ok: true, path: filePath, port: Number(lastBuiltPort) });
    } catch (err) {
      event.sender.send("build-mock:done", { ok: false, err: String(err?.message || err) });
    }
  });

  
  ipcMain.on('open-description-window', (_e, ctx) => {
    if (!descriptionWindow) {
      createDescriptionWindow(ctx || {});
    } else {
      // 이미 열려 있으면 포그라운드로 올리고 쿼리 업데이트 필요 시 재로딩
      try {
        const q = { path: (ctx && ctx.path) || lastBuiltPath || '', port: String((ctx && ctx.port) || lastBuiltPort || '') };
        descriptionWindow.loadFile(path.join(__dirname, 'description.html'), { query: q });
      } catch {}
      descriptionWindow.focus();
    }
  });

  ipcMain.handle('get-build-context', async () => ({ path: lastBuiltPath, port: lastBuiltPort }));

  ipcMain.handle('open-build-folder', async (_e, { path: p }) => {
    try {
      if (!p) return false;
      const dir = existsSync(p) && (await import('node:fs')).then ? undefined : undefined; // placeholder to avoid async
      // 동기식 처리
      const fs = await import('node:fs');
      const stat = fs.existsSync(p) ? fs.lstatSync(p) : null;
      const target = stat && stat.isDirectory() ? p : path.dirname(p);
      if (!target) return false;
      const result = await shell.openPath(target);
      return result === '';
    } catch { return false; }
  });

  ipcMain.handle('open-browser', async (_e, { url }) => {
    try { await shell.openExternal(url); return true; }
    catch { return false; }
  });

  ipcMain.on('close-description-window', () => {
    if (descriptionWindow) {
      descriptionWindow.close();
    }
  });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

/* --------- 1) 내장 Go 툴체인 경로/환경 설정 --------- */
// resources/<platform-arch>
// win32: windows-amd64 (고정; ARM 윈도우 미지원이면 이대로)
// darwin: darwin-amd64 / darwin-arm64
function pickGoFolder() {
  const plat = process.platform;
  const arch = process.arch; // 'x64' | 'arm64' ...
  if (plat === "win32") return "windows-amd64";
  if (plat === "darwin") return arch === "arm64" ? "darwin-arm64" : "darwin-amd64";
  throw new Error(`unsupported platform: ${plat}/${arch}`);
}

// go 실행파일 절대경로 찾기 (+ 실행권한 보정)
function resolveGoBinaryAbsolute() {
  const root = app.isPackaged ? process.resourcesPath : process.cwd();
  const goRoot = path.join(root, "resources", pickGoFolder());
  const goBin = path.join(goRoot, "bin", process.platform === "win32" ? "go.exe" : "go");

  if (!existsSync(goBin)) {
    throw new Error(`go binary not found: ${goBin}\n(개발 모드라면 <project>/resources/... 경로를 확인하세요)`);
  }
  if (process.platform !== "win32") {
    try { chmodSync(goBin, 0o755); } catch {}
  }
  return { goBin, goRoot };
}

function getBundledGoEnv(targetOS, targetArch) {
  const { goRoot } = resolveGoBinaryAbsolute();
  const env = { ...process.env };
  env.GOROOT = goRoot;
  env.GOPATH = path.join(app.getPath("userData"), "gopath");
  env.PATH = `${path.join(goRoot, "bin")}${path.delimiter}${env.PATH}`;
  env.CGO_ENABLED = "0";
  env.GOOS = targetOS;     // windows | darwin
  env.GOARCH = targetArch; // amd64 | arm64
  return env;
}

/* --------- 2) 입력 스펙 → Go main 코드 생성 --------- */
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

// 'go' 절대경로로 실행 + ENOENT 등 error 이벤트 캐치
function runGo(args, opts) {
  const { goBin } = resolveGoBinaryAbsolute();
  return new Promise((resolve, reject) => {
    const p = spawn(goBin, args, opts);
    let stderr = "";
    p.on("error", (err) => reject(err));
    p.stderr.on("data", d => (stderr += d.toString()));
    p.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(stderr || `${goBin} exit ${code}`));
    });
  });
}

ipcMain.on('set-build-context', (_e, ctx) => { lastBuiltPath = ctx.path; lastBuiltPort = ctx.port; });
ipcMain.on('open-description-window', (_e, ctx) => { createDescriptionWindow(ctx); });
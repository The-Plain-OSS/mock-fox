// 메인 기능 구현 모듈임.

// -------------------------------------------------------------

const isRenderer = typeof window !== "undefined" && typeof document !== "undefined";
if (!isRenderer) {
  console.log("[renderer/main] skipped: not in renderer");
} else {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}

async function boot() {
  try {
    const state = await import("./state.js");
    const { ipc } = await import("./ipc.js");
    const exp = await import("./export.js");

    // state에서 사용
    const { project, saveProject, getCurrent, setCurrent, updateProjectMeta, trimEmpty } = state;
    const { downloadFile, generateSpecHTML } = exp;

    // 짧은 셀렉터
    const $ = (id) => document.getElementById(id);

    // 필수 DOM 요소 확인
    const required = [
      "projectName","projectVersion","projectMeta","exportHtmlBtn","buildBtn","newProjectBtn",
      "searchInput","endpointList","addEndpointBtn",
      "method","endpoint","description",
      "query","headers","requestBody",
      "responseStatus","responseBody",
      "saveBtn","deleteEndpointBtn",
      "copyCurlBtn","curlPreview",
    ];
    const missing = required.filter(id => !$(id));
    if (missing.length) return fatal("필수 요소 누락: " + missing.join(", "));

    // ========== 프로젝트(좌측) ==========
    $("projectName").value = project.name || "";
    $("projectVersion").value = project.version || "";
    applyProjectMeta();

    $("projectName").addEventListener("input", (e) => { project.name = e.target.value; saveProject(); applyProjectMeta(); });
    $("projectVersion").addEventListener("input", (e) => { project.version = e.target.value; saveProject(); applyProjectMeta(); });

    $("exportHtmlBtn").addEventListener("click", () => {
      const html = generateSpecHTML(project);
      downloadFile(`${toSafeFilename(project.name || "api-spec")}.html`, html, "text/html");
    });

    /**
     * mock-server 빌드 요청
     */
    $("buildBtn").addEventListener("click", () => {
      if (!project?.endpoints?.length) {
        alert("엔드포인트가 없습니다. 먼저 하나 이상 추가하세요.");
        return;
      }

      // 설명창

      
      console.log("[renderer] build-mock request:", { projectId: project.id, endpoints: project.endpoints });
      ipc.send("build-mock", { projectId: project.id, endpoints: project.endpoints, projectName: project.name || "mock-server" });
      $("buildBtn").disabled = true;
      $("buildBtn").textContent = "빌드 중...";
      setTimeout(() => { // UX용 보호 타이머
        if ($("buildBtn").disabled) $("buildBtn").textContent = "빌드 중...";
      }, 1500);
    });

    // 빌드 결과 수신
    ipc.on("build-mock:done", (res) => {
      console.log("[renderer] build-mock:done", res);
      $("buildBtn").disabled = false;
      $("buildBtn").textContent = "Mock 서버 빌드";
      if (!res?.ok) {
        alert("빌드 실패: " + (res?.err || "알 수 없는 오류"));
        return;
      }
      ipc.send('open-description-window');
      // alert(`빌드 성공!\n저장 위치: ${res.path}`);
    });

    $("newProjectBtn").addEventListener("click", () => {
      if (!confirm("현재 내용을 초기화하고 새 프로젝트를 시작할까요?")) return;
      const fresh = {
        id: uuid(),
        name: "Untitled Project",
        version: "v0.1.0",
        updatedAt: new Date().toISOString(),
        endpoints: []
      };
      Object.assign(project, fresh);
      setCurrent(null);
      saveProject();
      applyProjectMeta();
      renderSidebar();
      clearForm();
    });

    // ========== 엔드포인트 목록/검색/추가 ==========
    $("searchInput").addEventListener("input", (e) => renderSidebar(e.target.value));
    $("addEndpointBtn").addEventListener("click", () => {
      const ep = {
        id: uuid(),
        method: "GET",
        path: "/resource",
        description: "",
        query: null,           // JSON object
        headers: null,         // JSON object
        body: null,            // JSON object
        responseStatus: 200,   // number
        responseBody: null     // JSON object
      };
      project.endpoints.unshift(ep);
      saveProject();
      renderSidebar($("searchInput").value);
      selectEndpoint(ep.id);
    });

    function renderSidebar(filter = "") {
      const wrap = $("endpointList");
      wrap.innerHTML = "";
      const q = (filter || "").toLowerCase();

      const filtered = project.endpoints.filter(ep => {
        const hay = [ep.method, ep.path, ep.description].join(" ").toLowerCase();
        return hay.includes(q);
      });

      if (filtered.length === 0) {
        wrap.innerHTML = `<div class="p-6 text-sm text-neutral-500">엔드포인트가 없습니다. 아래 ‘+ 엔드포인트 추가’를 눌러 시작하세요.</div>`;
        return;
      }

      filtered.forEach(ep => {
        const btn = document.createElement("button");
        btn.className = "w-full text-left p-4 hover:bg-neutral-50";
        btn.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-md ${badgeColor(ep.method)}">${ep.method}</span>
            <span class="text-sm font-medium truncate">${ep.path || "/"}</span>
          </div>
          <div class="text-xs text-neutral-500 truncate mt-0.5">${ep.description || ""}</div>
        `;
        btn.addEventListener("click", () => selectEndpoint(ep.id));
        wrap.appendChild(btn);
      });
    }

    function badgeColor(method){
      switch(method){
        case "GET": return "bg-emerald-100 text-emerald-700";
        case "POST": return "bg-blue-100 text-blue-700";
        case "PUT": return "bg-amber-100 text-amber-700";
        case "PATCH": return "bg-purple-100 text-purple-700";
        case "DELETE": return "bg-rose-100 text-rose-700";
        default: return "bg-neutral-100 text-neutral-700";
      }
    }

    // ========== 폼 바인딩/수집 ==========
    function bindForm(ep){
      $("method").value = ep.method || "GET";
      $("endpoint").value = ep.path || "";
      $("description").value = ep.description || "";

      $("query").value        = ep.query ? JSON.stringify(ep.query, null, 2) : "";
      $("headers").value      = ep.headers ? JSON.stringify(ep.headers, null, 2) : "";
      $("requestBody").value  = ep.body ? JSON.stringify(ep.body, null, 2) : "";

      $("responseStatus").value = String(ep.responseStatus || 200);
      $("responseBody").value   = ep.responseBody ? JSON.stringify(ep.responseBody, null, 2) : "";

      updateCurlPreview();
    }

    function clearForm(){
      ["method","endpoint","description","query","headers","requestBody","responseBody"].forEach(id => { const el = $(id); if (el) el.value = ""; });
      $("responseStatus").value = "200";
      $("curlPreview").textContent = "";
    }

    function selectEndpoint(id){
      const ep = project.endpoints.find(e => e.id === id);
      if (!ep) return;
      setCurrent(id);
      bindForm(ep);
      renderSidebar($("searchInput").value);
    }

    function collectForm(){
      const method = $("method").value;
      const path = trimEmpty($("endpoint").value);
      const description = trimEmpty($("description").value);

      const query        = parseJsonMaybe($("query").value, "Query(JSON) 형식이 올바르지 않습니다.");
      const headers      = parseJsonMaybe($("headers").value, "Headers(JSON) 형식이 올바르지 않습니다.");
      const body         = parseJsonMaybe($("requestBody").value, "Request Body(JSON) 형식이 올바르지 않습니다.");
      const responseBody = parseJsonMaybe($("responseBody").value, "Response(JSON) 형식이 올바르지 않습니다.");

      const responseStatus = Number($("responseStatus").value || 200);

      return { method, path, description, query, headers, body, responseStatus, responseBody };
    }

    function parseJsonMaybe(raw, errMsg){
      const s = trimEmpty(raw);
      if (!s) return null;
      try { return JSON.parse(s); }
      catch { alert(errMsg); throw new Error(errMsg); }
    }

    // 저장
    $("saveBtn").addEventListener("click", () => {
      const current = getCurrent();
      if (!current) return alert("먼저 엔드포인트를 추가하세요.");

      const data = collectForm();
      if (!data.path?.startsWith("/")) return alert("엔드포인트는 / 로 시작해야 합니다.");

      const i = project.endpoints.findIndex(e => e.id === current.id);
      project.endpoints[i] = { ...project.endpoints[i], ...data };
      saveProject();

      console.log("[renderer] saved:", project.endpoints[i]);
      ipc.send("save-spec", project.endpoints[i]);
      renderSidebar($("searchInput").value);
      updateCurlPreview();
    });

    // 삭제
    $("deleteEndpointBtn").addEventListener("click", () => {
      const current = getCurrent(); if (!current) return;
      const idx = project.endpoints.findIndex(e => e.id === current.id);
      if (idx < 0) return;
      if (!confirm("현재 엔드포인트를 삭제할까요?")) return;
      project.endpoints.splice(idx, 1);
      setCurrent(project.endpoints[0]?.id || null);
      saveProject();
      renderSidebar($("searchInput").value);
      const next = getCurrent();
      if (next) bindForm(next); else clearForm();
    });

    // cURL 미리보기: query→쿼리스트링, headers→-H 멀티, body→--data
    function updateCurlPreview(){
      const ep = getCurrent();
      if (!ep) { $("curlPreview").textContent = ""; return; }

      const method = ep.method || "GET";
      const url = buildUrl(ep.path || "/", ep.query || null);

      const headers = ep.headers && typeof ep.headers === "object"
        ? Object.entries(ep.headers).map(([k,v]) => `-H "${k}: ${String(v)}"`).join(" ")
        : `-H "Content-Type: application/json"`;

      const body = ep.body ? `--data '${JSON.stringify(ep.body)}'` : "";

      const curl = `curl -X ${method} "${url}" ${headers} ${body}`.trim();
      $("curlPreview").textContent = curl;
    }

    function buildUrl(path, query){
      if (!query || typeof query !== "object" || !Object.keys(query).length) return path;
      const qs = Object.entries(query)
        .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
      return `${path}?${qs}`;
    }

    $("copyCurlBtn").addEventListener("click", () => {
      const text = $("curlPreview").textContent || "";
      navigator.clipboard?.writeText(text).then(() => {
        $("copyCurlBtn").textContent = "복사됨!";
        setTimeout(() => ($("copyCurlBtn").textContent = "복사"), 800);
      });
    });

    // 초기 렌더
    renderSidebar();
    if (project.endpoints[0]) selectEndpoint(project.endpoints[0].id);

    // 유틸
    function applyProjectMeta(){ updateProjectMeta?.(); }
    function toSafeFilename(name){
      return (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    function uuid(){
      try { if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID(); } catch {}
      return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }
    function fatal(msg){
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;inset:16px;background:#fff;border:1px solid #e11d48;border-radius:12px;padding:12px;z-index:999999;font:12px/1.4 ui-sans-serif';
      div.innerHTML = `<b style="color:#be123c">렌더러 초기화 오류</b><pre style="white-space:pre-wrap;margin-top:8px">${msg}</pre>`;
      document.body.appendChild(div);
    }

  } catch (err) {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;inset:16px;background:#fff;border:1px solid #e11d48;border-radius:12px;padding:12px;z-index:999999;font:12px/1.4 ui-sans-serif';
    div.innerHTML = `<b style="color:#be123c">렌더러 초기화 오류</b><pre style="white-space:pre-wrap;margin-top:8px">${String(err.stack||err)}</pre>`;
    document.body.appendChild(div);
  }

  function generateGoMain(projectName, endpointsRaw) {
  // 1) 경로별로 EP들을 묶는다(메서드 스위치 위해)
  const byPath = new Map();
  for (const raw of (endpointsRaw || [])) {
    const ep = {
      id: raw.id,
      method: (raw.method || "GET").toUpperCase(),
      path: raw.path || "/",
      description: raw.description || "",
      headers: raw.headers || {},
      responses: Array.isArray(raw.responses) ? raw.responses : null,
      responseStatus: typeof raw.responseStatus === "number" ? raw.responseStatus : 200,
      responseBody: raw.responseBody ?? null
    };
    const arr = byPath.get(ep.path) || [];
    // 같은 메서드는 마지막 정의가 우선
    const filtered = arr.filter(e => e.method !== ep.method);
    byPath.set(ep.path, [...filtered, ep]);
  }

  const spec = [...byPath.entries()].map(([path, items]) => ({ path, items }));
  const specJson = JSON.stringify(spec);

  return `
package main

import (
  "encoding/json"
  "flag"
  "log"
  "net/http"
  "os"
  "strconv"
  "time"
)

type Resp struct {
  Status      int         \`json:"status"\`
  ContentType string      \`json:"contentType"\`
  Desc        string      \`json:"desc"\`
  Body        interface{} \`json:"body"\`
}

type EP struct {
  ID             string                 \`json:"id"\`
  Method         string                 \`json:"method"\`
  Path           string                 \`json:"path"\`
  Description    string                 \`json:"description"\`
  Headers        map[string]interface{} \`json:"headers"\`
  Responses      []Resp                 \`json:"responses"\`
  ResponseStatus int                    \`json:"responseStatus"\`
  ResponseBody   interface{}            \`json:"responseBody"\`
}

type Group struct {
  Path  string \`json:"path"\`
  Items []EP   \`json:"items"\`
}

func main() {
  // ---- 스펙 언마샬 ----
  var groups []Group
  _ = json.Unmarshal([]byte(${JSON.stringify(specJson)}), &groups)

  // ---- 포트/CORS 플래그 ----
  defPort := 8080
  if v := os.Getenv("PORT"); v != "" {
    if p, err := strconv.Atoi(v); err == nil && p > 0 { defPort = p }
  }
  port := flag.Int("port", defPort, "listening port")
  cors := flag.Bool("cors", true, "enable permissive CORS")
  flag.Parse()

  mux := http.NewServeMux()

  for _, g := range groups {
    // 경로마다 한 번만 핸들러 등록
    table := make(map[string]EP) // method -> EP
    for _, ep := range g.Items {
      table[ep.Method] = ep
    }

    mux.HandleFunc(g.Path, func(w http.ResponseWriter, r *http.Request) {
      // CORS (옵션)
      if *cors {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Headers", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        if r.Method == "OPTIONS" { w.WriteHeader(200); return }
      }

      ep, ok := table[r.Method]
      if !ok {
        w.WriteHeader(http.StatusMethodNotAllowed)
        return
      }

      // 지연 (헤더에 X-Delay(ms) 있으면)
      if ep.Headers != nil {
        if v, ok := ep.Headers["X-Delay"]; ok {
          switch t := v.(type) {
          case float64:
            time.Sleep(time.Duration(int(t)) * time.Millisecond)
          case string:
            if n, err := strconv.Atoi(t); err == nil {
              time.Sleep(time.Duration(n) * time.Millisecond)
            }
          }
        }
      }

      // Content-Type 결정 우선순위: responses[].contentType > 헤더.Content-Type > 기본
      ct := "application/json"
      if len(ep.Responses) > 0 && ep.Responses[0].ContentType != "" {
        ct = ep.Responses[0].ContentType
      } else if ep.Headers != nil {
        if v, ok := ep.Headers["Content-Type"]; ok {
          switch s := v.(type) {
          case string:
            if s != "" { ct = s }
          }
        }
      }
      w.Header().Set("Content-Type", ct)

      // 일반 헤더 주입 (Content-Type, X-Delay 제외)
      if ep.Headers != nil {
        for k, v := range ep.Headers {
          if k == "Content-Type" || k == "X-Delay" { continue }
          w.Header().Set(k, toString(v))
        }
      }

      // 응답 쓰기
      if len(ep.Responses) > 0 {
        w.WriteHeader(ep.Responses[0].Status)
        if ep.Responses[0].Body != nil {
          _ = json.NewEncoder(w).Encode(ep.Responses[0].Body)
        }
        return
      }

      status := ep.ResponseStatus
      if status == 0 { status = 200 }
      w.WriteHeader(status)
      if ep.ResponseBody != nil {
        _ = json.NewEncoder(w).Encode(ep.ResponseBody)
      }
    })
  }

  addr := ":" + strconv.Itoa(*port)
  log.Printf("${projectName || "mock-server"} listening on %s\\n", addr)
  log.Fatal(http.ListenAndServe(addr, mux))
}

func toString(v interface{}) string {
  switch t := v.(type) {
  case string:
    return t
  case float64:
    // JSON 숫자는 float64로 들어오므로 정수로 보이면 정수로 출력
    if t == float64(int64(t)) {
      return strconv.FormatInt(int64(t), 10)
    }
    return strconv.FormatFloat(t, 'f', -1, 64)
  case bool:
    if t { return "true" }
    return "false"
  default:
    b, _ := json.Marshal(t)
    return string(b)
  }
}
`.trim();
}
}

/**
 * @license
 * Copyright (c) 2025 The-Plain-OSS
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
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
    const { versionUI } = await import("./version-ui.js");
    const { templateUI } = await import("./template-ui.js");

    // state에서 사용
    const { project, saveProject, getCurrent, setCurrent, updateProjectMeta, trimEmpty } = state;
    const { downloadFile, generateSpecHTML } = exp;

    // 짧은 셀렉터
    const $ = (id) => document.getElementById(id);

    // 필수 DOM 요소 확인
    const required = [
      "projectName","projectMeta","exportHtmlBtn","buildBtn","newProjectBtn",
      "searchInput","endpointList","addEndpointBtn",
      "method","endpoint","description",
      "query","headers","requestBody",
      "responseStatus","responseBody",
      "deleteEndpointBtn",
      "copyCurlBtn","curlPreview",
      "modeToggle", "interfaceMode", "codeMode"
    ];
    const missing = required.filter(id => !$(id));
    if (missing.length) return fatal("필수 요소 누락: " + missing.join(", "));

    // ========== 프로젝트(좌측) ==========
    $("projectName").value = project.name || "";
    applyProjectMeta();
    updateProjectStats();

    $("projectName").addEventListener("input", (e) => { project.name = e.target.value; saveProject(); applyProjectMeta(); });

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
      const btn = $("buildBtn");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Mock 서버 빌드";
      }

      // 결과 검증
      if (!res || res.ok === false) {
        const msg = (res && res.err) ? String(res.err) : "알 수 없는 오류";
        alert("빌드 실패: " + msg);
        return;
      }

      // 경로/포트 정규화
      const path = typeof res.path === "string" && res.path.trim() ? res.path : "";
      const port = String(res.port || 3000);

      // 메인에 컨텍스트 저장(설명창에서 IPC 폴백으로도 읽을 수 있게)
      try { ipc.send("set-build-context", { path, port }); } catch (_) {}

      // 설명창 열기: 쿼리 인자와 함께 요청
      try { ipc.send("open-description-window", { path, port }); }
      catch (e) {
        console.error("open-description-window 실패", e);
        alert("설명창을 열 수 없습니다.");
      }
    });

    // 새프로젝트 버튼은 이제 templateUI에서 처리합니다

    // ========== 모드 토글 기능 ==========
    let currentMode = 'interface'; // 'interface' or 'code'

    // 모드 전환 함수
    function switchMode(mode) {
      const interfaceMode = $('interfaceMode');
      const codeMode = $('codeMode');
      const modeToggle = $('modeToggle');
      const modeToggleCircle = document.getElementById('modeToggleCircle');
      const interfaceLabel = document.getElementById('interfaceLabel');
      const codeLabel = document.getElementById('codeLabel');

      if (mode === 'code') {
        // 코드 모드로 전환
        currentMode = 'code';
        interfaceMode.classList.add('hidden');
        codeMode.classList.remove('hidden');
        modeToggleCircle.style.transform = 'translateX(24px)';
        modeToggleCircle.classList.remove('bg-gradient-to-r', 'from-emerald-500', 'to-green-500');
        modeToggleCircle.classList.add('bg-gradient-to-r', 'from-purple-500', 'to-indigo-500');
        interfaceLabel.classList.add('text-neutral-400');
        interfaceLabel.classList.remove('text-white');
        codeLabel.classList.remove('text-neutral-400');
        codeLabel.classList.add('text-white');

        // 인터페이스 데이터를 코드로 동기화
        syncInterfaceToCode();
      } else {
        // 인터페이스 모드로 전환
        currentMode = 'interface';
        codeMode.classList.add('hidden');
        interfaceMode.classList.remove('hidden');
        modeToggleCircle.style.transform = 'translateX(0px)';
        modeToggleCircle.classList.remove('bg-gradient-to-r', 'from-purple-500', 'to-indigo-500');
        modeToggleCircle.classList.add('bg-gradient-to-r', 'from-emerald-500', 'to-green-500');
        codeLabel.classList.add('text-neutral-400');
        codeLabel.classList.remove('text-white');
        interfaceLabel.classList.remove('text-neutral-400');
        interfaceLabel.classList.add('text-white');

        // 코드 데이터를 인터페이스로 동기화
        syncCodeToInterface();
      }
    }

    // 인터페이스 데이터를 코드로 동기화
    function syncInterfaceToCode() {
      const codeEditor = document.getElementById('codeEditor');
      if (!codeEditor) return;

      const projectData = {
        name: project.name || "",
        endpoints: project.endpoints.map(ep => ({
          id: ep.id,
          method: ep.method || "GET",
          path: ep.path || "/",
          description: ep.description || "",
          query: ep.query,
          headers: ep.headers,
          requestBody: ep.body,
          responseStatus: ep.responseStatus || 200,
          responseBody: ep.responseBody
        }))
      };

      codeEditor.value = JSON.stringify(projectData, null, 2);
      updateCodeValidation();
    }

    // 코드 데이터를 인터페이스로 동기화
    function syncCodeToInterface() {
      const codeEditor = document.getElementById('codeEditor');
      if (!codeEditor) return;

      try {
        const codeData = JSON.parse(codeEditor.value);

        // 프로젝트 이름 업데이트
        if (codeData.name) {
          project.name = codeData.name;
          $("projectName").value = project.name;
        }

        // 엔드포인트 업데이트
        if (Array.isArray(codeData.endpoints)) {
          project.endpoints = codeData.endpoints.map(ep => ({
            id: ep.id || uuid(),
            method: ep.method || "GET",
            path: ep.path || "/",
            description: ep.description || "",
            query: ep.query || null,
            headers: ep.headers || null,
            body: ep.requestBody || null,
            responseStatus: ep.responseStatus || 200,
            responseBody: ep.responseBody || null
          }));
        }

        saveProject();
        applyProjectMeta();
        renderSidebar();

        // 첫 번째 엔드포인트 선택
        if (project.endpoints[0]) {
          selectEndpoint(project.endpoints[0].id);
        } else {
          clearForm();
        }

      } catch (error) {
        console.error('코드 파싱 오류:', error);
        showToast('코드 형식이 올바르지 않습니다.', 'error');
      }
    }


    // 코드 검증 함수
    function updateCodeValidation() {
      const codeEditor = document.getElementById('codeEditor');
      const validationStatus = document.getElementById('validationStatus');
      const lineCol = document.getElementById('lineCol');

      if (!codeEditor || !validationStatus) return;

      try {
        JSON.parse(codeEditor.value);
        validationStatus.textContent = '✓ 유효한 JSON';
        validationStatus.className = 'text-xs text-emerald-400';
      } catch (error) {
        validationStatus.textContent = '✗ JSON 오류: ' + error.message;
        validationStatus.className = 'text-xs text-red-400';
      }

      // 커서 위치 업데이트
      if (lineCol) {
        const lines = codeEditor.value.substr(0, codeEditor.selectionStart).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        lineCol.textContent = `${line}:${col}`;
      }
    }

    // 모드 토글 이벤트 리스너
    $('modeToggle').addEventListener('click', () => {
      switchMode(currentMode === 'interface' ? 'code' : 'interface');
    });

    // 코드 에디터 이벤트 리스너들 - 즉시 또는 DOM 로드 후
    function setupCodeEditor() {
      const codeEditor = document.getElementById('codeEditor');
      console.log('코드 에디터 검색:', codeEditor);

      if (codeEditor) {
        console.log('코드 에디터 이벤트 리스너 등록 중...');

        // 실시간 검증 및 자동저장
        let codeAutoSaveTimeout;
        const debouncedCodeAutoSave = () => {
          clearTimeout(codeAutoSaveTimeout);
          codeAutoSaveTimeout = setTimeout(() => {
            console.log('자동저장 시도 중...');
            try {
              JSON.parse(codeEditor.value); // 검증
              console.log('JSON 유효함, syncCodeToInterface 호출');
              syncCodeToInterface();
            } catch (error) {
              console.log('JSON 파싱 오류 (자동저장 스킵):', error.message);
            }
          }, 1000); // 1초 후 자동저장
        };

        codeEditor.addEventListener('input', () => {
          console.log('코드 에디터 input 이벤트!');
          updateCodeValidation();
          debouncedCodeAutoSave();
        });
        codeEditor.addEventListener('keyup', updateCodeValidation);
        codeEditor.addEventListener('click', updateCodeValidation);

        // 탭 키 지원
        codeEditor.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            codeEditor.value = codeEditor.value.substring(0, start) + '  ' + codeEditor.value.substring(end);
            codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
            updateCodeValidation();
          }
        });
      }

      // 템플릿 버튼들 이벤트 리스너
      const templateButtons = [
        { id: 'restApiTemplate', template: getRestApiTemplate },
        { id: 'crudTemplate', template: getCrudTemplate },
        { id: 'authTemplate', template: getAuthTemplate },
        { id: 'ecommerceTemplate', template: getEcommerceTemplate }
      ];

      templateButtons.forEach(({ id, template }) => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener('click', () => {
            codeEditor.value = JSON.stringify(template(), null, 2);
            updateCodeValidation();
            showToast('템플릿이 로드되었습니다.', 'success');
          });
        }
      });
    }

    // 즉시 시도
    setupCodeEditor();

    // DOM이 아직 로드되지 않았다면 DOMContentLoaded에서도 시도
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupCodeEditor);
    }

    // 토스트 메시지 표시 함수
    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 transform translate-x-full z-50 ${
        type === 'success' ? 'bg-emerald-600' :
        type === 'error' ? 'bg-red-600' : 'bg-blue-600'
      }`;
      toast.textContent = message;
      document.body.appendChild(toast);

      // 애니메이션
      setTimeout(() => toast.classList.remove('translate-x-full'), 100);
      setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }

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

    // 자동저장 함수
    function autoSave() {
      const current = getCurrent();
      if (!current) return;

      try {
        const data = collectForm();
        if (data.path && !data.path.startsWith("/")) {
          console.warn("엔드포인트는 / 로 시작해야 합니다.");
          return;
        }

        const i = project.endpoints.findIndex(e => e.id === current.id);
        if (i >= 0) {
          project.endpoints[i] = { ...project.endpoints[i], ...data };
          saveProject();
          console.log("[renderer] auto-saved:", project.endpoints[i]);
          ipc.send("save-spec", project.endpoints[i]);
          renderSidebar($("searchInput").value);
          updateCurlPreview();
          updateProjectStats();
        }
      } catch (error) {
        console.error("자동저장 오류:", error);
      }
    }

    // 자동저장을 위한 디바운스 함수
    let autoSaveTimeout;
    function debouncedAutoSave() {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(autoSave, 500); // 500ms 후 자동저장
    }

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

    // UI 새로고침 이벤트 리스너 (버전 복원 시)
    window.addEventListener("refresh-ui", () => {
      // 프로젝트 메타 업데이트
      $("projectName").value = project.name || "";
      applyProjectMeta();

      // 사이드바 새로고침
      renderSidebar();

      // 첫 번째 엔드포인트 선택
      if (project.endpoints[0]) {
        selectEndpoint(project.endpoints[0].id);
      } else {
        clearForm();
      }
    });

    // 폼 입력 요소들에 자동저장 이벤트 리스너 추가
    const formInputs = ["method", "endpoint", "description", "query", "headers", "requestBody", "responseStatus", "responseBody"];
    formInputs.forEach(id => {
      const element = $(id);
      if (element) {
        element.addEventListener("input", debouncedAutoSave);
        element.addEventListener("change", debouncedAutoSave);
      }
    });

    // 초기 렌더
    renderSidebar();
    if (project.endpoints[0]) selectEndpoint(project.endpoints[0].id);

    // 유틸
    function applyProjectMeta(){ updateProjectMeta?.(); updateProjectStats(); }

    function updateProjectStats() {
      const statsEndpoints = document.getElementById('statsEndpoints');
      const statsModified = document.getElementById('statsModified');

      if (statsEndpoints) {
        statsEndpoints.textContent = `${project.endpoints.length}개`;
      }

      if (statsModified) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        statsModified.textContent = timeStr;
      }
    }
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

    // ========== AI 친화적 템플릿 함수들 ==========
    function getRestApiTemplate() {
      return {
        name: "REST API 프로젝트",
        endpoints: [
          {
            id: uuid(),
            method: "GET",
            path: "/api/users",
            description: "사용자 목록 조회",
            query: { page: 1, limit: 10 },
            headers: { "Content-Type": "application/json" },
            requestBody: null,
            responseStatus: 200,
            responseBody: {
              users: [
                { id: 1, name: "John Doe", email: "john@example.com" },
                { id: 2, name: "Jane Smith", email: "jane@example.com" }
              ],
              pagination: { page: 1, limit: 10, total: 2 }
            }
          },
          {
            id: uuid(),
            method: "POST",
            path: "/api/users",
            description: "새 사용자 생성",
            query: null,
            headers: { "Content-Type": "application/json" },
            requestBody: { name: "New User", email: "user@example.com" },
            responseStatus: 201,
            responseBody: { id: 3, name: "New User", email: "user@example.com", created_at: "2024-01-01T00:00:00Z" }
          }
        ]
      };
    }

    function getCrudTemplate() {
      return {
        name: "CRUD API 프로젝트",
        endpoints: [
          {
            id: uuid(),
            method: "GET",
            path: "/api/products",
            description: "제품 목록 조회",
            query: { category: "electronics", sort: "name" },
            headers: { "Content-Type": "application/json" },
            requestBody: null,
            responseStatus: 200,
            responseBody: [
              { id: 1, name: "Laptop", price: 999.99, category: "electronics" },
              { id: 2, name: "Phone", price: 599.99, category: "electronics" }
            ]
          },
          {
            id: uuid(),
            method: "POST",
            path: "/api/products",
            description: "새 제품 생성",
            query: null,
            headers: { "Content-Type": "application/json" },
            requestBody: { name: "New Product", price: 299.99, category: "electronics" },
            responseStatus: 201,
            responseBody: { id: 3, name: "New Product", price: 299.99, category: "electronics", created_at: "2024-01-01T00:00:00Z" }
          },
          {
            id: uuid(),
            method: "PUT",
            path: "/api/products/{id}",
            description: "제품 정보 수정",
            query: null,
            headers: { "Content-Type": "application/json" },
            requestBody: { name: "Updated Product", price: 399.99 },
            responseStatus: 200,
            responseBody: { id: 1, name: "Updated Product", price: 399.99, category: "electronics", updated_at: "2024-01-01T00:00:00Z" }
          },
          {
            id: uuid(),
            method: "DELETE",
            path: "/api/products/{id}",
            description: "제품 삭제",
            query: null,
            headers: null,
            requestBody: null,
            responseStatus: 204,
            responseBody: null
          }
        ]
      };
    }

    function getAuthTemplate() {
      return {
        name: "인증 API 프로젝트",
        endpoints: [
          {
            id: uuid(),
            method: "POST",
            path: "/api/auth/login",
            description: "사용자 로그인",
            query: null,
            headers: { "Content-Type": "application/json" },
            requestBody: { email: "user@example.com", password: "password123" },
            responseStatus: 200,
            responseBody: {
              access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              refresh_token: "dGVzdC1yZWZyZXNoLXRva2Vu",
              expires_in: 3600,
              user: { id: 1, email: "user@example.com", name: "John Doe" }
            }
          },
          {
            id: uuid(),
            method: "POST",
            path: "/api/auth/refresh",
            description: "토큰 갱신",
            query: null,
            headers: { "Content-Type": "application/json" },
            requestBody: { refresh_token: "dGVzdC1yZWZyZXNoLXRva2Vu" },
            responseStatus: 200,
            responseBody: {
              access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              expires_in: 3600
            }
          },
          {
            id: uuid(),
            method: "GET",
            path: "/api/auth/profile",
            description: "사용자 프로필 조회",
            query: null,
            headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            requestBody: null,
            responseStatus: 200,
            responseBody: { id: 1, email: "user@example.com", name: "John Doe", created_at: "2024-01-01T00:00:00Z" }
          }
        ]
      };
    }

    function getEcommerceTemplate() {
      return {
        name: "이커머스 API 프로젝트",
        endpoints: [
          {
            id: uuid(),
            method: "GET",
            path: "/api/products",
            description: "상품 목록 조회",
            query: { category: "clothing", page: 1, limit: 20 },
            headers: { "Content-Type": "application/json" },
            requestBody: null,
            responseStatus: 200,
            responseBody: {
              products: [
                { id: 1, name: "T-Shirt", price: 29.99, category: "clothing", stock: 100 },
                { id: 2, name: "Jeans", price: 59.99, category: "clothing", stock: 50 }
              ],
              pagination: { page: 1, limit: 20, total: 2, total_pages: 1 }
            }
          },
          {
            id: uuid(),
            method: "POST",
            path: "/api/cart",
            description: "장바구니에 상품 추가",
            query: null,
            headers: { "Content-Type": "application/json", "Authorization": "Bearer token" },
            requestBody: { product_id: 1, quantity: 2 },
            responseStatus: 200,
            responseBody: {
              cart: {
                id: 1,
                items: [{ product_id: 1, quantity: 2, price: 29.99, total: 59.98 }],
                total_amount: 59.98
              }
            }
          },
          {
            id: uuid(),
            method: "POST",
            path: "/api/orders",
            description: "주문 생성",
            query: null,
            headers: { "Content-Type": "application/json", "Authorization": "Bearer token" },
            requestBody: {
              items: [{ product_id: 1, quantity: 2 }],
              shipping_address: "123 Main St, City, Country",
              payment_method: "credit_card"
            },
            responseStatus: 201,
            responseBody: {
              order: {
                id: "ORD-001",
                status: "pending",
                total_amount: 59.98,
                created_at: "2024-01-01T00:00:00Z"
              }
            }
          }
        ]
      };
    }
}
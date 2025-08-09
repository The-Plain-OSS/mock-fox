/**
 * ui 변화에 대한 모듈임.
 */

import { $, project, currentId, setCurrent, jsonPretty, safeJsonParse, trimEmpty, saveProject, getCurrent, updateProjectMeta } from "./state.js";

export function initHeader(){
  $("projectName").value = project.name || "";
  $("projectVersion").value = project.version || "";
  updateProjectMeta();
  $("projectName").addEventListener("input", (e)=>{ project.name = e.target.value; saveProject(); });
  $("projectVersion").addEventListener("input", (e)=>{ project.version = e.target.value; saveProject(); });
}

export function renderSidebar(filter=""){
  const wrap = $("endpointList");
  wrap.innerHTML = "";
  const q = (filter||"").toLowerCase();
  const filtered = project.endpoints.filter(ep=>{
    const hay = [ep.method, ep.path, ep.description, (ep.tags||[]).join(",")].join(" ").toLowerCase();
    return hay.includes(q);
  });

  if(filtered.length === 0){
    wrap.innerHTML = `<div class="p-6 text-sm text-neutral-500">엔드포인트가 없습니다. 우측 상단 ‘+ 추가’를 눌러 시작하세요.</div>`;
    return;
  }

  filtered.forEach(ep=>{
    const active = ep.id === currentId;
    const el = document.createElement("button");
    el.className = `w-full text-left p-4 hover:bg-neutral-50 ${active ? "bg-neutral-50" : ""}`;
    el.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="text-xs font-medium px-2 py-0.5 rounded-md ${badgeColor(ep.method)}">${ep.method}</div>
        <div class="text-[10px] text-neutral-400">${(ep.tags||[]).slice(0,3).join(" · ")}</div>
      </div>
      <div class="mt-1 text-sm font-medium truncate">${ep.path || "/"}</div>
      <div class="text-xs text-neutral-500 truncate">${ep.description || ""}</div>
    `;
    el.addEventListener("click", ()=> selectEndpoint(ep.id));
    wrap.appendChild(el);
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

// -------- Form --------
export function bindForm(ep){
  $("method").value = ep.method || "GET";
  $("endpoint").value = ep.path || "";
  $("description").value = ep.description || "";
  $("query").value = jsonPretty(ep.query) || "";
  $("requestBody").value = jsonPretty(ep.body) || "";
  $("headers").value = jsonPretty(ep.headers) || "";
  $("tags").value = (ep.tags || []).join(", ");

  renderExamples(ep.examples || []);
  renderResponses(ep.responses || []);
  updateCurlPreview();
}

export function clearForm(){
  ["method","endpoint","description","query","requestBody","headers","tags"].forEach(id=>{ if($(id)) $(id).value = ""; });
  $("examplesWrap").innerHTML = "";
  $("responsesWrap").innerHTML = "";
  $("curlPreview").textContent = "";
}

export function collectForm(){
  return {
    method: $("method").value,
    path: trimEmpty($("endpoint").value),
    description: trimEmpty($("description").value),
    query: safeJsonParse($("query").value, null),
    body: safeJsonParse($("requestBody").value, null),
    headers: safeJsonParse($("headers").value, null),
    tags: trimEmpty($("tags").value).split(",").map(s=>s.trim()).filter(Boolean),
    examples: collectExamples(),
    responses: collectResponses()
  };
}

export function selectEndpoint(id){
  const ep = project.endpoints.find(e=>e.id===id);
  if(!ep) return;
  setCurrent(id);
  bindForm(ep);
  renderSidebar($("searchInput").value);
}

// -------- Examples / Responses --------
export function renderExamples(list){
  const wrap = $("examplesWrap");
  wrap.innerHTML = "";
  list.forEach((ex, idx)=> wrap.appendChild(exampleItem(ex, idx)));
}

function exampleItem(ex, idx){
  const div = document.createElement("div");
  div.className = "rounded-xl border border-neutral-200";
  div.innerHTML = `
    <div class="p-3 flex items-center justify-between">
      <div class="text-sm font-medium">예시 ${idx+1}</div>
      <button class="text-xs text-neutral-500 hover:underline" data-role="remove">삭제</button>
    </div>
    <div class="px-3 pb-3">
      <input class="w-full mb-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm" data-role="title" placeholder="예: 성공 케이스" value="${ex.title||""}">
      <textarea rows="4" class="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs" data-role="payload" placeholder='요청/응답 예시 JSON'>${ex.payload ? JSON.stringify(ex.payload,null,2) : ""}</textarea>
    </div>
  `;
  div.querySelector('[data-role="remove"]').addEventListener("click", ()=>{
    const ep = getCurrent();
    ep.examples.splice(idx,1);
    saveProject();
    bindForm(ep);
  });
  return div;
}

function collectExamples(){
  const nodes = Array.from(document.querySelectorAll("#examplesWrap > div"));
  return nodes.map(node=>{
    const title = node.querySelector('[data-role="title"]').value;
    const payload = safeJsonParse(node.querySelector('[data-role="payload"]').value, null);
    return { title, payload };
  });
}

export function renderResponses(list){
  const wrap = $("responsesWrap");
  wrap.innerHTML = "";
  list.forEach((res, idx)=> wrap.appendChild(responseItem(res, idx)));
}

function responseItem(res, idx){
  const div = document.createElement("div");
  div.className = "rounded-xl border border-neutral-200";
  div.innerHTML = `
    <div class="p-3 flex items-center justify-between">
      <div class="text-sm font-medium">응답 ${idx+1}</div>
      <button class="text-xs text-neutral-500 hover:underline" data-role="remove">삭제</button>
    </div>
    <div class="px-3 pb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
      <input class="rounded-lg border border-neutral-200 px-3 py-2 text-sm" data-role="status" placeholder="상태코드 (예: 200)" value="${res.status||""}">
      <input class="rounded-lg border border-neutral-200 px-3 py-2 text-sm" data-role="contentType" placeholder="Content-Type" value="${res.contentType||"application/json"}">
      <input class="rounded-lg border border-neutral-200 px-3 py-2 text-sm" data-role="desc" placeholder="설명" value="${res.desc||""}">
    </div>
    <div class="px-3 pb-3">
      <textarea rows="5" class="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs" data-role="body" placeholder='응답 바디(JSON)'>${res.body ? JSON.stringify(res.body,null,2) : ""}</textarea>
    </div>
  `;
  div.querySelector('[data-role="remove"]').addEventListener("click", ()=>{
    const ep = getCurrent();
    ep.responses.splice(idx,1);
    saveProject();
    bindForm(ep);
  });
  return div;
}

function collectResponses(){
  const nodes = Array.from(document.querySelectorAll("#responsesWrap > div"));
  return nodes.map(node=>{
    return {
      status: Number(node.querySelector('[data-role="status"]').value || 200),
      contentType: node.querySelector('[data-role="contentType"]').value || "application/json",
      desc: node.querySelector('[data-role="desc"]').value || "",
      body: safeJsonParse(node.querySelector('[data-role="body"]').value, null)
    }
  });
}

// -------- cURL --------
export function updateCurlPreview(){
  const ep = getCurrent();
  if(!ep){ $("curlPreview").textContent = ""; return; }
  const url = ep.path || "/";
  const headers = ep.headers || {};
  const headerFlags = Object.entries(headers).map(([k,v])=>`-H "${k}: ${v}"`).join(" ");
  const body = ep.body ? `--data '${JSON.stringify(ep.body)}'` : "";
  const qs = ep.query ? "?" + new URLSearchParams(Object.entries(ep.query)).toString() : "";
  const curl = `curl -X ${ep.method} "${url}${qs}" ${headerFlags} ${body}`.trim();
  $("curlPreview").textContent = curl;
}

// expose for other modules
export { collectExamples, collectResponses };

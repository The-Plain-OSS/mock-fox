/**
 * 명세 HTML export 모듈 (접기/펼치기 + 응답 정규화 + UI 개선)
 */

import { toKebab } from "./state.js";

export function downloadFile(filename, content, mime){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function generateSpecHTML(project){
  const style = `
    <style>
      :root{
        --bg:#fafafa; --card:#fff; --muted:#6b7280; --border:#e5e7eb;
        --ink:#0a0a0a; --ink-weak:#374151;
        --ok:#10b981; --warn:#f59e0b; --err:#ef4444;
      }
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans","Apple Color Emoji","Segoe UI Emoji",sans-serif}
      .container{max-width:1100px;margin:0 auto;padding:40px 24px}
      h1{font-size:28px;margin:0 0 4px}
      h2{font-size:20px;margin:24px 0 12px}
      .muted{color:var(--muted)}
      .sec{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin:16px 0}
      pre{background:#f6f6f6;padding:12px;border-radius:12px;overflow:auto;margin:8px 0 0;white-space:pre-wrap;word-break:break-word}
      code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
      .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
      .method{padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600}
      .GET{background:#d1fae5;color:#065f46}
      .POST{background:#dbeafe;color:#1e40af}
      .PUT{background:#fde68a;color:#92400e}
      .PATCH{background:#e9d5ff;color:#6b21a8}
      .DELETE{background:#fecaca;color:#991b1b}
      .path{font-weight:600}
      .tag{font-size:12px;color:var(--muted)}
      .kv{width:100%;border:1px solid var(--border);border-radius:12px;overflow:hidden}
      .kv table{border-collapse:collapse;width:100%}
      .kv th,.kv td{font-size:13px;text-align:left;padding:8px 10px;border-bottom:1px solid var(--border);vertical-align:top}
      .kv th{width:180px;color:var(--ink-weak);background:#fafafa}
      .pill{display:inline-block;border:1px solid var(--border);padding:2px 8px;border-radius:999px;font-size:12px;margin-right:6px}
      .status{padding:2px 8px;border-radius:8px;background:#eef2ff;font-weight:600;margin-right:6px}
      .status.ok{background:#ecfdf5;color:#065f46}
      .status.warn{background:#fffbeb;color:#92400e}
      .status.err{background:#fef2f2;color:#991b1b}
      .toc{position:sticky;top:0;background:var(--bg);padding:12px 0 16px;margin:12px 0;border-bottom:1px dashed var(--border)}
      .toc a{color:#2563eb;text-decoration:none;margin-right:10px;font-size:13px}
      .empty{color:var(--muted)}

      /* 엔드포인트 접기/펼치기 카드 */
      details.ep{border:1px solid var(--border);border-radius:16px;background:var(--card);margin:16px 0}
      details.ep > summary{list-style:none;cursor:pointer;display:flex;gap:10px;align-items:center;padding:14px 16px}
      details.ep > summary::-webkit-details-marker{display:none}
      details.ep[open] > summary{border-bottom:1px solid var(--border)}
      summary .chev{transition:transform .15s ease}
      details[open] .chev{transform:rotate(90deg)}
      summary:hover{background:#f8fafc}
    </style>`;

  // 데이터 정규화 & 정렬
  const endpoints = (project?.endpoints || []).map(e => ({
    ...e,
    method: (e.method || "GET").toUpperCase(),
    path: e.path || "/"
  })).sort((a,b) => (a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path)));

  // TOC
  const toc = endpoints.map(ep => {
    const id = sectionId(ep);
    return `<a href="#${id}"><span class="pill ${ep.method}">${ep.method}</span><code>${escapeHtml(ep.path)}</code></a>`;
  }).join("");

  const epHtml = endpoints.map(ep => renderEndpoint(ep)).join("");
  const updated = project?.updatedAt ? new Date(project.updatedAt) : new Date();

  return `
  <!doctype html>
  <html><head><meta charset="utf-8"><title>${escapeHtml(project?.name || "API Spec")}</title>${style}</head>
  <body>
    <div class="container">
      <h1>${escapeHtml(project?.name || "API Spec")}</h1>
      <div class="muted">Version ${escapeHtml(project?.version || "v1")} · Updated ${updated.toLocaleString()}</div>

      <div class="toc">
        ${toc}
        <span style="float:right">
          <button onclick="window.__toggleAll(true)" class="pill">모두 펼치기</button>
          <button onclick="window.__toggleAll(false)" class="pill">모두 접기</button>
        </span>
      </div>

      ${epHtml}
    </div>

    <script>
      window.__toggleAll = function(open){
        document.querySelectorAll('details.ep').forEach(d => d.open = !!open);
      };
    </script>
  </body></html>`;
}

/* ===================== 렌더 함수들 ===================== */

function renderEndpoint(ep){
  const id = sectionId(ep);
  const tags = ep.tags?.length ? `<span class="tag"> · ${ep.tags.slice(0,5).join(" · ")}</span>` : "";
  const responses = normalizeResponses(ep);

  return `
  <details id="${id}" class="ep" open>
    <summary>
      <span class="chev">▶</span>
      <span class="method ${ep.method}">${ep.method}</span>
      <span class="path"><code>${escapeHtml(ep.path)}</code></span>
      ${tags}
    </summary>
    <div style="padding:12px 16px 16px">
      ${ep.description ? `<p class="muted" style="margin:0 0 8px">${escapeHtml(ep.description)}</p>` : ""}

      ${renderKV("Headers", ep.headers)}
      ${renderKV("Query", ep.query)}
      ${renderBody("Request Body", ep.body)}

      ${renderExamples(ep.examples)}
      ${renderResponses(responses)}
    </div>
  </details>`;
}

// headers/query를 표로
function renderKV(title, obj){
  if (!obj || typeof obj !== "object" || !Object.keys(obj).length) {
    return `<details class="sec" open><summary><h2>${title}</h2></summary><div class="empty">—</div></details>`;
  }
  const rows = Object.entries(obj).map(([k,v]) =>
    `<tr><th>${escapeHtml(k)}</th><td><code>${escapeHtml(pretty(v))}</code></td></tr>`
  ).join("");
  return `
  <details class="sec" open>
    <summary><h2>${title}</h2></summary>
    <div class="kv"><table>${rows}</table></div>
  </details>`;
}

function renderBody(title, body){
  if (body == null) {
    return `<details class="sec" open><summary><h2>${title}</h2></summary><div class="empty">—</div></details>`;
  }
  return `
  <details class="sec" open>
    <summary><h2>${title}</h2></summary>
    <pre>${escapeHtml(JSON.stringify(body, null, 2))}</pre>
  </details>`;
}

function renderExamples(list=[]){
  if(!Array.isArray(list) || !list.length) return "";
  return `
  <details class="sec">
    <summary><h2>Examples</h2></summary>
    ${list.map(ex => `
      <div style="margin:8px 0">
        ${ex.title ? `<div><strong>${escapeHtml(ex.title)}</strong></div>` : ""}
        ${ex.payload != null ? `<pre>${escapeHtml(JSON.stringify(ex.payload,null,2))}</pre>` : ""}
      </div>
    `).join("")}
  </details>`;
}

// responses: 신형/구형 통합
function renderResponses(responses){
  if(!responses.length) return "";
  return `
  <details class="sec" open>
    <summary><h2>Responses</h2></summary>
    ${responses.map(r => {
      const cls = r.status >= 200 && r.status < 300 ? "ok" : (r.status < 400 ? "" : r.status < 500 ? "warn" : "err");
      const ctype = r.contentType || "application/json";
      return `
        <div style="margin:12px 0">
          <span class="status ${cls}">${r.status}</span>
          <span class="pill"><code>${escapeHtml(ctype)}</code></span>
          ${r.desc ? `<span class="muted">· ${escapeHtml(r.desc)}</span>` : ""}
          ${r.body != null ? `<pre>${escapeHtml(JSON.stringify(r.body,null,2))}</pre>` : ""}
        </div>
      `;
    }).join("")}
  </details>`;
}

/* ===================== 유틸 ===================== */

function normalizeResponses(ep){
  // 신형
  if (Array.isArray(ep.responses) && ep.responses.length) {
    return ep.responses.map(r => ({
      status: r.status ?? 200,
      contentType: r.contentType || ep.headers?.["Content-Type"] || "application/json",
      desc: r.desc || "",
      body: r.body ?? null
    }));
  }
  // 구형
  if (ep.responseStatus != null || ep.responseBody != null) {
    return [{
      status: ep.responseStatus ?? 200,
      contentType: ep.headers?.["Content-Type"] || "application/json",
      desc: "",
      body: ep.responseBody ?? null
    }];
  }
  return [];
}

function sectionId(ep){
  const kebab = toKebab ? toKebab(`${ep.method}-${ep.path}`) : `${ep.method}-${ep.path}`.toLowerCase().replace(/[^a-z0-9]+/g,"-");
  return kebab.replace(/(^-|-$)/g,"");
}

function pretty(v){
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}

function escapeHtml(s){
  return String(s ?? "")
    .replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[c]));
}
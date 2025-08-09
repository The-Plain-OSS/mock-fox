/**
 * 명세 html export 하는 모듈
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
      body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Noto Sans,Apple Color Emoji,Segoe UI Emoji,sans-serif;background:#fafafa;color:#0a0a0a;margin:0;padding:40px}
      .container{max-width:1000px;margin:0 auto}
      .badge{display:inline-block;padding:2px 8px;border-radius:8px;font-size:12px;margin-right:6px}
      .sec{background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:16px;margin:12px 0}
      pre{background:#f6f6f6;padding:12px;border-radius:12px;overflow:auto}
      .muted{color:#6b7280}
      h1{font-size:28px;margin:0 0 6px} h2{font-size:20px;margin:0 0 8px}
      .row{display:flex;gap:8px;align-items:center}
      .tag{font-size:12px;color:#6b7280}
    </style>`;
  const methodColor = (m)=>{
    switch(m){
      case "GET": return "background:#d1fae5;color:#065f46";
      case "POST": return "background:#dbeafe;color:#1e40af";
      case "PUT": return "background:#fde68a;color:#92400e";
      case "PATCH": return "background:#e9d5ff;color:#6b21a8";
      case "DELETE": return "background:#fecaca;color:#991b1b";
      default: return "background:#e5e7eb;color:#374151";
    }
  };
  const epHtml = project.endpoints.map(ep=>{
    return `
      <div class="sec">
        <div class="row">
          <span class="badge" style="${methodColor(ep.method)}">${ep.method}</span>
          <strong>${ep.path || "/"}</strong>
          ${ep.tags?.length ? `<span class="tag"> · ${ep.tags.slice(0,5).join(" · ")}</span>` : ""}
        </div>
        ${ep.description ? `<p class="muted">${escapeHtml(ep.description)}</p>` : ""}
        ${ep.headers ? `<h2>Headers</h2><pre>${escapeHtml(JSON.stringify(ep.headers,null,2))}</pre>` : ""}
        ${ep.query ? `<h2>Query</h2><pre>${escapeHtml(JSON.stringify(ep.query,null,2))}</pre>` : ""}
        ${ep.body ? `<h2>Request Body</h2><pre>${escapeHtml(JSON.stringify(ep.body,null,2))}</pre>` : ""}
        ${renderExamples(ep.examples)}
        ${renderResponses(ep.responses)}
      </div>
    `;
  }).join("");

  return `
  <!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(project.name)} Spec</title>${style}</head>
  <body><div class="container">
    <h1>${escapeHtml(project.name || "API Spec")}</h1>
    <div class="muted">Version ${escapeHtml(project.version || "v1")} · Updated ${new Date(project.updatedAt).toLocaleString()}</div>
    ${epHtml}
  </div></body></html>`;
}

function renderExamples(list=[]){
  if(!list.length) return "";
  return `<h2>Examples</h2>` + list.map((ex,i)=>`
    <div>
      ${ex.title ? `<div><strong>${escapeHtml(ex.title)}</strong></div>`:""}
      ${ex.payload ? `<pre>${escapeHtml(JSON.stringify(ex.payload,null,2))}</pre>`:""}
    </div>
  `).join("");
}

function renderResponses(list=[]){
  if(!list.length) return "";
  return `<h2>Responses</h2>` + list.map((r,i)=>`
    <div>
      <div><strong>${r.status||200}</strong> ${r.contentType||"application/json"} ${r.desc?`· ${escapeHtml(r.desc)}`:""}</div>
      ${r.body ? `<pre>${escapeHtml(JSON.stringify(r.body,null,2))}</pre>`:""}
    </div>
  `).join("");
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[c]));
}

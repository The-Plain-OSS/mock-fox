// 전역 상태/스토리지/유틸 관리 모듈임. 웬만하면 건들 일 없을 거임.
const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

// localStorage 안전 접근
const memoryStore = (() => {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
})();
const storage = (isBrowser && window.localStorage) ? window.localStorage : memoryStore;

// UUID 안전 생성
function uuid() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  // 폴백
  return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

// DOM 안전 선택자
export const $ = (id) => {
  if (!isBrowser) return null;
  return document.getElementById(id);
};

// JSON 유틸
export const safeJsonParse = (str, fallback) => {
  if (!str || !String(str).trim()) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
};
export const jsonPretty = (obj) => (obj ? JSON.stringify(obj, null, 2) : "");
export const trimEmpty = (s) => (s || "").trim();
export const toKebab = (s) =>
  (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// 상태
export let project = loadProject() || {
  id: uuid(),
  name: "My API Project",
  version: "v0.1.0",
  updatedAt: new Date().toISOString(),
  endpoints: []
};

export let currentId = null;

// 저장/로드
export function saveProject() {
  project.updatedAt = new Date().toISOString();
  try {
    storage.setItem("api-spec-project", JSON.stringify(project));
  } catch (e) {
    // 저장 실패는 조용히 패스 (quota 등)
    console.warn("[state] saveProject failed:", e);
  }
  updateProjectMeta();
}

export function loadProject() {
  try {
    const raw = storage.getItem("api-spec-project");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// UI 메타 업데이트 (렌더러에서만)
export function updateProjectMeta() {
  const el = $("projectMeta");
  if (!el) return;
  try {
    el.textContent =
      `엔드포인트 ${project.endpoints.length}개 · 업데이트 ${new Date(project.updatedAt).toLocaleString()}`;
  } catch {
    // toLocaleString 예외 방지
    el.textContent =
      `엔드포인트 ${project.endpoints.length}개 · 업데이트 ${project.updatedAt}`;
  }
}

// 현재 EP 헬퍼
export function getCurrent() {
  return project.endpoints.find((e) => e.id === currentId);
}

export function setCurrent(id) {
  currentId = id;
}

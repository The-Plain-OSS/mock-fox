// 건들지 않는 파일임.
const isRenderer =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined";

let ipc;

if (isRenderer) {
  const hasApi = typeof window.api !== "undefined" && typeof window.api.send === "function";
  ipc = hasApi
    ? window.api
    : {
        send: (ch, data) =>
          console.log("[IPC mock:renderer]", ch, data),
      };
} else {
  // 메인/노드 환경: no-op (불러와져도 크래시 방지)
  ipc = {
    send: (ch, data) =>
      console.log("[IPC noop:main]", ch, data),
  };
}

export { ipc };
export default ipc;

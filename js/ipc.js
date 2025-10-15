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
// 건들지 않는 파일임.
const isRenderer = 
  typeof window !== "undefined" &&  typeof window.document !== "undefined";

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

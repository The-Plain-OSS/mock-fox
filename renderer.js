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
// 렌더러 프로세스 (프론트엔드)

// 사용자가 입력한 API 명세 수집

// 사용자 입력값 수집 및 이벤트 처리

// Save / Build 버튼 클릭 시 처리


// 1. html 입력값 .value로 불러오고 data에 키:값쌍으로 딕셔너리 저장.
document.getElementById("saveBtn").addEventListener("click", () => {
  const data = {
    endpoint: document.getElementById("endpoint").value,
    method: document.getElementById("method").value,
    query: document.getElementById("query").value,
    body: document.getElementById("requestBody").value
  };

  // 2. 콘솔에 출력
  console.log("명세 저장됨:", data);

  // 3. Electron에 전달
  window.api.send("save-spec", data);
});


/**
  * go로 해당 프로젝트의 api를 목서버로 전환
 */
document.getElementById("buildBtn").addEventListener("click", () => {
  alert("Go 빌드 실행 요청됨!");
});

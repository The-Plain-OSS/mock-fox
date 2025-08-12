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

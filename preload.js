// Electron용 브릿지 (보안 IPC)

// 렌더러 프로세스와 메인 프로세스를 잇는 다리 

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  }
});

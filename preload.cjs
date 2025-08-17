const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  invoke: (ch, payload) => ipcRenderer.invoke(ch, payload),
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, listener) => ipcRenderer.on(channel, (_e, ...args) => listener(...args)),
});

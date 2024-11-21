import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => {
        return ipcRenderer.invoke(channel, ...args);
      },
      on: (channel: string, func: (...args: any[]) => void) => {
        const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => func(...args);
        ipcRenderer.on(channel, subscription);
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      },
      once: (channel: string, func: (...args: any[]) => void) => {
        ipcRenderer.once(channel, (_event, ...args) => func(...args));
      },
      removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel);
      }
    }
  }
);

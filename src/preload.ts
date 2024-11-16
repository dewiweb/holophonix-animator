// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script running');

export type OSCConfig = {
  localPort: number;
  remotePort: number;
  remoteAddress: string;
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  osc: {
    connect: (config: OSCConfig) => ipcRenderer.invoke('osc:connect', config),
    disconnect: () => ipcRenderer.invoke('osc:disconnect'),
    sendMessage: (address: string, args: any[]) => ipcRenderer.invoke('osc:sendMessage', { address, args }),
    onConnected: (callback: (config: OSCConfig) => void) => ipcRenderer.on('osc:connected', (event, config) => callback(config)),
    onDisconnected: (callback: () => void) => ipcRenderer.on('osc:disconnected', () => callback()),
    onError: (callback: (error: Error) => void) => ipcRenderer.on('osc:error', (event, error) => callback(error)),
    onMessage: (callback: (message: any) => void) => ipcRenderer.on('osc:message', (event, message) => callback(message))
  }
});

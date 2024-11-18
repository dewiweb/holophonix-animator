// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './types/electron';

// Log when preload script starts
console.log('Preload script running');

// Create a type-safe API object
const api: ElectronAPI = {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    once: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, func);
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    }
  },
  on: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  once: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.once(channel, (event, ...args) => func(...args));
  },
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', api);

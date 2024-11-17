// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Log when preload script starts
console.log('Preload script running');

contextBridge.exposeInMainWorld('electron', {
  on: (channel: string, callback: (...args: any[]) => void) => {
    console.log(`Preload: Setting up listener for ${channel}`);
    const subscription = (_event: any, ...args: any[]) => {
      // For OSC messages, pass the first argument directly
      if (channel === 'osc:message' && args.length > 0) {
        const message = args[0];
        console.log('Preload: Forwarding OSC message:', {
          address: message?.address,
          args: message?.args,
          timestamp: message?.timestamp
        });
        callback(message);
      } else {
        console.log(`Preload: Forwarding ${channel} event:`, args);
        callback(...args);
      }
    };
    ipcRenderer.on(channel, subscription);
  },
  removeAllListeners: (channel: string) => {
    console.log(`Preload: Removing all listeners for ${channel}`);
    ipcRenderer.removeAllListeners(channel);
  },
  invoke: (channel: string, ...args: any[]) => {
    console.log(`Preload: Invoking ${channel}:`, {
      args: args.map(arg => typeof arg === 'object' ? { ...arg } : arg)
    });
    return ipcRenderer.invoke(channel, ...args);
  }
});

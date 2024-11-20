export interface ElectronAPI {
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, func: (...args: any[]) => void): void;
    once(channel: string, func: (...args: any[]) => void): void;
    removeListener(channel: string, func: (...args: any[]) => void): void;
    removeAllListeners(channel: string): void;
  };
  on(channel: string, func: (...args: any[]) => void): void;
  once(channel: string, func: (...args: any[]) => void): void;
  invoke(channel: string, ...args: any[]): Promise<any>;
  removeAllListeners(channel: string): void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

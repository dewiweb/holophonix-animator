export interface IElectronAPI {
  on(channel: string, callback: (...args: any[]) => void): void;
  removeAllListeners(channel: string): void;
  invoke(channel: string, ...args: any[]): Promise<any>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}

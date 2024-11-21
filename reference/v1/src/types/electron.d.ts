import { OSCConfig, TrackControlMessage } from './osc';
import { AppSettings } from '../main/settings';

export interface OSCChannels {
  'osc:connect': (config: OSCConfig) => Promise<{ success: boolean; error?: string }>;
  'osc:disconnect': () => Promise<{ success: boolean; error?: string }>;
  'osc:trackControl': (message: TrackControlMessage) => Promise<{ success: boolean; error?: string }>;
  'osc:query': (address: string) => Promise<{ success: boolean; error?: string }>;
  'osc:test': () => Promise<{ success: boolean; error?: string }>;
  'settings:load': () => Promise<{ success: boolean; error?: string; settings?: AppSettings }>;
  'settings:save': (settings: Partial<AppSettings>) => Promise<{ success: boolean; error?: string }>;
}

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

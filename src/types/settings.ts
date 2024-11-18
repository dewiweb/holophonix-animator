export interface Settings {
  oscRateLimit: number;
  oscConnection: {
    localPort: number;
    remotePort: number;
    remoteAddress: string;
    autoConnect: boolean;
  };
}

export const defaultSettings: Settings = {
  oscRateLimit: 50, // 50ms = 20 messages per second
  oscConnection: {
    localPort: 9000,
    remotePort: 9001, // Changed from 8000 to match the default in OSCConnection
    remoteAddress: '127.0.0.1',
    autoConnect: false
  }
};

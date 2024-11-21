declare module 'osc' {
  export class UDPPort {
    constructor(options: any);
    on(event: string, callback: (message: any) => void): void;
    once(event: string, callback: (message: any) => void): void;
    open(): void;
    close(): void;
    send(message: any): void;
  }
}

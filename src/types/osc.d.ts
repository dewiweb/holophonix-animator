declare module 'osc' {
  export class Message {
    constructor(address: string);
    append(arg: any): void;
  }

  export function writePacket(msg: Message): Buffer;
}

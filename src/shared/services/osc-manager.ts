import { EventEmitter } from 'events';
import { OSCMessage } from '../types/osc.types';

export class OSCManager extends EventEmitter {
    private connected = false;
    private config: { host: string; port: number };

    constructor(config: { host: string; port: number }) {
        super();
        this.config = config;
    }

    async connect(): Promise<void> {
        this.connected = true;
        this.emit('connected');
    }

    async disconnect(): Promise<void> {
        this.connected = false;
        this.emit('disconnected');
    }

    get isConnected(): boolean {
        return this.connected;
    }

    async send(message: OSCMessage): Promise<void> {
        if (!this.connected) {
            throw new Error('Cannot send message: not connected');
        }
        this.emit('message', message);
    }

    async sendBatch(messages: OSCMessage[]): Promise<void> {
        if (!this.connected) {
            throw new Error('Cannot send messages: not connected');
        }
        messages.forEach(msg => this.emit('message', msg));
    }
}

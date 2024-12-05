import { EventEmitter } from 'events';
import { OSCMessage } from '../../shared/types/osc.types';

interface Position {
    x: number;
    y: number;
    z: number;
}

export class MockOSCServer extends EventEmitter {
    private connected = false;
    private messageLog: OSCMessage[] = [];

    constructor() {
        super();
    }

    async connect(): Promise<void> {
        if (this.connected) {
            throw new Error('Server already connected');
        }
        this.connected = true;
        this.emit('ready');
    }

    async disconnect(): Promise<void> {
        if (!this.connected) {
            throw new Error('Server not connected');
        }
        this.connected = false;
        this.emit('close');
    }

    get isConnected(): boolean {
        return this.connected;
    }

    async send(message: OSCMessage): Promise<void> {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        this.messageLog.push(message);
        this.emit('message', message);
    }

    async sendPosition(position: Position): Promise<void> {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        await this.send({
            address: '/position',
            args: [position.x, position.y, position.z]
        });
    }

    async updateConfig(config: any): Promise<void> {
        // Mock implementation
    }

    getMessageLog(): OSCMessage[] {
        return this.messageLog;
    }

    clearMessageLog(): void {
        this.messageLog = [];
    }
}

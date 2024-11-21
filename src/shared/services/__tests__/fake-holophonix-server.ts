import { UDPPort } from 'osc';
import { EventEmitter } from 'events';

export class FakeHolophonixServer extends EventEmitter {
    private port: UDPPort;
    private isRunning: boolean = false;

    constructor(private serverPort: number = 3333) {
        super();
        this.port = new UDPPort({
            localAddress: '0.0.0.0',
            localPort: serverPort,
            metadata: true
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.port.on('message', (oscMsg: any) => {
            this.emit('message', oscMsg);
            
            // Auto-respond to specific messages
            if (oscMsg.address === '/holophonix/ping') {
                this.send('/holophonix/pong', []);
            }
        });

        this.port.on('error', (error: Error) => {
            this.emit('error', error);
        });
    }

    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isRunning) {
                resolve();
                return;
            }

            const onReady = () => {
                this.isRunning = true;
                this.port.removeListener('error', onError);
                resolve();
            };

            const onError = (error: Error) => {
                this.port.removeListener('ready', onReady);
                reject(error);
            };

            this.port.once('ready', onReady);
            this.port.once('error', onError);

            this.port.open();
        });
    }

    public stop(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.isRunning) {
                resolve();
                return;
            }

            // Remove all listeners to prevent memory leaks
            this.port.removeAllListeners();
            this.removeAllListeners();

            try {
                this.port.close();
            } catch (error) {
                // Ignore errors during close
            }

            this.isRunning = false;
            resolve();
        });
    }

    public send(address: string, args: any[]) {
        if (!this.isRunning) {
            throw new Error('Server is not running');
        }

        this.port.send({
            address,
            args
        });
    }

    public isServerRunning(): boolean {
        return this.isRunning;
    }
}

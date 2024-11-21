import { OSCBaseHandler } from '../osc-base-handler';
import { FakeHolophonixServer } from './fake-holophonix-server';
import { ConnectionState, OSCConfig } from '../../types/osc.types';

describe('OSCBaseHandler Integration Tests', () => {
    let server: FakeHolophonixServer;
    let handler: OSCBaseHandler;
    const TEST_PORT = Math.floor(Math.random() * 1000) + 50000; // Random high port

    beforeEach(async () => {
        // Start the fake server
        server = new FakeHolophonixServer(TEST_PORT);
        await server.start();

        // Create handler with test configuration
        const config: Partial<OSCConfig> = {
            serverIP: '127.0.0.1',
            localIP: '127.0.0.1',
            inputPort: TEST_PORT + 1,
            outputPort: TEST_PORT,
            connectionTimeout: 1000
        };
        handler = new OSCBaseHandler(config);
    });

    afterEach(async () => {
        // Clean up server
        await server.stop();
        
        // Clean up handler
        if (handler.getConnectionState() === ConnectionState.CONNECTED) {
            await new Promise<void>((resolve) => {
                handler.once('error', () => resolve());
                handler['inputPort'].close();
                handler['outputPort'].close();
            });
        }

        // Wait a bit for ports to fully close
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should successfully connect to the fake server', async () => {
        await handler.connect();
        expect(handler.getConnectionState()).toBe(ConnectionState.CONNECTED);
    });

    it('should handle ping/pong messages', async () => {
        const messageHandler = jest.fn();
        server.on('message', messageHandler);

        await handler.connect();
        
        // Send a ping message through the output port
        handler['outputPort'].send({
            address: '/holophonix/ping',
            args: []
        });

        // Wait for the server to receive and process the message
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(messageHandler).toHaveBeenCalledWith(
            expect.objectContaining({
                address: '/holophonix/ping'
            })
        );
    });

    it('should handle server disconnection', async () => {
        const errorHandler = jest.fn();
        handler.on('error', errorHandler);

        await handler.connect();
        await server.stop();

        // Wait for the handler to detect the disconnection
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(handler.getConnectionState()).toBe(ConnectionState.ERROR);
        expect(errorHandler).toHaveBeenCalled();
    });
});

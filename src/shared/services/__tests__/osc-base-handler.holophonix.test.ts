import { OSCBaseHandler } from '../osc-base-handler';
import { ConnectionState, OSCConfig } from '../../types/osc.types';

describe('OSCBaseHandler Holophonix Integration Tests', () => {
    let handler: OSCBaseHandler;
    const HOLOPHONIX_PORT = 4003;
    const LOCAL_PORT = 1234; // Port where we listen for messages
    const TEST_TIMEOUT = 60000; // Increased to 60 seconds
    const CLEANUP_TIMEOUT = 5000; // 5 seconds for cleanup

    beforeEach(() => {
        // Create handler with configuration for Holophonix Designer
        const config: Partial<OSCConfig> = {
            serverIP: '127.0.0.1',
            localIP: '127.0.0.1',
            inputPort: LOCAL_PORT,    // Port where we listen for messages
            outputPort: HOLOPHONIX_PORT, // Port where Holophonix Designer listens (4003)
            connectionTimeout: 10000   // Increased connection timeout
        };
        handler = new OSCBaseHandler(config);
    });

    afterEach(async () => {
        // Clean up handler with improved error handling
        try {
            if (handler.getConnectionState() === ConnectionState.CONNECTED) {
                await Promise.race([
                    new Promise<void>((resolve, reject) => {
                        handler.once('error', reject);
                        handler['inputPort'].close();
                        handler['outputPort'].close();
                        resolve();
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Cleanup timeout')), CLEANUP_TIMEOUT)
                    )
                ]);
            }
        } catch (error) {
            console.warn('Cleanup error:', error);
        }

        // Wait a bit for ports to fully close
        await new Promise(resolve => setTimeout(resolve, 100));
    }, CLEANUP_TIMEOUT);

    it('should connect to Holophonix Designer', async () => {
        await handler.connect();
        expect(handler.getConnectionState()).toBe(ConnectionState.CONNECTED);
    }, TEST_TIMEOUT);

    it('should send messages to Holophonix Designer', async () => {
        await handler.connect();
        expect(handler.getConnectionState()).toBe(ConnectionState.CONNECTED);

        // Send a get request for track position
        handler['outputPort'].send({
            address: '/get',
            args: ['/track/1/xyz']
        });

        // Wait for potential response
        await new Promise(resolve => setTimeout(resolve, 2000));

        // If we got here without errors, the message was sent successfully
        expect(handler.getConnectionState()).toBe(ConnectionState.CONNECTED);
    }, TEST_TIMEOUT);

    it('should send and receive position messages', async () => {
        const receivedMessages: any[] = [];
        const messageHandler = jest.fn((msg) => {
            receivedMessages.push(msg);
            console.log('Received message:', JSON.stringify(msg));
        });
        
        handler.on('message', messageHandler);
        await handler.connect();
        expect(handler.getConnectionState()).toBe(ConnectionState.CONNECTED);

        console.log('Sending position query...');
        // Send individual coordinate query first
        handler['outputPort'].send({
            address: '/get',
            args: ['/track/1/x']
        });
        console.log('Sent query for x coordinate');

        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Setting x position...');
        // Set x position
        handler['outputPort'].send({
            address: '/track/1/x',
            args: [0.5]
        });
        console.log('Sent x position update');

        // Wait for potential state update
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try getting all coordinates
        console.log('Requesting all coordinates...');
        handler['outputPort'].send({
            address: '/get',
            args: ['/track/1/xyz']
        });
        console.log('Sent query for all coordinates');

        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Log connection state and port info
        console.log('Connection state:', handler.getConnectionState());
        console.log('Input port:', LOCAL_PORT);
        console.log('Output port:', HOLOPHONIX_PORT);

        // Log received messages for debugging
        console.log('Total messages received:', receivedMessages.length);
        receivedMessages.forEach((msg, i) => {
            console.log(`Message ${i + 1}:`, JSON.stringify(msg));
        });

        expect(messageHandler).toHaveBeenCalled();
    }, TEST_TIMEOUT);

    it('should handle track gain messages', async () => {
        const receivedMessages: any[] = [];
        const messageHandler = jest.fn((msg) => {
            receivedMessages.push(msg);
            console.log('Received message:', JSON.stringify(msg));
        });

        handler.on('message', messageHandler);
        await handler.connect();
        expect(handler.getConnectionState()).toBe(ConnectionState.CONNECTED);

        console.log('Requesting current gain...');
        // Request current gain
        handler['outputPort'].send({
            address: '/get',
            args: ['/track/1/gain']
        });
        console.log('Sent gain query');

        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Setting gain...');
        // Set gain value (between -inf and 10.0)
        handler['outputPort'].send({
            address: '/track/1/gain',
            args: [0.0]
        });
        console.log('Sent gain update');

        // Wait for potential state update
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Log connection state and port info
        console.log('Connection state:', handler.getConnectionState());
        console.log('Input port:', LOCAL_PORT);
        console.log('Output port:', HOLOPHONIX_PORT);

        // Log received messages for debugging
        console.log('Total messages received:', receivedMessages.length);
        receivedMessages.forEach((msg, i) => {
            console.log(`Message ${i + 1}:`, JSON.stringify(msg));
        });

        expect(messageHandler).toHaveBeenCalled();
    }, TEST_TIMEOUT);
});

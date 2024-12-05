import { OSCManager } from '../../shared/services/osc-manager';
import { OSCMessage } from '../../shared/types/osc.types';
import { MockOSCServer } from '../mocks/osc-server.mock';

describe('OSC Manager Integration', () => {
    let oscManager: OSCManager;
    let mockServer: MockOSCServer;

    beforeEach(() => {
        mockServer = new MockOSCServer();
        oscManager = new OSCManager({
            host: 'localhost',
            port: 8000
        });
    });

    afterEach(async () => {
        await oscManager.disconnect();
        if (mockServer.isConnected) {
            await mockServer.disconnect();
        }
    });

    it('should connect to OSC server', async () => {
        await mockServer.connect();
        await oscManager.connect();
        expect(oscManager.isConnected).toBe(true);
    });

    it('should handle connection errors gracefully', async () => {
        const badConfig = {
            host: 'invalid-host',
            port: -1
        };

        await oscManager.updateConfig(badConfig);
        await expect(oscManager.connect()).rejects.toThrow();
        expect(oscManager.isConnected).toBe(false);
    });

    it('should send and receive messages', async () => {
        await mockServer.connect();
        await oscManager.connect();

        const message: OSCMessage = {
            address: '/test/message',
            args: [1, 'test']
        };

        await oscManager.send(message);
        const log = mockServer.getMessageLog();
        expect(log).toHaveLength(1);
        expect(log[0]).toEqual(message);
    });

    it('should update connection configuration', async () => {
        const newConfig = {
            host: '127.0.0.1',
            port: 9000
        };
        await oscManager.updateConfig(newConfig);
        expect(oscManager.isConnected).toBe(false);
        
        await mockServer.connect();
        await oscManager.connect();
        expect(oscManager.isConnected).toBe(true);
    });

    it('should disconnect from OSC server', async () => {
        await mockServer.connect();
        await oscManager.connect();
        expect(oscManager.isConnected).toBe(true);
        
        await oscManager.disconnect();
        expect(oscManager.isConnected).toBe(false);
    });

    it('should maintain connection state', async () => {
        await mockServer.connect();
        await oscManager.connect();
        expect(oscManager.isConnected).toBe(true);

        await oscManager.disconnect();
        expect(oscManager.isConnected).toBe(false);
    });

    it('should handle invalid messages gracefully', async () => {
        await mockServer.connect();
        await oscManager.connect();

        const invalidMessage = {
            address: 123, // Invalid address type
            args: ['test']
        } as unknown as OSCMessage;

        await expect(oscManager.send(invalidMessage)).rejects.toThrow();
    });
});

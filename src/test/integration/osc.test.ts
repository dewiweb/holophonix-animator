import { OSCManager, OSCConfig, OSCMessage } from '../../bindings';

describe('OSC Manager Integration', () => {
    let oscManager: OSCManager;
    const defaultConfig: OSCConfig = {
        host: 'localhost',
        port: 8000,
        timeout_ms: 1000
    };

    beforeEach(() => {
        oscManager = new OSCManager(defaultConfig);
    });

    afterEach(async () => {
        await oscManager.disconnect();
    });

    it('should connect to OSC server', async () => {
        await oscManager.connect();
        expect(oscManager.is_connected()).toBe(true);
    });

    it('should handle connection errors gracefully', async () => {
        const badConfig: OSCConfig = {
            host: 'invalid-host',
            port: 8000,
            timeout_ms: 1000
        };
        await oscManager.update_config(badConfig);
        
        await expect(oscManager.connect()).rejects.toThrow();
        expect(oscManager.is_connected()).toBe(false);
    });

    it('should send position updates', async () => {
        await oscManager.connect();
        const message: OSCMessage = {
            address: '/position',
            args: [0.5, 0.5, 0.0]
        };
        await expect(oscManager.send(message)).resolves.not.toThrow();
    });

    it('should update connection configuration', async () => {
        const newConfig: OSCConfig = {
            host: 'localhost',
            port: 9000,
            timeout_ms: 2000
        };
        await oscManager.update_config(newConfig);
        expect(oscManager.is_connected()).toBe(false);
        
        await oscManager.connect();
        expect(oscManager.is_connected()).toBe(true);
    });

    it('should disconnect from OSC server', async () => {
        await oscManager.connect();
        expect(oscManager.is_connected()).toBe(true);
        
        await oscManager.disconnect();
        expect(oscManager.is_connected()).toBe(false);
    });

    it('should maintain connection state', async () => {
        await oscManager.connect();
        expect(oscManager.is_connected()).toBe(true);

        await oscManager.disconnect();
        expect(oscManager.is_connected()).toBe(false);
    });

    it('should handle multiple rapid position updates', async () => {
        await oscManager.connect();
        
        const messages: OSCMessage[] = [
            { address: '/position', args: [0.1, 0.1, 0.0] },
            { address: '/position', args: [0.2, 0.2, 0.0] },
            { address: '/position', args: [0.3, 0.3, 0.0] },
            { address: '/position', args: [0.4, 0.4, 0.0] },
            { address: '/position', args: [0.5, 0.5, 0.0] }
        ];

        await Promise.all(messages.map(msg => oscManager.send(msg)));
    });

    it('should handle reconnection attempts', async () => {
        await oscManager.connect();
        await oscManager.disconnect();
        await expect(oscManager.connect()).resolves.not.toThrow();
    });

    it('should handle invalid messages gracefully', async () => {
        await oscManager.connect();
        const invalidMessage = {
            address: '/invalid',
            args: ['not-a-number']
        } as unknown as OSCMessage;

        await expect(oscManager.send(invalidMessage)).rejects.toThrow();
    });
});

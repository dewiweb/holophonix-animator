import { OSCHandler } from '../osc-handler';
import { StateSynchronizer } from '../state-synchronizer';
import { createServer } from 'dgram';
import { OSCConfig, TrackParameters, OSCMessage } from '../../types/osc.types';

describe('OSCHandler Integration Tests', () => {
  let handler: OSCHandler;
  let mockHolophonix: any;
  let stateSynchronizer: StateSynchronizer;
  
  const TEST_PORT = 4004;
  const TEST_HOST = '127.0.0.1';

  const testConfig: Partial<OSCConfig> = {
    port: TEST_PORT,
    host: TEST_HOST,
    connectionTimeout: 100,
    maxRetries: 2,
    queryTimeout: 100,
    validationInterval: 1000
  };

  beforeEach(async () => {
    // Create mock Holophonix server
    mockHolophonix = createServer('udp4');
    mockHolophonix.bind(TEST_PORT, TEST_HOST);

    // Setup message handling
    mockHolophonix.on('message', (msg, rinfo) => {
      // Parse OSC message and respond accordingly
      // TODO: Implement mock responses based on received messages
    });

    // Initialize OSC handler
    handler = new OSCHandler(testConfig);
    stateSynchronizer = new StateSynchronizer(handler);
  });

  afterEach(() => {
    mockHolophonix.close();
    handler.disconnect();
  });

  test('should establish connection with mock Holophonix', async () => {
    const connectPromise = handler.connect();
    await expect(connectPromise).resolves.not.toThrow();
  });

  test('should handle track parameter updates', async () => {
    await handler.connect();

    const trackId = 1;
    const parameters: TrackParameters = {
      xyz: { x: 1.0, y: 0.0, z: 0.0 },
      gain: 0.0,
      mute: false,
      name: 'Test Track'
    };

    const updatePromise = handler.updateTrackParameters(trackId, parameters);
    await expect(updatePromise).resolves.not.toThrow();
  });

  test('should handle multiple concurrent updates', async () => {
    await handler.connect();

    const updates = Array.from({ length: 5 }, (_, i) => ({
      trackId: i + 1,
      parameters: {
        xyz: { x: Math.random(), y: Math.random(), z: Math.random() },
        gain: Math.random(),
        mute: false,
        name: `Track ${i + 1}`
      }
    }));

    const updatePromises = updates.map(({ trackId, parameters }) =>
      handler.updateTrackParameters(trackId, parameters)
    );

    await expect(Promise.all(updatePromises)).resolves.not.toThrow();
  });

  test('should handle connection loss and reconnection', async () => {
    await handler.connect();
    
    // Simulate connection loss
    mockHolophonix.close();
    
    // Wait for reconnection attempt
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Restart mock server
    mockHolophonix = createServer('udp4');
    mockHolophonix.bind(TEST_PORT, TEST_HOST);
    
    // Verify handler recovers
    const parameters: TrackParameters = {
      xyz: { x: 1.0, y: 0.0, z: 0.0 },
      gain: 0.0,
      mute: false,
      name: 'Test Track'
    };
    
    const updatePromise = handler.updateTrackParameters(1, parameters);
    await expect(updatePromise).resolves.not.toThrow();
  });
});

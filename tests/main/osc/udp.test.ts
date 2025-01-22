import { OscUdpClient } from '../../../src/main/osc/udp';
import { Position3D, createPositionMessage } from '../../../src/main/osc/types';
import dgram from 'dgram';

jest.setTimeout(10000); // Increase timeout for all tests

describe('OSC UDP Client', () => {
  let client: OscUdpClient;
  const TEST_PORT = 9999;
  const TEST_HOST = '127.0.0.1';

  beforeEach(async () => {
    client = new OscUdpClient(TEST_HOST, TEST_PORT);
    // Wait for client to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterEach(async () => {
    await client.close();
  });

  test('should create UDP client with correct config', () => {
    expect(client.isConnected()).toBe(true);
    expect(client.getPort()).toBe(TEST_PORT);
    expect(client.getHost()).toBe(TEST_HOST);
  });

  test('should handle error event', async () => {
    const errorClient = new OscUdpClient(TEST_HOST, TEST_PORT);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create a socket to bind to the same port
    const socket = dgram.createSocket('udp4');
    
    await new Promise<void>((resolve) => {
      socket.bind(TEST_PORT, TEST_HOST, resolve);
    });

    // Wait for error event
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force an error by closing the socket
    socket.close();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try to send a message when client is in error state
    await errorClient.close();
    await expect(errorClient.send({ address: '/test', args: [] }))
      .rejects.toThrow('Failed to send OSC message: client not connected');
  });

  test('should handle port open errors', async () => {
    expect(() => {
      new OscUdpClient(TEST_HOST, -2);
    }).toThrow('Invalid port number');
  });

  test('should send OSC message with different types successfully', async () => {
    const testPort = TEST_PORT + 3;
    // Create a mock server to receive the message
    const server = dgram.createSocket('udp4');
    
    await new Promise<void>((resolve) => {
      server.bind(testPort, TEST_HOST, resolve);
    });

    const testClient = new OscUdpClient(TEST_HOST, testPort);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test different argument types
    const messages = [
      { address: '/test/string', args: ['hello'] },
      { address: '/test/number', args: [42.5] },
      { address: '/test/boolean', args: [true] },
      { address: '/test/mixed', args: ['hello', 42.5, true] }
    ];

    for (const message of messages) {
      await testClient.send(message);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await testClient.close();
    server.close();
  });

  test('should handle send errors', async () => {
    expect(() => {
      new OscUdpClient(TEST_HOST, 0);
    }).toThrow('Invalid port number');
  });

  test('should handle send message errors', async () => {
    const testPort = TEST_PORT + 4;
    const testClient = new OscUdpClient(TEST_HOST, testPort);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Force an error by sending invalid message
    const invalidMessage = { address: '/test', args: [Symbol('invalid')] };
    await expect(testClient.send(invalidMessage as any))
      .rejects.toThrow('Failed to send OSC message');

    await testClient.close();
  });

  test('should receive OSC messages', async () => {
    const testPort = TEST_PORT + 1;
    // Create a mock OSC server
    const server = dgram.createSocket('udp4');
    const receivedData: Buffer[] = [];

    server.on('message', (msg) => {
      receivedData.push(msg);
    });

    await new Promise<void>((resolve) => {
      server.bind(testPort, TEST_HOST, resolve);
    });

    const testClient = new OscUdpClient(TEST_HOST, testPort);
    await new Promise(resolve => setTimeout(resolve, 500));

    const message = createPositionMessage(1, { x: 0, y: 0, z: 0 });
    await testClient.send(message);
    
    // Wait for message to be received
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(receivedData.length).toBeGreaterThan(0);
    
    await testClient.close();
    server.close();
  });

  test('should handle close when already closed', async () => {
    await client.close();
    // Second close should not throw
    await client.close();
    expect(client.isConnected()).toBe(false);
  });

  test('should handle close errors', async () => {
    const testPort = TEST_PORT + 2;
    const errorClient = new OscUdpClient(TEST_HOST, testPort);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force an error by closing twice
    await errorClient.close();
    await errorClient.close(); // Should not throw
    expect(errorClient.isConnected()).toBe(false);
  });

  test('should throw error for invalid port number', () => {
    expect(() => new OscUdpClient(TEST_HOST, -1)).toThrow('Invalid port number');
    expect(() => new OscUdpClient(TEST_HOST, 70000)).toThrow('Invalid port number');
  });
});

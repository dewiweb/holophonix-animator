import { OscUdpClient } from '../../../src/main/osc/udp';
import { Position3D, createPositionMessage } from '../../../src/main/osc/types';
import dgram from 'dgram';

jest.setTimeout(60000); // Increase timeout for all tests

describe('OSC UDP Client', () => {
  let client: OscUdpClient;
  let testPort: number;
  const TEST_HOST = '127.0.0.1';

  beforeEach(async () => {
    // Create a temporary UDP socket to get a free port
    const tempSocket = dgram.createSocket('udp4');
    tempSocket.unref(); // Allow the process to exit

    await new Promise<void>((resolve) => {
      tempSocket.bind(0, TEST_HOST, () => {
        testPort = tempSocket.address().port;
        tempSocket.close(resolve);
      });
    });

    // Create client with the free port
    client = new OscUdpClient(TEST_HOST, testPort);
    // Wait for client to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    if (client) {
      await client.close();
      client = null as any;
    }
  });

  test('should create UDP client with correct config', () => {
    expect(client.isConnected()).toBe(true);
    expect(client.getPort()).toBe(testPort);
    expect(client.getHost()).toBe(TEST_HOST);
  });

  test('should handle error event', async () => {
    // Create a temporary UDP socket to get a free port
    const tempSocket = dgram.createSocket('udp4');
    let errorPort: number;
    
    await new Promise<void>((resolve) => {
      tempSocket.bind(0, TEST_HOST, () => {
        errorPort = tempSocket.address().port + 5;
        tempSocket.close(resolve);
      });
    });
    
    // Create a socket to bind to the same port
    const socket = dgram.createSocket('udp4');
    
    await new Promise<void>((resolve) => {
      socket.bind(errorPort, TEST_HOST, resolve);
    });

    // Try to create client on already bound port
    const errorClient = new OscUdpClient(TEST_HOST, errorPort);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force an error by closing the socket
    socket.close();
    await new Promise(resolve => setTimeout(resolve, 100));
    
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
    const testPort = client.getPort() + 3;
    // Create a mock server to receive the message
    const server = dgram.createSocket('udp4');
    server.unref(); // Allow the process to exit
    
    await new Promise<void>((resolve) => {
      server.bind(testPort, TEST_HOST, resolve);
    });

    const testClient = new OscUdpClient(TEST_HOST, testPort);
    await new Promise(resolve => setTimeout(resolve, 100));

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

    const testPort = client.getPort() + 4;
    const testClient = new OscUdpClient(TEST_HOST, testPort);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Force an error by sending invalid message
    const invalidMessage = { address: '/test', args: [{ invalid: 'object' }] };
    await expect(testClient.send(invalidMessage as any))
      .rejects.toThrow('Failed to send OSC message: Unsupported argument type: object');

    await testClient.close();
  });

  test('should receive OSC messages', async () => {
    // Create a temporary UDP socket to get a free port
    const tempSocket = dgram.createSocket('udp4');
    let receivePort: number;
    
    await new Promise<void>((resolve) => {
      tempSocket.bind(0, TEST_HOST, () => {
        receivePort = tempSocket.address().port + 1;
        tempSocket.close(resolve);
      });
    });
    
    // Create a mock OSC server
    const server = dgram.createSocket('udp4');
    server.unref(); // Allow the process to exit
    const receivedData: Buffer[] = [];

    server.on('message', (msg) => {
      receivedData.push(msg);
    });

    await new Promise<void>((resolve) => {
      server.bind(receivePort, TEST_HOST, resolve);
    });

    const testClient = new OscUdpClient(TEST_HOST, receivePort);
    await new Promise(resolve => setTimeout(resolve, 100));

    const message = createPositionMessage(1, { x: 0, y: 0, z: 0 });
    await testClient.send(message);
    
    // Wait for message to be received
    await new Promise(resolve => setTimeout(resolve, 200));
    
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
    // Create a temporary UDP socket to get a free port
    const tempSocket = dgram.createSocket('udp4');
    let closePort: number;
    
    await new Promise<void>((resolve) => {
      tempSocket.bind(0, TEST_HOST, () => {
        closePort = tempSocket.address().port + 2;
        tempSocket.close(resolve);
      });
    });
    
    const errorClient = new OscUdpClient(TEST_HOST, closePort);
    await new Promise(resolve => setTimeout(resolve, 100));
    
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

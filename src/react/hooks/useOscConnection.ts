import { useState, useCallback } from 'react';
import { ConnectionStatus } from '../types';
import { OscManager } from '../../rust/src/lib';

export const useOscConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.Disconnected);
  const [oscManager, setOscManager] = useState<OscManager | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (host: string, port: number) => {
    try {
      setStatus(ConnectionStatus.Connecting);
      setError(null);

      const config = {
        host,
        port,
        send_port: port,
        receive_port: port + 1,
      };

      const manager = new OscManager(config);
      await manager.connect();
      
      setOscManager(manager);
      setStatus(ConnectionStatus.Connected);
    } catch (err) {
      setStatus(ConnectionStatus.Disconnected);
      setError(`Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
      setOscManager(null);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (oscManager) {
        await oscManager.disconnect();
      }
      setStatus(ConnectionStatus.Disconnected);
      setOscManager(null);
      setError(null);
    } catch (err) {
      setError(`Failed to disconnect: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [oscManager]);

  const sendPosition = useCallback(async (address: string, x: number, y: number, z: number) => {
    try {
      if (!oscManager) {
        throw new Error('Not connected to OSC server');
      }

      await oscManager.send_position(address, x, y, z);
      setError(null);
    } catch (err) {
      setError(`Failed to send position: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [oscManager]);

  return {
    status,
    error,
    connect,
    disconnect,
    sendPosition,
    isConnected: status === ConnectionStatus.Connected,
  };
};

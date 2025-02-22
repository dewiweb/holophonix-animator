import { useState, useCallback, useEffect, useRef } from 'react';

interface UseConnectionOptions {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  connectionTimeout?: number; // in milliseconds
  reconnectAttempts?: number;
  reconnectDelay?: number; // in milliseconds
  autoReconnect?: boolean;
}

const DEFAULT_OPTIONS: Required<UseConnectionOptions> = {
  onConnected: () => {},
  onDisconnected: () => {},
  onError: () => {},
  connectionTimeout: 5000,
  reconnectAttempts: 3,
  reconnectDelay: 2000,
  autoReconnect: true
};

interface ConnectionState {
  ip: string;
  port: number;
  reconnectCount: number;
}

export const useConnection = (options: UseConnectionOptions = {}) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<ConnectionState | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  const handleConnectionError = useCallback((err: Error, isTimeout = false) => {
    const error = isTimeout ? new Error('Connection timeout') : err;
    setError(error);
    setIsConnecting(false);
    mergedOptions.onError(error);

    // Attempt to reconnect if enabled and within retry limit
    if (mergedOptions.autoReconnect && 
        connectionDetails && 
        connectionDetails.reconnectCount < mergedOptions.reconnectAttempts) {
      setIsReconnecting(true);
      const newConnectionDetails = {
        ...connectionDetails,
        reconnectCount: connectionDetails.reconnectCount + 1
      };
      setConnectionDetails(newConnectionDetails);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect(newConnectionDetails.ip, newConnectionDetails.port);
      }, mergedOptions.reconnectDelay);
    }
  }, [mergedOptions, connectionDetails]);

  // In a real implementation, this would be replaced with actual OSC connection logic
  const connect = useCallback(async (ip: string, port: number) => {
    clearTimeouts();
    setIsConnecting(true);
    setError(null);
    setIsReconnecting(false);

    // Store connection details for potential reconnection
    setConnectionDetails({ ip, port, reconnectCount: 0 });

    // Set connection timeout
    timeoutRef.current = setTimeout(() => {
      handleConnectionError(new Error('Connection timeout'), true);
    }, mergedOptions.connectionTimeout);

    try {
      // TODO: Replace with actual OSC connection
      // This is a mock implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      clearTimeouts();
      setIsConnected(true);
      setConnectionDetails({ ip, port, reconnectCount: 0 });
      mergedOptions.onConnected();

      // Store connection details in localStorage
      localStorage.setItem('lastConnection', JSON.stringify({ ip, port }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      handleConnectionError(error);
    }
  }, [mergedOptions, clearTimeouts, handleConnectionError]);

  const disconnect = useCallback(() => {
    clearTimeouts();
    // TODO: Replace with actual OSC disconnect logic
    setIsConnected(false);
    setConnectionDetails(null);
    setIsReconnecting(false);
    mergedOptions.onDisconnected();
  }, [mergedOptions, clearTimeouts]);

  // Load last connection details on mount
  useEffect(() => {
    const lastConnection = localStorage.getItem('lastConnection');
    if (lastConnection) {
      try {
        const { ip, port } = JSON.parse(lastConnection);
        setConnectionDetails({ ip, port, reconnectCount: 0 });
      } catch (err) {
        console.error('Failed to parse last connection details:', err);
      }
    }
    return () => clearTimeouts();
  }, [clearTimeouts]);

  return {
    isConnected,
    isConnecting,
    isReconnecting,
    error,
    connect,
    disconnect,
    connectionDetails
  };
};

import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils';
import { ConnectionPanel } from '../../react/components/ConnectionPanel';
import { ConnectionStatus } from '../../shared/types';

describe('ConnectionPanel', () => {
  const mockProps = {
    status: ConnectionStatus.Disconnected,
    onConnect: jest.fn(),
    onDisconnect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders connection form', () => {
    render(<ConnectionPanel {...mockProps} />);
    
    expect(screen.getByLabelText('Host')).toBeInTheDocument();
    expect(screen.getByLabelText('Port')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('handles input changes and connect', () => {
    render(<ConnectionPanel {...mockProps} />);
    
    const hostInput = screen.getByLabelText('Host');
    const portInput = screen.getByLabelText('Port');

    fireEvent.change(hostInput, { target: { value: '127.0.0.1' } });
    fireEvent.change(portInput, { target: { value: '9000' } });

    // Click connect and verify the callback receives the updated values
    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);
    expect(mockProps.onConnect).toHaveBeenCalledWith('127.0.0.1', 9000);
  });

  it('handles connect/disconnect state', () => {
    const { rerender } = render(<ConnectionPanel {...mockProps} />);
    
    // Initially shows Connect button
    expect(screen.getByText('Connect')).toBeInTheDocument();

    // After connecting
    rerender(<ConnectionPanel {...mockProps} status={ConnectionStatus.Connected} />);
    
    // Should show Disconnect button
    const disconnectButton = screen.getByText('Disconnect');
    fireEvent.click(disconnectButton);
    expect(mockProps.onDisconnect).toHaveBeenCalled();
  });
});

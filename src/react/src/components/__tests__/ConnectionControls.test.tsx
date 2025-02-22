import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ConnectionControls } from '../ConnectionControls';

describe('ConnectionControls', () => {
  const mockConnect = jest.fn();
  const mockDisconnect = jest.fn();
  const defaultProps = {
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    error: null,
    connectionDetails: null,
    onConnect: mockConnect,
    onDisconnect: mockDisconnect,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders connection form with input fields', () => {
    render(<ConnectionControls {...defaultProps} />);

    expect(screen.getByLabelText(/ip address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('shows different connection states', () => {
    const { rerender } = render(<ConnectionControls {...defaultProps} />);
    expect(screen.getByTestId('connection-status')).toHaveTextContent(/disconnected/i);

    // Test connecting state
    rerender(<ConnectionControls {...defaultProps} isConnecting={true} />);
    expect(screen.getByTestId('connection-status')).toHaveTextContent(/connecting/i);

    // Test connected state
    rerender(<ConnectionControls {...defaultProps} isConnected={true} />);
    expect(screen.getByTestId('connection-status')).toHaveTextContent(/connected/i);

    // Test reconnecting state
    rerender(
      <ConnectionControls
        {...defaultProps}
        isReconnecting={true}
        connectionDetails={{ ip: '192.168.1.1', port: 8000, reconnectCount: 2 }}
      />
    );
    expect(screen.getByTestId('connection-status')).toHaveTextContent(/reconnecting.*2/i);
  });

  it('shows error message', () => {
    render(
      <ConnectionControls
        {...defaultProps}
        error={new Error('Connection timeout')}
      />
    );

    expect(screen.getByTestId('connection-error')).toHaveTextContent(/connection timeout/i);
  });

  it('validates IP address format', () => {
    render(<ConnectionControls {...defaultProps} />);

    const ipInput = screen.getByLabelText(/ip address/i);
    
    // Invalid IP
    fireEvent.change(ipInput, { target: { value: 'invalid-ip' } });
    fireEvent.blur(ipInput);
    expect(screen.getByText(/invalid ip address/i)).toBeInTheDocument();
    
    // Valid IP
    fireEvent.change(ipInput, { target: { value: '192.168.1.1' } });
    fireEvent.blur(ipInput);
    expect(screen.queryByText(/invalid ip address/i)).not.toBeInTheDocument();
  });

  it('validates port number', () => {
    render(<ConnectionControls {...defaultProps} />);

    const portInput = screen.getByLabelText(/port/i);
    
    // Invalid port
    fireEvent.change(portInput, { target: { value: '999999' } });
    fireEvent.blur(portInput);
    expect(screen.getByText(/port must be between 1 and 65535/i)).toBeInTheDocument();
    
    // Valid port
    fireEvent.change(portInput, { target: { value: '8000' } });
    fireEvent.blur(portInput);
    expect(screen.queryByText(/port must be between 1 and 65535/i)).not.toBeInTheDocument();
  });

  it('calls onConnect with valid input', () => {
    render(<ConnectionControls {...defaultProps} />);

    const ipInput = screen.getByLabelText(/ip address/i);
    const portInput = screen.getByLabelText(/port/i);
    const connectButton = screen.getByRole('button', { name: /connect/i });

    fireEvent.change(ipInput, { target: { value: '192.168.1.1' } });
    fireEvent.change(portInput, { target: { value: '8000' } });
    fireEvent.click(connectButton);

    expect(mockConnect).toHaveBeenCalledWith('192.168.1.1', 8000);
  });

  it('shows disconnect button when connected', () => {
    render(<ConnectionControls {...defaultProps} isConnected={true} />);

    const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
    fireEvent.click(disconnectButton);

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('disables inputs while connected or connecting', () => {
    const { rerender } = render(<ConnectionControls {...defaultProps} isConnected={true} />);

    expect(screen.getByLabelText(/ip address/i)).toBeDisabled();
    expect(screen.getByLabelText(/port/i)).toBeDisabled();

    rerender(<ConnectionControls {...defaultProps} isConnecting={true} />);
    expect(screen.getByLabelText(/ip address/i)).toBeDisabled();
    expect(screen.getByLabelText(/port/i)).toBeDisabled();
  });

  it('loads connection details from props', () => {
    render(
      <ConnectionControls
        {...defaultProps}
        connectionDetails={{ ip: '192.168.1.100', port: 9000, reconnectCount: 0 }}
      />
    );

    expect(screen.getByLabelText(/ip address/i)).toHaveValue('192.168.1.100');
    expect(screen.getByLabelText(/port/i)).toHaveValue(9000);
  });
});

import React, { useState } from 'react';
import { Card, FormGroup, InputGroup, Button, Intent } from '@blueprintjs/core';
import { ConnectionStatus } from '../../bindings';
import './ConnectionPanel.css';

interface ConnectionPanelProps {
    status: ConnectionStatus;
    onConnect: (host: string, port: number) => void;
    onDisconnect: () => void;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
    status,
    onConnect,
    onDisconnect,
}) => {
    const [host, setHost] = useState('localhost');
    const [port, setPort] = useState(8000);

    const getStatusIntent = (): Intent => {
        switch (status) {
            case ConnectionStatus.Connected:
                return Intent.SUCCESS;
            case ConnectionStatus.Connecting:
                return Intent.WARNING;
            case ConnectionStatus.Error:
                return Intent.DANGER;
            default:
                return Intent.NONE;
        }
    };

    const getStatusText = (): string => {
        switch (status) {
            case ConnectionStatus.Connected:
                return 'Connected';
            case ConnectionStatus.Connecting:
                return 'Connecting...';
            case ConnectionStatus.Error:
                return 'Connection Error';
            default:
                return 'Disconnected';
        }
    };

    const handleConnect = () => {
        onConnect(host, port);
    };

    return (
        <Card className="connection-panel">
            <div className="connection-form">
                <FormGroup
                    label="Host"
                    labelFor="host-input"
                >
                    <InputGroup
                        id="host-input"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        disabled={status === ConnectionStatus.Connected}
                    />
                </FormGroup>

                <FormGroup
                    label="Port"
                    labelFor="port-input"
                >
                    <InputGroup
                        id="port-input"
                        type="number"
                        value={port.toString()}
                        onChange={(e) => setPort(parseInt(e.target.value, 10))}
                        disabled={status === ConnectionStatus.Connected}
                    />
                </FormGroup>
            </div>

            <div className="connection-status">
                <span className={`status-indicator status-${getStatusIntent()}`}>
                    {getStatusText()}
                </span>
                {status !== ConnectionStatus.Connected ? (
                    <Button
                        intent={Intent.PRIMARY}
                        onClick={handleConnect}
                        disabled={status === ConnectionStatus.Connecting}
                        loading={status === ConnectionStatus.Connecting}
                        text="Connect"
                    />
                ) : (
                    <Button
                        intent={Intent.DANGER}
                        onClick={onDisconnect}
                        text="Disconnect"
                    />
                )}
            </div>
        </Card>
    );
};

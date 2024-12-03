import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, FormGroup, InputGroup } from '@blueprintjs/core';
import { RootState } from '../store';
import { updateOscConfig } from '../store/slices/oscConfigSlice';
import { OSCConfig } from '../../bindings';

export const Settings: React.FC = () => {
    const dispatch = useDispatch();
    const config = useSelector((state: RootState) => state.oscConfig);
    const [host, setHost] = React.useState(config.host);
    const [port, setPort] = React.useState(config.port.toString());
    const [timeout, setTimeout] = React.useState(config.timeout_ms.toString());

    const handleSave = () => {
        const newConfig: OSCConfig = {
            host,
            port: parseInt(port, 10),
            timeout_ms: parseInt(timeout, 10)
        };
        dispatch(updateOscConfig(newConfig));
    };

    return (
        <div className="settings-page">
            <h2>OSC Settings</h2>
            <FormGroup label="Host" labelFor="host-input">
                <InputGroup
                    id="host-input"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                />
            </FormGroup>
            <FormGroup label="Port" labelFor="port-input">
                <InputGroup
                    id="port-input"
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                />
            </FormGroup>
            <FormGroup label="Timeout (ms)" labelFor="timeout-input">
                <InputGroup
                    id="timeout-input"
                    type="number"
                    value={timeout}
                    onChange={(e) => setTimeout(e.target.value)}
                />
            </FormGroup>
            <Button intent="primary" onClick={handleSave}>
                Save Settings
            </Button>
        </div>
    );
};

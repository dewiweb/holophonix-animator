import React from 'react';
import { Callout, Intent, Button } from '@blueprintjs/core';
import './ErrorNotification.css';

interface ErrorNotificationProps {
    message: string | null;
    onDismiss?: () => void;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
    message,
    onDismiss,
}) => {
    if (!message) {
        return null;
    }

    return (
        <div className="error-notification">
            <Callout
                intent={Intent.DANGER}
                icon="error"
                title="Error"
                onDismiss={onDismiss}
            >
                {message}
            </Callout>
        </div>
    );
};

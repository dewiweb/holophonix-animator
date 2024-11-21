import React from 'react';
import { Behavior } from '../types/behaviors';
import { BehaviorParameterEditor } from './BehaviorParameterEditor';
import { ParameterValidationError } from '../types/parameters';
import './ParameterSection.css';

interface ParameterSectionProps {
    selectedBehavior: Behavior | null;
    onValidationErrors?: (errors: ParameterValidationError[]) => void;
}

export const ParameterSection: React.FC<ParameterSectionProps> = ({
    selectedBehavior,
    onValidationErrors
}) => {
    if (!selectedBehavior) {
        return (
            <div className="parameter-section">
                <div className="no-selection">
                    Select a behavior to edit parameters
                </div>
            </div>
        );
    }

    return (
        <div className="parameter-section">
            <div className="parameter-header">
                <h3>{selectedBehavior.name} Parameters</h3>
                <div className="behavior-type">
                    Type: {selectedBehavior.type}
                </div>
            </div>
            <div className="parameter-content">
                <BehaviorParameterEditor
                    behavior={selectedBehavior.implementation}
                    onChange={onValidationErrors}
                />
            </div>
        </div>
    );
};

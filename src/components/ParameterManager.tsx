import React, { useState, useCallback, useEffect } from 'react';
import { ParameterGroup as ParameterGroupType, ParameterPreset } from '../types/parameter-groups';
import { ParameterGroup } from './ParameterGroup';
import { PresetSelector } from './PresetSelector';
import { useParameterValidation } from '../hooks/useParameterValidation';
import { useParameterHistory } from '../hooks/useParameterHistory';

interface ParameterManagerProps {
  groups: Record<string, ParameterGroupType>;
  presets?: Record<string, ParameterPreset>;
  initialValues?: Record<string, Record<string, number | string | boolean>>;
  onChange: (groupId: string, values: Record<string, number | string | boolean>) => void;
  onError?: (errors: Array<{ groupId: string; errors: any[] }>) => void;
  disabled?: boolean;
}

export const ParameterManager: React.FC<ParameterManagerProps> = ({
  groups,
  presets = {},
  initialValues = {},
  onChange,
  onError,
  disabled = false
}) => {
  // Track selected presets for each group
  const [selectedPresets, setSelectedPresets] = useState<Record<string, string>>({});

  // Initialize parameter history
  const {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrentState,
  } = useParameterHistory(initialValues);

  // Create validators for each group
  const validators = Object.entries(groups).reduce((acc, [groupId, group]) => {
    acc[groupId] = useParameterValidation(group.parameters);
    return acc;
  }, {} as Record<string, ReturnType<typeof useParameterValidation>>);

  // Handle preset selection
  const handlePresetSelect = useCallback((groupId: string, presetId: string) => {
    if (!presetId) {
      // Clear preset
      setSelectedPresets(prev => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
      return;
    }

    const preset = presets[presetId];
    if (!preset || preset.groupId !== groupId) return;

    // Validate preset values
    const validator = validators[groupId];
    const validation = validator.validateGroup(preset.values);
    
    if (!validation.isValid) {
      onError?.([{ groupId, errors: validation.errors }]);
      return;
    }

    // Update values and selected preset
    addToHistory(groupId, preset.values);
    setSelectedPresets(prev => ({
      ...prev,
      [groupId]: presetId
    }));

    // Notify parent
    onChange(groupId, preset.values);
  }, [presets, validators, onChange, onError, addToHistory]);

  // Handle parameter change
  const handleParameterChange = useCallback((
    groupId: string,
    paramName: string,
    value: number | string | boolean
  ) => {
    // Validate the new value
    const validator = validators[groupId];
    const validation = validator.validateValue(paramName, value);

    if (!validation.isValid) {
      onError?.([{ groupId, errors: validation.errors }]);
      return;
    }

    // Clear preset selection since we're modifying values
    setSelectedPresets(prev => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });

    // Get current group values
    const currentValues = getCurrentState()[groupId] || {};
    
    // Update values
    const newGroupValues = {
      ...currentValues,
      [paramName]: value
    };

    // Add to history
    addToHistory(groupId, newGroupValues);

    // Notify parent
    onChange(groupId, newGroupValues);
  }, [validators, onChange, onError, getCurrentState, addToHistory]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          // Redo
          if (canRedo) {
            const entry = redo();
            if (entry) {
              onChange(entry.groupId, entry.values);
            }
          }
        } else {
          // Undo
          if (canUndo) {
            const entry = undo();
            if (entry) {
              onChange(entry.groupId, entry.values);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, onChange]);

  return (
    <div className="space-y-8">
      {Object.entries(groups).map(([groupId, group]) => (
        <div key={groupId} className="bg-white shadow rounded-lg p-6">
          {presets && Object.keys(presets).length > 0 && (
            <PresetSelector
              presets={presets}
              selectedPresetId={selectedPresets[groupId]}
              onSelect={(presetId) => handlePresetSelect(groupId, presetId)}
              groupId={groupId}
            />
          )}
          
          <ParameterGroup
            group={group}
            values={getCurrentState()[groupId] || {}}
            onChange={(paramName, value) => handleParameterChange(groupId, paramName, value)}
            disabled={disabled}
            presetId={selectedPresets[groupId]}
          />

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                if (canUndo) {
                  const entry = undo();
                  if (entry) onChange(entry.groupId, entry.values);
                }
              }}
              disabled={!canUndo || disabled}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Undo
            </button>
            <button
              onClick={() => {
                if (canRedo) {
                  const entry = redo();
                  if (entry) onChange(entry.groupId, entry.values);
                }
              }}
              disabled={!canRedo || disabled}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Redo
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

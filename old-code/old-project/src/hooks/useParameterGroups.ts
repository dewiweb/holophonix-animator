import { useCallback, useMemo, useState } from 'react';
import { 
  ParameterGroup, 
  ParameterPreset,
  ParameterValue
} from '../types/parameter-groups';
import { useParameterValidation } from './useParameterValidation';
import { useParameterTransform } from './useParameterTransform';

interface UseParameterGroupsResult {
  values: Record<string, ParameterValue>;
  setValues: (values: Record<string, ParameterValue>) => void;
  updateValue: (paramName: string, value: ParameterValue) => void;
  resetToDefaults: () => void;
  applyPreset: (presetId: string) => void;
  currentPresetId: string | undefined;
  isValid: boolean;
  errors: string[];
}

export function useParameterGroups(
  group: ParameterGroup,
  presets?: Record<string, ParameterPreset>
): UseParameterGroupsResult {
  // State
  const [values, setValues] = useState<Record<string, ParameterValue>>(() => {
    // Initialize with default values
    const defaults: Record<string, ParameterValue> = {};
    Object.entries(group.parameters).forEach(([name, metadata]) => {
      defaults[name] = metadata.defaultValue;
    });
    return defaults;
  });

  const [currentPresetId, setCurrentPresetId] = useState<string>();
  const [isValid, setIsValid] = useState(true);

  // Setup validation
  const { validateGroup, hasRequiredParameters } = useParameterValidation(group.parameters);

  // Setup parameter transforms
  const { transformValue } = useParameterTransform(group.parameters);

  // Update a single parameter value
  const updateValue = useCallback(
    (paramName: string, value: ParameterValue) => {
      const result = transformValue(paramName, value);
      if (result.isValid) {
        setValues(prev => ({
          ...prev,
          [paramName]: result.value
        }));
        // Clear preset when values are modified
        setCurrentPresetId(undefined);
      }
    },
    [transformValue]
  );

  // Reset all parameters to their default values
  const resetToDefaults = useCallback(() => {
    const defaults: Record<string, ParameterValue> = {};
    Object.entries(group.parameters).forEach(([name, metadata]) => {
      defaults[name] = metadata.defaultValue;
    });
    setValues(defaults);
    setCurrentPresetId(undefined);
  }, [group.parameters]);

  // Apply a preset
  const applyPreset = useCallback(
    (presetId: string) => {
      if (!presets || !presets[presetId]) {
        console.warn(`Preset ${presetId} not found`);
        return;
      }

      const preset = presets[presetId];
      setValues(prev => ({
        ...prev,
        ...preset.values
      }));
      setCurrentPresetId(presetId);
    },
    [presets]
  );

  // Validate values and update isValid state
  const validation = useMemo(() => {
    const result = validateGroup(values);
    const hasRequired = hasRequiredParameters(values);
    setIsValid(result.isValid && hasRequired);
    return result;
  }, [values, validateGroup, hasRequiredParameters]);

  return {
    values,
    setValues,
    updateValue,
    resetToDefaults,
    applyPreset,
    currentPresetId,
    isValid,
    errors: validation.errors.map(error => error.message)
  };
}

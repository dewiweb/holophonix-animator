import React from 'react';
import { ParameterPreset } from '../types/parameter-groups';

interface PresetSelectorProps {
  presets: Record<string, ParameterPreset>;
  selectedPresetId?: string;
  onSelect: (presetId: string) => void;
  groupId: string;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  selectedPresetId,
  onSelect,
  groupId
}) => {
  // Filter presets by group
  const groupPresets = Object.values(presets).filter(
    preset => preset.groupId === groupId
  );

  if (groupPresets.length === 0) return null;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">
        Parameter Presets
      </label>
      <select
        value={selectedPresetId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">Custom</option>
        {groupPresets.map(preset => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
      {selectedPresetId && (
        <p className="mt-1 text-sm text-gray-500">
          {presets[selectedPresetId]?.description}
        </p>
      )}
    </div>
  );
};

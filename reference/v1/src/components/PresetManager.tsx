import React, { useCallback, useState } from 'react';
import { ParameterPreset, ParameterValue } from '../types/parameter-groups';
import { cn } from '../utils/styles';

interface PresetManagerProps {
  presets: Record<string, ParameterPreset>;
  selectedPresetId?: string;
  currentValues: Record<string, ParameterValue>;
  onSelect: (presetId: string) => void;
  onSave: (preset: ParameterPreset) => void;
  onDelete: (presetId: string) => void;
  groupId: string;
  className?: string;
}

export function PresetManager({
  presets,
  selectedPresetId,
  currentValues,
  onSelect,
  onSave,
  onDelete,
  groupId,
  className
}: PresetManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [editingPresetId, setEditingPresetId] = useState<string>();

  // Filter presets by group
  const groupPresets = Object.entries(presets)
    .filter(([_, preset]) => preset.groupId === groupId)
    .sort(([_, a], [__, b]) => a.name.localeCompare(b.name));

  // Handle preset creation
  const handleCreatePreset = useCallback(() => {
    if (!newPresetName.trim()) return;

    const newPreset: ParameterPreset = {
      id: `${groupId}_${Date.now()}`,
      groupId,
      name: newPresetName.trim(),
      description: newPresetDescription.trim(),
      values: { ...currentValues },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newPreset);
    setNewPresetName('');
    setNewPresetDescription('');
    setIsCreating(false);
  }, [groupId, newPresetName, newPresetDescription, currentValues, onSave]);

  // Handle preset update
  const handleUpdatePreset = useCallback(
    (presetId: string) => {
      const preset = presets[presetId];
      if (!preset) return;

      const updatedPreset: ParameterPreset = {
        ...preset,
        values: { ...currentValues },
        updatedAt: new Date().toISOString()
      };

      onSave(updatedPreset);
    },
    [presets, currentValues, onSave]
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Parameter Presets
        </label>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New
        </button>
      </div>

      <select
        value={selectedPresetId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">Custom</option>
        {groupPresets.map(([id, preset]) => (
          <option key={id} value={id}>
            {preset.name}
          </option>
        ))}
      </select>

      {selectedPresetId && presets[selectedPresetId] && (
        <div className="bg-gray-50 rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {presets[selectedPresetId].name}
            </h4>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => handleUpdatePreset(selectedPresetId)}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => onDelete(selectedPresetId)}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
          {presets[selectedPresetId].description && (
            <p className="text-sm text-gray-500">
              {presets[selectedPresetId].description}
            </p>
          )}
          <p className="text-xs text-gray-400">
            Last updated: {new Date(presets[selectedPresetId].updatedAt).toLocaleString()}
          </p>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Preset</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter preset name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter preset description (optional)"
                />
              </div>
            </div>
            <div className="mt-5 sm:mt-6 space-x-3">
              <button
                type="button"
                onClick={handleCreatePreset}
                disabled={!newPresetName.trim()}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewPresetName('');
                  setNewPresetDescription('');
                }}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

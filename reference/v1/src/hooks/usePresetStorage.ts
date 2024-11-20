import { useState, useCallback, useEffect } from 'react';
import { ParameterPreset } from '../types/parameter-groups';

const STORAGE_KEY = 'holophonix-animator-presets';

interface UsePresetStorageResult {
  presets: Record<string, ParameterPreset>;
  savePreset: (preset: ParameterPreset) => void;
  deletePreset: (presetId: string) => void;
  importPresets: (presets: Record<string, ParameterPreset>) => void;
  exportPresets: () => Record<string, ParameterPreset>;
  clearPresets: () => void;
}

export function usePresetStorage(): UsePresetStorageResult {
  // Load presets from localStorage
  const [presets, setPresets] = useState<Record<string, ParameterPreset>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (err) {
      console.error('Failed to load presets:', err);
      return {};
    }
  });

  // Save presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (err) {
      console.error('Failed to save presets:', err);
    }
  }, [presets]);

  // Save or update a preset
  const savePreset = useCallback((preset: ParameterPreset) => {
    setPresets(prev => ({
      ...prev,
      [preset.id]: preset
    }));
  }, []);

  // Delete a preset
  const deletePreset = useCallback((presetId: string) => {
    setPresets(prev => {
      const next = { ...prev };
      delete next[presetId];
      return next;
    });
  }, []);

  // Import presets (overwrite existing)
  const importPresets = useCallback((newPresets: Record<string, ParameterPreset>) => {
    setPresets(newPresets);
  }, []);

  // Export presets
  const exportPresets = useCallback(() => {
    return { ...presets };
  }, [presets]);

  // Clear all presets
  const clearPresets = useCallback(() => {
    setPresets({});
  }, []);

  return {
    presets,
    savePreset,
    deletePreset,
    importPresets,
    exportPresets,
    clearPresets
  };
}

// Utility function to generate a preset ID
export function generatePresetId(groupId: string): string {
  return `${groupId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Utility function to validate a preset
export function validatePreset(preset: ParameterPreset): boolean {
  return (
    typeof preset === 'object' &&
    typeof preset.id === 'string' &&
    typeof preset.groupId === 'string' &&
    typeof preset.name === 'string' &&
    typeof preset.values === 'object' &&
    typeof preset.createdAt === 'string' &&
    typeof preset.updatedAt === 'string'
  );
}

// Utility function to migrate legacy presets
export function migrateLegacyPresets(
  legacyPresets: Record<string, any>
): Record<string, ParameterPreset> {
  const migratedPresets: Record<string, ParameterPreset> = {};

  for (const [id, preset] of Object.entries(legacyPresets)) {
    try {
      if (!validatePreset(preset)) {
        // Add missing fields
        const now = new Date().toISOString();
        migratedPresets[id] = {
          id: preset.id || id,
          groupId: preset.groupId || 'default',
          name: preset.name || 'Unnamed Preset',
          description: preset.description || '',
          values: preset.values || {},
          createdAt: preset.createdAt || now,
          updatedAt: preset.updatedAt || now
        };
      } else {
        migratedPresets[id] = preset;
      }
    } catch (err) {
      console.error(`Failed to migrate preset ${id}:`, err);
    }
  }

  return migratedPresets;
}

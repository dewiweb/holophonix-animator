import React, { useState } from 'react';
import { Animation, Track } from '../../types';
import './AnimationPresets.css';

interface PresetFormData {
  name: string;
  category: string;
  description: string;
  duration: number;
  type: 'linear' | 'circular' | 'random' | 'custom';
  parameters: any;
}

interface PresetFormProps {
  initialData?: Animation;
  onSubmit: (formData: PresetFormData) => void;
}

const PresetForm: React.FC<PresetFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<PresetFormData>({
    name: initialData?.name || '',
    category: initialData?.category || '',
    description: initialData?.description || '',
    duration: initialData?.duration || 2000,
    type: initialData?.type || 'circular',
    parameters: initialData?.parameters || {
      center: { x: 0, y: 0, z: 0 },
      radius: 5,
      startAngle: 0,
      endAngle: 360,
      plane: 'xy'
    }
  });

  return (
    <div className="preset-form" data-testid="preset-form">
      <div className="form-group">
        <label htmlFor="name">Preset Name</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label htmlFor="category">Category</label>
        <input
          id="category"
          type="text"
          value={formData.category}
          onChange={e => setFormData({ ...formData, category: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label htmlFor="duration">Duration (ms)</label>
        <input
          id="duration"
          type="number"
          value={formData.duration}
          onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
        />
      </div>
      <button onClick={() => onSubmit(formData)}>
        {initialData ? 'Save Changes' : 'Save Preset'}
      </button>
    </div>
  );
};

interface AnimationPresetsProps {
  presets: Animation[];
  selectedTrack: Track | null;
  onApplyPreset?: (trackId: string, preset: Animation) => void;
  onCreatePreset?: (preset: Partial<Animation>) => void;
  onEditPreset?: (preset: Animation) => void;
}

interface PresetFormData {
  name: string;
  category: string;
  description: string;
  duration: number;
  type: 'linear' | 'circular' | 'random' | 'custom';
  parameters: any;
}

export const AnimationPresets: React.FC<AnimationPresetsProps> = ({
  presets,
  selectedTrack,
  onApplyPreset,
  onCreatePreset,
  onEditPreset
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Animation | null>(null);
  const [previewingPreset, setPreviewingPreset] = useState<string | null>(null);

  const categories = ['All', ...new Set(presets.map(p => p.category))];

  const filteredPresets = selectedCategory === 'All'
    ? presets
    : presets.filter(p => p.category === selectedCategory);

  const handleCreateSubmit = (formData: PresetFormData) => {
    onCreatePreset?.({
      name: formData.name,
      category: formData.category,
      description: formData.description,
      duration: formData.duration,
      type: formData.type,
      parameters: formData.parameters
    });
    setShowCreateForm(false);
  };

  const handleEditSubmit = (formData: PresetFormData) => {
    if (!editingPreset) return;
    onEditPreset?.({
      ...editingPreset,
      name: formData.name,
      category: formData.category,
      description: formData.description,
      duration: formData.duration
    });
    setEditingPreset(null);
  };

  const renderPresetForm = () => {
    return showCreateForm ? (
      <PresetForm onSubmit={handleCreateSubmit} />
    ) : editingPreset ? (
      <PresetForm initialData={editingPreset} onSubmit={handleEditSubmit} />
    ) : null;

  };

  const renderPresetPreview = (preset: Animation) => {
    const size = 100;
    const center = size / 2;
    let path = '';

    if (preset.type === 'circular') {
      const { radius } = preset.parameters;
      const scaledRadius = (radius / 10) * (size / 2); // Scale radius to fit preview
      path = `M ${center + scaledRadius} ${center} A ${scaledRadius} ${scaledRadius} 0 1 1 ${center - scaledRadius} ${center} A ${scaledRadius} ${scaledRadius} 0 1 1 ${center + scaledRadius} ${center}`;
    } else if (preset.type === 'linear') {
      const { startPosition, endPosition } = preset.parameters;
      const scalePoint = (p: { x: number; y: number }) => ({
        x: center + (p.x / 10) * (size / 2),
        y: center + (p.y / 10) * (size / 2)
      });
      const start = scalePoint(startPosition);
      const end = scalePoint(endPosition);
      path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    }

    return (
      <div 
        className="preset-preview"
        data-testid={`preset-preview-${preset.id}`}
      >
        <svg width={size} height={size}>
          <path
            d={path}
            stroke="#4CAF50"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="animation-presets">
      <div className="presets-header">
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          data-testid="category-filter"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button onClick={() => setShowCreateForm(true)}>Create Preset</button>
      </div>

      {renderPresetForm()}

      <div className="presets-grid">
        {filteredPresets.map(preset => (
          <div
            key={preset.id}
            className="preset-card"
            data-testid={`preset-card-${preset.id}`}
            onMouseEnter={() => setPreviewingPreset(preset.id)}
            onMouseLeave={() => setPreviewingPreset(null)}
          >
            <div className="preset-info">
              <h3>{preset.name}</h3>
              <p>{preset.description}</p>
              <span className="category-tag">{preset.category}</span>
            </div>
            {previewingPreset === preset.id && renderPresetPreview(preset)}
            <div className="preset-actions">
              <button
                onClick={() => selectedTrack && onApplyPreset?.(selectedTrack.id, preset)}
                disabled={!selectedTrack}
                data-testid={`apply-preset-${preset.id}`}
              >
                Apply
              </button>
              <button
                onClick={() => setEditingPreset(preset)}
                data-testid={`edit-preset-${preset.id}`}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useCallback } from 'react';
import { Panel } from '../Panel';
import { AnimationModel, AnimationType } from '../../types';
import './AnimationPanel.css';

interface AnimationPanelProps {
  availableModels: string[];
  activeModels: AnimationModel[];
  selectedModelId: string | null;
  onModelSelect: (id: string) => void;
  onModelAdd: (type: AnimationType) => void;
  onModelRemove: (id: string) => void;
  onModelUpdate: (id: string, updates: Partial<AnimationModel>) => void;
  onModelPlay: (id: string) => void;
  onModelStop: (id: string) => void;
}

const typeNameMap: Record<string, AnimationType> = {
  'Linear Move': 'linear',
  'Circular Path': 'circular',
  'Random Walk': 'random',
};

export const AnimationPanel: React.FC<AnimationPanelProps> = ({
  availableModels,
  activeModels,
  selectedModelId,
  onModelSelect,
  onModelAdd,
  onModelRemove,
  onModelUpdate,
  onModelPlay,
  onModelStop,
}) => {
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  const handleNameEdit = useCallback((id: string, newName: string) => {
    onModelUpdate(id, { name: newName });
    setEditingModelId(null);
  }, [onModelUpdate]);

  const renderAvailableModel = useCallback((modelName: string) => (
    <div
      key={modelName}
      className="model-template"
      onClick={() => onModelAdd(typeNameMap[modelName])}
    >
      <div className="model-template__icon">⬡</div>
      <div className="model-template__name">{modelName}</div>
    </div>
  ), [onModelAdd]);

  const renderActiveModel = useCallback((model: AnimationModel) => {
    const isEditing = editingModelId === model.id;
    const isSelected = selectedModelId === model.id;

    return (
      <div
        key={model.id}
        className={'model-item ' + (isSelected ? 'model-item--selected' : '')}
        onClick={() => onModelSelect(model.id)}
      >
        <div className="model-item__preview" data-testid="model-preview">
          {model.type === 'linear' && (
            <div className="model-item__preview-linear">
              <div className="preview-dot preview-dot--start" />
              <div className="preview-line" />
              <div className="preview-dot preview-dot--end" />
            </div>
          )}
          {model.type === 'circular' && (
            <div className="model-item__preview-circular">
              <div className="preview-circle" />
              <div className="preview-dot" />
            </div>
          )}
        </div>
        <div className="model-item__content">
          {isEditing ? (
            <input
              type="text"
              defaultValue={model.name}
              autoFocus
              onBlur={(e) => handleNameEdit(model.id, e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNameEdit(model.id, e.currentTarget.value)}
            />
          ) : (
            <div
              className="model-item__name"
              onDoubleClick={() => setEditingModelId(model.id)}
            >
              {model.name}
            </div>
          )}
          <div className="model-item__controls">
            <button
              className="model-item__control"
              onClick={(e) => {
                e.stopPropagation();
                onModelPlay(model.id);
              }}
              aria-label="play model"
            >
              ⏯
            </button>
            <button
              className="model-item__control"
              onClick={(e) => {
                e.stopPropagation();
                onModelStop(model.id);
              }}
              aria-label="stop model"
            >
              ⏹
            </button>
            <button
              className="model-item__remove"
              onClick={(e) => {
                e.stopPropagation();
                onModelRemove(model.id);
              }}
              aria-label="remove model"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }, [editingModelId, selectedModelId, handleNameEdit, onModelPlay, onModelRemove, onModelSelect, onModelStop]);

  return (
    <Panel title="Animation Models" collapsible>
      <div className="animation-panel__content">
        <div className="animation-panel__section">
          <h3 className="animation-panel__section-title">Available Models</h3>
          <div className="animation-panel__templates">
            {availableModels.map(renderAvailableModel)}
          </div>
        </div>
        <div className="animation-panel__section">
          <h3 className="animation-panel__section-title">Active Models</h3>
          <div className="animation-panel__active-models">
            {activeModels.map(renderActiveModel)}
          </div>
        </div>
      </div>
    </Panel>
  );
};

import React from 'react';

interface PreviewWindowProps {
  onMinimize?: () => void;
  onClose?: () => void;
}

export const PreviewWindow: React.FC<PreviewWindowProps> = ({ onMinimize, onClose }) => {
  return (
    <div className="preview-window">
      <div className="preview-header">
        <span>Animation Preview</span>
        <div className="window-controls">
          <button onClick={onMinimize}>_</button>
          <button onClick={onClose}>×</button>
        </div>
      </div>
      <div className="preview-content">
        <div className="preview-canvas"></div>
      </div>
    </div>
  );
};

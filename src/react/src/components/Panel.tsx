import React from 'react';

interface PanelProps {
  title: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ title, children }) => {
  return (
    <div className="panel">
      <div className="panel-header">{title}</div>
      <div className="panel-content">{children}</div>
    </div>
  );
};

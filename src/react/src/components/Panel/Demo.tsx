import React, { useState } from 'react';
import { Panel } from './index';

export const PanelDemo: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(300);

  return (
    <div style={{ display: 'flex', gap: '1px', padding: '20px', background: 'var(--bg-color)', height: '100vh' }}>
      <Panel
        title="Tracks"
        collapsible
        resizable
        width={leftWidth}
        onResize={setLeftWidth}
        controls={
          <button onClick={() => console.log('Add Track')}>+</button>
        }
      >
        <div style={{ color: 'var(--text-color)' }}>
          <div>Track 1</div>
          <div>Track 2</div>
          <div>Track 3</div>
        </div>
      </Panel>

      <div style={{ flex: 1, background: 'var(--panel-bg)' }}>
        <Panel title="Animation Models">
          <div style={{ color: 'var(--text-color)' }}>
            Center panel content
          </div>
        </Panel>
      </div>

      <Panel
        title="Properties"
        collapsible
        resizable
        width={rightWidth}
        onResize={setRightWidth}
      >
        <div style={{ color: 'var(--text-color)' }}>
          <div>Property 1: Value</div>
          <div>Property 2: Value</div>
          <div>Property 3: Value</div>
        </div>
      </Panel>
    </div>
  );
};

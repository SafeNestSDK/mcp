import React from 'react';
import { createRoot } from 'react-dom/client';
import { useToolResult } from '@ui/hooks/useToolResult';
import { DetectionPage } from '@ui/pages/DetectionPage';
import { baseStyles } from '@ui/theme';

function Widget() {
  const { data, loading, callTool } = useToolResult();

  if (loading || !data) {
    return <div style={{ padding: 16, textAlign: 'center', color: '#94A3B8' }}>Analyzing...</div>;
  }

  return (
    <DetectionPage
      data={data}
      onGetActionPlan={() => {
        const rationale = data.result.rationale || data.result.summary || '';
        callTool('get_action_plan', { situation: rationale });
      }}
      onRunFullAnalysis={() => {
        callTool('analyse_multi', {
          content: data.result.content || '',
          endpoints: ['social_engineering', 'app_fraud', 'romance_scam', 'mule_recruitment', 'gambling_harm', 'coercive_control', 'vulnerability_exploitation', 'radicalisation'],
        });
      }}
    />
  );
}

const style = document.createElement('style');
style.textContent = baseStyles;
document.head.appendChild(style);

createRoot(document.getElementById('root')!).render(<Widget />);

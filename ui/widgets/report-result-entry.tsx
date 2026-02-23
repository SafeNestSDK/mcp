import React from 'react';
import { createRoot } from 'react-dom/client';
import { useToolResult } from '@ui/hooks/useToolResult';
import { ReportPage } from '@ui/pages/ReportPage';
import { baseStyles } from '@ui/theme';

function Widget() {
  const { data, loading, callTool } = useToolResult();

  if (loading || !data) {
    return <div style={{ padding: 16, textAlign: 'center', color: '#94A3B8' }}>Generating report...</div>;
  }

  return (
    <ReportPage
      data={data}
      onGetActionPlan={() => {
        callTool('get_action_plan', { situation: data.result.summary || '' });
      }}
    />
  );
}

const style = document.createElement('style');
style.textContent = baseStyles;
document.head.appendChild(style);

createRoot(document.getElementById('root')!).render(<Widget />);

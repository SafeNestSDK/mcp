import React from 'react';
import { createRoot } from 'react-dom/client';
import { useToolResult } from '@ui/hooks/useToolResult';
import { MultiPage } from '@ui/pages/MultiPage';
import { baseStyles } from '@ui/theme';

function Widget() {
  const { data, loading } = useToolResult();

  if (loading || !data) {
    return <div style={{ padding: 16, textAlign: 'center', color: '#94A3B8' }}>Running multi-endpoint analysis...</div>;
  }

  return <MultiPage data={data} />;
}

const style = document.createElement('style');
style.textContent = baseStyles;
document.head.appendChild(style);

createRoot(document.getElementById('root')!).render(<Widget />);

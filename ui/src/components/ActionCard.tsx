import React from 'react';
import { colors } from '../theme';

interface ActionCardProps {
  action: string;
}

export function ActionCard({ action }: ActionCardProps) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: '#ECFDF5',
        border: `1px solid #A7F3D0`,
        margin: '8px 0',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: colors.severity.safe, marginBottom: 4 }}>
        Recommended Action
      </div>
      <div style={{ fontSize: 13, color: '#065F46' }}>{action}</div>
    </div>
  );
}

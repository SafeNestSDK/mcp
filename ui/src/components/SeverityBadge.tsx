import React from 'react';
import { severityColor } from '../theme';

interface SeverityBadgeProps {
  level: string;
  label?: string;
}

export function SeverityBadge({ level, label }: SeverityBadgeProps) {
  const color = severityColor(level);
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        background: color,
        textTransform: 'capitalize',
      }}
    >
      {label || level}
    </span>
  );
}

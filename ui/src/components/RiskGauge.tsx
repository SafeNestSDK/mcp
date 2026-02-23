import React from 'react';
import { severityColor, colors } from '../theme';

interface RiskGaugeProps {
  score: number; // 0-1
  level: string;
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  const pct = Math.round(score * 100);
  const color = severityColor(level);
  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score);

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle
          cx={50} cy={50} r={radius}
          fill="none" stroke={colors.bg.tertiary} strokeWidth={stroke}
        />
        <circle
          cx={50} cy={50} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x={50} y={46} textAnchor="middle" fontSize={22} fontWeight={700} fill={color}>
          {pct}%
        </text>
        <text x={50} y={62} textAnchor="middle" fontSize={10} fill={colors.text.secondary}>
          Risk Score
        </text>
      </svg>
    </div>
  );
}

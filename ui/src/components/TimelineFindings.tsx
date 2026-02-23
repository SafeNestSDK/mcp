import React from 'react';
import { colors, severityColor } from '../theme';

interface Finding {
  timestamp: number;
  frame_index?: number;
  description: string;
  categories: string[];
  severity: number;
}

interface TimelineFindingsProps {
  findings: Finding[];
}

function severityLevel(s: number): string {
  if (s <= 0.3) return 'low';
  if (s <= 0.6) return 'medium';
  if (s <= 0.85) return 'high';
  return 'critical';
}

export function TimelineFindings({ findings }: TimelineFindingsProps) {
  if (!findings || findings.length === 0) {
    return (
      <div style={{ fontSize: 13, color: colors.text.muted, fontStyle: 'italic', padding: '12px 0' }}>
        No safety findings detected.
      </div>
    );
  }

  return (
    <div style={{ margin: '12px 0' }}>
      {findings.map((f, i) => {
        const color = severityColor(severityLevel(f.severity));
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              padding: '8px 0',
              borderBottom: i < findings.length - 1 ? `1px solid ${colors.border}` : undefined,
            }}
          >
            <div
              style={{
                minWidth: 60,
                fontSize: 11,
                fontFamily: 'monospace',
                color: colors.text.muted,
                paddingTop: 2,
              }}
            >
              {f.timestamp.toFixed(1)}s
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: colors.text.primary, marginBottom: 2 }}>{f.description}</div>
              <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                <span style={{ color, fontWeight: 600 }}>{Math.round(f.severity * 100)}%</span>
                <span style={{ color: colors.text.muted }}>{f.categories.join(', ')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

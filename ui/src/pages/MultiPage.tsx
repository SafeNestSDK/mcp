import React from 'react';
import { AppWrapper } from '../App';
import { RiskGauge } from '../components/RiskGauge';
import { SeverityBadge } from '../components/SeverityBadge';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { CategoryChips } from '../components/CategoryChips';
import { colors, severityColor } from '../theme';
import type { ToolResultPayload, AnalyseMultiResult } from '../types';

export function MultiPage({ data }: { data: ToolResultPayload }) {
  const result = data.result as AnalyseMultiResult;
  const { summary, results } = result;

  return (
    <AppWrapper title="Multi-Endpoint Analysis">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <RiskGauge score={summary.highest_risk.risk_score} level={summary.overall_risk_level} />
        <div>
          <SeverityBadge level={summary.overall_risk_level} />
          <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 4 }}>
            {summary.detected_count} of {summary.total_endpoints} threats detected
          </div>
          {result.cross_endpoint_modifier && (
            <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 2 }}>
              Cross-endpoint modifier: {result.cross_endpoint_modifier.toFixed(2)}x
            </div>
          )}
        </div>
      </div>

      {results.map((r, i) => {
        const color = severityColor(r.level);
        return (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              marginBottom: 8,
              borderRadius: 8,
              background: colors.bg.secondary,
              borderLeft: `3px solid ${r.detected ? color : colors.severity.safe}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
                {r.endpoint.replace(/_/g, ' ')}
              </span>
              <SeverityBadge level={r.detected ? r.level : 'safe'} label={r.detected ? `${Math.round(r.risk_score * 100)}%` : 'Clear'} />
            </div>
            {r.categories.length > 0 && <CategoryChips categories={r.categories} />}
            <div style={{ fontSize: 12, color: colors.text.secondary }}>{r.rationale}</div>
          </div>
        );
      })}
    </AppWrapper>
  );
}

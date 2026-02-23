import React from 'react';
import { AppWrapper } from '../App';
import { RiskGauge } from '../components/RiskGauge';
import { SeverityBadge } from '../components/SeverityBadge';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { CategoryChips } from '../components/CategoryChips';
import { EvidenceCard } from '../components/EvidenceCard';
import { ActionCard } from '../components/ActionCard';
import { AgeCalibration } from '../components/AgeCalibration';
import { colors } from '../theme';
import type { ToolResultPayload } from '../types';

function formatToolName(name: string): string {
  return name
    .replace(/^detect_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

interface DetectionPageProps {
  data: ToolResultPayload;
  onGetActionPlan?: () => void;
  onRunFullAnalysis?: () => void;
}

export function DetectionPage({ data, onGetActionPlan, onRunFullAnalysis }: DetectionPageProps) {
  const { toolName, result } = data;
  const title = formatToolName(toolName);

  // Handle different result shapes
  const riskScore = result.risk_score ?? 0;
  const confidence = result.confidence ?? 0;
  const level = result.level || result.severity || result.grooming_risk || result.risk_level || 'none';
  const detected = result.detected ?? result.is_bullying ?? result.unsafe ?? (result.grooming_risk && result.grooming_risk !== 'none') ?? false;
  const rationale = result.rationale || result.summary || '';
  const action = result.recommended_action || '';
  const categories = result.categories || result.bullying_type || result.flags || [];
  const evidence = result.evidence || [];
  const ageCalibration = result.age_calibration;

  return (
    <AppWrapper title={title}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <RiskGauge score={riskScore} level={level} />
        <div>
          <SeverityBadge level={level} label={detected ? `${level} Risk` : 'Safe'} />
          <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 4 }}>
            {detected ? 'Threat detected' : 'No threat detected'}
          </div>
          {ageCalibration && <AgeCalibration calibration={ageCalibration} />}
        </div>
      </div>

      <ConfidenceBar value={confidence} />

      {categories.length > 0 && <CategoryChips categories={categories} />}

      {rationale && (
        <div style={{ margin: '12px 0', fontSize: 13, color: colors.text.secondary, lineHeight: 1.6 }}>
          {rationale}
        </div>
      )}

      {evidence.length > 0 && <EvidenceCard evidence={evidence} />}

      {action && <ActionCard action={action} />}

      {(onGetActionPlan || onRunFullAnalysis) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {onGetActionPlan && (
            <button
              onClick={onGetActionPlan}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${colors.brand.primary}`,
                background: colors.brand.primary,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Get Action Plan
            </button>
          )}
          {onRunFullAnalysis && (
            <button
              onClick={onRunFullAnalysis}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: '#fff',
                color: colors.text.primary,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Run Full Analysis
            </button>
          )}
        </div>
      )}
    </AppWrapper>
  );
}

import React from 'react';
import { AppWrapper } from '../App';
import { EmotionChart } from '../components/EmotionChart';
import { CategoryChips } from '../components/CategoryChips';
import { ActionCard } from '../components/ActionCard';
import { colors } from '../theme';
import type { ToolResultPayload, EmotionsResult } from '../types';

export function EmotionsPage({ data }: { data: ToolResultPayload }) {
  const result = data.result as EmotionsResult;

  return (
    <AppWrapper title="Emotion Analysis">
      <CategoryChips categories={result.dominant_emotions} />

      <EmotionChart scores={result.emotion_scores} trend={result.trend} />

      <div style={{ margin: '12px 0', fontSize: 13, color: colors.text.secondary, lineHeight: 1.6 }}>
        {result.summary}
      </div>

      {result.recommended_followup && <ActionCard action={result.recommended_followup} />}
    </AppWrapper>
  );
}

import React from 'react';
import { colors } from '../theme';
import type { AgeCalibration as AgeCalType } from '../types';

interface AgeCalibrationProps {
  calibration?: AgeCalType;
}

export function AgeCalibration({ calibration }: AgeCalibrationProps) {
  if (!calibration?.applied) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
        color: colors.brand.primaryDark,
        background: '#EEF2FF',
      }}
    >
      <span style={{ fontWeight: 600 }}>Age:</span>
      <span>{calibration.age_group}</span>
      {calibration.multiplier && <span>({calibration.multiplier}x)</span>}
    </div>
  );
}

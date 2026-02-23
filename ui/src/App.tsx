import React from 'react';
import { colors, fontFamily } from './theme';

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: `1px solid ${colors.border}`,
};

const logoStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryLight})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
};

const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: colors.text.primary,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 11,
  color: colors.text.muted,
  marginLeft: 'auto',
};

export function AppWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ fontFamily, maxWidth: 600, margin: '0 auto' }}>
      <div style={headerStyle}>
        <div style={logoStyle}>T</div>
        <span style={titleStyle}>{title}</span>
        <span style={subtitleStyle}>Powered by Tuteliq AI</span>
      </div>
      {children}
    </div>
  );
}

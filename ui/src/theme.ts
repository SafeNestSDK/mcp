export const colors = {
  brand: {
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
  },
  severity: {
    safe: '#10B981',
    low: '#F59E0B',
    medium: '#F97316',
    high: '#EF4444',
    critical: '#991B1B',
  },
  bg: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
  },
  border: '#E2E8F0',
} as const;

export function severityColor(level: string): string {
  const map: Record<string, string> = {
    safe: colors.severity.safe,
    none: colors.severity.safe,
    low: colors.severity.low,
    medium: colors.severity.medium,
    high: colors.severity.high,
    critical: colors.severity.critical,
  };
  return map[level] || colors.text.muted;
}

export const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${fontFamily};
    color: ${colors.text.primary};
    background: ${colors.bg.primary};
    font-size: 14px;
    line-height: 1.5;
    padding: 16px;
  }
`;

import { type TextStyle } from 'react-native';

interface ColorTokens {
  readonly background: string;

  readonly surface: string;

  readonly surfaceRaised: string;
  readonly border: string;
  readonly textPrimary: string;

  readonly textSecondary: string;

  readonly textMuted: string;

  readonly primary: string;

  readonly accent: string;

  readonly onEmphasis: string;

  readonly danger: string;

  readonly warning: string;

  readonly scrim: string;
}

interface SpacingTokens {
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
  readonly xxl: number;
}

interface RadiusTokens {
  readonly sm: number;

  readonly md: number;

  readonly lg: number;

  readonly pill: number;
}

interface TypographyToken {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: '400' | '500' | '600' | '700';

  readonly fontVariant?: TextStyle['fontVariant'];
}

interface TypographyTokens {
  readonly title: TypographyToken;
  readonly body: TypographyToken;

  readonly amount: TypographyToken;

  readonly code: TypographyToken;

  readonly label: TypographyToken;
  readonly caption: TypographyToken;
}

export interface ThemeTokens {
  readonly colors: ColorTokens;
  readonly spacing: SpacingTokens;
  readonly radii: RadiusTokens;
  readonly typography: TypographyTokens;
}

const spacing: SpacingTokens = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

const radii: RadiusTokens = { sm: 8, md: 12, lg: 16, pill: 999 };

const TABULAR_NUMS: TextStyle['fontVariant'] = ['tabular-nums'];

const typography: TypographyTokens = {
  title: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  amount: { fontSize: 24, lineHeight: 30, fontWeight: '600', fontVariant: TABULAR_NUMS },
  code: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  label: { fontSize: 14, lineHeight: 19, fontWeight: '500' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400', fontVariant: TABULAR_NUMS },
};

const lightColors: ColorTokens = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceRaised: '#EFF6FF',
  border: '#E2E8F0',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  primary: '#2563EB',

  accent: '#0F9F93',
  onEmphasis: '#FFFFFF',
  danger: '#DC2626',
  warning: '#D97706',
  scrim: 'rgba(15, 23, 42, 0.45)',
};

const darkColors: ColorTokens = {
  background: '#0F172A',
  surface: '#111C2F',
  surfaceRaised: '#172554',
  border: '#263449',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#3B82F6',
  accent: '#2DD4BF',

  onEmphasis: '#0F172A',
  danger: '#F87171',
  warning: '#FBBF24',
  scrim: 'rgba(2, 6, 23, 0.6)',
};

export const lightTheme: ThemeTokens = { colors: lightColors, spacing, radii, typography };

export const darkTheme: ThemeTokens = { colors: darkColors, spacing, radii, typography };
/** Shared values used to style the interface. */

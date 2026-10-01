/**
 * Disaster Emergency Design System & Theme Tokens
 * Clean, modern light-theme emergency aesthetic matching reference design.
 * High-clarity off-white background, deep navy text, blue actions, red SOS.
 */

export const THEME = {
  colors: {
    // Base backgrounds & surfaces
    background: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceBorder: '#E5E7EB',
    surfaceSubtle: '#F1F5F9',

    // Primary action blue (reference design)
    primary: '#0066FF',
    primaryDark: '#0052CC',
    primarySubtle: '#EFF6FF',
    primaryBorder: '#BFDBFE',

    // Emergency Crimson / SOS
    emergency: '#EF4444',
    emergencyDark: '#DC2626',
    emergencyHover: '#B91C1C',
    emergencySubtle: '#FEE2E2',
    emergencyBorder: '#FCA5A5',

    // Amber / Warning / Standby
    warning: '#F59E0B',
    warningSubtle: '#FEF3C7',
    warningBorder: '#FDE68A',

    // Signal / Connected Blue
    signal: '#0066FF',
    signalDark: '#0052CC',
    signalSubtle: '#EFF6FF',

    // Safe Green
    success: '#10B981',
    successDark: '#059669',
    successSubtle: '#ECFDF5',
    successBorder: '#A7F3D0',

    // Neutral Text Hierarchy (Deep Navy / Slate)
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textDisabled: '#CBD5E1',

    // Disabled / Inactive elements
    disabledBg: '#F1F5F9',
    disabledBorder: '#E2E8F0',
    disabledText: '#94A3B8',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    button: {
      shadowColor: '#0066FF',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 3,
    },
    sos: {
      shadowColor: '#EF4444',
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    },
  },

  typography: {
    fontFamily: 'System',
    titleHero: {
      fontSize: 26,
      fontWeight: '900' as const,
      letterSpacing: 0.5,
      color: '#0F172A',
    },
    titleSection: {
      fontSize: 18,
      fontWeight: '800' as const,
      letterSpacing: 0.2,
      color: '#0F172A',
    },
    titleCard: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      color: '#475569',
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      color: '#64748B',
    },
    caption: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.6,
      color: '#94A3B8',
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '700' as const,
      letterSpacing: 0.4,
      color: '#FFFFFF',
    },
  },

  touchTarget: {
    minHeight: 48,
  },
};


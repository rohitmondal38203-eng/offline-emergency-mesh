/**
 * Disaster Emergency Design System & Theme Tokens
 * High-contrast, dark-mode optimized for outdoor readability and low battery consumption.
 */

export const THEME = {
  colors: {
    // Base backgrounds
    background: '#090d16',
    surface: '#111827',
    surfaceRaised: '#1f2937',
    surfaceBorder: '#374151',
    surfaceSubtle: '#141e33',

    // Emergency Crimson
    emergency: '#dc2626',
    emergencyHover: '#b91c1c',
    emergencySubtle: 'rgba(220, 38, 38, 0.15)',
    emergencyBorder: '#ef4444',

    // Amber / Warning / Standby
    warning: '#f59e0b',
    warningSubtle: 'rgba(245, 158, 11, 0.15)',
    warningBorder: '#d97706',

    // Signal Cyan / Info / Mesh
    signal: '#38bdf8',
    signalDark: '#0284c7',
    signalSubtle: 'rgba(56, 189, 248, 0.12)',

    // Safe Green
    success: '#10b981',
    successSubtle: 'rgba(16, 185, 129, 0.12)',

    // Neutral Text Hierarchy
    textPrimary: '#f9fafb',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    textDisabled: '#4b5563',

    // Disabled / Inactive elements
    disabledBg: '#1f2937',
    disabledBorder: '#374151',
    disabledText: '#6b7280',
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
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },

  typography: {
    fontFamily: 'System',
    titleHero: {
      fontSize: 26,
      fontWeight: '900' as const,
      letterSpacing: 1.2,
      color: '#f9fafb',
    },
    titleSection: {
      fontSize: 18,
      fontWeight: '800' as const,
      letterSpacing: 0.5,
      color: '#f9fafb',
    },
    titleCard: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: '#f9fafb',
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      color: '#9ca3af',
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      color: '#9ca3af',
    },
    caption: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.8,
      color: '#6b7280',
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '800' as const,
      letterSpacing: 1,
      color: '#ffffff',
    },
  },

  touchTarget: {
    minHeight: 48,
  },
};

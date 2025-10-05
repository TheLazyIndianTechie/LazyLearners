/**
 * Email Theme Configuration
 *
 * Centralized theme and design tokens for all email templates
 */

export const emailTheme = {
  // Colors - LazyGameDevs brand colors
  colors: {
    // Primary brand colors
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // Primary brand color
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    // Secondary purple colors
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    // Neutral grays
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    // Semantic colors
    success: {
      light: '#dcfce7',
      main: '#22c55e',
      dark: '#166534',
    },
    warning: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#92400e',
    },
    error: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#991b1b',
    },
    info: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#1e40af',
    },
    // Text colors
    text: {
      primary: '#111827',
      secondary: '#374151',
      tertiary: '#6b7280',
      inverse: '#ffffff',
    },
    // Background colors
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      dark: '#111827',
    },
    // Border colors
    border: {
      light: '#e5e7eb',
      main: '#d1d5db',
      dark: '#9ca3af',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '28px',
      '4xl': '32px',
      '5xl': '40px',
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.6',
      loose: '2',
    },
  },

  // Spacing (in pixels)
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '4px',
    base: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Layout
  layout: {
    maxWidth: {
      email: '600px',
      content: '560px',
    },
    padding: {
      email: '20px',
      section: '40px',
      content: '30px',
    },
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
    dark: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
  },

  // Transitions
  transitions: {
    fast: '150ms',
    base: '300ms',
    slow: '500ms',
  },
} as const;

/**
 * Common inline styles for email compatibility
 */
export const emailStyles = {
  // Container styles
  container: {
    width: '100%',
    maxWidth: emailTheme.layout.maxWidth.email,
    margin: '0 auto',
    backgroundColor: emailTheme.colors.background.primary,
  },

  // Section styles
  section: {
    padding: emailTheme.layout.padding.section,
  },

  // Header gradient
  headerGradient: {
    background: emailTheme.gradients.primary,
    padding: '40px',
    textAlign: 'center' as const,
    borderRadius: '8px 8px 0 0',
  },

  // Footer
  footer: {
    padding: '20px 40px',
    backgroundColor: emailTheme.colors.background.secondary,
    textAlign: 'center' as const,
    borderRadius: '0 0 8px 8px',
  },

  // Button primary
  buttonPrimary: {
    display: 'inline-block',
    padding: '14px 28px',
    backgroundColor: emailTheme.colors.primary[500],
    color: emailTheme.colors.text.inverse,
    textDecoration: 'none',
    borderRadius: emailTheme.borderRadius.base,
    fontWeight: emailTheme.typography.fontWeight.bold,
    fontSize: emailTheme.typography.fontSize.base,
  },

  // Button secondary
  buttonSecondary: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: emailTheme.colors.primary[500],
    textDecoration: 'none',
    border: `2px solid ${emailTheme.colors.primary[500]}`,
    borderRadius: emailTheme.borderRadius.base,
    fontWeight: emailTheme.typography.fontWeight.semibold,
    fontSize: emailTheme.typography.fontSize.base,
  },

  // Card
  card: {
    backgroundColor: emailTheme.colors.background.primary,
    borderRadius: emailTheme.borderRadius.md,
    padding: emailTheme.spacing[6],
    boxShadow: emailTheme.shadow.base,
  },

  // Alert box
  alertSuccess: {
    backgroundColor: emailTheme.colors.success.light,
    borderLeft: `4px solid ${emailTheme.colors.success.main}`,
    padding: emailTheme.spacing[4],
    borderRadius: emailTheme.borderRadius.sm,
    marginTop: emailTheme.spacing[4],
    marginBottom: emailTheme.spacing[4],
  },

  alertWarning: {
    backgroundColor: emailTheme.colors.warning.light,
    borderLeft: `4px solid ${emailTheme.colors.warning.main}`,
    padding: emailTheme.spacing[4],
    borderRadius: emailTheme.borderRadius.sm,
    marginTop: emailTheme.spacing[4],
    marginBottom: emailTheme.spacing[4],
  },

  alertError: {
    backgroundColor: emailTheme.colors.error.light,
    borderLeft: `4px solid ${emailTheme.colors.error.main}`,
    padding: emailTheme.spacing[4],
    borderRadius: emailTheme.borderRadius.sm,
    marginTop: emailTheme.spacing[4],
    marginBottom: emailTheme.spacing[4],
  },

  alertInfo: {
    backgroundColor: emailTheme.colors.info.light,
    borderLeft: `4px solid ${emailTheme.colors.info.main}`,
    padding: emailTheme.spacing[4],
    borderRadius: emailTheme.borderRadius.sm,
    marginTop: emailTheme.spacing[4],
    marginBottom: emailTheme.spacing[4],
  },

  // Typography
  h1: {
    margin: '0 0 20px',
    color: emailTheme.colors.text.primary,
    fontSize: emailTheme.typography.fontSize['3xl'],
    fontWeight: emailTheme.typography.fontWeight.bold,
    lineHeight: emailTheme.typography.lineHeight.tight,
  },

  h2: {
    margin: '0 0 16px',
    color: emailTheme.colors.text.primary,
    fontSize: emailTheme.typography.fontSize['2xl'],
    fontWeight: emailTheme.typography.fontWeight.bold,
    lineHeight: emailTheme.typography.lineHeight.tight,
  },

  h3: {
    margin: '0 0 12px',
    color: emailTheme.colors.text.primary,
    fontSize: emailTheme.typography.fontSize.xl,
    fontWeight: emailTheme.typography.fontWeight.semibold,
    lineHeight: emailTheme.typography.lineHeight.normal,
  },

  paragraph: {
    margin: '0 0 15px',
    color: emailTheme.colors.text.secondary,
    fontSize: emailTheme.typography.fontSize.base,
    lineHeight: emailTheme.typography.lineHeight.relaxed,
  },

  small: {
    fontSize: emailTheme.typography.fontSize.sm,
    color: emailTheme.colors.text.tertiary,
  },
} as const;

/**
 * Type exports
 */
export type EmailTheme = typeof emailTheme;
export type EmailStyles = typeof emailStyles;

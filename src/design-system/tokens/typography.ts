/**
 * Design System - Typography Tokens
 * Based on analysis of existing typography component usage
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
  },

  // Font Sizes (from existing Typography component)
  fontSize: {
    xs: '0.75rem', // 12px - captions, small text
    sm: '0.875rem', // 14px - body text, labels
    base: '1rem', // 16px - base body text
    lg: '1.125rem', // 18px - large body text, h3
    xl: '1.25rem', // 20px - h2
    '2xl': '1.5rem', // 24px - h1
    '3xl': '1.875rem', // 30px - large headings
    '4xl': '2.25rem', // 36px - hero text
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line Heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
  },

  // Typography Scales (from existing Typography component usage)
  scale: {
    // Headings
    h1: {
      fontSize: '1.5rem', // 2xl
      fontWeight: '700', // bold
      lineHeight: '1.25', // tight
      color: 'hsl(222.2, 47.4%, 11.2%)', // black
    },
    h2: {
      fontSize: '1.25rem', // xl
      fontWeight: '700', // bold
      lineHeight: '1.25', // tight
      color: 'hsl(222.2, 47.4%, 11.2%)', // black
    },
    h3: {
      fontSize: '1.125rem', // lg
      fontWeight: '700', // bold
      lineHeight: '1.25', // tight
      color: 'hsl(222.2, 47.4%, 11.2%)', // black
    },
    h4: {
      fontSize: '1rem', // base
      fontWeight: '600', // semibold
      lineHeight: '1.25', // tight
      color: 'hsl(222.2, 47.4%, 11.2%)', // black
    },
    h5: {
      fontSize: '0.875rem', // sm
      fontWeight: '600', // semibold
      lineHeight: '1.25', // tight
      color: 'hsl(222.2, 47.4%, 11.2%)', // black
    },
    h6: {
      fontSize: '0.75rem', // xs
      fontWeight: '600', // semibold
      lineHeight: '1.25', // tight
      color: 'hsl(222.2, 47.4%, 11.2%)', // black
    },

    // Body text
    body: {
      fontSize: '0.875rem', // sm
      fontWeight: '400', // normal
      lineHeight: '1.625', // relaxed
      color: 'hsl(215.4, 16.3%, 36.9%)', // gray-700
    },

    // Labels
    label: {
      fontSize: '0.875rem', // sm
      fontWeight: '500', // medium
      lineHeight: '1.5', // normal
      color: 'hsl(215.4, 16.3%, 36.9%)', // gray-700
    },

    // Captions
    caption: {
      fontSize: '0.75rem', // xs
      fontWeight: '400', // normal
      lineHeight: '1.5', // normal
      color: 'hsl(215.4, 16.3%, 46.9%)', // gray-500
    },

    // Interactive text
    link: {
      fontSize: '0.875rem', // sm
      fontWeight: '500', // medium
      lineHeight: '1.5', // normal
      color: '#ff4800', // brand primary
    },
  },
} as const;

export type TypographyScale = keyof typeof typography.scale;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;

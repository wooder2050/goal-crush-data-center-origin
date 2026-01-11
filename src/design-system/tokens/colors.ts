/**
 * Design System - Color Tokens
 * Based on analysis of existing components and CSS custom properties
 */

export const colors = {
  // Brand Colors
  brand: {
    primary: '#ff4800', // Orange-red brand color
    primaryLight: '#ff4800/10',
    primaryDark: '#e6410a',
  },

  // Neutral Colors (from CSS custom properties)
  neutral: {
    50: 'hsl(210, 40%, 98%)',
    100: 'hsl(210, 40%, 96%)',
    200: 'hsl(214.3, 31.8%, 91.4%)',
    300: 'hsl(213, 27%, 84%)',
    400: 'hsl(215.4, 16.3%, 56.9%)',
    500: 'hsl(215.4, 16.3%, 46.9%)',
    600: 'hsl(215.4, 16.3%, 36.9%)',
    700: 'hsl(215.4, 16.3%, 26.9%)',
    800: 'hsl(222.2, 47.4%, 11.2%)',
    900: 'hsl(222.2, 84%, 4.9%)',
    950: 'hsl(222.2, 84%, 4.9%)',
  },

  // Semantic Colors
  semantic: {
    // Success
    success: {
      50: 'hsl(138, 76%, 97%)',
      100: 'hsl(141, 84%, 93%)',
      500: 'hsl(142, 76%, 36%)',
      600: 'hsl(142, 72%, 29%)',
      900: 'hsl(140, 100%, 2%)',
    },
    // Warning
    warning: {
      50: 'hsl(48, 96%, 89%)',
      100: 'hsl(48, 100%, 80%)',
      500: 'hsl(31, 92%, 58%)',
      600: 'hsl(25, 95%, 53%)',
      900: 'hsl(15, 86%, 30%)',
    },
    // Error/Destructive
    error: {
      50: 'hsl(0, 86%, 97%)',
      100: 'hsl(0, 93%, 94%)',
      500: 'hsl(0, 84.2%, 60.2%)',
      600: 'hsl(0, 72%, 51%)',
      900: 'hsl(0, 63%, 31%)',
    },
    // Info
    info: {
      50: 'hsl(214, 100%, 97%)',
      100: 'hsl(214, 95%, 93%)',
      500: 'hsl(217, 91%, 60%)',
      600: 'hsl(221, 83%, 53%)',
      900: 'hsl(224, 76%, 48%)',
    },
  },

  // Component-specific colors (used in existing components)
  component: {
    // Card shadows and borders
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    cardBorder: 'hsl(214.3, 31.8%, 91.4%)',

    // Input and form elements
    inputBorder: 'hsl(214.3, 31.8%, 91.4%)',
    inputFocus: 'hsl(222.2, 47.4%, 11.2%)',

    // Sports-specific colors
    trophy: '#fbbf24', // Gold for trophies
    trophyOutline: '#f59e0b',

    // Hover states
    hoverOverlay: 'rgba(0, 0, 0, 0.05)',
  },
} as const;

export type ColorScale = typeof colors;
export type BrandColor = keyof typeof colors.brand;
export type NeutralColor = keyof typeof colors.neutral;
export type SemanticColorCategory = keyof typeof colors.semantic;

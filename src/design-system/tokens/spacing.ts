/**
 * Design System - Spacing Tokens
 * Based on analysis of existing component spacing patterns
 */

export const spacing = {
  // Base spacing scale (Tailwind compatible)
  px: '1px',
  0: '0px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px

  // Semantic spacing (based on component usage patterns)
  component: {
    // Button spacing
    buttonPaddingX: {
      sm: '0.75rem', // 12px - px-3
      default: '1rem', // 16px - px-4
      lg: '2rem', // 32px - px-8
    },
    buttonPaddingY: {
      sm: '0.375rem', // 6px - py-1.5
      default: '0.5rem', // 8px - py-2
      lg: '0.5rem', // 8px - py-2
    },

    // Card spacing (from analysis)
    cardPadding: {
      mobile: '0.5rem', // 8px - p-2
      desktop: '1rem', // 16px - p-4
      large: '1.5rem', // 24px - p-6
    },

    // Container spacing
    containerPadding: {
      sm: '1rem', // 16px - px-4
      md: '1rem', // 16px - px-4, lg:px-6
      lg: '1.5rem', // 24px - px-6, lg:px-8
      xl: '2rem', // 32px - px-8, lg:px-12
    },

    // Section spacing
    sectionPadding: {
      sm: '2rem', // 32px - py-8
      md: '3rem', // 48px - py-12
      lg: '4rem', // 64px - py-16
      xl: '6rem', // 96px - py-24
    },

    // Gap spacing (from Grid component)
    gap: {
      xs: '0.25rem', // 4px - gap-1
      sm: '0.5rem', // 8px - gap-2
      md: '1rem', // 16px - gap-4
      lg: '1.5rem', // 24px - gap-6
      xl: '2rem', // 32px - gap-8
    },
  },

  // Interactive element spacing
  interactive: {
    // Minimum touch target (accessibility)
    minTouchTarget: '44px',

    // Focus ring offset
    focusRingOffset: '2px',

    // Icon spacing
    iconMargin: {
      sm: '0.25rem', // 4px - mr-1
      md: '0.5rem', // 8px - mr-2
      lg: '0.75rem', // 12px - mr-3
    },
  },

  // Layout spacing
  layout: {
    // Header/Navigation
    headerHeight: '4rem', // 64px
    navItemSpacing: '1rem', // 16px

    // Sidebar
    sidebarWidth: '16rem', // 256px

    // Modal/Dialog
    modalPadding: '1.5rem', // 24px
    modalMargin: '1rem', // 16px
  },
} as const;

export type SpacingScale = keyof typeof spacing;
export type ComponentSpacing = keyof typeof spacing.component;

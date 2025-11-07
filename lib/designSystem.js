/**
 * Nova AI - Minimal Design System
 * Inspired by ChatGPT, Claude, and Perplexity
 * 
 * Philosophy: Calm, premium, accessible
 */

export const designSystem = {
  // Colors - Minimal palette
  colors: {
    light: {
      // Backgrounds
      bg: {
        primary: '#FFFFFF',
        secondary: '#F9FAFB',
        tertiary: '#F3F4F6',
        elevated: '#FFFFFF',
      },
      // Text
      text: {
        primary: '#1F2937',
        secondary: '#6B7280',
        tertiary: '#9CA3AF',
        muted: '#D1D5DB',
      },
      // Borders
      border: {
        light: '#F3F4F6',
        default: '#E5E7EB',
        strong: '#D1D5DB',
      },
      // Accent (Purple)
      accent: {
        primary: '#8B5CF6',
        hover: '#7C3AED',
        light: '#EDE9FE',
        subtle: '#F5F3FF',
      },
      // Semantic
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    dark: {
      // Backgrounds
      bg: {
        primary: '#0F172A',
        secondary: '#1E293B',
        tertiary: '#334155',
        elevated: '#1E293B',
      },
      // Text
      text: {
        primary: '#F1F5F9',
        secondary: '#CBD5E1',
        tertiary: '#94A3B8',
        muted: '#64748B',
      },
      // Borders
      border: {
        light: '#1E293B',
        default: '#334155',
        strong: '#475569',
      },
      // Accent (Purple)
      accent: {
        primary: '#8B5CF6',
        hover: '#A78BFA',
        light: '#6D28D9',
        subtle: '#4C1D95',
      },
      // Semantic
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // Typography - Modern, readable
  typography: {
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing - Generous, breathable
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },

  // Border radius - Soft, modern
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows - Subtle depth
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Layout constraints
  layout: {
    chatMaxWidth: '780px',
    sidebarWidth: '280px',
    topBarHeight: '64px',
    inputHeight: '56px',
  },

  // Animation timings - Smooth, not poppy
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: 'cubic-bezier(0.32, 0.72, 0, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Use sparingly
    },
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// CSS custom properties generator
export function generateCSSVariables(theme = 'light') {
  const colors = designSystem.colors[theme];
  
  return `
    /* Backgrounds */
    --color-bg-primary: ${colors.bg.primary};
    --color-bg-secondary: ${colors.bg.secondary};
    --color-bg-tertiary: ${colors.bg.tertiary};
    --color-bg-elevated: ${colors.bg.elevated};
    
    /* Text */
    --color-text-primary: ${colors.text.primary};
    --color-text-secondary: ${colors.text.secondary};
    --color-text-tertiary: ${colors.text.tertiary};
    --color-text-muted: ${colors.text.muted};
    
    /* Borders */
    --color-border-light: ${colors.border.light};
    --color-border-default: ${colors.border.default};
    --color-border-strong: ${colors.border.strong};
    
    /* Accent */
    --color-accent-primary: ${colors.accent.primary};
    --color-accent-hover: ${colors.accent.hover};
    --color-accent-light: ${colors.accent.light};
    --color-accent-subtle: ${colors.accent.subtle};
    
    /* Semantic */
    --color-success: ${colors.success};
    --color-warning: ${colors.warning};
    --color-error: ${colors.error};
    --color-info: ${colors.info};
  `;
}

export default designSystem;

import type { Config } from 'tailwindcss';

/**
 * Trafi color tokens from UX specification
 * Used across all Trafi applications for consistent branding
 */
export const trafiColors = {
  background: {
    light: '#FAFAFA',
    dark: '#0A0A0A',
  },
  foreground: {
    light: '#171717',
    dark: '#FAFAFA',
  },
  muted: {
    light: '#F5F5F5',
    dark: '#171717',
  },
  'muted-foreground': {
    light: '#737373',
    dark: '#A3A3A3',
  },
  border: {
    light: '#E5E5E5',
    dark: '#262626',
  },
  primary: '#F97316', // Orange accent for CTAs
  'primary-foreground': '#FFFFFF',
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
} as const;

/**
 * Trafi Tailwind configuration
 * Extend this in your app's tailwind.config.ts
 */
export const trafiConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        trafi: trafiColors,
      },
      fontFamily: {
        sans: ['var(--font-general-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-clash-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
};

export default trafiConfig;

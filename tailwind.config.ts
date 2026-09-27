import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'rgb(var(--brand-50-rgb, 254 242 242) / <alpha-value>)',
          100: 'rgb(var(--brand-100-rgb, 254 226 226) / <alpha-value>)',
          200: 'rgb(var(--brand-200-rgb, 254 202 202) / <alpha-value>)',
          300: 'rgb(var(--brand-300-rgb, 252 165 165) / <alpha-value>)',
          400: 'rgb(var(--brand-400-rgb, 248 113 113) / <alpha-value>)',
          500: 'rgb(var(--brand-primary-rgb, 230 30 37) / <alpha-value>)',
          600: 'rgb(var(--brand-hover-rgb, 204 20 26) / <alpha-value>)',
          700: 'rgb(var(--brand-700-rgb, 185 28 28) / <alpha-value>)',
          800: 'rgb(var(--brand-800-rgb, 153 27 27) / <alpha-value>)',
          900: 'rgb(var(--brand-900-rgb, 127 29 29) / <alpha-value>)',
          950: 'rgb(var(--brand-950-rgb, 69 10 10) / <alpha-value>)',
          DEFAULT: 'rgb(var(--brand-primary-rgb, 230 30 37) / <alpha-value>)',
        },
        dark: {
          bg: 'rgb(var(--bg-primary-rgb, 0 0 0) / <alpha-value>)',
          card: 'rgb(var(--bg-surface-rgb, 18 18 20) / <alpha-value>)',
          surface: 'rgb(var(--bg-surface-rgb, 28 28 30) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated-rgb, 44 44 46) / <alpha-value>)',
          border: 'rgb(var(--border-strong-rgb, 56 56 58) / <alpha-value>)',
          borderSubtle: 'rgb(var(--border-subtle-rgb, 36 36 38) / <alpha-value>)',
          text: 'rgb(var(--text-primary-rgb, 245 245 247) / <alpha-value>)',
          muted: 'rgb(var(--text-muted-rgb, 134 134 139) / <alpha-value>)',
        },
        light: {
          bg: 'rgb(var(--bg-primary-rgb, 245 245 247) / <alpha-value>)',
          card: 'rgb(var(--bg-surface-rgb, 255 255 255) / <alpha-value>)',
          surface: 'rgb(var(--bg-elevated-rgb, 255 255 255) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated-rgb, 232 232 237) / <alpha-value>)',
          border: 'rgb(var(--border-strong-rgb, 210 210 215) / <alpha-value>)',
          borderSubtle: 'rgb(var(--border-subtle-rgb, 229 229 234) / <alpha-value>)',
          text: 'rgb(var(--text-primary-rgb, 29 29 31) / <alpha-value>)',
          muted: 'rgb(var(--text-muted-rgb, 134 134 139) / <alpha-value>)',
        },
        ios: {
          blue: '#007aff',
          green: '#34c759',
          indigo: '#5856d6',
          orange: '#ff9500',
          pink: '#ff2d55',
          purple: '#af52de',
          red: '#ff3b30',
          teal: '#5ac8fa',
          yellow: '#ffcc00',
          gray: '#8e8e93',
          gray2: '#636366',
          gray3: '#48484a',
          gray4: '#3a3a3c',
          gray5: '#2c2c2e',
          gray6: '#1c1c1e',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['"SF Mono"', 'Consolas', '"Liberation Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-red': '0 0 25px -4px rgba(230, 30, 37, 0.45)',
        'ios-card': '0 2px 10px rgba(0, 0, 0, 0.04), 0 8px 30px rgba(0, 0, 0, 0.06)',
        'ios-card-dark': '0 4px 24px -2px rgba(0, 0, 0, 0.6), 0 1px 2px rgba(255, 255, 255, 0.05)',
        'ios-floating': '0 12px 40px -6px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        'ios': '1.25rem', // 20px
        'ios-lg': '1.75rem', // 28px
        'ios-xl': '2.25rem', // 36px
      }
    },
  },
  plugins: [],
};

export default config;

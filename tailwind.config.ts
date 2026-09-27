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
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#e61e25', // Apple Vision signature red
          600: '#cc141a',
          700: '#b00f14',
          800: '#921015',
          900: '#791216',
          950: '#430508',
        },
        dark: {
          bg: '#000000', // Apple True Black (OLED)
          card: '#121214',
          surface: '#1c1c1e',
          elevated: '#2c2c2e',
          border: '#38383a',
          borderSubtle: '#242426',
          text: '#f5f5f7',
          muted: '#86868b', // Apple secondary text gray
        },
        light: {
          bg: '#f5f5f7', // Apple Light Gray background
          card: '#ffffff',
          surface: '#ffffff',
          elevated: '#e8e8ed',
          border: '#d2d2d7',
          borderSubtle: '#e5e5ea',
          text: '#1d1d1f', // Apple Primary text
          muted: '#86868b',
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

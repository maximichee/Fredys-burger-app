import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#fb8500',
          strong:  '#ff6b00',
          soft:    'rgba(251,133,0,0.15)',
        },
        dark: {
          DEFAULT: '#0f0f0f',
          100:     '#1a1a1a',
          200:     '#1f1f1f',
          300:     '#2a2a2a',
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;

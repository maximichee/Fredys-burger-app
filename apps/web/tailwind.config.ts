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
          strong:  '#ff9d33',          // hover: aclara (oscurecer baja el contraste con la letra oscura)
          soft:    'rgba(251,133,0,0.15)',
        },
        // Paleta "Parrilla de noche"
        dark: {
          DEFAULT: '#0f0b09',          // carbón tostado
          100:     '#17110d',
          200:     '#1e1612',
          300:     '#2a1f1a',
        },
        crema:   '#fff3e0',
        choco:   '#3a1f1a',
        cuero:   '#5a3a33',
        cheddar: '#ffc23d',
        tinta:   '#160d09',            // letra sobre el naranja
        apagado: '#c9b3a1',            // texto secundario
      },
      fontFamily: {
        sans:    ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        display: ['var(--font-anton)', 'Impact', 'Arial Narrow', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;

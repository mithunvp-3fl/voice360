import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        verdict: {
          comply: '#16a34a',
          partial: '#f59e0b',
          not: '#dc2626',
          na: '#6b7280',
        },
      },
    },
  },
  plugins: [],
};

export default config;

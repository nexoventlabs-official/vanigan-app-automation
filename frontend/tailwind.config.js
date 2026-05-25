/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf6ef',
          100: '#fae6d2',
          200: '#f4caa1',
          300: '#eba76a',
          400: '#df8541',
          500: '#cf6726',
          600: '#b04f1d',
          700: '#8d3d1a',
          800: '#6b2e15',
          900: '#4d2110',
        },
        accent: {
          500: '#0f766e',
          600: '#0d645d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

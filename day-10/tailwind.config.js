/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: '#0F1420',
        inkpanel: '#161C2C',
        paper: '#F6F4EE',
        paperpanel: '#EDEADF',
        amber: '#D9A441',
        teal: '#3FB6A8',
      },
    },
  },
  plugins: [],
};

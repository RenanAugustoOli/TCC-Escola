/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0fb',
          100: '#c2d4f5',
          200: '#9ab8ef',
          300: '#6b9be3',
          400: '#3d7dd6',
          500: '#1a6abf',
          600: '#0047AB',
          700: '#003d92',
          800: '#003079',
          900: '#001f52',
        },
        navy: {
          900: '#0f2444',
          800: '#162d52',
          700: '#1e3a63',
        },
      },
    },
  },
  plugins: [],
}

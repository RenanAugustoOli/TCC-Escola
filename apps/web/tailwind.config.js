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
        // Marca da landing page pública da academia (rota /academia) — isolada
        // da paleta `primary`/`navy` usada no painel administrativo acima.
        gymtech: {
          blue: '#1565C0',
          blueDark: '#0D47A1',
          blueLight: '#E3F0FC',
          ink: '#0F172A',
          slate: '#64748B',
          mist: '#F5F7FA',
          success: '#16A34A',
          danger: '#DC2626',
        },
      },
      fontFamily: {
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'count-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'grid-drift': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 40px' },
        },
      },
      animation: {
        'count-in': 'count-in 0.5s ease-out forwards',
        'grid-drift': 'grid-drift 12s linear infinite',
      },
    },
  },
  plugins: [],
}

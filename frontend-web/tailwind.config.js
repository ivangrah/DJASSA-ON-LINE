/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        djassa: {
          red: '#E11D48',
          'red-strong': '#E60023',
          'red-dark': '#BE123C',
          'red-soft': '#FECDD3',
          black: '#121212',
          ink: '#0F172A',
          white: '#FFFFFF',
          cloud: '#F5F5F5',
          mist: '#F8FAFC',
          slate: '#64748B',
        },
      },
      fontFamily: {
        jakarta: ['"Outfit"', 'system-ui', 'sans-serif'],
        inter: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 34px rgba(18,18,18,0.10)',
        pop: '0 14px 44px rgba(225,29,72,0.38)',
        glow: '0 0 0 3px rgba(225,29,72,0.22)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.35)', opacity: 0.65 },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.6s ease-in-out infinite',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        floaty: 'floaty 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

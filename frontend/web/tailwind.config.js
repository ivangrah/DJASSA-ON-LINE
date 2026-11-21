/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        djassa: {
          // Charte officielle Djassa Online — Rouge / Noir Mat / Blanc Pur
          red: '#780000',
          'red-strong': '#9b0000', // survol
          'red-dark': '#9b0000',
          'red-soft': '#FCE7E7',
          black: '#121212',
          ink: '#121212',
          white: '#FFFFFF',
          cloud: '#F8FAFC',
          mist: '#F8FAFC',
          cream: '#F8F7F4',
          gray: '#bcb8b1',
          slate: '#475569',
        },
      },
      fontFamily: {
        jakarta: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        inter: ['"DM Sans"', 'system-ui', 'sans-serif'],
        spacegrotesk: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        'DM-Sans': ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 28px -6px rgba(120,0,0,0.12)',
        card: '0 10px 28px -6px rgba(120,0,0,0.12)',
        pop: '0 14px 40px -10px rgba(120,0,0,0.28)',
        glow: '0 0 0 3px rgba(120,0,0,0.22)',
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

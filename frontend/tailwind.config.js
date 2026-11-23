/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#060E0B',
          900: '#0B1713', // Primary background
          850: '#0F1E19',
          800: '#12231C', // Card surface 1
          750: '#162820',
          700: '#192C23', // Card surface 2 (elevated)
          600: '#243E35', // Accent border / deep forest
          500: '#2E5045',
        },
        ivory: {
          50: '#FFFFFF',
          100: '#FBF9F4',
          200: '#F3EFE5', // Main text
          300: '#E7E1D2',
          400: '#D5CDBE',
        },
        sage: {
          300: '#D2DDD2',
          400: '#B8C7B8',
          500: '#9DAF9D', // Sage accent / secondary lines
          600: '#849884',
          700: '#6A7D6A',
          muted: '#AEB8AA', // Muted text
        },
        brass: {
          300: '#DEC49D',
          400: '#CCA978',
          500: '#B99561', // Antique brass accent
          600: '#9E7C4B',
          700: '#806338',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      animation: {
        'shimmer-brass': 'shimmerBrass 3s linear infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'flow-particle': 'flowParticle 2.5s linear infinite',
      },
      keyframes: {
        shimmerBrass: {
          'from': { backgroundPosition: '0 0' },
          'to': { backgroundPosition: '-200% 0' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.85' }
        },
        flowParticle: {
          '0%': { transform: 'translateX(0)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' }
        }
      }
    },
  },
  plugins: [],
}

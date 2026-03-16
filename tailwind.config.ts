import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/animations/**/*.{js,ts,jsx,tsx,mdx}',
    './components/app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/landing/**/*.{js,ts,jsx,tsx,mdx}',
    './components/layout/**/*.{js,ts,jsx,tsx,mdx}',
    './components/marketing/**/*.{js,ts,jsx,tsx,mdx}',
    './components/ui/**/*.{js,ts,jsx,tsx,mdx}',
    './components/vehicles/**/*.{js,ts,jsx,tsx,mdx}',
    './components/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        navy: {
          950: '#040810',
          900: '#0A0F1E',
          800: '#0F1629',
          700: '#151D35',
          600: '#1E2A4A',
        },
        accent: {
          blue: '#3B82F6',
          'blue-glow': 'rgba(59,130,246,0.15)',
          'blue-border': 'rgba(59,130,246,0.3)',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['Geist', 'DM Sans', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'count-up': 'count-up 1s ease-out forwards',
        'fade-up': 'fade-up 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'grid-navy': 'linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59,130,246,0.2)',
        'glow-green': '0 0 20px rgba(16,185,129,0.2)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.15)',
        'card': '0 4px 24px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.06)',
        'modal': '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}
export default config

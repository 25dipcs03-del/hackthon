/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2f8',
          100: '#d4dff0',
          200: '#a9bfe1',
          300: '#7e9fd2',
          400: '#537fc3',
          500: '#2b5fa5',
          DEFAULT: '#142D4E',
          light:  '#1e4070',
          dark:   '#0d1e35',
          900:    '#071528',
        },
        secondary: {
          50:  '#e8f9f7',
          100: '#c4f0ec',
          200: '#89e1d9',
          300: '#4ed2c6',
          DEFAULT: '#19B6A4',
          light:  '#22d3c5',
          dark:   '#138f80',
          900:    '#0a5f56',
        },
        civic: {
          critical: '#EF4444',
          high:     '#F97316',
          medium:   '#EAB308',
          low:      '#22C55E',
          bg:       '#F0F4F8',
          card:     '#FFFFFF',
          border:   '#E2E8F0',
          muted:    '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'xs':        '0 1px 2px rgba(0,0,0,0.04)',
        'card':      '0 1px 4px rgba(20,45,78,0.06), 0 1px 2px rgba(20,45,78,0.04)',
        'card-hover':'0 8px 24px rgba(20,45,78,0.12)',
        'glow':      '0 0 0 3px rgba(25,182,164,0.18)',
        'glow-primary':'0 0 0 3px rgba(20,45,78,0.15)',
        'sidebar':   '4px 0 24px rgba(0,0,0,0.08)',
        'float':     '0 20px 60px rgba(20,45,78,0.18)',
        'inner-sm':  'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-primary':  'linear-gradient(135deg, #142D4E 0%, #1e4070 50%, #0d4d7a 100%)',
        'gradient-teal':     'linear-gradient(135deg, #19B6A4 0%, #138f80 100%)',
        'gradient-hero':     'linear-gradient(135deg, #0d1e35 0%, #142D4E 40%, #1a3a6e 75%, #0e6b6b 100%)',
        'gradient-card':     'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        'gradient-stat':     'linear-gradient(135deg, rgba(20,45,78,0.05) 0%, rgba(25,182,164,0.05) 100%)',
        'dots-pattern':      'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
        'grid-pattern':      'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dots': '20px 20px',
        'grid': '40px 40px',
      },
      animation: {
        'fade-in':       'fadeIn 0.4s ease-out',
        'slide-up':      'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-slow':    'pulse 3s ease-in-out infinite',
        'shimmer':       'shimmer 2s infinite',
        'float':         'float 6s ease-in-out infinite',
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:      { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:     { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float:       { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        glowPulse:   { '0%,100%': { boxShadow: '0 0 0 0 rgba(25,182,164,0.3)' }, '50%': { boxShadow: '0 0 0 8px rgba(25,182,164,0)' } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    }
  },
  plugins: []
}

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy brand tokens (keep for backward compat — values refreshed to Electric Indigo)
        brand: '#4F46E5',
        'brand-dark': '#3730A3',
        'brand-light': '#EEF2FF',
        accent: '#F59E0B',
        // Extended "Electric Indigo" palette
        'brand-50': '#EEF2FF',
        'brand-100': '#E0E7FF',
        'brand-200': '#C7D2FE',
        'brand-300': '#A5B4FC',
        'brand-400': '#818CF8',
        'brand-500': '#4F46E5',
        'brand-600': '#4338CA',
        'brand-700': '#3730A3',
        'brand-800': '#312E81',
        'brand-900': '#1E1B4B',
        // Vibrant accents (hyperlocal + premium feel)
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
        },
        // Semantic colours
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#047857',
        },
        danger: {
          DEFAULT: '#F43F5E',
          light: '#FFE4E6',
          dark: '#BE123C',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        surface: {
          DEFAULT: '#F7F8FA',
          card: '#FFFFFF',
          muted: '#F1F3F7',
        },
        // Radix / shadcn tokens (keep existing)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Noto Sans Telugu', 'system-ui', 'sans-serif'],
        telugu: ['Noto Sans Telugu', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      transitionTimingFunction: {
        // Ultra-smooth easings for Framer Motion / CSS transitions
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'in-out-smooth': 'cubic-bezier(0.65, 0, 0.35, 1)',
        snappy: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        // Existing
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Refined
        shimmer: 'shimmer 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'badge-pop': 'badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'tap-scale': 'tapScale 0.2s ease-out',
        'gradient-shift': 'gradientShift 6s ease-in-out infinite',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        badgePop: {
          '0%': { transform: 'scale(0)' },
          '55%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        tapScale: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.94)' },
          '100%': { transform: 'scale(1)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        // Legacy (kept for compat)
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 4px 14px rgba(16, 24, 40, 0.08), 0 2px 6px rgba(16, 24, 40, 0.05)',
        'bottom-nav': '0 -1px 0 rgba(16,24,40,0.04), 0 -8px 24px rgba(16,24,40,0.06)',
        floating: '0 10px 28px rgba(79, 70, 229, 0.32), 0 4px 10px rgba(79, 70, 229, 0.18)',
        modal: '0 24px 60px rgba(16, 24, 40, 0.18), 0 4px 12px rgba(16, 24, 40, 0.08)',
        // Premium
        soft: '0 2px 8px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.03)',
        immersive: '0 20px 50px -12px rgba(16, 24, 40, 0.18), 0 8px 16px -8px rgba(16, 24, 40, 0.10)',
        glow: '0 0 0 4px rgba(79, 70, 229, 0.12)',
        'glow-emerald': '0 0 0 4px rgba(16, 185, 129, 0.15)',
        'inner-soft': 'inset 0 1px 2px rgba(16, 24, 40, 0.04)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
        'gradient-sunrise': 'linear-gradient(135deg, #F59E0B 0%, #F43F5E 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

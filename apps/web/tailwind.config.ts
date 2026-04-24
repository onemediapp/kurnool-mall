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
        // V5 Customer brand — Shopping (Swiggy orange) + Services (purple)
        shop: {
          DEFAULT: '#FC8019',
          dark: '#E8720C',
          light: '#FEF3E8',
          muted: '#FDE8CC',
          text: '#1C1C1C',
          subtext: '#525252',
          border: '#E5E7EB',
          bg: '#FFFFFF',
        },
        service: {
          DEFAULT: '#7C3AED',
          dark: '#6D28D9',
          light: '#EDE9FE',
          muted: '#DDD6FE',
          text: '#1C1C1C',
          subtext: '#525252',
          border: '#E5E7EB',
          bg: '#FFFFFF',
        },
        info: '#3D7AB5',
        // Legacy brand tokens (keep for backward compat)
        brand: '#1A56DB',
        'brand-dark': '#1E3A5F',
        'brand-light': '#DBEAFE',
        accent: '#F59E0B',
        // Extended brand palette
        'brand-50': '#EFF6FF',
        'brand-100': '#DBEAFE',
        'brand-500': '#1A56DB',
        'brand-600': '#1746C0',
        'brand-700': '#1E3A5F',
        // Semantic colours
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          dark: '#15803D',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        surface: {
          DEFAULT: '#F9FAFB',
          card: '#FFFFFF',
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
        pill: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Telugu', 'system-ui', 'sans-serif'],
        telugu: ['Noto Sans Telugu', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        // Existing
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // New
        shimmer: 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'badge-pop': 'badgePop 0.2s ease-out',
        'pulse-badge': 'pulseBadge 1.6s ease-in-out infinite',
      },
      keyframes: {
        // Existing
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // New
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        badgePop: {
          '0%': { transform: 'scale(0)' },
          '60%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseBadge: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(252,128,25,0.5)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 6px rgba(252,128,25,0)' },
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
        'bottom-nav': '0 -1px 0 rgba(0,0,0,0.06), 0 -4px 12px rgba(0,0,0,0.04)',
        floating: '0 8px 24px rgba(26,86,219,0.25)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
        'card-sm': '0 1px 2px rgba(0,0,0,0.04)',
        'card-lg': '0 6px 16px rgba(0,0,0,0.08)',
        'card-xl': '0 12px 32px rgba(0,0,0,0.12)',
        float: '0 16px 40px rgba(252,128,25,0.22)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

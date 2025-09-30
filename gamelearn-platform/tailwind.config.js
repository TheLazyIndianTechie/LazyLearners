/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Primary: Electric Coral-Amber
        coral: {
          50: '#FFF4ED',
          100: '#FFE6D5',
          200: '#FFCBAA',
          300: '#FFA574',
          400: '#FF7539',
          500: '#FF5714',
          600: '#F03A00',
          700: '#C72800',
          800: '#9E2200',
          900: '#7A1B00',
        },
        // Secondary: Deep Forest Green
        forest: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // Accent: Electric Cyan
        cyan: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        // Neutrals: Warm charcoal with cream
        slate: {
          50: '#FFFBF5',
          100: '#F8F5F0',
          200: '#E8E3DB',
          300: '#D1C7B8',
          400: '#9E9484',
          500: '#6B6155',
          600: '#4A4038',
          700: '#342E27',
          800: '#1F1B17',
          900: '#0F0D0B',
          950: '#080706',
        },
        // Map to shadcn naming convention
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        accent: ['Impact', 'sans-serif'],
      },
      fontSize: {
        'xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
        'sm': ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5' }],
        'base': ['clamp(1rem, 0.95rem + 0.25vw, 1.125rem)', { lineHeight: '1.6' }],
        'lg': ['clamp(1.125rem, 1rem + 0.625vw, 1.5rem)', { lineHeight: '1.5' }],
        'xl': ['clamp(1.25rem, 1.1rem + 0.75vw, 1.875rem)', { lineHeight: '1.4' }],
        '2xl': ['clamp(1.5rem, 1.3rem + 1vw, 2.25rem)', { lineHeight: '1.3' }],
        '3xl': ['clamp(1.875rem, 1.5rem + 1.875vw, 3rem)', { lineHeight: '1.2' }],
        '4xl': ['clamp(2.25rem, 1.75rem + 2.5vw, 3.75rem)', { lineHeight: '1.1' }],
        '5xl': ['clamp(3rem, 2rem + 5vw, 6rem)', { lineHeight: '1' }],
        '6xl': ['clamp(3.75rem, 2.5rem + 6.25vw, 8rem)', { lineHeight: '0.9' }],
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
        'glow-coral': '0 0 20px rgb(255 117 57 / 0.5), 0 0 40px rgb(255 117 57 / 0.2)',
        'glow-cyan': '0 0 20px rgb(34 211 238 / 0.5), 0 0 40px rgb(34 211 238 / 0.2)',
        'glow-forest': '0 0 20px rgb(16 185 129 / 0.5), 0 0 40px rgb(16 185 129 / 0.2)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgb(255 117 57 / 0.3)" },
          "50%": { boxShadow: "0 0 40px rgb(255 117 57 / 0.6), 0 0 60px rgb(255 117 57 / 0.3)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-slide-up": "fade-slide-up 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 0h1v60H0zM60 0v1H0V0z' fill='%23ffffff' fill-opacity='0.02'/%3E%3C/svg%3E")`,
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Add custom utilities
    function({ addUtilities }) {
      addUtilities({
        '.text-gradient-coral': {
          'background': 'linear-gradient(135deg, #FF7539 0%, #22D3EE 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.bg-grid': {
          'background-image': `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 0h1v60H0zM60 0v1H0V0z' fill='%23ffffff' fill-opacity='0.02'/%3E%3C/svg%3E")`,
        },
      })
    },
  ],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
        brand: {
          light: "#F6E6C3",
          dark: "#962901",
          black: "#0A0A0A",
          primary: '#962901',
          secondary: '#F6E6C3',
          mid: '#c77f50',
          50: '#FAF7F0',
          100: '#F6E6C3', 
          200: '#E6D0A0',
          300: '#D4B380',
          400: '#c77f50',
          500: '#C5A572',
          600: '#962901',
          700: '#7A2201',
          800: '#5E1A01',
          900: '#421201'
        },
        accent: {
          primary: '#962901',
          secondary: '#F6E6C3',
          dark: '#000000'
        }
      },
      borderRadius: {
        xl2: "1.25rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.06)",
      },
      fontFamily: {
        brand: ["var(--font-cinzel)"],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.zinc.800"),
            "--tw-prose-headings": theme("colors.brand.dark"),
            "--tw-prose-links": theme("colors.brand.dark"),
            "--tw-prose-bold": theme("colors.zinc.900"),
            "--tw-prose-counters": theme("colors.zinc.600"),
            "--tw-prose-bullets": theme("colors.brand.dark"),
            "--tw-prose-hr": theme("colors.zinc.200"),
            a: { textDecoration: "none", borderBottom: `1px solid ${theme("colors.brand.dark")}` },
            h1: { fontWeight: "800", letterSpacing: "-0.02em" },
            h2: { fontWeight: "700", marginTop: "2.5rem" },
            h3: { fontWeight: "700", marginTop: "2rem" },
            "ol > li::marker": { color: theme("colors.brand.dark") },
            "ul > li::marker": { color: theme("colors.brand.dark") },
            code: { backgroundColor: theme("colors.zinc.100"), padding: "2px 6px", borderRadius: "6px" },
          },
        },
      }),
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 25s linear infinite"
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}

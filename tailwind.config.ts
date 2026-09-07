import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary-soft))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          soft: "hsl(var(--success-soft))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          soft: "hsl(var(--destructive-soft))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 6px)",
        "2xl": "calc(var(--radius) + 14px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["clamp(2.6rem, 1.6rem + 3.4vw, 4.25rem)", { lineHeight: "1.04", letterSpacing: "-0.032em" }],
        "display-md": ["clamp(2rem, 1.4rem + 2.2vw, 3rem)", { lineHeight: "1.08", letterSpacing: "-0.028em" }],
        "display-sm": ["clamp(1.5rem, 1.2rem + 1.1vw, 2rem)", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 hsl(var(--shadow-color) / 0.05)",
        card: "0 1px 3px hsl(var(--shadow-color) / 0.06), 0 8px 24px -12px hsl(var(--shadow-color) / 0.12)",
        lifted: "0 2px 6px hsl(var(--shadow-color) / 0.07), 0 18px 40px -16px hsl(var(--shadow-color) / 0.22)",
        pop: "0 12px 40px -10px hsl(var(--shadow-color) / 0.28)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "none" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "none" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 220ms cubic-bezier(0.32, 0.72, 0, 1)",
        "accordion-up": "accordion-up 200ms cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in": "fade-in 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        "scale-in": "scale-in 180ms cubic-bezier(0.32, 0.72, 0, 1)",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;

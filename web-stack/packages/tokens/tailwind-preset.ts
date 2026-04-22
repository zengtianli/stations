import type { Config } from "tailwindcss"
import plugin from "tailwindcss/plugin"
import { keyframes, animation } from "./src/animations"

/**
 * Shared Tailwind preset for all apps.
 *
 * `darkMode: []` — website is `forcedTheme="light"`, so dark variants stay unused.
 * All color tokens pivot through `hsl(var(--token))` to keep `[data-track="..."]`
 * overrides working at runtime.
 */
const tlzPreset: Partial<Config> = {
  darkMode: [],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "'PingFang SC'",
          "'Helvetica Neue'",
          "sans-serif",
        ],
      },
      keyframes,
      animation,
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addUtilities }) => {
      const animationDelayVariants: Record<string, Record<string, string>> = {}
      for (let i = 1; i <= 10; i++) {
        animationDelayVariants[`.animate-delay-${i * 100}`] = {
          "animation-delay": `${i * 100}ms`,
        }
      }
      addUtilities(animationDelayVariants)
    }),
  ],
}

export default tlzPreset
export { tlzPreset }

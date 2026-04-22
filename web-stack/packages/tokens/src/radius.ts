/**
 * Border radius scale. `--radius` is the base, Tailwind `rounded-{lg,md,sm}`
 * derive from it to stay consistent with website.
 */
export const radius = {
  base: "1rem",
  lg: "var(--radius)",
  md: "calc(var(--radius) - 2px)",
  sm: "calc(var(--radius) - 4px)",
} as const

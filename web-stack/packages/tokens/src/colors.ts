/**
 * Semantic colors — HSL triplets, consumed via `hsl(var(--token))` in Tailwind.
 *
 * Base scheme mirrors website `app/globals.css`. Dark theme is intentionally
 * omitted: the flagship site uses `forcedTheme="light"`.
 */
export const semanticColorsLight = {
  background: "0 0% 96%",
  foreground: "0 0% 9%",
  card: "0 0% 100%",
  cardForeground: "0 0% 9%",
  popover: "0 0% 100%",
  popoverForeground: "0 0% 9%",
  primary: "0 0% 9%",
  primaryForeground: "0 0% 98%",
  secondary: "0 0% 96%",
  secondaryForeground: "0 0% 9%",
  muted: "0 0% 96%",
  mutedForeground: "0 0% 45%",
  accent: "0 0% 96%",
  accentForeground: "0 0% 9%",
  destructive: "0 84% 60%",
  destructiveForeground: "0 0% 98%",
  border: "0 0% 90%",
  input: "0 0% 90%",
  ring: "0 0% 64%",
  trackAccent: "0 0% 9%",
} as const

export type TrackKey = "hydro" | "ai" | "devtools" | "indie"

/** Per-direction accent HSL override applied via `[data-track="..."]`. */
export const trackAccent: Record<TrackKey, string> = {
  hydro: "217 91% 68%",
  ai: "263 70% 76%",
  devtools: "160 64% 52%",
  indie: "45 93% 56%",
}

/** Per-direction page background (opaque RGB from website CLAUDE.md). */
export const trackBackground: Record<TrackKey, string> = {
  hydro: "#E3F0FF",
  ai: "#F0E8FF",
  devtools: "#DFFBE9",
  indie: "#FFF3D6",
}

/** Brand chrome used by the mega navbar (matches ops-console/website chrome). */
export const brandChrome = {
  brandText: "#111111",
  linkIdle: "#333333",
  linkHover: "#D40000",
  panelBg: "#F5F5F5",
  panelDivider: "#E0E0E0",
  navBorder: "#E5E5E5",
  navShadow: "0 8px 16px -8px rgba(0,0,0,0.08)",
} as const

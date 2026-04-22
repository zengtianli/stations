/**
 * Typography. The Inter CSS variable is injected by each Next.js app via
 * `next/font/google`: `const inter = Inter({ variable: "--font-inter" })`.
 */
export const typography = {
  fontSans: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif",
  fontMono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  lineHeightBase: 1.8,
} as const

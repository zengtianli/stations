// Shared types for cc-options-web.

export type OptRow = {
  ticker: string
  strike: number
  exp: string
  exp_date: string
  dte: number
  cp: string
  qty: number
  price: number
  avg: number
  bid: number
  ask: number
  spread: number
  iv: number
  delta: number
  gamma: number
  theta: number
  vega: number
  intrinsic: number
  time_value: number
  tv_annual_pct: number
}

export type Current = {
  qqq_price: number
  qqq_shares: number
  cash: number
  stock_mv: number
  opt_liability: number
  nlv: number
  margin_debt: number
  leverage: number
  stock_delta: number
  opt_delta_total: number
  net_delta: number
  net_theta: number
  net_gamma: number
  net_vega: number
  total_tv: number
  effective_theta: number
  opt_rows: OptRow[]
}

export type Scenario = {
  pct: number
  nlv: number
  delta_nlv: number
  delta_pct: number
}

export type ScenariosResp = {
  current: Current
  days: number
  scenarios: Scenario[]
}

export type EquityRow = {
  date: string
  nlv: number | null
  cash: number | null
  stock_mv: number | null
  opt_mtm: number | null
  qqq_shares: number | null
  margin_debt: number | null
  leverage: number | null
  qqq_close: number | null
  spy_close: number | null
  tqqq_close: number | null
  b1_nlv: number | null
  b2_nlv: number | null
}

export type PerfMetric = {
  label: string
  annual_return: number | null
  annual_vol: number | null
  sharpe: number | null
  sortino: number | null
  max_drawdown: number | null
  total_return: number | null
}

export type PerfMetricsResp = {
  start: string
  strategies: PerfMetric[]
}

export type RollCredit = {
  credit: number
  annual: number
  days_period: number
  open_date: string
  buy_price: number | null
  sell_price: number
  is_roll: boolean
} | null

export type RollSignal = OptRow & {
  action: string
  reasons: string[]
  tv_harvested_pct: number
  theta_efficiency: number
  net_tv_annual: number
  slippage_total: number
  credit: RollCredit
  target?: string
}

export type RollSignalsResp = { count: number; signals: RollSignal[] }

export type SummaryResp = {
  as_of: string
  nlv: number
  leverage: number
  prev_nlv: number | null
  prev_leverage: number | null
  prev_date: string | null
}

export type RangeKey = "1M" | "3M" | "6M" | "1Y" | "YTD"

export type TwrResp = {
  start: string
  dates: string[]
  cc: (number | null)[]
  spy: (number | null)[]
  qqq: (number | null)[]
  tqqq: (number | null)[]
}

// Formatters
export function fmtMoney(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—"
  return v.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export function fmtSigned(v: number, digits = 0, prefix = "$"): string {
  const sign = v >= 0 ? "+" : "-"
  return `${sign}${prefix}${fmtMoney(Math.abs(v), digits)}`
}

export function fmtPct(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—"
  return `${(v * 100).toFixed(digits)}%`
}

/**
 * Classify whether curr is up/down/flat vs prev, using tolerance (default 0.1%).
 * Null prev → "flat" (no baseline).
 */
export function calcTrend(
  curr: number | null | undefined,
  prev: number | null | undefined,
  tolerancePct = 0.001,
): "up" | "down" | "flat" {
  if (curr === null || curr === undefined || prev === null || prev === undefined) return "flat"
  if (prev === 0) return "flat"
  const diff = (curr - prev) / Math.abs(prev)
  if (diff > tolerancePct) return "up"
  if (diff < -tolerancePct) return "down"
  return "flat"
}

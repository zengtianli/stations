import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

function formatTokens(n) {
  if (n == null) return '0'
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function formatNumber(n) {
  if (n == null) return '0'
  return n.toLocaleString()
}

const STATUS_STYLES = {
  healthy: 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50',
  error: 'bg-red-900/50 text-red-400 border-red-700/50',
  skip: 'bg-slate-700/50 text-slate-400 border-slate-600/50',
  rate_limited: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50',
}

const STATUS_DOT = {
  healthy: 'bg-emerald-400',
  error: 'bg-red-400',
  skip: 'bg-slate-500',
  rate_limited: 'bg-yellow-400',
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function AccountCard({ account }) {
  const status = account.skip ? 'skip' : account.status || 'healthy'
  return (
    <div className={`rounded-xl border p-4 ${STATUS_STYLES[status] || STATUS_STYLES.error}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-white">{account.name}</span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status] || STATUS_DOT.error}`} />
          {status.replace('_', ' ')}
        </span>
      </div>
      <p className="text-xs text-slate-400 truncate">{account.email}</p>
      <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
        {account.token_expires_in_min != null && (
          <span>Token expires: {account.token_expires_in_min}m</span>
        )}
        {account.refresh_failures > 0 && (
          <span className="text-red-400">Refresh failures: {account.refresh_failures}</span>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [usage, setUsage] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [usageRes, accountsRes] = await Promise.all([
        api('/api/usage/summary'),
        api('/api/accounts'),
      ])
      if (usageRes && accountsRes) {
        const [usageData, accountsData] = await Promise.all([
          usageRes.json(),
          accountsRes.json(),
        ])
        setUsage(usageData)
        setAccounts(accountsData)
        setLastUpdate(new Date())
      }
    } catch {
      // silent — keep stale data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 30_000)
    return () => clearInterval(timer)
  }, [fetchData])

  const today = usage?.today || {}
  const month = usage?.month || {}

  const todayTokens =
    (today.input_tokens || 0) +
    (today.output_tokens || 0) +
    (today.cache_read_tokens || 0) +
    (today.cache_creation_tokens || 0)

  const monthTokens =
    (month.input_tokens || 0) +
    (month.output_tokens || 0) +
    (month.cache_read_tokens || 0) +
    (month.cache_creation_tokens || 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        Loading...
      </div>
    )
  }

  const healthyCount = accounts.filter(a => !a.skip && a.status === 'healthy').length
  const totalCount = accounts.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            API Proxy Overview
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${healthyCount > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {healthyCount}/{totalCount} accounts healthy
          </div>
          {lastUpdate && (
            <p className="text-xs text-slate-600 mt-1">
              Updated {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Endpoint Banner */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">API Endpoint</p>
          <code className="text-emerald-400 font-mono text-sm">https://proxy.tianlizeng.cloud</code>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText('https://proxy.tianlizeng.cloud')}
          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
        >
          Copy
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today Requests"
          value={formatNumber(today.requests || 0)}
        />
        <StatCard
          label="Today Tokens"
          value={formatTokens(todayTokens)}
          sub={`In: ${formatTokens(today.input_tokens)} / Out: ${formatTokens(today.output_tokens)}`}
        />
        <StatCard
          label="30-Day Requests"
          value={formatNumber(month.requests || 0)}
        />
        <StatCard
          label="30-Day Tokens"
          value={formatTokens(monthTokens)}
          sub={`In: ${formatTokens(month.input_tokens)} / Out: ${formatTokens(month.output_tokens)}`}
        />
      </div>

      {/* Backend Accounts */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3">Backend Accounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((acct, i) => (
            <AccountCard key={acct.email || i} account={acct} />
          ))}
          {accounts.length === 0 && (
            <p className="text-sm text-slate-600 col-span-full">No accounts configured.</p>
          )}
        </div>
      </div>
    </div>
  )
}

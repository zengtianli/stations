import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

const STATUS_STYLES = {
  healthy:      'text-green-400 bg-green-400/10',
  error:        'text-red-400 bg-red-400/10',
  disabled:     'text-red-400 bg-red-400/10',
  skip:         'text-gray-400 bg-gray-400/10',
  rate_limited: 'text-yellow-400 bg-yellow-400/10',
}

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'text-slate-400 bg-slate-400/10'
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{status}</span>
}

function TtlDisplay({ minutes }) {
  if (minutes == null) return <span className="text-slate-500">-</span>
  const cls = minutes < 10 ? 'text-red-400' : minutes < 30 ? 'text-yellow-400' : 'text-green-400'
  return <span className={cls}>{minutes}min</span>
}

export default function Status() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api('/api/accounts')
      const data = await res?.json()
      if (Array.isArray(data)) setAccounts(data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAccounts()
    const timer = setInterval(fetchAccounts, 30000)
    return () => clearInterval(timer)
  }, [fetchAccounts])

  async function handleToggle(name) {
    setToggling(name)
    try {
      await api(`/api/accounts/${encodeURIComponent(name)}/toggle`, { method: 'POST' })
      await fetchAccounts()
    } catch {}
    setToggling(null)
  }

  if (loading) {
    return <div className="text-center text-slate-400 py-12">加载中...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">后端账号状态</h1>
        <span className="text-xs text-slate-500">每 30s 自动刷新</span>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center text-slate-400 py-12">暂无账号</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map(acc => (
            <div key={acc.name} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base">{acc.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{acc.email}</p>
                </div>
                <StatusBadge status={acc.skip ? 'skip' : acc.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Token TTL</div>
                  <TtlDisplay minutes={acc.token_expires_in_min} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">刷新失败</div>
                  <span className={acc.refresh_failures > 0 ? 'text-red-400' : 'text-slate-300'}>
                    {acc.refresh_failures ?? 0}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleToggle(acc.name)}
                disabled={toggling === acc.name}
                className={`mt-1 w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  acc.skip
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
                    : 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30'
                }`}
              >
                {toggling === acc.name ? '...' : acc.skip ? '启用' : '禁用'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

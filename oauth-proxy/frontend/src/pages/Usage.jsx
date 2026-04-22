import { useState, useEffect } from 'react'
import { api } from '../api'

const DAY_OPTIONS = [
  { label: '今天', value: 1 },
  { label: '7天', value: 7 },
  { label: '30天', value: 30 },
]

function formatTime(ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function StatusBadge({ code }) {
  let cls = 'text-gray-400 bg-gray-400/10'
  if (code >= 200 && code < 300) cls = 'text-green-400 bg-green-400/10'
  else if (code >= 400 && code < 500) cls = 'text-yellow-400 bg-yellow-400/10'
  else if (code >= 500) cls = 'text-red-400 bg-red-400/10'
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{code}</span>
}

function formatTokens(n) {
  if (n == null) return '-'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function Usage() {
  const [days, setDays] = useState(7)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api(`/api/usage?days=${days}&limit=200`)
      .then(r => r?.json())
      .then(data => {
        if (!cancelled && Array.isArray(data)) setRows(data)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [days])

  const totalInput = rows.reduce((s, r) => s + (r.input_tokens || 0), 0)
  const totalOutput = rows.reduce((s, r) => s + (r.output_tokens || 0), 0)
  const totalCache = rows.reduce((s, r) => s + (r.cache_read_tokens || 0), 0)
  const successCount = rows.filter(r => r.status_code >= 200 && r.status_code < 300).length
  const avgLatency = rows.length ? Math.round(rows.reduce((s, r) => s + (r.latency_ms || 0), 0) / rows.length) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">调用记录</h1>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
        >
          {DAY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: '总调用', value: rows.length },
          { label: 'Input Tokens', value: formatTokens(totalInput) },
          { label: 'Output Tokens', value: formatTokens(totalOutput) },
          { label: 'Cache Read', value: formatTokens(totalCache) },
          { label: '成功率', value: rows.length ? `${((successCount / rows.length) * 100).toFixed(1)}%` : '-' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">{s.label}</div>
            <div className="text-lg font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs border-b border-slate-700">
                {['时间', '模型', 'Input', 'Output', 'Cache Read', '后端账号', '状态码', '延迟'].map(h => (
                  <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">加载中...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">暂无数据</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-300">{formatTime(r.timestamp)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs">{r.model}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums">{formatTokens(r.input_tokens)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums">{formatTokens(r.output_tokens)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums">{formatTokens(r.cache_read_tokens)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-300">{r.account_name}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge code={r.status_code} /></td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right tabular-nums text-slate-300">{r.latency_ms != null ? `${r.latency_ms}ms` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && rows.length > 0 && (
        <p className="text-xs text-slate-500 mt-3 text-right">
          平均延迟 {avgLatency}ms · 共 {rows.length} 条记录
        </p>
      )}
    </div>
  )
}

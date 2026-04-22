import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

function maskKey(key) {
  if (!key || key.length < 10) return key
  return key.slice(0, 7) + '...' + key.slice(-4)
}

function formatTokens(n) {
  if (n == null) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export default function Keys() {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', group_name: '' })
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(null)

  const fetchKeys = useCallback(async () => {
    try {
      const res = await api('/api/keys')
      if (res?.ok) {
        const data = await res.json()
        setKeys(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  async function createKey(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const res = await api('/api/keys', {
        method: 'POST',
        body: JSON.stringify({ name: form.name.trim(), group_name: form.group_name.trim() }),
      })
      if (res?.ok) {
        setShowModal(false)
        setForm({ name: '', group_name: '' })
        fetchKeys()
      }
    } catch { /* ignore */ }
    setCreating(false)
  }

  async function toggleEnabled(item) {
    try {
      const res = await api(`/api/keys/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !item.enabled }),
      })
      if (res?.ok) fetchKeys()
    } catch { /* ignore */ }
  }

  async function deleteKey(item) {
    if (!window.confirm(`确认删除密钥「${item.name}」？此操作不可撤销。`)) return
    try {
      const res = await api(`/api/keys/${item.id}`, { method: 'DELETE' })
      if (res?.ok) fetchKeys()
    } catch { /* ignore */ }
  }

  function copyKey(key) {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">API 密钥</h2>
          <p className="text-sm text-slate-400 mt-1">管理你的 API 密钥</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
        >
          创建密钥
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left px-5 py-3 font-medium">名称</th>
              <th className="text-left px-5 py-3 font-medium">API 密钥</th>
              <th className="text-left px-5 py-3 font-medium">分组</th>
              <th className="text-left px-5 py-3 font-medium">用量</th>
              <th className="text-left px-5 py-3 font-medium">状态</th>
              <th className="text-right px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-500">加载中...</td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-500">暂无密钥，点击右上角创建</td>
              </tr>
            ) : (
              keys.map(item => (
                <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{item.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-slate-300 text-xs bg-slate-900 px-2 py-1 rounded font-mono">
                        {maskKey(item.key)}
                      </code>
                      <button
                        onClick={() => copyKey(item.key)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        title="复制密钥"
                      >
                        {copied === item.key ? (
                          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {item.group_name ? (
                      <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">{item.group_name}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    <div>今日 {formatTokens(item.today_tokens)} tokens</div>
                    <div className="text-slate-500">30天 {formatTokens(item.month_tokens)} tokens</div>
                  </td>
                  <td className="px-5 py-3">
                    {item.enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-900/50 text-emerald-400 rounded text-xs font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        活跃
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-900/30 text-red-400 rounded text-xs font-medium">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        禁用
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleEnabled(item)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          item.enabled
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/80'
                        }`}
                      >
                        {item.enabled ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={() => deleteKey(item)}
                        className="px-3 py-1 rounded text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-96 p-6">
            <h3 className="text-lg font-bold text-white mb-4">创建密钥</h3>
            <form onSubmit={createKey}>
              <label className="block text-sm text-slate-400 mb-1">名称</label>
              <input
                className="w-full mb-4 px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-white"
                placeholder="例如：production-key"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
              <label className="block text-sm text-slate-400 mb-1">分组</label>
              <input
                className="w-full mb-6 px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-white"
                placeholder="例如：default（可选）"
                value={form.group_name}
                onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm({ name: '', group_name: '' }) }}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.name.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

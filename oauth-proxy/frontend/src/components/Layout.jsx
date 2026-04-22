import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/', label: '仪表盘', icon: '📊' },
  { to: '/keys', label: 'API 密钥', icon: '🔑' },
  { to: '/usage', label: '使用记录', icon: '📈' },
  { to: '/status', label: '状态面板', icon: '⚡' },
]

const SITE_NAV = [
  { href: 'https://tianlizeng.cloud/services', label: 'Services' },
  { href: 'https://stack.tianlizeng.cloud', label: 'Stack' },
  { href: 'https://cmds.tianlizeng.cloud', label: 'CC Docs' },
  { href: 'https://changelog.tianlizeng.cloud', label: 'Changelog' },
  { href: 'https://dashboard.tianlizeng.cloud', label: 'Dashboard' },
]

export default function Layout() {
  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-[9999] h-11 flex items-center bg-white/90 backdrop-blur-xl border-b border-black/10">
      <div className="max-w-[1500px] w-full mx-auto px-5 flex items-center gap-1 text-xs font-medium">
        <a href="https://tianlizeng.cloud/" className="px-3 py-1.5 font-bold text-gray-900 hover:text-blue-600">曾田力</a>
        <div className="w-px h-4 bg-black/10 mx-2" />
        {SITE_NAV.map(n => (
          <a key={n.href} href={n.href} className="px-3 py-1.5 rounded-md text-gray-500 hover:bg-black/5 hover:text-gray-900">{n.label}</a>
        ))}
      </div>
    </nav>
    <div className="flex h-[calc(100vh-44px)] mt-11">
      <aside className="w-56 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white">CC Proxy</h1>
          <p className="text-xs text-slate-500 mt-1">API Management</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(n => (
            <NavLink
              key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-700/60 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="border-b border-slate-700 px-6 py-3 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-400 rounded text-xs font-mono">API</span>
            <code className="text-slate-300">https://proxy.tianlizeng.cloud</code>
          </div>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
    </>
  )
}

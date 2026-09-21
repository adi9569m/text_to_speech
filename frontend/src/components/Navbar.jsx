import React from 'react'
import {
  AlertCircle,
  RefreshCw,
  LogIn,
  LogOut,
  Home,
  Mic2,
  History,
  BarChart3,
} from 'lucide-react'

export default function Navbar({
  activeView,
  setActiveView,
  backendStatus,
  onRefreshHealth,
  currentUser,
  onOpenAuth,
  onSignOut,
  historyCount = 0,
}) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'studio', label: 'Studio', icon: Mic2 },
    { id: 'library', label: `History (${historyCount})`, icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <header className="w-full bg-white/95 border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Header */}
        <div
          onClick={() => setActiveView('home')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              VoiceFlow
            </span>
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              Studio
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-950 shadow-xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-blue-900" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Right Status & Auth */}
        <div className="flex items-center gap-3">
          {/* Backend Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            {backendStatus === 'online' && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </span>
            )}
            {backendStatus === 'offline' && (
              <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Offline</span>
              </span>
            )}
            {backendStatus === 'checking' && (
              <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Connecting...</span>
              </span>
            )}

            <button
              type="button"
              onClick={onRefreshHealth}
              className="text-slate-400 hover:text-blue-900 p-0.5 rounded cursor-pointer transition ml-1"
              title="Refresh connection status"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* User Account / Auth */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-2xs">
                  {(currentUser.name || currentUser.username)[0]}
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="font-bold text-slate-800 truncate max-w-[110px]">
                    {currentUser.name || currentUser.username}
                  </span>
                  {currentUser.name && (
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]">
                      @{currentUser.username}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onSignOut}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { useApp } from '@/lib/app-context'
import {
  Shield, LayoutDashboard, ArrowLeftRight, AlertTriangle,
  Bell, MessageSquare, LogOut, ChevronRight, Settings, Sun, Moon,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',     badge: null },
  { href: '/transactions',  icon: ArrowLeftRight,  label: 'Transactions',  badge: null },
  { href: '/fraud',         icon: AlertTriangle,   label: 'Fraud Alerts',  badge: 'fraud' },
  { href: '/notifications', icon: Bell,            label: 'Notifications', badge: null },
  { href: '/chat',          icon: MessageSquare,   label: 'AI Assistant',  badge: null },
  { href: '/settings',      icon: Settings,        label: 'Settings',      badge: null },
] as const

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { openAlertCount } = useApp()

  const initials = user ? user.split('@')[0].slice(0, 2).toUpperCase() : '??'

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-800 bg-[#0a0e1a]">

      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#012169] shadow-lg">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-white tracking-tight">VaultFlow</span>
          <p className="text-[10px] text-slate-500">Personal Banking</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const alertBadge = badge === 'fraud' && openAlertCount > 0 ? openAlertCount : null

          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-[#012169] text-white shadow-md'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {alertBadge !== null ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold bg-[#E31837] text-white">
                  {alertBadge > 9 ? '9+' : alertBadge}
                </span>
              ) : (
                active && <ChevronRight className="h-3 w-3 opacity-50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="px-4">
        <div className="h-px bg-white/5" />
      </div>

      {/* User section */}
      <div className="px-3 py-4 space-y-1">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-xs font-bold text-white select-none">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-200">{user}</p>
            <p className="text-[10px] text-slate-500">Personal account</p>
          </div>
        </div>

        <button onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <button onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-[#E31837]/10 hover:text-[#E31837]">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

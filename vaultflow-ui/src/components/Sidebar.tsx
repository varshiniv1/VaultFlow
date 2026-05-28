'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  Shield, LayoutDashboard, ArrowLeftRight, AlertTriangle,
  Bell, MessageSquare, LogOut, ChevronRight,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions',  icon: ArrowLeftRight,  label: 'Transactions' },
  { href: '/fraud',         icon: AlertTriangle,   label: 'Fraud Alerts' },
  { href: '/notifications', icon: Bell,            label: 'Notifications' },
  { href: '/chat',          icon: MessageSquare,   label: 'AI Assistant' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-slate-900">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-white">VaultFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3 w-3 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 px-3 py-4">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400">
            {user?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <span className="flex-1 truncate text-xs text-slate-400">{user}</span>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

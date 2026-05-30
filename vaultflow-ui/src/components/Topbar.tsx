'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useApp } from '@/lib/app-context'
import { Bell, AlertTriangle, ChevronRight } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/transactions':  'Accounts & Transactions',
  '/fraud':         'Fraud Alerts',
  '/notifications': 'Notifications',
  '/chat':          'AI Assistant',
  '/settings':      'Settings',
}

export default function Topbar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { openAlertCount } = useApp()

  const title = Object.entries(PAGE_TITLES).find(
    ([k]) => pathname === k || pathname.startsWith(k + '/'),
  )?.[1] ?? 'VaultFlow'

  const name     = user?.split('@')[0] ?? ''
  const initials = name.slice(0, 2).toUpperCase() || '??'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const isOnDashboard = pathname === '/dashboard'

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 px-6">

      {/* Left */}
      <div className="flex items-center gap-2">
        {!isOnDashboard && (
          <>
            <Link href="/dashboard" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition hidden sm:block">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-300 hidden sm:block" />
          </>
        )}
        {isOnDashboard ? (
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {greeting}, {name}
            </p>
            <p className="text-xs text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        ) : (
          <h1 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {openAlertCount > 0 && (
          <Link href="/fraud"
            className="flex items-center gap-1.5 rounded-full border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 text-xs font-semibold text-[#E31837] dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition">
            <AlertTriangle className="h-3 w-3" />
            {openAlertCount} alert{openAlertCount > 1 ? 's' : ''}
          </Link>
        )}

        <Link href="/notifications"
          className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition">
          <Bell className="h-4 w-4" />
        </Link>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-xs font-bold text-white shadow-sm select-none">
          {initials}
        </div>
      </div>
    </header>
  )
}

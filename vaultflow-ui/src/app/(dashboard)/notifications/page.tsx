'use client'

import { useEffect, useState } from 'react'
import { getAccounts, getNotifications } from '@/lib/api'
import type { Account, Notification } from '@/types'
import { Bell, ArrowLeftRight, TrendingUp, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; dot: string }> = {
  TRANSACTION_COMPLETED:  { label: 'Transaction',       icon: Bell,           color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', dot: 'bg-emerald-500' },
  HIGH_VALUE_TRANSACTION: { label: 'High Value',        icon: TrendingUp,     color: 'text-amber-700 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-900/30',    dot: 'bg-amber-500'   },
  TRANSFER_SENT:          { label: 'Transfer Sent',     icon: ArrowLeftRight, color: 'text-[#012169] dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/30',      dot: 'bg-blue-500'    },
  TRANSFER_RECEIVED:      { label: 'Transfer Received', icon: ArrowLeftRight, color: 'text-violet-700 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-900/30',  dot: 'bg-violet-500'  },
  FRAUD_ALERT:            { label: 'Fraud Alert',       icon: AlertTriangle,  color: 'text-red-700 dark:text-red-400',        bg: 'bg-red-50 dark:bg-red-900/30',        dot: 'bg-red-500'     },
}

export default function NotificationsPage() {
  const [accounts, setAccounts]     = useState<Account[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [notifs, setNotifs]         = useState<Notification[]>([])
  const [loading, setLoading]       = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    getAccounts()
      .then((a) => { setAccounts(a); if (a.length > 0) setSelectedId(a[0].id) })
      .catch(() => {})
  }, [])

  function load(id: string, isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    getNotifications(id)
      .then(setNotifs)
      .catch(() => setNotifs([]))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => {
    if (!selectedId) return
    load(selectedId)
  }, [selectedId])

  const unreadCount = notifs.length

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Transaction alerts and account activity</p>
        </div>
        {selectedId && (
          <button onClick={() => load(selectedId, true)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Account selector */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Account:</label>
        {accounts.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No accounts yet.</p>
        ) : (
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#012169]">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountType} •••• {a.accountNumber.slice(-4)}
              </option>
            ))}
          </select>
        )}
        {unreadCount > 0 && (
          <span className="rounded-full bg-[#012169] px-2.5 py-0.5 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Notification list */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-[#012169] dark:text-blue-400" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <Bell className="h-8 w-8 text-slate-300 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Transaction alerts for this account will appear here. Make a deposit or transfer to get started.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50 dark:divide-slate-700/40">
            {notifs.map((n) => {
              const meta = TYPE_META[n.type] ?? {
                label: n.type, icon: Bell, dot: 'bg-slate-400',
                color: 'text-slate-600 dark:text-slate-400',
                bg: 'bg-slate-50 dark:bg-slate-700/40',
              }
              const Icon = meta.icon
              return (
                <li key={n.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                    <Icon className={`h-5 w-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(n.createdAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{n.message}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      n.status === 'SENT'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : n.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {n.status}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

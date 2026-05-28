'use client'

import { useEffect, useState } from 'react'
import { getAccounts, getNotifications } from '@/lib/api'
import type { Account, Notification } from '@/types'
import { Bell, ArrowLeftRight, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  TRANSACTION_COMPLETED:  { label: 'Completed',        icon: Bell,           color: 'text-green-600',  bg: 'bg-green-50' },
  HIGH_VALUE_TRANSACTION: { label: 'High Value',       icon: TrendingUp,     color: 'text-amber-600',  bg: 'bg-amber-50' },
  TRANSFER_SENT:          { label: 'Transfer Sent',    icon: ArrowLeftRight, color: 'text-blue-600',   bg: 'bg-blue-50' },
  TRANSFER_RECEIVED:      { label: 'Transfer Received',icon: ArrowLeftRight, color: 'text-purple-600', bg: 'bg-purple-50' },
}

export default function NotificationsPage() {
  const [accounts, setAccounts]     = useState<Account[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [notifs, setNotifs]         = useState<Notification[]>([])
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    getAccounts().then((a) => {
      setAccounts(a)
      if (a.length > 0) setSelectedId(a[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    getNotifications(selectedId)
      .then(setNotifs)
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false))
  }, [selectedId])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Notifications</h1>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Account:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.accountNumber}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <Bell className="h-10 w-10" />
            <p className="text-sm">No notifications for this account</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifs.map((n) => {
              const meta = TYPE_META[n.type] ?? { label: n.type, icon: Bell, color: 'text-slate-600', bg: 'bg-slate-50' }
              const Icon = meta.icon
              return (
                <li key={n.id} className="flex items-start gap-4 px-5 py-4">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700">{n.message}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${n.status === 'SENT' ? 'bg-green-100 text-green-700' : n.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {n.status}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

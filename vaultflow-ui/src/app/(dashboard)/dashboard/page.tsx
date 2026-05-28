'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAccounts, getFraudAlerts, getTransactionsByAccount } from '@/lib/api'
import type { Account, Transaction, FraudAlert } from '@/types'
import { Wallet, TrendingUp, AlertTriangle, ArrowLeftRight, Plus } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'ACTIVE' || status === 'COMPLETED'
      ? 'bg-green-100 text-green-700'
      : status === 'FROZEN' || status === 'PENDING'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export default function DashboardPage() {
  const [accounts, setAccounts]             = useState<Account[]>([])
  const [recentTxns, setRecentTxns]         = useState<Transaction[]>([])
  const [alerts, setAlerts]                 = useState<FraudAlert[]>([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    Promise.all([getAccounts(), getFraudAlerts()])
      .then(async ([accs, fAlerts]) => {
        setAccounts(accs)
        setAlerts(fAlerts)
        if (accs.length > 0) {
          const txns = await getTransactionsByAccount(accs[0].id).catch(() => [])
          setRecentTxns(txns.slice(0, 5))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const openAlerts   = alerts.filter((a) => a.status === 'OPEN').length

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back — here&apos;s your overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { icon: Wallet,         label: 'Total Balance',   value: fmt(totalBalance),      color: 'text-blue-600',   bg: 'bg-blue-50' },
          { icon: TrendingUp,     label: 'Accounts',        value: accounts.length,         color: 'text-green-600',  bg: 'bg-green-50' },
          { icon: ArrowLeftRight, label: 'Recent Txns',     value: recentTxns.length,       color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: AlertTriangle,  label: 'Open Alerts',     value: openAlerts,              color: 'text-red-600',    bg: 'bg-red-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accounts */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Accounts</h2>
            <Link href="/transactions" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
              <Plus className="h-3 w-3" /> New
            </Link>
          </div>
          {accounts.length === 0 ? (
            <p className="p-5 text-sm text-slate-400">No accounts yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {accounts.map((acc) => (
                <li key={acc.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{acc.accountNumber}</p>
                    <p className="text-xs text-slate-400">{acc.accountType} · {acc.ownerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{fmt(acc.balance, acc.currency)}</p>
                    <StatusBadge status={acc.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent transactions */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
            <Link href="/transactions" className="text-xs font-medium text-blue-600 hover:underline">View all</Link>
          </div>
          {recentTxns.length === 0 ? (
            <p className="p-5 text-sm text-slate-400">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentTxns.map((txn) => {
                const sign = txn.type === 'DEPOSIT' ? '+' : '-'
                const color = txn.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                return (
                  <li key={txn.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{txn.type}</p>
                      <p className="text-xs text-slate-400">
                        {txn.category ?? 'Uncategorized'} · {new Date(txn.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${color}`}>{sign}{fmt(txn.amount, txn.currency)}</p>
                      <StatusBadge status={txn.status} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Open fraud alerts banner */}
      {openAlerts > 0 && (
        <Link href="/fraud" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 hover:bg-red-100 transition">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-sm font-medium text-red-800">
            {openAlerts} open fraud alert{openAlerts > 1 ? 's' : ''} require your attention
          </span>
          <span className="ml-auto text-xs font-medium text-red-600">Review →</span>
        </Link>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { getAccounts, getFraudAlerts, getTransactionsByAccount, createAccount } from '@/lib/api'
import type { Account, Transaction, FraudAlert } from '@/types'
import {
  Wallet, TrendingUp, AlertTriangle, ArrowLeftRight,
  Plus, BarChart2, ArrowDownLeft, ArrowUpRight, ChevronRight,
  CreditCard, Shield, Bell, X,
} from 'lucide-react'

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

const CAT_BAR_COLORS: Record<string, string> = {
  FOOD_DINING:   'bg-orange-500',
  TRANSPORT:     'bg-blue-500',
  UTILITIES:     'bg-slate-500',
  HOUSING:       'bg-purple-500',
  SHOPPING:      'bg-pink-500',
  ENTERTAINMENT: 'bg-yellow-500',
  HEALTHCARE:    'bg-emerald-500',
  TRANSFER:      'bg-indigo-500',
  OTHER:         'bg-slate-400',
}

const CAT_LABELS: Record<string, string> = {
  FOOD_DINING:   'Food & Dining',
  TRANSPORT:     'Transport',
  UTILITIES:     'Utilities',
  HOUSING:       'Housing',
  SHOPPING:      'Shopping',
  ENTERTAINMENT: 'Entertainment',
  HEALTHCARE:    'Healthcare',
  TRANSFER:      'Transfer',
  OTHER:         'Other',
}

const ACCOUNT_GRADIENTS = [
  'from-[#012169] to-[#003087]',
  'from-[#1a1a2e] to-[#16213e]',
  'from-[#1e3a5f] to-[#0f2744]',
  'from-[#0d1b2a] to-[#1b2d45]',
]

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-[#012169] px-6 py-10">
        <div className="h-4 w-32 rounded bg-white/20 mb-3" />
        <div className="h-10 w-56 rounded bg-white/20 mb-2" />
        <div className="h-4 w-24 rounded bg-white/20" />
        <div className="mt-6 flex gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 w-28 rounded-full bg-white/20" />)}
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-700" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [accounts, setAccounts]     = useState<Account[]>([])
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([])
  const [allTxns, setAllTxns]       = useState<Transaction[]>([])
  const [alerts, setAlerts]         = useState<FraudAlert[]>([])
  const [loading, setLoading]       = useState(true)

  // Inline account creation
  const [showCreate, setShowCreate]     = useState(false)
  const [newOwner, setNewOwner]         = useState('')
  const [newType, setNewType]           = useState('CHECKING')
  const [newCurrency, setNewCurrency]   = useState('USD')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError]   = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAccounts(), getFraudAlerts()])
      .then(async ([accs, fAlerts]) => {
        setAccounts(accs)
        setAlerts(fAlerts)
        // Auto-open account creation form for brand-new users
        if (accs.length === 0) setShowCreate(true)
        if (accs.length > 0) {
          const txns = await getTransactionsByAccount(accs[0].id).catch(() => [])
          setRecentTxns(txns.slice(0, 6))
          setAllTxns(txns)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault()
    setCreateLoading(true); setCreateError(null)
    try {
      await createAccount({ ownerName: newOwner, accountType: newType, currency: newCurrency })
      const [accs, fAlerts] = await Promise.all([getAccounts(), getFraudAlerts()])
      setAccounts(accs); setAlerts(fAlerts)
      if (accs.length > 0) {
        const txns = await getTransactionsByAccount(accs[0].id).catch(() => [])
        setRecentTxns(txns.slice(0, 6)); setAllTxns(txns)
      }
      setShowCreate(false)
      setNewOwner(''); setNewType('CHECKING'); setNewCurrency('USD')
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number }
      setCreateError(e.status === 503
        ? 'Service temporarily unavailable. Please try again.'
        : e.message ?? 'Failed to open account.')
    } finally {
      setCreateLoading(false)
    }
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const openAlerts   = alerts.filter((a) => a.status === 'OPEN').length

  const spendMap = allTxns
    .filter((t) => t.type === 'WITHDRAWAL' || t.type === 'TRANSFER')
    .reduce<Record<string, number>>((acc, t) => {
      const key = t.category ?? 'OTHER'
      acc[key] = (acc[key] ?? 0) + t.amount
      return acc
    }, {})

  const spendEntries = Object.entries(spendMap).sort((a, b) => b[1] - a[1])
  const maxSpend    = spendEntries[0]?.[1] ?? 1
  const totalSpend  = spendEntries.reduce((s, [, v]) => s + v, 0)

  if (loading) return <Skeleton />

  return (
    <div className="space-y-0">

      {/* ── BofA-style hero ─────────────────────────────────────────────── */}
      <div className="bg-[#012169] px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-300/70 mb-1">
          Total Portfolio Balance
        </p>
        <p className="text-5xl font-bold text-white tracking-tight tabular-nums">
          {fmt(totalBalance)}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <p className="text-sm text-blue-200/70">
            Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
          {openAlerts > 0 && (
            <Link href="/fraud"
              className="inline-flex items-center gap-1 rounded-full bg-red-500/25 border border-red-400/40 px-2.5 py-0.5 text-xs font-semibold text-red-200 hover:bg-red-500/40 transition">
              <AlertTriangle className="h-3 w-3" />
              {openAlerts} alert{openAlerts > 1 ? 's' : ''}
            </Link>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { label: 'Deposit',  icon: ArrowDownLeft,  cls: 'bg-emerald-600 hover:bg-emerald-500', tab: 'deposit' },
            { label: 'Withdraw', icon: ArrowUpRight,   cls: 'bg-white/10    hover:bg-white/20 border border-white/20', tab: 'withdraw' },
            { label: 'Transfer', icon: ArrowLeftRight, cls: 'bg-white/10    hover:bg-white/20 border border-white/20', tab: 'transfer' },
          ].map(({ label, icon: Icon, cls, tab }) => (
            <Link key={label} href={`/transactions?tab=${tab}`}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md transition ${cls}`}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
          <button onClick={() => setShowCreate(v => !v)}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-[#E31837] hover:bg-[#c9152e] px-5 py-2 text-sm font-semibold text-white shadow-md transition">
            <Plus className="h-4 w-4" /> New Account
          </button>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="bg-slate-50 dark:bg-slate-950 p-6 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            { icon: Wallet,        label: 'Total Balance',  value: fmt(totalBalance),  color: 'text-[#012169] dark:text-blue-400',   bg: 'bg-blue-50   dark:bg-blue-900/20'   },
            { icon: CreditCard,    label: 'Accounts',       value: accounts.length,    color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { icon: ArrowLeftRight,label: 'Transactions',   value: allTxns.length,     color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
            { icon: Shield,        label: 'Security Alerts',value: openAlerts,
              color: openAlerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400',
              bg:    openAlerts > 0 ? 'bg-red-50 dark:bg-red-900/20'   : 'bg-slate-100 dark:bg-slate-700/40' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label}
              className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Account Cards */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#012169] dark:text-blue-400" />
                <h2 className="font-semibold text-slate-900 dark:text-white">My Accounts</h2>
              </div>
              <button onClick={() => setShowCreate(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-[#E31837] hover:text-[#c9152e] transition">
                <Plus className="h-3 w-3" /> Add Account
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="p-5">
                {!showCreate ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                      <CreditCard className="h-7 w-7 text-[#012169] dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No accounts yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">Open your first bank account to get started</p>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                      className="mt-1 rounded-full bg-[#E31837] px-5 py-2 text-xs font-semibold text-white hover:bg-[#c9152e] transition">
                      Open an Account
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Open your first account</p>
                      {accounts.length > 0 && (
                        <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {createError && (
                      <div className="mb-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-400">{createError}</div>
                    )}
                    <form onSubmit={handleCreateAccount} className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Your Name</label>
                        <input type="text" required value={newOwner} onChange={e => setNewOwner(e.target.value)}
                          placeholder="Full legal name"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Type</label>
                          <select value={newType} onChange={e => setNewType(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]">
                            <option value="CHECKING">Checking</option>
                            <option value="SAVINGS">Savings</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</label>
                          <select value={newCurrency} onChange={e => setNewCurrency(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]">
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="INR">INR</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" disabled={createLoading}
                        className="w-full rounded-full bg-[#E31837] hover:bg-[#c9152e] py-2.5 text-sm font-bold text-white transition disabled:opacity-60 shadow-sm">
                        {createLoading ? 'Opening account…' : 'Open Account'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {/* Inline form when user clicks "Add Account" and already has accounts */}
                {showCreate && (
                  <div className="rounded-2xl border border-[#012169]/20 dark:border-blue-800/40 bg-blue-50/60 dark:bg-blue-900/10 p-4 mb-1">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#012169] dark:text-blue-400">Open new account</p>
                      <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    {createError && (
                      <div className="mb-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-2.5 text-xs text-red-700 dark:text-red-400">{createError}</div>
                    )}
                    <form onSubmit={handleCreateAccount} className="space-y-2.5">
                      <input type="text" required value={newOwner} onChange={e => setNewOwner(e.target.value)}
                        placeholder="Account holder name"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169]" />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={newType} onChange={e => setNewType(e.target.value)}
                          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]">
                          <option value="CHECKING">Checking</option>
                          <option value="SAVINGS">Savings</option>
                        </select>
                        <select value={newCurrency} onChange={e => setNewCurrency(e.target.value)}
                          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]">
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="INR">INR</option>
                        </select>
                      </div>
                      <button type="submit" disabled={createLoading}
                        className="w-full rounded-full bg-[#E31837] hover:bg-[#c9152e] py-2 text-xs font-bold text-white transition disabled:opacity-60">
                        {createLoading ? 'Opening…' : 'Open Account'}
                      </button>
                    </form>
                  </div>
                )}
                {accounts.map((acc, idx) => (
                  <div key={acc.id}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${ACCOUNT_GRADIENTS[idx % ACCOUNT_GRADIENTS.length]} p-5 text-white`}>
                    <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/5" />
                    <div className="pointer-events-none absolute bottom-0 right-8 h-20 w-20 translate-y-8 rounded-full bg-white/5" />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{acc.accountType}</p>
                          <p className="font-mono text-sm font-medium text-white/80 mt-0.5">
                            •••• •••• •••• {acc.accountNumber.slice(-4)}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          acc.status === 'ACTIVE' ? 'bg-emerald-400/20 text-emerald-300' :
                          acc.status === 'FROZEN' ? 'bg-amber-400/20 text-amber-300' :
                          'bg-red-400/20 text-red-300'
                        }`}>{acc.status}</span>
                      </div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wide">Available Balance</p>
                      <p className="text-2xl font-bold mt-0.5 tabular-nums">{fmt(acc.balance, acc.currency)}</p>
                      <p className="text-xs text-white/50 mt-3">{acc.ownerName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-[#012169] dark:text-blue-400" />
                <h2 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
              </div>
              <Link href="/transactions"
                className="flex items-center gap-0.5 text-xs font-semibold text-[#E31837] hover:text-[#c9152e] transition">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentTxns.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                  <ArrowLeftRight className="h-7 w-7 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No transactions yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Make your first deposit to get started</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50 dark:divide-slate-700/40">
                {recentTxns.map((txn) => {
                  const isCredit = txn.type === 'DEPOSIT'
                  const Icon = isCredit ? ArrowDownLeft : txn.type === 'WITHDRAWAL' ? ArrowUpRight : ArrowLeftRight
                  return (
                    <li key={txn.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isCredit ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                        <Icon className={`h-4 w-4 ${isCredit ? 'text-emerald-600' : 'text-red-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {txn.category ? (CAT_LABELS[txn.category] ?? txn.category) : txn.type}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <p className={`text-sm font-bold shrink-0 tabular-nums ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isCredit ? '+' : '-'}{fmt(txn.amount, txn.currency)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Spending Analytics */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 px-5 py-4">
            <BarChart2 className="h-4 w-4 text-[#012169] dark:text-blue-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Spending Analysis</h2>
            {totalSpend > 0 && (
              <span className="ml-auto text-xs text-slate-400">
                Total outflow: <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{fmt(totalSpend)}</span>
              </span>
            )}
          </div>

          {spendEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                <BarChart2 className="h-7 w-7 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No spending data yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Withdrawals and transfers will appear here</p>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {spendEntries.map(([cat, amount]) => {
                const pct      = Math.round((amount / maxSpend) * 100)
                const barColor = CAT_BAR_COLORS[cat] ?? 'bg-slate-400'
                const label    = CAT_LABELS[cat] ?? cat
                return (
                  <div key={cat}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                      <span className="tabular-nums text-slate-500 dark:text-slate-400">
                        {fmt(amount)} <span className="text-slate-400">({Math.round((amount / totalSpend) * 100)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div className={`h-2 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Notifications strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {openAlerts > 0 && (
            <Link href="/fraud"
              className="flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-5 py-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <span className="flex-1 text-sm font-medium text-red-800 dark:text-red-300">
                {openAlerts} open fraud alert{openAlerts > 1 ? 's' : ''} — review now
              </span>
              <ChevronRight className="h-4 w-4 text-red-500" />
            </Link>
          )}
          <Link href="/notifications"
            className="flex items-center gap-3 rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 px-5 py-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
            <Bell className="h-5 w-5 shrink-0 text-[#012169] dark:text-blue-400" />
            <span className="flex-1 text-sm font-medium text-blue-800 dark:text-blue-300">View notifications</span>
            <ChevronRight className="h-4 w-4 text-blue-500" />
          </Link>
        </div>

      </div>
    </div>
  )
}

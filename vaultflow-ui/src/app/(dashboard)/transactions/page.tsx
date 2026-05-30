'use client'

import { useEffect, useState, FormEvent } from 'react'
import {
  getAccounts, getTransactionsByAccount,
  deposit, withdraw, transfer, createAccount, deleteAccount,
} from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { Account, Transaction } from '@/types'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, RefreshCw, Search, Plus, X, CreditCard, Trash2 } from 'lucide-react'

type ActionTab  = 'deposit' | 'withdraw' | 'transfer'
type FilterType = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'

const CATEGORY_COLORS: Record<string, string> = {
  RENT_HOUSING:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  GROCERIES:     'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  FOOD_DINING:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  UTILITIES:     'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  TRANSPORT:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  INCOME:        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  HEALTHCARE:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ENTERTAINMENT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  SHOPPING:      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  TRAVEL:        'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  TRANSFER:      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  OTHER:         'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const CATEGORY_LABELS: Record<string, string> = {
  RENT_HOUSING:  'Rent / Housing',
  GROCERIES:     'Groceries',
  FOOD_DINING:   'Food & Dining',
  UTILITIES:     'Utilities',
  TRANSPORT:     'Transport',
  INCOME:        'Income',
  HEALTHCARE:    'Healthcare',
  ENTERTAINMENT: 'Entertainment',
  SHOPPING:      'Shopping',
  TRAVEL:        'Travel',
  TRANSFER:      'Transfer',
  OTHER:         'Other',
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now  = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === now.toDateString())       return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (daysAgo <= 7)  return 'This Week'
  if (daysAgo <= 30) return 'This Month'
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const TAB_META: Record<ActionTab, {
  icon: typeof ArrowDownLeft
  label: string
  activeBorder: string
  activeText: string
  activeBg: string
  btnCls: string
}> = {
  deposit:  {
    icon: ArrowDownLeft, label: 'Deposit',
    activeBorder: 'border-emerald-500', activeText: 'text-emerald-700 dark:text-emerald-400',
    activeBg: 'bg-emerald-50 dark:bg-emerald-900/10',
    btnCls: 'bg-emerald-600 hover:bg-emerald-500',
  },
  withdraw: {
    icon: ArrowUpRight, label: 'Withdraw',
    activeBorder: 'border-[#E31837]', activeText: 'text-[#E31837] dark:text-red-400',
    activeBg: 'bg-red-50 dark:bg-red-900/10',
    btnCls: 'bg-[#E31837] hover:bg-[#c9152e]',
  },
  transfer: {
    icon: ArrowLeftRight, label: 'Transfer',
    activeBorder: 'border-[#012169]', activeText: 'text-[#012169] dark:text-blue-400',
    activeBg: 'bg-blue-50 dark:bg-blue-900/10',
    btnCls: 'bg-[#012169] hover:bg-[#01195e]',
  },
}

// ── Category picker ───────────────────────────────────────────────────────────

const PRESET_CATEGORIES = [
  { value: 'RENT_HOUSING',  label: 'Rent / Housing', emoji: '🏠' },
  { value: 'GROCERIES',     label: 'Groceries',      emoji: '🛒' },
  { value: 'FOOD_DINING',   label: 'Food & Dining',  emoji: '🍽️' },
  { value: 'UTILITIES',     label: 'Utilities',      emoji: '💡' },
  { value: 'TRANSPORT',     label: 'Transport',      emoji: '🚗' },
  { value: 'INCOME',        label: 'Income',         emoji: '💰' },
  { value: 'HEALTHCARE',    label: 'Healthcare',     emoji: '🏥' },
  { value: 'ENTERTAINMENT', label: 'Entertainment',  emoji: '🎬' },
  { value: 'SHOPPING',      label: 'Shopping',       emoji: '🛍️' },
  { value: 'TRAVEL',        label: 'Travel',         emoji: '✈️' },
]

function CategoryPicker({
  value, otherText, onChange, onOtherChange,
}: {
  value: string
  otherText: string
  onChange: (v: string) => void
  onOtherChange: (v: string) => void
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Category <span className="font-normal normal-case text-slate-400">(optional — AI picks if blank)</span>
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(value === cat.value ? '' : cat.value)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
              value === cat.value
                ? 'bg-[#012169] border-[#012169] text-white shadow-sm'
                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#012169] hover:text-[#012169] dark:hover:text-blue-400'
            }`}
          >
            <span>{cat.emoji}</span> {cat.label}
          </button>
        ))}
        {/* Other */}
        <button
          type="button"
          onClick={() => onChange(value === 'OTHER' ? '' : 'OTHER')}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
            value === 'OTHER'
              ? 'bg-[#012169] border-[#012169] text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#012169] hover:text-[#012169] dark:hover:text-blue-400'
          }`}
        >
          ✏️ Other
        </button>
      </div>
      {/* Custom text input — only when "Other" is selected */}
      {value === 'OTHER' && (
        <input
          type="text"
          value={otherText}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="e.g. Gym, Gifts, Insurance…"
          maxLength={50}
          className="w-full rounded-xl border border-[#012169]/40 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169]"
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { isAdmin } = useAuth()

  const [accounts, setAccounts]        = useState<Account[]>([])
  const [selectedId, setSelectedId]    = useState<string>('')
  const [txns, setTxns]                = useState<Transaction[]>([])
  const [tab, setTab]                  = useState<ActionTab>('deposit')
  const [amount, setAmount]            = useState('')
  const [description, setDescription] = useState('')
  const [targetId, setTargetId]        = useState('')
  const [loading, setLoading]          = useState(false)
  const [txnLoading, setTxnLoading]    = useState(false)
  const [error, setError]              = useState<string | null>(null)
  const [success, setSuccess]          = useState<string | null>(null)
  const [search, setSearch]            = useState('')
  const [filterType, setFilterType]    = useState<FilterType>('ALL')
  const [acctLoading, setAcctLoading]  = useState(true)

  // Category picker
  const [category, setCategory]         = useState<string>('')
  const [otherText, setOtherText]       = useState<string>('')

  // Admin: delete account
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const [deleteError, setDeleteError]       = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete]   = useState(false)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newOwner, setNewOwner]             = useState('')
  const [newType, setNewType]               = useState('SAVINGS')
  const [newCurrency, setNewCurrency]       = useState('USD')
  const [createLoading, setCreateLoading]   = useState(false)
  const [createError, setCreateError]       = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab') as ActionTab | null
      if (p && ['deposit', 'withdraw', 'transfer'].includes(p)) setTab(p)
    }
  }, [])

  useEffect(() => {
    getAccounts()
      .then((a) => { setAccounts(a); if (a.length > 0) setSelectedId(a[0].id) })
      .catch(() => {})
      .finally(() => setAcctLoading(false))
  }, [])

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault()
    setCreateLoading(true); setCreateError(null)
    try {
      const acct = await createAccount({ ownerName: newOwner, accountType: newType, currency: newCurrency })
      const updated = await getAccounts()
      setAccounts(updated)
      setSelectedId(acct.id)
      setShowCreateForm(false)
      setNewOwner(''); setNewType('SAVINGS'); setNewCurrency('USD')
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number }
      if (e.status === 503) {
        setCreateError('Banking service is temporarily unavailable. Please try again in a moment.')
      } else {
        setCreateError(e.message ?? 'Failed to create account.')
      }
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (!selectedId || !confirmDelete) return
    setDeleteLoading(true); setDeleteError(null)
    try {
      await deleteAccount(selectedId)
      const updated = await getAccounts()
      setAccounts(updated)
      setSelectedId(updated.length > 0 ? updated[0].id : '')
      setTxns([])
      setConfirmDelete(false)
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number }
      setDeleteError(
        e.status === 403 ? 'Admin access required.' :
        e.status === 503 ? 'Service temporarily unavailable.' :
        e.message || 'Failed to delete account.'
      )
      setConfirmDelete(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedId) return
    setTxnLoading(true)
    getTransactionsByAccount(selectedId)
      .then(setTxns)
      .catch(() => setTxns([]))
      .finally(() => setTxnLoading(false))
  }, [selectedId])

  const filteredTxns = txns.filter((txn) => {
    const matchType   = filterType === 'ALL' || txn.type === filterType
    const q           = search.toLowerCase()
    const matchSearch = !q ||
      txn.type.toLowerCase().includes(q) ||
      txn.description?.toLowerCase().includes(q) ||
      txn.category?.toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const groups: { label: string; items: Transaction[] }[] = []
  filteredTxns.forEach((txn) => {
    const label    = getDateGroup(txn.createdAt)
    const existing = groups.find((g) => g.label === label)
    if (existing) existing.items.push(txn)
    else groups.push({ label, items: [txn] })
  })

  async function handleAction(e: FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    setLoading(true); setError(null); setSuccess(null)
    // Resolve the final category: "OTHER" → use the custom text the user typed
    const resolvedCategory = category === 'OTHER' ? (otherText.trim() || 'OTHER') : category
    try {
      const amt = parseFloat(amount)
      if (tab === 'deposit')  await deposit(selectedId, amt, description, resolvedCategory || undefined)
      if (tab === 'withdraw') await withdraw(selectedId, amt, description, resolvedCategory || undefined)
      if (tab === 'transfer') await transfer(selectedId, targetId, amt, description, crypto.randomUUID(), resolvedCategory || undefined)

      // Refresh data first so the balance is up-to-date before showing the banner
      const [updatedAccs, updatedTxns] = await Promise.all([
        getAccounts(),
        getTransactionsByAccount(selectedId),
      ])
      setAccounts(updatedAccs)
      setTxns(updatedTxns)

      const newBal = updatedAccs.find(a => a.id === selectedId)?.balance ?? 0
      setSuccess(`${TAB_META[tab].label} of ${fmt(parseFloat(amount))} successful! New balance: ${fmt(newBal)}`)
      setAmount(''); setDescription(''); setTargetId(''); setCategory(''); setOtherText('')

      // Auto-dismiss after 5 s
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number }
      if (e.status === 503) {
        setError('Banking service is temporarily unavailable. Please try again in a moment.')
      } else if (e.status === 422) {
        // Unprocessable Entity — show backend reason (e.g. "Insufficient funds") plus balance hint
        const bal = selectedAccount ? ` Your current balance is ${fmt(selectedAccount.balance, selectedAccount.currency)}.` : ''
        setError((e.message || 'Unprocessable request.') + bal)
      } else {
        setError(e.message || 'Operation failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const meta = TAB_META[tab]

  const selectedAccount = accounts.find(a => a.id === selectedId)

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Accounts & Transactions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your accounts and make transfers</p>
        </div>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-[#E31837] hover:bg-[#c9152e] px-4 py-2 text-sm font-semibold text-white transition shadow-sm"
        >
          {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreateForm ? 'Cancel' : 'Open Account'}
        </button>
      </div>

      {/* Account selector row */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Active account:</label>
        {acctLoading ? (
          <div className="h-9 w-52 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        ) : accounts.length === 0 ? (
          <span className="text-sm text-slate-400 italic">No accounts — open one above</span>
        ) : (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountType} •••• {a.accountNumber.slice(-4)} — {fmt(a.balance, a.currency)}
              </option>
            ))}
          </select>
        )}
        {selectedAccount && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            selectedAccount.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
            selectedAccount.status === 'FROZEN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {selectedAccount.status}
          </span>
        )}
      </div>

      {/* Admin: delete account */}
      {isAdmin && selectedId && (
        <div className="flex items-center gap-2">
          {!confirmDelete ? (
            <button
              onClick={() => { setConfirmDelete(true); setDeleteError(null) }}
              className="flex items-center gap-1.5 rounded-full border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Account
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-2">
              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                Permanently delete this account?
              </span>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="rounded-full bg-red-600 hover:bg-red-700 px-3 py-1 text-xs font-bold text-white transition disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          )}
          {deleteError && (
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">{deleteError}</span>
          )}
        </div>
      )}

      {/* Open account form */}
      {showCreateForm && (
        <div className="rounded-2xl border border-[#012169]/20 dark:border-blue-800/40 bg-white dark:bg-slate-800/60 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-[#012169] dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Open a new bank account</h2>
          </div>
          {createError && (
            <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
              {createError}
            </div>
          )}
          <form onSubmit={handleCreateAccount} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Account Holder</label>
              <input
                type="text" required value={newOwner} onChange={(e) => setNewOwner(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Account Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]">
                <option value="SAVINGS">Savings Account</option>
                <option value="CHECKING">Checking Account</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Currency</label>
              <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]">
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="INR">INR — Indian Rupee</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <button type="submit" disabled={createLoading}
                className="rounded-full bg-[#012169] hover:bg-[#01195e] px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 shadow-sm">
                {createLoading ? 'Opening account…' : 'Open Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Action panel */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-slate-100 dark:border-slate-700/60">
            {(['deposit', 'withdraw', 'transfer'] as ActionTab[]).map((t) => {
              const m = TAB_META[t]
              const active = tab === t
              return (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex flex-1 flex-col items-center gap-1 border-b-2 py-3.5 text-xs font-semibold capitalize transition ${
                    active
                      ? `${m.activeBorder} ${m.activeText} ${m.activeBg}`
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}>
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* Selected account balance preview */}
          {selectedAccount && (
            <div className="border-b border-slate-50 dark:border-slate-700/40 bg-slate-50/60 dark:bg-slate-700/20 px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {selectedAccount.accountType} •••• {selectedAccount.accountNumber.slice(-4)}
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {fmt(selectedAccount.balance, selectedAccount.currency)}
              </p>
            </div>
          )}

          <form onSubmit={handleAction} className="space-y-4 p-5">
            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                <span className="flex-1">⚠ {error}</span>
                <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600 leading-none">✕</button>
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-start gap-2">
                <span className="flex-1">✓ {success}</span>
                <button onClick={() => setSuccess(null)} className="shrink-0 text-emerald-500 hover:text-emerald-700 leading-none">✕</button>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                <input type="number" min="0.01" step="0.01" value={amount}
                  onChange={(e) => setAmount(e.target.value)} required placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 pl-7 pr-3 py-2.5 text-sm text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#012169]"
                />
              </div>
            </div>

            {tab === 'transfer' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">To Account</label>
                <select value={targetId} onChange={(e) => setTargetId(e.target.value)} required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]">
                  <option value="">Select destination…</option>
                  {accounts.filter((a) => a.id !== selectedId).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountType} •••• {a.accountNumber.slice(-4)} — {fmt(a.balance, a.currency)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Description <span className="font-normal normal-case text-slate-400">(optional)</span>
              </label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Rent payment"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169]"
              />
            </div>

            {/* Category picker */}
            <CategoryPicker
              value={category}
              otherText={otherText}
              onChange={setCategory}
              onOtherChange={setOtherText}
            />

            <button type="submit" disabled={loading || accounts.length === 0}
              className={`w-full rounded-full py-2.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-60 ${meta.btnCls}`}>
              {loading ? 'Processing…' : `Confirm ${meta.label}`}
            </button>
          </form>
        </div>

        {/* Transaction history */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm lg:col-span-2 flex flex-col">
          <div className="border-b border-slate-100 dark:border-slate-700/60 px-5 py-3.5 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 dark:text-white">Transaction History</h2>
              {txnLoading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions…"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 pl-8 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169]"
                />
              </div>
              <div className="flex gap-1 shrink-0">
                {(['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER'] as FilterType[]).map((type) => (
                  <button key={type} onClick={() => setFilterType(type)}
                    className={`rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
                      filterType === type
                        ? 'bg-[#012169] text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}>
                    {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredTxns.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                <ArrowLeftRight className="h-7 w-7 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {txns.length === 0 ? 'No transactions yet' : 'No results found'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {txns.length === 0
                    ? 'Use the panel on the left to make your first transaction'
                    : 'Try adjusting your search or filter'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto">
              {groups.map(({ label, items }) => (
                <div key={label}>
                  <div className="sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/90 dark:bg-slate-900/80 backdrop-blur-sm px-5 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
                  </div>
                  {items.map((txn) => {
                    const isCredit = txn.type === 'DEPOSIT'
                    const Icon = isCredit ? ArrowDownLeft : txn.type === 'WITHDRAWAL' ? ArrowUpRight : ArrowLeftRight
                    return (
                      <div key={txn.id}
                        className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-700/30 px-5 py-3.5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isCredit ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                          <Icon className={`h-4 w-4 ${isCredit ? 'text-emerald-600' : 'text-red-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {txn.description || (txn.category ? (CATEGORY_LABELS[txn.category] ?? txn.category) : txn.type)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {txn.category && (
                              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                CATEGORY_COLORS[txn.category] ?? 'bg-slate-100 text-slate-600'}`}>
                                {CATEGORY_LABELS[txn.category] ?? txn.category}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              {new Date(txn.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-sm font-bold tabular-nums ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {isCredit ? '+' : '-'}{fmt(txn.amount, txn.currency)}
                          </p>
                          <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                            txn.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : txn.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {txn.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

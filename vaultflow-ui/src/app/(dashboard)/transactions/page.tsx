'use client'

import { useEffect, useState, FormEvent } from 'react'
import {
  getAccounts, getTransactionsByAccount,
  deposit, withdraw, transfer,
} from '@/lib/api'
import type { Account, Transaction } from '@/types'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, RefreshCw } from 'lucide-react'

type ActionTab = 'deposit' | 'withdraw' | 'transfer'

const CATEGORY_COLORS: Record<string, string> = {
  FOOD_DINING: 'bg-orange-100 text-orange-700',
  TRANSPORT: 'bg-blue-100 text-blue-700',
  UTILITIES: 'bg-gray-100 text-gray-700',
  HOUSING: 'bg-purple-100 text-purple-700',
  SHOPPING: 'bg-pink-100 text-pink-700',
  ENTERTAINMENT: 'bg-yellow-100 text-yellow-700',
  HEALTHCARE: 'bg-green-100 text-green-700',
  TRANSFER: 'bg-indigo-100 text-indigo-700',
  SALARY: 'bg-teal-100 text-teal-700',
  OTHER: 'bg-slate-100 text-slate-600',
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export default function TransactionsPage() {
  const [accounts, setAccounts]         = useState<Account[]>([])
  const [selectedId, setSelectedId]     = useState<string>('')
  const [txns, setTxns]                 = useState<Transaction[]>([])
  const [tab, setTab]                   = useState<ActionTab>('deposit')
  const [amount, setAmount]             = useState('')
  const [description, setDescription]  = useState('')
  const [targetId, setTargetId]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [txnLoading, setTxnLoading]     = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState<string | null>(null)

  useEffect(() => {
    getAccounts().then((a) => {
      setAccounts(a)
      if (a.length > 0) setSelectedId(a[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setTxnLoading(true)
    getTransactionsByAccount(selectedId)
      .then(setTxns)
      .catch(() => setTxns([]))
      .finally(() => setTxnLoading(false))
  }, [selectedId])

  async function handleAction(e: FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    setLoading(true); setError(null); setSuccess(null)
    try {
      const amt = parseFloat(amount)
      if (tab === 'deposit')  await deposit(selectedId, amt, description)
      if (tab === 'withdraw') await withdraw(selectedId, amt, description)
      if (tab === 'transfer') await transfer(selectedId, targetId, amt, description, crypto.randomUUID())
      setSuccess(`${tab.charAt(0).toUpperCase() + tab.slice(1)} successful!`)
      setAmount(''); setDescription(''); setTargetId('')
      const [updatedAccs, updatedTxns] = await Promise.all([
        getAccounts(),
        getTransactionsByAccount(selectedId),
      ])
      setAccounts(updatedAccs)
      setTxns(updatedTxns)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Transactions</h1>

      {/* Account selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Account:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.accountNumber} — {fmt(a.balance, a.currency)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Action panel */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex border-b border-slate-100">
            {(['deposit', 'withdraw', 'transfer'] as ActionTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs font-semibold capitalize transition ${
                  tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <form onSubmit={handleAction} className="space-y-4 p-5">
            {error   && <p className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</p>}
            {success && <p className="text-xs text-green-700 bg-green-50 rounded p-2">{success}</p>}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
              <input
                type="number" min="0.01" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)} required
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {tab === 'transfer' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Target Account</label>
                <select
                  value={targetId} onChange={(e) => setTargetId(e.target.value)} required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select account…</option>
                  {accounts.filter((a) => a.id !== selectedId).map((a) => (
                    <option key={a.id} value={a.id}>{a.accountNumber}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description (optional)</label>
              <input
                type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Rent payment"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Processing…' : `Confirm ${tab}`}
            </button>
          </form>
        </div>

        {/* Transaction list */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">History</h2>
            {txnLoading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          {txns.length === 0 ? (
            <p className="p-5 text-sm text-slate-400">No transactions for this account.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txns.map((txn) => {
                    const isCredit = txn.type === 'DEPOSIT'
                    const Icon = isCredit ? ArrowDownLeft : txn.type === 'WITHDRAWAL' ? ArrowUpRight : ArrowLeftRight
                    return (
                      <tr key={txn.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${isCredit ? 'text-green-500' : 'text-red-500'}`} />
                            {txn.type}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {txn.category ? (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[txn.category] ?? 'bg-slate-100 text-slate-600'}`}>
                              {txn.category}
                            </span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className={`px-5 py-3 text-right font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}{fmt(txn.amount, txn.currency)}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{new Date(txn.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${txn.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : txn.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

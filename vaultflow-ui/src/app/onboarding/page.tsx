'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, CreditCard, CheckCircle } from 'lucide-react'
import { createAccount } from '@/lib/api'

const STEPS = ['Account type', 'Details', 'Review']

export default function OnboardingPage() {
  const router = useRouter()
  const [ownerName, setOwnerName]     = useState('')
  const [accountType, setAccountType] = useState('CHECKING')
  const [currency, setCurrency]       = useState('USD')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await createAccount({ ownerName, accountType, currency })
      router.replace('/dashboard')
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number }
      if (e.status === 503) {
        setError('Our banking service is temporarily unavailable. Please wait a moment and try again.')
      } else if (e.status === 401) {
        setError('Your session expired. Please log in again.')
        setTimeout(() => router.replace('/login'), 2000)
      } else {
        setError(e.message ?? 'Failed to open your account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#012169]">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">VaultFlow</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome! Let's open your account</h1>
        <p className="text-slate-500 text-sm mt-1.5">Takes less than a minute. You can open more accounts later.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              i === 0 ? 'bg-[#012169] text-white' : 'bg-slate-200 text-slate-400'}`}>
              {i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === 0 ? 'text-slate-700' : 'text-slate-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="h-5 w-5 text-[#012169]" />
          <h2 className="text-lg font-bold text-slate-900">Account details</h2>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Account Holder Name
            </label>
            <input type="text" required value={ownerName} onChange={e => setOwnerName(e.target.value)}
              placeholder="Enter your full legal name"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169] transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Account Type
              </label>
              <div className="space-y-2">
                {[
                  { value: 'CHECKING', label: 'Checking', desc: 'For everyday use' },
                  { value: 'SAVINGS',  label: 'Savings',  desc: 'Grow your money'  },
                ].map(({ value, label, desc }) => (
                  <button key={value} type="button"
                    onClick={() => setAccountType(value)}
                    className={`w-full rounded-xl border-2 px-3 py-2.5 text-left transition ${
                      accountType === value
                        ? 'border-[#012169] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <p className={`text-xs font-bold ${accountType === value ? 'text-[#012169]' : 'text-slate-700'}`}>{label}</p>
                    <p className="text-[10px] text-slate-400">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Currency
              </label>
              <div className="space-y-1">
                {[
                  { value: 'USD', label: 'USD', flag: '🇺🇸' },
                  { value: 'EUR', label: 'EUR', flag: '🇪🇺' },
                  { value: 'GBP', label: 'GBP', flag: '🇬🇧' },
                  { value: 'INR', label: 'INR', flag: '🇮🇳' },
                ].map(({ value, label, flag }) => (
                  <button key={value} type="button"
                    onClick={() => setCurrency(value)}
                    className={`w-full rounded-xl border-2 px-3 py-2 text-left flex items-center gap-2 transition ${
                      currency === value
                        ? 'border-[#012169] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <span className="text-sm">{flag}</span>
                    <span className={`text-xs font-bold ${currency === value ? 'text-[#012169]' : 'text-slate-700'}`}>{label}</span>
                    {currency === value && <CheckCircle className="h-3 w-3 text-[#012169] ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-600">Summary</p>
            <p>Holder: <span className="text-slate-800 font-medium">{ownerName || '—'}</span></p>
            <p>Type: <span className="text-slate-800 font-medium">{accountType} · {currency}</span></p>
            <p>Starting balance: <span className="text-slate-800 font-medium">$0.00</span></p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-full bg-[#E31837] hover:bg-[#c9152e] disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold py-3 text-sm transition shadow-sm">
            {loading ? 'Opening your account…' : 'Open Account & Continue'}
          </button>
        </form>

        <button onClick={() => router.replace('/dashboard')}
          className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-600 transition">
          Skip for now →
        </button>
      </div>
    </div>
  )
}

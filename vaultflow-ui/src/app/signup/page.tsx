'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Shield, CheckCircle } from 'lucide-react'
import { register } from '@/lib/api'

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showCf, setShowCf]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const pwStrong  = password.length >= 8
  const pwMatch   = password === confirm && confirm.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await register(email, password)
      router.replace('/dashboard')
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number }
      if (e.status === 409) {
        setError('An account with that email already exists.')
      } else {
        setError(e.message ?? 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">

      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#012169] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">VaultFlow</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Bank smarter.<br />Move faster.
          </h2>
          <p className="text-blue-200/70 text-lg leading-relaxed">
            Secure, real-time banking at your fingertips. Open your account in minutes.
          </p>
          <div className="mt-8 space-y-3">
            {['FDIC-insured accounts', 'Zero-fee transfers', 'Real-time fraud monitoring', 'AI-powered insights'].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-blue-100/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300/40 text-xs">© 2026 VaultFlow Financial Services</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#012169]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">VaultFlow</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-sm text-slate-500 mb-8">Already have an account?{' '}
            <a href="/login" className="font-semibold text-[#E31837] hover:text-[#c9152e]">Sign in</a>
          </p>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Email address
              </label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169] focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className={`h-1 flex-1 rounded-full transition-colors ${pwStrong ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span className={`text-xs font-medium ${pwStrong ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {pwStrong ? 'Strong' : 'Weak'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input type={showCf ? 'text' : 'password'} required value={confirm}
                  onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password"
                  className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    confirm.length > 0
                      ? pwMatch ? 'border-emerald-400 focus:ring-emerald-500' : 'border-red-300 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-[#012169]'
                  }`}
                />
                <button type="button" onClick={() => setShowCf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCf ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full rounded-full bg-[#E31837] hover:bg-[#c9152e] disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold py-3 text-sm transition mt-2 shadow-sm">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            By creating an account you agree to our{' '}
            <span className="underline cursor-pointer hover:text-slate-600">Terms of Service</span> and{' '}
            <span className="underline cursor-pointer hover:text-slate-600">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await login(email, password)
      router.replace('/dashboard')
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      if (e.status === 429) {
        setError(e.message ?? 'Account locked. Too many failed attempts.')
      } else if (e.status === 503) {
        setError('Banking service is temporarily unavailable. Please try again shortly.')
      } else {
        setError('Incorrect email or password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">

      {/* Left — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#012169] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">VaultFlow</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Your money,<br />always protected.
          </h2>
          <p className="text-blue-200/70 text-lg leading-relaxed">
            Bank-grade security with real-time fraud detection and AI-powered insights.
          </p>
          <div className="mt-8 space-y-3">
            {['256-bit encryption', '24/7 fraud monitoring', 'Instant notifications', 'Multi-account support'].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-blue-100/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300/40 text-xs">© 2026 VaultFlow Financial Services</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#012169]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">VaultFlow</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-8">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-semibold text-[#E31837] hover:text-[#c9152e]">Sign up</a>
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 font-medium">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Online ID (Email)
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169] focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Passcode
                </label>
                <span className="text-xs text-[#E31837] hover:text-[#c9152e] cursor-pointer font-medium">Forgot password?</span>
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169] focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full rounded-full bg-[#E31837] hover:bg-[#c9152e] disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold py-3 text-sm transition mt-2 shadow-sm">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Protected by 256-bit TLS encryption
          </p>
        </div>
      </div>
    </div>
  )
}

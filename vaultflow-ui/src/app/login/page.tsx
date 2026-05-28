'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'

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
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      router.replace('/dashboard')
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      if (e.status === 429) {
        setError(e.message ?? 'Account locked. Too many failed attempts.')
      } else {
        setError('Invalid email or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/40">
            <Shield className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">VaultFlow</h1>
            <p className="text-sm text-slate-400">Secure banking platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-lg font-semibold text-white">Sign in to your account</h2>

          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@vaultflow.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-500 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Demo credentials: <span className="text-slate-400">admin@vaultflow.com / admin123</span>
          </p>
        </div>
      </div>
    </div>
  )
}

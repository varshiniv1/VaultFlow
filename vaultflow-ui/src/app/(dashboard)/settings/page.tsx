'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { changePassword } from '@/lib/api'
import { Eye, EyeOff, CheckCircle, AlertCircle, User, Lock, Moon, Sun, Wallet, MessageSquare } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [current, setCurrent]   = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showCur, setShowCur]   = useState(false)
  const [showNew, setShowNew]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const initials = user ? user.split('@')[0].slice(0, 2).toUpperCase() : '??'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(false)
    if (newPw.length < 6) { setError('New password must be at least 6 characters.'); return }
    if (newPw !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await changePassword(current, newPw)
      setSuccess(true)
      setCurrent(''); setNewPw(''); setConfirm('')
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">

      {/* Profile card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 text-xl font-bold text-white shadow-md">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{user?.split('@')[0]}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active account
            </span>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/30">
            {theme === 'dark'
              ? <Sun className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              : <Moon className="h-4 w-4 text-violet-600" />}
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-white">Appearance</h2>
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Currently using <span className="font-medium capitalize">{theme}</span> mode
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
            <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-white">Quick Links</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {[
            { href: '/transactions', icon: Wallet,        label: 'Manage Accounts',  desc: 'View, deposit, withdraw, or transfer' },
            { href: '/fraud',        icon: User,          label: 'Fraud Alerts',      desc: 'Review and manage suspicious activity' },
            { href: '/chat',         icon: MessageSquare, label: 'AI Assistant',      desc: 'Ask questions about your account' },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
                <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <span className="text-xs text-slate-400">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Change Password</h2>
            <p className="text-xs text-slate-400">Use a strong, unique password</p>
          </div>
        </div>

        <div className="p-6">
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Password updated successfully.
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCur ? 'text' : 'password'}
                  value={current} onChange={(e) => setCurrent(e.target.value)} required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowCur((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw} onChange={(e) => setNewPw(e.target.value)} required
                  placeholder="Min. 6 characters"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-60"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

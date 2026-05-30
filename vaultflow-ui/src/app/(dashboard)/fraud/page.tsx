'use client'

import { useEffect, useState } from 'react'
import { getFraudAlerts, explainFraudAlert, dismissFraudAlert, reviewFraudAlert } from '@/lib/api'
import { useApp } from '@/lib/app-context'
import type { FraudAlert, FraudExplanation } from '@/types'
import { AlertTriangle, Brain, CheckCircle, XCircle, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const STATUS_STYLE: Record<string, string> = {
  OPEN:      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/60',
  REVIEWED:  'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/60',
  DISMISSED: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600/60',
}

const RISK_STYLE: Record<string, string> = {
  HIGH:   'text-red-600 dark:text-red-400',
  MEDIUM: 'text-amber-600 dark:text-amber-400',
  LOW:    'text-emerald-600 dark:text-emerald-400',
}

export default function FraudPage() {
  const { refreshAlertCount } = useApp()
  const [alerts, setAlerts]         = useState<FraudAlert[]>([])
  const [loading, setLoading]       = useState(true)
  const [explanations, setExplanations] = useState<Record<string, FraudExplanation>>({})
  const [explaining, setExplaining] = useState<Record<string, boolean>>({})
  const [acting, setActing]         = useState<Record<string, boolean>>({})

  useEffect(() => {
    getFraudAlerts()
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleExplain(id: string) {
    setExplaining((prev) => ({ ...prev, [id]: true }))
    try {
      const exp = await explainFraudAlert(id)
      setExplanations((prev) => ({ ...prev, [id]: exp }))
    } catch { /* ignore */ }
    finally { setExplaining((prev) => ({ ...prev, [id]: false })) }
  }

  async function handleAction(id: string, action: 'dismiss' | 'review') {
    setActing((prev) => ({ ...prev, [id]: true }))
    try {
      const updated = action === 'dismiss'
        ? await dismissFraudAlert(id)
        : await reviewFraudAlert(id)
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)))
      refreshAlertCount()
    } catch { /* ignore */ }
    finally { setActing((prev) => ({ ...prev, [id]: false })) }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const open      = alerts.filter((a) => a.status === 'OPEN')
  const reviewed  = alerts.filter((a) => a.status === 'REVIEWED')
  const dismissed = alerts.filter((a) => a.status === 'DISMISSED')
  const grouped   = [...open, ...reviewed, ...dismissed]

  return (
    <div className="p-6 space-y-6">

      {/* Summary stat chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Open',      count: open.length,      bg: 'bg-red-50 dark:bg-red-900/20',     text: 'text-red-700 dark:text-red-400',     border: 'border-red-200 dark:border-red-800/60',     dot: 'bg-red-500' },
          { label: 'Reviewed',  count: reviewed.length,  bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/60', dot: 'bg-amber-500' },
          { label: 'Dismissed', count: dismissed.length, bg: 'bg-slate-50 dark:bg-slate-800/60', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700',    dot: 'bg-slate-400' },
        ].map(({ label, count, bg, text, border, dot }) => (
          <div key={label} className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 ${bg} ${border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            <span className={`text-sm font-semibold ${text}`}>{count} {label}</span>
          </div>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-16 text-center">
          <ShieldCheck className="h-10 w-10 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All clear — no fraud alerts</p>
            <p className="text-xs text-slate-400 mt-0.5">Suspicious transactions will appear here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((alert) => {
            const exp  = explanations[alert.id]
            const isOpen = alert.status === 'OPEN'
            return (
              <div
                key={alert.id}
                className={`overflow-hidden rounded-2xl border bg-white dark:bg-slate-800/60 shadow-sm ${
                  isOpen
                    ? 'border-red-200 dark:border-red-800/50'
                    : 'border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between p-5">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-xl p-2 ${isOpen ? 'bg-red-50 dark:bg-red-900/30' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                      {isOpen
                        ? <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        : <ShieldAlert   className="h-4 w-4 text-slate-400" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[alert.status]}`}>
                          {alert.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(alert.createdAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{alert.reason}</p>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        Amount:{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(alert.amount)}</span>
                        {' '}· Account:{' '}
                        <span className="font-mono text-xs">{alert.accountId.slice(0, 8)}…</span>
                      </p>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleAction(alert.id, 'review')}
                        disabled={acting[alert.id]}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-60 transition"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Review
                      </button>
                      <button
                        onClick={() => handleAction(alert.id, 'dismiss')}
                        disabled={acting[alert.id]}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600/60 disabled:opacity-60 transition"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Dismiss
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Explain */}
                <div className="border-t border-slate-100 dark:border-slate-700/60 px-5 py-3">
                  {!exp ? (
                    <button
                      onClick={() => handleExplain(alert.id)}
                      disabled={explaining[alert.id]}
                      className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 disabled:opacity-60 transition"
                    >
                      {explaining[alert.id]
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Brain className="h-3.5 w-3.5" />}
                      {explaining[alert.id] ? 'Analyzing with AI…' : 'Explain with AI'}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">AI Analysis</span>
                        <span className={`ml-auto text-xs font-bold ${RISK_STYLE[exp.riskLevel] ?? 'text-slate-600'}`}>
                          {exp.riskLevel} RISK
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Explanation:</span> {exp.explanation}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Recommendation:</span> {exp.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

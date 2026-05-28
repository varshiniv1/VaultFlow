'use client'

import { useEffect, useState } from 'react'
import { getFraudAlerts, explainFraudAlert, dismissFraudAlert, reviewFraudAlert } from '@/lib/api'
import type { FraudAlert, FraudExplanation } from '@/types'
import { AlertTriangle, Brain, CheckCircle, XCircle, Loader2, ShieldAlert } from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const STATUS_STYLE: Record<string, string> = {
  OPEN:      'bg-red-100 text-red-700 border-red-200',
  REVIEWED:  'bg-amber-100 text-amber-700 border-amber-200',
  DISMISSED: 'bg-slate-100 text-slate-500 border-slate-200',
}

const RISK_STYLE: Record<string, string> = {
  HIGH:   'text-red-600',
  MEDIUM: 'text-amber-600',
  LOW:    'text-green-600',
}

export default function FraudPage() {
  const [alerts, setAlerts]                           = useState<FraudAlert[]>([])
  const [loading, setLoading]                         = useState(true)
  const [explanations, setExplanations]               = useState<Record<string, FraudExplanation>>({})
  const [explaining, setExplaining]                   = useState<Record<string, boolean>>({})
  const [acting, setActing]                           = useState<Record<string, boolean>>({})

  useEffect(() => {
    getFraudAlerts()
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleExplain(id: string) {
    setExplaining((prev) => ({ ...prev, [id]: true }))
    try {
      const exp = await explainFraudAlert(id)
      setExplanations((prev) => ({ ...prev, [id]: exp }))
    } catch {
      // ignore
    } finally {
      setExplaining((prev) => ({ ...prev, [id]: false }))
    }
  }

  async function handleAction(id: string, action: 'dismiss' | 'review') {
    setActing((prev) => ({ ...prev, [id]: true }))
    try {
      const updated = action === 'dismiss' ? await dismissFraudAlert(id) : await reviewFraudAlert(id)
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)))
    } catch {
      // ignore
    } finally {
      setActing((prev) => ({ ...prev, [id]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const open     = alerts.filter((a) => a.status === 'OPEN')
  const reviewed = alerts.filter((a) => a.status === 'REVIEWED')
  const dismissed = alerts.filter((a) => a.status === 'DISMISSED')
  const grouped = [...open, ...reviewed, ...dismissed]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900">Fraud Alerts</h1>
        {open.length > 0 && (
          <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">{open.length}</span>
        )}
      </div>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 py-16 text-slate-400">
          <ShieldAlert className="h-10 w-10" />
          <p className="text-sm">No fraud alerts detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((alert) => {
            const exp = explanations[alert.id]
            return (
              <div key={alert.id} className={`rounded-xl border bg-white shadow-sm overflow-hidden ${alert.status === 'OPEN' ? 'border-red-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between p-5">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-lg p-2 ${alert.status === 'OPEN' ? 'bg-red-50' : 'bg-slate-50'}`}>
                      <AlertTriangle className={`h-4 w-4 ${alert.status === 'OPEN' ? 'text-red-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[alert.status]}`}>
                          {alert.status}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{alert.reason}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Amount: <span className="font-semibold text-slate-700">{fmt(alert.amount)}</span>
                        &nbsp;· Account: <span className="font-mono text-xs">{alert.accountId.slice(0, 8)}…</span>
                      </p>
                    </div>
                  </div>

                  {alert.status === 'OPEN' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(alert.id, 'review')}
                        disabled={acting[alert.id]}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-200 disabled:opacity-60"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Review
                      </button>
                      <button
                        onClick={() => handleAction(alert.id, 'dismiss')}
                        disabled={acting[alert.id]}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Dismiss
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Explain */}
                <div className="border-t border-slate-100 px-5 py-3">
                  {!exp ? (
                    <button
                      onClick={() => handleExplain(alert.id)}
                      disabled={explaining[alert.id]}
                      className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-500 disabled:opacity-60"
                    >
                      {explaining[alert.id]
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Brain className="h-3.5 w-3.5" />}
                      {explaining[alert.id] ? 'Analyzing with AI…' : 'Explain with AI'}
                    </button>
                  ) : (
                    <div className="rounded-lg bg-blue-50 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">AI Analysis</span>
                        <span className={`ml-auto text-xs font-bold ${RISK_STYLE[exp.riskLevel] ?? 'text-slate-600'}`}>
                          {exp.riskLevel} RISK
                        </span>
                      </div>
                      <p className="text-xs text-slate-700"><span className="font-medium">Explanation:</span> {exp.explanation}</p>
                      <p className="text-xs text-slate-700"><span className="font-medium">Recommendation:</span> {exp.recommendation}</p>
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

import type { Account, AuthResponse, FraudAlert, FraudExplanation, Notification, Transaction } from '@/types'

// ── Token store (module-level, memory-only for security) ─────────────────────
let accessToken: string | null = null
let tokenExpiresAt: number | null = null  // Unix ms
let storedRefreshToken: string | null = null

export const tokenStore = {
  set(token: string, expiresInSeconds: number, refreshTok: string) {
    accessToken = token
    tokenExpiresAt = Date.now() + expiresInSeconds * 1000
    storedRefreshToken = refreshTok
    if (typeof window !== 'undefined') {
      localStorage.setItem('vf_refresh', refreshTok)
    }
  },
  clear() {
    accessToken = null
    tokenExpiresAt = null
    storedRefreshToken = null
    if (typeof window !== 'undefined') localStorage.removeItem('vf_refresh')
  },
  getRefresh: () =>
    storedRefreshToken ??
    (typeof window !== 'undefined' ? localStorage.getItem('vf_refresh') : null),
  isExpiringSoon: () =>
    tokenExpiresAt !== null && Date.now() > tokenExpiresAt - 60_000,
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
let refreshing: Promise<void> | null = null

async function doRefresh(): Promise<void> {
  const rt = tokenStore.getRefresh()
  if (!rt) throw new Error('No refresh token')
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  })
  if (!res.ok) {
    tokenStore.clear()
    throw new Error('Refresh failed')
  }
  const data: AuthResponse = await res.json()
  tokenStore.set(data.token, data.expiresIn, data.refreshToken)
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Proactive refresh
  if (accessToken && tokenStore.isExpiringSoon()) {
    if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null })
    await refreshing
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  let res = await fetch(path, { ...init, headers })

  // Reactive refresh on 401
  if (res.status === 401 && !path.includes('/api/auth/')) {
    try {
      if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null })
      await refreshing
      headers['Authorization'] = `Bearer ${accessToken}`
      res = await fetch(path, { ...init, headers })
    } catch {
      if (typeof window !== 'undefined') window.location.href = '/login'
      throw new Error('Session expired')
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = Object.assign(new Error(body?.message ?? 'API error'), { status: res.status, ...body })
    throw err
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body?.message ?? 'Login failed'), { status: res.status, ...body })
  }
  const data: AuthResponse = await res.json()
  tokenStore.set(data.token, data.expiresIn, data.refreshToken)
  return data
}

export async function restoreSession(): Promise<string | null> {
  try {
    await doRefresh()
    return accessToken
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  const rt = tokenStore.getRefresh()
  if (rt) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    }).catch(() => {})
  }
  tokenStore.clear()
}

// ── Accounts ──────────────────────────────────────────────────────────────────
export const getAccounts = () => apiFetch<Account[]>('/api/accounts')
export const getAccount  = (id: string) => apiFetch<Account>(`/api/accounts/${id}`)
export const createAccount = (body: { ownerName: string; accountType: string; currency: string }) =>
  apiFetch<Account>('/api/accounts', { method: 'POST', body: JSON.stringify(body) })
export const deposit  = (id: string, amount: number, description?: string) =>
  apiFetch<Account>(`/api/accounts/${id}/deposit`, { method: 'POST', body: JSON.stringify({ amount, description }) })
export const withdraw = (id: string, amount: number, description?: string) =>
  apiFetch<Account>(`/api/accounts/${id}/withdraw`, { method: 'POST', body: JSON.stringify({ amount, description }) })
export const transfer = (id: string, targetAccountId: string, amount: number, description?: string, idempotencyKey?: string) => {
  const extraHeaders = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
  return apiFetch<Account>(`/api/accounts/${id}/transfer`, {
    method: 'POST',
    headers: extraHeaders,
    body: JSON.stringify({ targetAccountId, amount, description }),
  })
}
export const freezeAccount   = (id: string) => apiFetch<Account>(`/api/accounts/${id}/freeze`,   { method: 'PATCH' })
export const unfreezeAccount = (id: string) => apiFetch<Account>(`/api/accounts/${id}/unfreeze`, { method: 'PATCH' })
export const closeAccount    = (id: string) => apiFetch<Account>(`/api/accounts/${id}/close`,    { method: 'PATCH' })

// ── Transactions ──────────────────────────────────────────────────────────────
export const getTransactionsByAccount = (accountId: string) =>
  apiFetch<Transaction[]>(`/api/transactions/account/${accountId}`)

// ── Fraud ─────────────────────────────────────────────────────────────────────
export const getFraudAlerts          = ()        => apiFetch<FraudAlert[]>('/api/fraud/alerts')
export const getFraudByAccount       = (id: string) => apiFetch<FraudAlert[]>(`/api/fraud/alerts/account/${id}`)
export const explainFraudAlert       = (id: string) => apiFetch<FraudExplanation>(`/api/fraud/alerts/${id}/explain`, { method: 'POST' })
export const dismissFraudAlert       = (id: string) => apiFetch<FraudAlert>(`/api/fraud/alerts/${id}/dismiss`, { method: 'PATCH' })
export const reviewFraudAlert        = (id: string) => apiFetch<FraudAlert>(`/api/fraud/alerts/${id}/review`,  { method: 'PATCH' })

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (accountId: string) =>
  apiFetch<Notification[]>(`/api/notifications/account/${accountId}`)

// ── AI ────────────────────────────────────────────────────────────────────────
export const chatWithAI = (message: string) =>
  apiFetch<{ reply: string }>('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message }) })

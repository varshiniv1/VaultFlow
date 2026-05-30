import type { Account, AuthResponse, FraudAlert, FraudExplanation, Notification, Transaction } from '@/types'

// ── Token store (module-level, memory-only for security) ─────────────────────
let accessToken: string | null = null
let tokenExpiresAt: number | null = null  // Unix ms
let storedRefreshToken: string | null = null

export const tokenStore = {
  set(token: string, expiresInSeconds: number, refreshTok: string) {
    sessionExpiredFired = false          // reset on every successful auth
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

// ── Session expiry — fire once, let auth-context handle the redirect ──────────
let sessionExpiredFired = false

function signalSessionExpired() {
  if (sessionExpiredFired) return
  sessionExpiredFired = true
  tokenStore.clear()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vf:session-expired'))
  }
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
  const isPublic = ['/api/auth/login', '/api/auth/refresh', '/api/auth/register'].includes(path)

  // For protected endpoints: make sure we have a usable access token BEFORE firing
  // the request. This avoids a doomed GET → 401 → refresh → 401 cascade that floods
  // the console when the session is dead (e.g. backend restarted, tokens wiped).
  if (!isPublic && (!accessToken || tokenStore.isExpiringSoon())) {
    if (!tokenStore.getRefresh()) {
      // No way to authenticate — bail once, no network request.
      signalSessionExpired()
      throw new Error('Session expired')
    }
    try {
      if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null })
      await refreshing
    } catch {
      signalSessionExpired()
      throw new Error('Session expired')
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  let res = await fetch(path, { ...init, headers })

  // Reactive refresh on 401 (token became invalid mid-flight)
  if (res.status === 401 && !isPublic) {
    try {
      if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null })
      await refreshing
      headers['Authorization'] = `Bearer ${accessToken}`
      res = await fetch(path, { ...init, headers })
    } catch {
      // Refresh failed — signal the app once; auth-context will redirect to /login
      signalSessionExpired()
      throw new Error('Session expired')
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    // Spring Boot 3 hides `message` by default — also check `detail` (RFC 7807) and `error`
    const message = body?.message || body?.detail || body?.error || `Error ${res.status}`
    const err = Object.assign(new Error(message), { status: res.status, ...body })
    throw err
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function register(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body?.error ?? 'Registration failed'), { status: res.status, ...body })
  }
  const data: AuthResponse = await res.json()
  tokenStore.set(data.token, data.expiresIn, data.refreshToken)
  return data
}

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
  // No stored refresh token → not logged in. Don't fire a doomed request.
  if (!tokenStore.getRefresh()) return null
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
export const deposit  = (id: string, amount: number, description?: string, category?: string) =>
  apiFetch<Account>(`/api/accounts/${id}/deposit`, { method: 'POST', body: JSON.stringify({ amount, description, category }) })
export const withdraw = (id: string, amount: number, description?: string, category?: string) =>
  apiFetch<Account>(`/api/accounts/${id}/withdraw`, { method: 'POST', body: JSON.stringify({ amount, description, category }) })
export const transfer = (id: string, targetAccountId: string, amount: number, description?: string, idempotencyKey?: string, category?: string) => {
  const extraHeaders: Record<string, string> = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
  return apiFetch<Account>(`/api/accounts/${id}/transfer`, {
    method: 'POST',
    headers: extraHeaders,
    body: JSON.stringify({ targetAccountId, amount, description, category }),
  })
}
export const freezeAccount   = (id: string) => apiFetch<Account>(`/api/accounts/${id}/freeze`,   { method: 'PATCH' })
export const unfreezeAccount = (id: string) => apiFetch<Account>(`/api/accounts/${id}/unfreeze`, { method: 'PATCH' })
export const closeAccount    = (id: string) => apiFetch<Account>(`/api/accounts/${id}/close`,    { method: 'PATCH' })
/** Admin-only: permanently delete a bank account. */
export const deleteAccount   = (id: string) => apiFetch<void>(`/api/accounts/${id}`, { method: 'DELETE' })

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
export const chatWithAI = (
  message: string,
  history: { role: string; content: string }[] = [],
) =>
  apiFetch<{ reply: string }>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  })

// ── User settings ─────────────────────────────────────────────────────────────
export const changePassword = (currentPassword: string, newPassword: string) =>
  apiFetch<void>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })

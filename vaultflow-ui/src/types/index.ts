export interface Account {
  id: string
  accountNumber: string
  ownerName: string
  accountType: 'SAVINGS' | 'CHECKING'
  balance: number
  currency: string
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED'
  createdAt: string
}

export interface Transaction {
  id: string
  sourceAccountId: string
  targetAccountId?: string
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
  amount: number
  currency: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  description?: string
  category?: string
  createdAt: string
}

export interface FraudAlert {
  id: string
  transactionId: string
  accountId: string
  amount: number
  reason: string
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED'
  createdAt: string
}

export interface FraudExplanation {
  explanation: string
  riskLevel: string
  recommendation: string
}

export interface Notification {
  id: string
  accountId: string
  transactionId: string
  type: 'TRANSACTION_COMPLETED' | 'HIGH_VALUE_TRANSACTION' | 'TRANSFER_SENT' | 'TRANSFER_RECEIVED'
  message: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  createdAt: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  type: string
  email: string
  expiresIn: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

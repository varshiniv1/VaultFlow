# VaultFlow 🏦

A production-grade banking platform built with a **Spring Boot 4 microservices backend** and a **Next.js 14 frontend**. VaultFlow demonstrates real-world distributed-systems patterns — event-driven fraud detection, JWT authentication with refresh tokens, AI-powered transaction categorization, resilience patterns, and a full observability stack.

**🔗 Live demo → [vaultflow-ui.vercel.app](https://vaultflow-ui.vercel.app)**

---

## Architecture

```
                        ┌─────────────────────────────────────────┐
                        │           Next.js 14 UI  :3001           │
                        └───────────────────┬─────────────────────┘
                                            │ HTTP
                        ┌───────────────────▼─────────────────────┐
                        │         API Gateway  :8080               │
                        │   JWT auth · rate-limit · routing        │
                        └──┬──────────┬──────────┬──────────┬─────┘
                           │          │          │          │
              ┌────────────▼──┐  ┌────▼─────┐ ┌─▼────────┐ ┌▼──────────────┐
              │  Accounts :8081│  │Txns :8082│ │Fraud:8084│ │Notifs  :8083  │
              │  PostgreSQL    │  │Postgres  │ │Postgres  │ │Postgres        │
              └───────────────┘  └────┬─────┘ └────▲─────┘ └───────▲───────┘
                                      │  Kafka      │               │
                                      └─────────────┴───────────────┘
```

### Services

| Service | Port | Responsibility |
|---|---|---|
| **vaultflow-gateway** | 8080 | JWT auth, request routing, rate-limiting |
| **vaultflow-accounts** | 8081 | Account CRUD, deposit/withdraw/transfer |
| **vaultflow-transactions** | 8082 | Transaction records, Kafka producer, AI categorization |
| **vaultflow-fraud** | 8084 | Kafka consumer, fraud rule engine, AI explanation |
| **vaultflow-notifications** | 8083 | Kafka consumer, notification delivery |
| **vaultflow-ui** | 3001 | Next.js 14 dashboard |

---

## Features

### Banking
- Multi-account support (Savings & Checking, multiple currencies)
- Deposit, withdraw, and transfer with **idempotency-key** deduplication
- Real-time balance updates after every transaction
- Full transaction history with date grouping (Today / Yesterday / This Week…)

### Spend Analysis
- **10 bank-standard categories** — Rent/Housing, Groceries, Food & Dining, Utilities, Transport, Income, Healthcare, Entertainment, Shopping, Travel — plus free-text Other
- User picks a category per transaction; AI auto-tags if left blank
- Color-coded category badges on every transaction row

### Security
- JWT access tokens (15 min) + refresh tokens (7 days) with silent renewal
- Account lockout after repeated failed login attempts
- Token revocation on logout
- Secrets managed via environment variables — never committed

### Fraud Detection
- Every transaction published to Kafka; fraud service consumes and scores it
- One-click **AI explanation** of any alert (Groq · llama-3.3-70b)
- Alert lifecycle: Open → Reviewed / Dismissed

### Notifications
- Kafka-driven in-app notifications for completed transactions and high-value transfers
- Per-account notification feed in the UI with unread badge

### Resilience
- **Resilience4j** circuit breaker, retry (3 attempts, 500ms back-off), and timelimiter on all inter-service HTTP calls
- Graceful fallback — account balance always updated even if transaction service is temporarily unavailable

### AI Assistant
- In-app chat powered by Groq (llama-3.3-70b)
- Answers questions about accounts, transactions, and fraud alerts

### UI
- Responsive Next.js 14 dashboard with light / dark mode
- BofA-inspired design (#012169 navy + #E31837 red)
- Gradient bank-card account display
- Date-grouped transaction history with category badges
- Live fraud-alert badge on sidebar navigation
- Session-aware with auto token refresh and expiry redirect

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 23, Spring Boot 4, Spring Security, Spring Data JPA, Flyway |
| **Messaging** | Apache Kafka (RedPanda Cloud) |
| **Database** | PostgreSQL (Neon — serverless) |
| **Resilience** | Resilience4j (circuit breaker, retry, timelimiter) |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide |
| **AI** | Groq API — llama-3.3-70b |
| **Tracing** | Zipkin |
| **Metrics** | Prometheus, Grafana |
| **Logging** | Loki, Promtail |
| **Containers** | Docker, Docker Compose |

---

## Deployment (Free — $0/month)

| Layer | Platform | Cost |
|-------|----------|------|
| Next.js frontend | [Vercel](https://vercel.com) | Free forever |
| 5 Spring Boot services | [Render](https://render.com) | Free forever |
| PostgreSQL (×4) | [Neon](https://neon.tech) | Free forever |
| Kafka | [RedPanda Cloud](https://redpanda.com) | Free forever |

See **[DEPLOY.md](DEPLOY.md)** for the complete step-by-step deployment guide.

---

## Getting Started (Local)

### Prerequisites
- **Docker Desktop** (running)
- **Java 23** and **Maven**
- **Node.js 20+** and **npm**

### 1 — Clone and configure

```bash
git clone https://github.com/varshiniv1/VaultFlow.git
cd VaultFlow
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DB_PASSWORD=postgres
GROQ_API_KEY=your_key_here          # https://console.groq.com/keys
JWT_SECRET=your_base64_secret_here  # openssl rand -base64 48
```

### 2 — Start infrastructure

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Starts: 4 PostgreSQL databases · Kafka · Zipkin

### 3 — Start all backend services

**Windows:**
```bat
start-backend.bat
```

**Mac / Linux:**
```bash
./start-backend.sh
```

Wait ~30 seconds for all 5 services to finish starting.

### 4 — Start the frontend

```bash
cd vaultflow-ui
npm install
npm run dev
```

### 5 — Open the app

| URL | Service |
|---|---|
| http://localhost:3001 | VaultFlow UI |
| http://localhost:8080 | API Gateway |
| http://localhost:9411 | Zipkin (tracing) |

Default accounts:

| Email | Password | Role |
|-------|----------|------|
| `admin@vaultflow.com` | `admin123` | Admin |
| `user@vaultflow.com` | `user123` | User |

---

## Full Docker Stack

Builds and starts all services + the full observability stack:

```bash
docker-compose up --build
```

| URL | Service |
|---|---|
| http://localhost:9090 | Prometheus |
| http://localhost:3000 | Grafana (admin / admin) |
| http://localhost:3100 | Loki |

---

## API Overview

All routes go through the API Gateway at `http://localhost:8080`.

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login — returns JWT + refresh token |
| `POST` | `/api/auth/refresh` | Exchange refresh token for new access token |
| `POST` | `/api/auth/logout` | Revoke refresh token |
| `POST` | `/api/auth/change-password` | Change password (authenticated) |

### Accounts
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/accounts` | List accounts for current user |
| `POST` | `/api/accounts` | Create a new account |
| `POST` | `/api/accounts/{id}/deposit` | Deposit funds |
| `POST` | `/api/accounts/{id}/withdraw` | Withdraw funds |
| `POST` | `/api/accounts/{id}/transfer` | Transfer to another account |
| `PATCH` | `/api/accounts/{id}/freeze` | Freeze account (admin) |
| `DELETE` | `/api/accounts/{id}` | Delete account (admin) |

### Transactions
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/transactions/account/{id}` | Transaction history for an account |

### Fraud
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/fraud/alerts` | Get all fraud alerts |
| `POST` | `/api/fraud/alerts/{id}/explain` | AI explanation of an alert |
| `PATCH` | `/api/fraud/alerts/{id}/review` | Mark alert as reviewed |
| `PATCH` | `/api/fraud/alerts/{id}/dismiss` | Dismiss an alert |

### Notifications
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications/account/{id}` | Notifications for an account |

### AI Chat
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | Chat with the AI financial assistant |

---

## Project Structure

```
VaultFlow/
├── vaultflow-gateway/          # API Gateway — auth, routing
├── vaultflow-accounts/         # Account management service
├── vaultflow-transactions/     # Transaction service + Kafka producer
├── vaultflow-fraud/            # Fraud detection + Kafka consumer
├── vaultflow-notifications/    # Notifications + Kafka consumer
├── vaultflow-ui/               # Next.js 14 frontend
│   └── src/
│       ├── app/                # App Router pages
│       ├── components/         # Sidebar, Topbar
│       └── lib/                # API client, auth context
├── render.yaml                 # Render Blueprint (all 5 services)
├── docker-compose.yml          # Full stack containerized
├── docker-compose.dev.yml      # Dev mode (infra only)
├── DEPLOY.md                   # Free deployment guide
└── start-backend.bat/.sh       # Launch all Spring Boot services locally
```

---

## License

MIT

# VaultFlow — Free Deployment Guide

## What we're using and why

| Platform | Runs | Free? | Card needed? |
|----------|------|-------|-------------|
| **Render** | 5 Spring Boot services | Yes — no expiry | **No** |
| **Neon** | 4 PostgreSQL databases | Yes — no expiry | No |
| **Upstash Kafka** | Message streaming | Yes — 10k msgs/day | No |
| **Vercel** | Next.js frontend | Yes — no expiry | No |

> ⚠️ **Why not Fly.io?** Fly.io requires a credit card even for the free tier. Render does not.

> ⚠️ **Upstash Redis vs Kafka** — Redis and Kafka are different products. VaultFlow uses
> **Kafka** for transaction events between services. If you already created a Redis instance
> on Upstash, ignore it — you need to create a separate **Kafka** cluster.

---

## Status check — what you need from Neon

For each of your 5 Neon projects, copy the connection string and split it into:

```
SPRING_DATASOURCE_URL      = jdbc:postgresql://<your-neon-host>/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME = <your-neon-username>
SPRING_DATASOURCE_PASSWORD = <your-neon-password>
```

---

## Phase 2 — Create an Upstash Kafka cluster (not Redis!)

1. Go to **https://upstash.com** → log in
2. In the left sidebar click **Kafka** (not Redis)
3. Click **Create Cluster** → name it `vaultflow`, region **US-East-1**, click **Create**
4. Once created, click on the cluster → go to the **Details** tab → copy:
   - **Bootstrap Server** (e.g. `grizzly-us1-kafka.upstash.io:9092`)
   - **Username** (e.g. `grizzly-us1-vaultflow`)
   - **Password** (long string)

You'll need these three values for the transactions, notifications, and fraud services.

---

## Phase 3 — Generate a JWT secret

Run this command once and save the output:

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

**Mac/Linux:**
```bash
openssl rand -base64 48
```

---

## Phase 4 — Deploy to Render

### 4a — Push the repo to GitHub first

If you haven't already:
```bash
git remote add origin https://github.com/<your-username>/VaultFlow.git
git push -u origin main
```

### 4b — Connect repo to Render

1. Go to **https://render.com** → Sign up with GitHub (no card needed)
2. Click **New** → **Blueprint**
3. Select your VaultFlow GitHub repo
4. Render detects `render.yaml` and shows all 5 services — click **Apply**
5. Render creates all 5 services but they'll be **waiting for secrets**

### 4c — Add secrets to each service

Go to each service in the Render dashboard → **Environment** tab → add the variables below.

---

#### vaultflow-transactions

| Key | Value |
|-----|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<your-neon-transactions-host>/neondb?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `<your-neon-username>` |
| `SPRING_DATASOURCE_PASSWORD` | `<your-neon-password>` |
| `SPRING_KAFKA_BOOTSTRAPSERVERS` | `<your-upstash-bootstrap-server>` |
| `SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL` | `SASL_SSL` |
| `SPRING_KAFKA_PROPERTIES_SASL_MECHANISM` | `SCRAM-SHA-256` |
| `SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG` | `org.apache.kafka.common.security.scram.ScramLoginModule required username="<upstash-user>" password="<upstash-pass>";` |
| `GROQ_API_KEY` | `<your-groq-key>` |

---

#### vaultflow-accounts

| Key | Value |
|-----|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<your-neon-accounts-host>/neondb?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `<your-neon-username>` |
| `SPRING_DATASOURCE_PASSWORD` | `<your-neon-password>` |

---

#### vaultflow-notifications

| Key | Value |
|-----|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<your-neon-notifications-host>/neondb?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `<your-neon-username>` |
| `SPRING_DATASOURCE_PASSWORD` | `<your-neon-password>` |
| `SPRING_KAFKA_BOOTSTRAPSERVERS` | `<your-upstash-bootstrap-server>` |
| `SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL` | `SASL_SSL` |
| `SPRING_KAFKA_PROPERTIES_SASL_MECHANISM` | `SCRAM-SHA-256` |
| `SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG` | `org.apache.kafka.common.security.scram.ScramLoginModule required username="<upstash-user>" password="<upstash-pass>";` |

---

#### vaultflow-fraud

| Key | Value |
|-----|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<your-neon-fraud-host>/neondb?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `<your-neon-username>` |
| `SPRING_DATASOURCE_PASSWORD` | `<your-neon-password>` |
| `SPRING_KAFKA_BOOTSTRAPSERVERS` | `<your-upstash-bootstrap-server>` |
| `SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL` | `SASL_SSL` |
| `SPRING_KAFKA_PROPERTIES_SASL_MECHANISM` | `SCRAM-SHA-256` |
| `SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG` | `org.apache.kafka.common.security.scram.ScramLoginModule required username="<upstash-user>" password="<upstash-pass>";` |
| `GROQ_API_KEY` | `<your-groq-key>` |

---

#### vaultflow-gateway (set this last)

| Key | Value |
|-----|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<your-neon-gateway-host>/neondb?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `<your-neon-username>` |
| `SPRING_DATASOURCE_PASSWORD` | `<your-neon-password>` |
| `JWT_SECRET` | `<the base64 string you generated in Phase 3>` |
| `GROQ_API_KEY` | `<your-groq-key>` |

After saving secrets, Render automatically triggers a deploy for each service.

### 4d — Wait for all services to go green

In the Render dashboard, each service shows a status dot:
- 🟡 Building (Docker build happening — takes 5-10 min first time)
- 🟢 Live
- 🔴 Failed → click the service → Logs tab to see the error

**Wait for all 5 services to go 🟢 before moving to Phase 5.**

The gateway URL will be: `https://vaultflow-gateway.onrender.com`

Test it:
```
https://vaultflow-gateway.onrender.com/actuator/health
```
Should return: `{"status":"UP"}`

---

## Phase 5 — Deploy the frontend to Vercel

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **Add New Project** → import your VaultFlow repo
3. In configuration:
   - **Root Directory**: `vaultflow-ui`
   - **Framework Preset**: Next.js (auto-detected)
4. Under **Environment Variables** add:
   ```
   GATEWAY_URL = https://vaultflow-gateway.onrender.com
   ```
5. Click **Deploy**

Your live URL will be something like: `https://vaultflow-ui.vercel.app`

---

## Cold start warning

Render's free tier sleeps services after 15 minutes of inactivity.
The first request after sleep takes **~30-50 seconds** to wake up.
This is normal for free hosting — subsequent requests are instant.

---

## If a deployment fails

Open the service in Render dashboard → **Logs** tab. Common causes:

| Error in logs | Fix |
|---|---|
| `Connection to ... refused` | DB URL is wrong — check `SPRING_DATASOURCE_URL` has `?sslmode=require` at the end |
| `Authentication failed` | DB password is wrong |
| `SASL authentication failed` | Kafka JAAS config — make sure it ends with a semicolon `;` |
| `Web process failed to bind to $PORT` | Should be fixed by the `${PORT:xxxx}` change — redeploy |
| Build step fails / file not found | Docker build context issue — make sure `dockerContext: .` is set in render.yaml |

# iq-money

Telegram Mini App skeleton. Access gated to a fixed allowlist of Telegram users
(`ALLOWED_TG_IDS`). No domain functionality yet — clean base cloned from the
`transcribe` infra (Next 16 / React 19 / Tailwind 4 / Prisma).

## Stack
- Next 16 (App Router), React 19, Tailwind 4
- Prisma + Postgres (empty schema for now)
- Telegram WebApp auth (`lib/auth.ts` — initData HMAC + allowlist)

## Local dev
```
createdb money
cp .env.example .env   # (or edit .env)
npm install
npm run dev            # PORT=8203
```

## Deploy
Push to `release` → GitHub Action `deploy.yml` builds, scp's to
`/home/deploy/apps/money` on prod, runs migrations, pm2 restarts `money` on
:8203. Served at https://money.iq-factura.com (nginx + certbot).

### Required GitHub secrets
`SERVER_IP`, `SSH_KEY`, `DATABASE_URL`, `BOT_TOKEN`, `ALLOWED_TG_IDS`

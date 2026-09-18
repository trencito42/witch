# Witch

Website monitoring beyond uptime. Witch loads public sites in Chromium, compares them to a baseline, and opens incidents when something meaningful changes.

## Architecture

- **Web** — Next.js App Router on port `3003`
- **Worker** — claims jobs from MySQL (`HTTP_CHECK`, `BROWSER_CHECK`, `AI_ANALYSIS`, `EMAIL_ALERT`, `MONTHLY_REPORT`, `SCREENSHOT_CLEANUP`)
- **Scheduler** — enqueues due monitors with jitter
- **MySQL / MariaDB** — source of truth, including the job queue
- **Playwright Chromium** — isolated browser contexts per check
- **Local storage adapter** — screenshots on disk, served through authenticated `/api/media/...` routes

Domain logic lives under `src/features`, `src/monitoring`, `src/server`. UI stays in `src/app`.

## Requirements

- Node.js 20+
- MySQL 8 or MariaDB 11
- Chromium dependencies for Playwright

## Installation

```bash
cp .env.example .env
npm install
npx playwright install chromium
```

Create a database and user, then set `DATABASE_URL`.

```sql
CREATE DATABASE witch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'witch'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL ON witch.* TO 'witch'@'localhost';
FLUSH PRIVILEGES;
```

## Environment variables

See `.env.example`. Required for a running app:

- `DATABASE_URL`
- `AUTH_SECRET` (32+ random bytes)
- `APP_URL` / `NEXT_PUBLIC_APP_URL`

Optional:

- SMTP or `RESEND_API_KEY` for email
- `AI_API_KEY` for incident analysis
- Stripe keys and price IDs for paid plans

If those credentials are missing, the related feature is disabled rather than mocked.

## Database

```bash
npm run db:migrate
npm run db:generate   # after schema edits
npm run db:seed       # opt-in, refused in production
```

## Development

```bash
npm run dev           # web on :3003
npm run worker
npm run scheduler
npm run fixture       # controlled failure pages on :3456
```

Or run worker + scheduler together:

```bash
npm run worker:all
```

Promote an operator (sets `user.is_admin`, used only for `/admin/diagnostics`):

```bash
npm run promote-admin -- you@example.com
```

## Playwright

```bash
npx playwright install chromium
```

In Docker, the image already installs Chromium and OS libraries.

## Production

```bash
npm run build
npm run start         # 127.0.0.1:3003
npm run worker
npm run scheduler
```

Point nginx or Caddy at `127.0.0.1:3003`. Examples:

- `deploy/Caddyfile`
- `deploy/systemd/*.service`
- `docker-compose.yml` (app, worker, scheduler; MySQL via `local-db` profile)

Do not bind the worker or scheduler to port 3003.

## Stripe

1. Create Products/Prices for Freelancer, Agency, Agency Pro
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Set `STRIPE_PRICE_FREELANCER`, `STRIPE_PRICE_AGENCY`, `STRIPE_PRICE_AGENCY_PRO`
4. Webhook URL: `https://witch.pw/api/stripe/webhook`  
   Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`

Checkout Sessions use `mode: subscription`. The Customer Portal handles cancel/upgrade. Plan state is taken from verified webhooks only.

If you charge in the US or EU, enable Stripe Tax and complete registrations before turning on automatic tax. Witch does not enable `automatic_tax` until that is configured in Stripe.

## Email

Set either Resend (`RESEND_API_KEY`) or SMTP. From address: `EMAIL_FROM`.

Templates: welcome, verify, password reset, invitation, incident, recovery, monthly report.

## AI

`AI_PROVIDER` + `AI_API_KEY` + `AI_MODEL`. Compatible with the OpenAI Chat Completions API (including compatible `AI_BASE_URL`). Analysis runs only after a deterministic incident is opened.

## Storage

`STORAGE_DRIVER=local` and `STORAGE_PATH=./storage`. Keys are org/site/year/month. Retention is plan-based and enforced by `SCREENSHOT_CLEANUP`.

## Testing

```bash
npm run test
npm run test:e2e
npm run lint
npm run typecheck
```

The fixture server (`npm run fixture`) exposes:

`http://127.0.0.1:3456/?state=healthy|broken-layout|missing-button|broken-image|javascript-error|http-500|slow`

## Troubleshooting

- **Health:** `GET /api/health` returns `{ "status": "ok" }` when MySQL answers
- **Worker idle:** confirm `npm run scheduler` and `npm run worker` are both running
- **No screenshots:** install Chromium; check worker logs; Free plan has no browser monitoring
- **SSRF rejected:** only public HTTP(S) hosts are allowed
- **Emails missing:** SMTP/Resend unset — auth still works, mail is skipped
- **Stripe checkout errors:** keys or price IDs unset

## Security notes

Tenant isolation is enforced on every query via `organization_id`. Screenshots are not public files. Monitoring never uses dashboard cookies. Redirects are re-validated. There is no public HTTP API in this release.

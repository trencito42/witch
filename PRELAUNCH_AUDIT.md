# Witch pre-launch audit

**Audited tree:** uncommitted launch-blocker pass on top of `61760d8b6a4d36390c6c4d3c66cdfad4e104e94f` (`61760d8`).

This is a production release-candidate review of the **current working tree**. No commit was created in this pass.

## Changes made in this pass

- **Mobile chrome:** authenticated header/nav use `background: var(--bg)` (`#070709`) with low-opacity borders and no blur.
- **Tablet:** shell breakpoint is `lg` (1024px). 768px keeps bottom nav.
- **Entitlements:** `getEffectivePlan` / `getEffectivePlanFromSubscription` is the status-aware helper. Runner, scheduler, worker retention, reports, alerts, invites, tenancy, and `applyPlanLimits` use the subscription row (not raw `planId`). Onboarding does not bypass browser gating. AI enqueue requires Freelancer+.
- **Marketing:** Agency Pro does not mention API keys. Landing plan bullets match limits. Reports are “print or save as PDF from your browser.”
- **Account delete:** Stripe cancel → DB transaction → storage cleanup with logged retries.
- **Site stats:** last check is `ROW_NUMBER() OVER (PARTITION BY site_id …) rn = 1`.
- **Status page:** slug via `slugSchema`, headline max 160, unique slug error, PAUSED/UNKNOWN not Operational, freshness is “Last checked … ago”, 90-day history excludes IGNORED.
- **Stale monitoring:** overdue checks show “Check delayed” / “Monitoring looks delayed” instead of quiet-healthy.
- **Dialog/Sheet:** portal to `document.body`, `aria-modal`, labelled-by title, inert background, nested scroll lock.
- **Browser worker:** `page.evaluate(extractDomSignals)` broke under `tsx` (`__name is not defined`). DOM extraction now runs from a string IIFE.
- **E2E:** real signup→Agency Pro→fixture site→HTTP+browser→incident→recovery pipeline (`scripts/e2e-pipeline.ts`). Real Org B 403 on Org A snapshot (`scripts/e2e-tenancy.ts`).

## Commands actually executed

| Command | Result |
| --- | --- |
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass** |
| `npm test` | **pass** — 16 files, **67** tests |
| `FIXTURE_ENABLED=true npx tsx --require ./worker/register-server-only.cjs scripts/e2e-pipeline.ts` | **pass** — snapshots=2, incident opened, `visualDiffId` set, resolved |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3003 npx tsx --require ./worker/register-server-only.cjs scripts/e2e-tenancy.ts` | **pass** — anon 401, Org B authenticated **403** |
| `npx tsx scripts/verify-migrations.ts` | **skipped** — MySQL user `witch` cannot `CREATE DATABASE` |
| `npm run build` | **pass** (Next.js 15.5.4) |
| `npx playwright test` (local) | **partial** — request/fixture tests pass; Chromium page tests fail here (`libatk-1.0.so.0` missing). CI installs `--with-deps`. |
| `npm run migrate` on this database | **already applied**; re-run skips `0000`/`0001`/`0002` via `schema_migrations` |

## Tests skipped and why

- Authenticated Playwright **UI** routes (`/overview` @375 etc.) skip without `E2E_EMAIL` / `E2E_PASSWORD`.
- Local Playwright **page** tests skip/fail without OS Chromium libraries. The pipeline script does not need Playwright Test; it uses the app’s Playwright Chromium for checks.
- Fresh/upgrade migrate databases skipped: no `CREATE DATABASE` privilege.

## Remaining findings

### HIGH

1. **Operator backups** for MySQL and `./storage` are not in compose/systemd.
2. **Stripe is unset** in `.env`. Self-serve checkout stays disabled until keys + prices + webhook exist.
3. **Email/AI providers unset** — alerts/AI jobs no-op when disabled (by design).
4. **Host MySQL cannot run isolated migrate sandboxes** with the app user.

### MEDIUM

- `past_due` keeps paid features (dunning, by design).
- Discord webhook URLs stored plaintext.
- Homemade dialog is improved (portal/inert/focus) but is not Radix.

## Exact blockers remaining before paid launch

1. Stripe live/test prices + webhook + Customer Portal.
2. Backups.
3. Deploy **this working tree** (rebuild `next start` + restart worker so the `tsx` DOM evaluate fix is live).
4. Confirm nginx only proxies `127.0.0.1:3003`.

Until (1)–(3) are done, do not send paying traffic.

## Private beta vs paid public

- **Private beta:** yes, after rebuild/restart of web+worker on this tree.
- **Paid public launch:** not until Stripe, backups, and that deploy are done.

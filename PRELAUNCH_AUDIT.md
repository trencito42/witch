# Witch pre-launch audit

**Audited tree:** uncommitted launch-hardening on top of `e0857f569a421b8bf2b164bc3ace3b8dcaa2d519` (`e0857f5` — `fix(ui): eliminate button contrast hacks with CSS layers, fix tablet grid and verify 66 viewports in visual QA`).

This is a production release-candidate review of the **current working tree**, not a feature pass. No commit was created.

## Changes made in this pass

- **Entitlements:** `unpaid`, `incomplete`, `incomplete_expired`, and `canceled` no longer grant paid `planId` features. `past_due` still keeps the paid plan during Stripe dunning. Tenancy and the scheduler use `entitledPlanId()`.
- **Stripe:** checkout idempotency key per org+plan; portal only for `active`/`trialing`/`past_due`; incomplete can start checkout again; webhook row lock + `lastStripeEventCreated` conditional update; do not null period fields; cancel must succeed if a live Stripe subscription exists; signature failures return 400, processing failures 500.
- **Downgrade:** extra sites are **paused** (not deleted); intervals are clamped; browser/element monitors are **disabled** when the entitled plan has no browser monitoring. Snapshots/history older than the new retention window can still be compacted.
- **Auth/team:** cannot demote an OWNER via `changeRole`; org ID substitution that is not a membership is rejected; ownership transfer remains transactional.
- **Visual evidence:** incident detail loads `metadata.visualDiffId`; accept-baseline requires matching `siteId` + viewport and is transactional; baseline lookup is ordered, not “latest 20 snapshots”; retention skips diffs referenced by OPEN/ACKNOWLEDGED incidents.
- **Jobs/worker:** `FOR UPDATE SKIP LOCKED`; stale lease 30 minutes; failed hourly jobs can be retried; `CONFIRM_CHECK` without `http-confirm` counts toward `BROWSER_CONCURRENCY`; Chromium launch failures clear the cached browser promise.
- **Marketing/UI truth:** Free is HTTP-only; no 99.9% accuracy claim; no “actual production incidents”; no API-key product claim; onboarding copy follows `browserMonitoring`; overview labels match queries; status page no longer says “Verified live” without freshness, filters 90 days, hides target URLs, and does not list IGNORED incidents.
- **API keys:** no public API consumes keys; create is rejected; settings copy says so.
- **Deploy:** compose publishes `127.0.0.1:3003` and `127.0.0.1:3306`; app healthcheck + stop grace; nginx uses `$proxy_add_x_forwarded_for`.
- **Tests/CI:** visualDiffId unit test; fixture + pipeline Playwright (authenticated pipeline skipped without staging creds); CI runs Playwright fixture tests after build.

## Previously reported issues — verification

| Issue | Status |
| --- | --- |
| Landing false promises | **Fixed in copy** (hero, FAQ, pricing, 99.9%, API keys). Product still *describes* Chromium as a paid capability. |
| Delete account + Stripe | **Fixed:** cancel throws if Stripe is unconfigured but a live `stripeSubscriptionId` exists; then DB transaction. |
| Partial delete-account | **Fixed:** org+user delete is one transaction. Storage is still deleted before DB (HIGH leftover). |
| Webhook idempotency race | **Fixed:** unique event insert first; org `FOR UPDATE`; skip/apply with timestamp predicate. |
| Webhook ordering | **Fixed:** skip `event.created < lastStripeEventCreated`. |
| Incident vs visual diff | **Fixed:** `visualDiffId` in classify metadata; incident page queries that id. |
| Overview 30d uptime = first site | **Fixed:** `computeOrgHttpMetrics` workspace-wide; label says workspace HTTP uptime. |
| `--surface-*` missing | **Fixed:** aliases in `globals.css`. Running `next start` on port 3003 may still be an old build until restart. |
| ACK not active in UI | **Fixed:** site/overview stats count OPEN+ACKNOWLEDGED. |
| Sites N+1 | **Fixed:** `loadSiteListStats` batch. Last-check still sampled from 2000 recent rows (MEDIUM). |
| CONFIRM_CHECK vs browser concurrency | **Fixed** for non-HTTP confirms; HTTP confirms do not consume Chromium slots. |
| Report resolved / `incidentCount` | **Fixed:** detected vs resolved windows; UI reads `incidentsDetected`. |
| Baseline UI missing after 20 snapshots | **Fixed:** dedicated baseline/current queries. |
| Desktop UI + mobile latest diff | **Fixed:** desktop-only join for the compare heatmap. |
| Free element monitors | **Fixed:** UI + action + scheduler + plan enforcement. |
| Ownership transfer non-transactional | **Fixed.** |
| Migration history | **Fixed:** `schema_migrations` + bootstrap marks. Not re-tested against a blank MySQL in this pass. |
| Homemade dialog a11y | **Improved:** focus trap + Escape. Not a full Radix replacement. |
| Safe areas | **Fixed:** utilities + `viewport-fit: cover`. |
| Native `confirm()` on Team | **Fixed:** product Dialog. |
| Error/loading/status PAUSED | **Fixed.** |
| Discord secret plaintext | **Unchanged** (MVP). |
| Public GitHub repo | **Unchanged** (operator choice). |

## Remaining findings

### CRITICAL

None remaining in application code that would charge a customer without a working cancel path, leak another tenant’s media to an authenticated outsider, or grant paid Chromium on Free while Stripe is `unpaid`/`canceled`.

### HIGH

1. **Authenticated monitor→incident Playwright flow was not executed.** Fixture HTTP 200 / missing-CTA states are covered. Signup→check→incident→alert→resolve needs `E2E_EMAIL`, `E2E_PASSWORD`, `DATABASE_URL`, worker, and Chromium on staging.
2. **Account delete still removes object storage before the DB commit.** A failed transaction can leave an account without screenshots.
3. **Downgrade retention compaction still deletes old checks/snapshots** (not sites). Operators must tell customers that lowering `historyDays` shortens stored telemetry.
4. **No automated backups** in compose/systemd. MySQL and `./storage` need an operator backup job before paid launch.
5. **Production worker/scheduler still start via `npx tsx`.** Fine for v1 if Node/tsx stay pinned; not a compiled artifact.
6. **Email verification is off when SMTP/Resend is unset.** Signup still works; inboxes are unverified.
7. **Last-check stats sample 2000 recent rows.** A 75-site workspace with dense checks can miss older sites’ last duration (uptime cards still use aggregated HTTP metrics).

### MEDIUM

- Invite accept / site create can still race seat and site caps under concurrent requests.
- User+org bootstrap after signup is not one transaction.
- `past_due` keeps paid features by design (dunning).
- AI/email jobs complete successfully when the provider is disabled (no delivery).
- Chromium down → browser jobs fail → possible uptime incidents after confirm.
- Discord webhook URLs stored plaintext.
- systemd does not set `TimeoutStopSec` / worker drain beyond default.
- nginx snippet has no `ssl_certificate` paths (must be completed on the host).

### LOW

- Print CSS still uses `!important` (print only).
- `trialEndsAt` column unused; no trial product.
- Cookie org fallback still maps a stale cookie to the first membership (explicit switch IDs do not).

## Commands actually executed

| Command | Result |
| --- | --- |
| `npm run typecheck` | **pass** (exit 0) |
| `npm run lint` | **pass** (exit 0; earlier unused-arg warnings on `createApiKey` were then fixed) |
| `npm test` | **pass** — 14 files, **60** tests |
| `PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test e2e/fixtures.spec.ts e2e/pipeline.spec.ts` | **pass** — 5 passed, 1 skipped (authenticated pipeline) |
| `npm run build` | **pass** (exit 0, Next.js 15.5.4) |

Not run in this pass: fresh MySQL migrate, upgrade-from-previous-schema migrate, authenticated Playwright against staging, live Stripe webhook delivery, Chromium-unavailable soak.

## Features intentionally disabled when credentials are absent

| Missing | Behavior |
| --- | --- |
| Stripe keys / prices / webhook secret | Checkout throws “Billing is not configured”; settings show plans as non-self-serve. |
| SMTP / Resend | Transactional mail skipped; email verification not required. |
| OpenAI | AI analysis returns no diagnosis; incident still opens. |
| Playwright Chromium / `PLAYWRIGHT_CHROMIUM_PATH` | Browser jobs fail; HTTP monitors continue. |
| Discord webhook URL | Channel not added / not posted. |

## Known limitations

- No public REST API (keys are unused).
- No Slack, no white-label, no server-side PDF export, no custom origin headers/cookies, no multi-region “edge” fleet.
- Free = 1 site, HTTP/TLS, 30-minute interval, 7-day history, no alerts, no visual.
- Visual baselines are per monitor+viewport; compare UI is desktop-first.
- Public status page shows site **names** and public incident titles, not URLs or AI evidence.

## Manual QA checklist

1. Restart the process bound to port 3003 from this tree (`npm run build && npm start`) so `--surface-*` CSS is live.
2. Signup, login, password reset, session revoke.
3. Create site against `scripts/fixture-server` healthy URL; HTTP check succeeds.
4. On Freelancer (or with browser enabled): desktop/mobile snapshots; break fixture to `missing-button`; run check; incident opens with the matching diff; Discord/email job appears if configured; restore fixture; incident resolves after confirmation successes.
5. Attempt checkout twice quickly — second should reuse idempotency / portal.
6. Stripe test: `past_due` keeps plan; `unpaid`/`canceled` drop to Free without deleting sites (extras pause).
7. Delete account with a test subscription — Stripe subscription canceled first.
8. Two users: media URL from org A returns 403 for org B.
9. Status page: paused site is Paused, not Operational; no raw URL.
10. Mobile 390 / tablet 768: bottom nav vs toasts; dialogs trap Tab/Escape.
11. Confirm nginx proxies only to `127.0.0.1:3003`.

## Exact blockers remaining before paid launch

1. **Operator:** Stripe live prices + webhook endpoint + Customer Portal; never take money with Stripe disabled.
2. **Operator:** backups for MySQL and `storage/`.
3. **Operator:** deploy **this working tree** (it is not on `e0857f5` alone) and restart web/worker/scheduler.
4. **Operator:** restrict port 3003 to localhost (compose now does; confirm host firewall/systemd).
5. **Operator:** decide whether to require email (configure SMTP) and whether the GitHub repo should be private.
6. **Staging:** run the skipped authenticated Playwright pipeline once against a real workspace + worker.

Until (1)–(4) are done, do not send paying traffic. Application-level charge/leak/false-promise blockers from this audit are addressed in the working tree.

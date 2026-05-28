# GitHub Actions Flow Control — Educational Demo (Module 8.6.1)

A tiny React + Vite + Vitest app whose sole purpose is to host a realistic, multi-job CI/CD pipeline that demonstrates the **flow control** primitives of GitHub Actions:

- `needs` dependencies & job ordering
- Parallel jobs
- `if: failure()` (step- and job-level)
- `continue-on-error` and the `outcome` vs `conclusion` distinction
- `actions/cache` with conditional install on `cache-hit`
- Conditional `actions/upload-artifact` (only on failure)
- Branch-based deploy gating
- Stop-on-failure cascading via `needs`
- A dedicated **Report job** that runs only when something failed

> The app itself is intentionally trivial — a "Task Status Dashboard" that cycles a status label. The pipeline is the lesson.

---

## Quick start

```bash
npm install
npm run dev      # open the app
npm test         # run Vitest (writes test/test.json)
npm run lint     # run ESLint
npm run build    # produce dist/
```

---

## Workflow architecture

```
                push / PR / workflow_dispatch
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
           [ lint ]                    [ test ]        (parallel)
              │                           │
              └─────────────┬─────────────┘
                            ▼
                        [ build ]
                            │
                            ▼
                    [ deploy ]   ← only on main
                            
   any of the above fails  →  [ report ]   (if: failure())
```

| Job | Depends on | What it teaches |
|-----|-----------|------------------|
| `lint`   | —              | `actions/cache` + `cache-hit` conditional skip of `npm ci` |
| `test`   | —              | `if: failure()` + `steps.<id>.outcome` for conditional artifact upload; `continue-on-error`; `outcome` vs `conclusion` |
| `build`  | `lint`, `test` | Stop-on-failure: skipped if any dependency failed |
| `deploy` | `build`        | Branch gating with `if: github.ref == 'refs/heads/main'` |
| `report` | all of the above | `if: failure()` at **job level** — runs only when something upstream failed |

---

## How to break each stage on purpose (for live demos)

### Break the **lint** job
Open [src/App.jsx](src/App.jsx) and add an unused import:

```jsx
import { useEffect } from 'react'; // unused → no-unused-vars fails
```

Or sneak a `==` somewhere:

```jsx
if (status == 'ok') { /* eqeqeq fails */ }
```

### Break the **test** job
Open [src/utils/status.js](src/utils/status.js) and change `'OK'` → `'OKAY'`. Tests fail, and because of `if: failure() && steps.vitest.outcome == 'failure'` the `test-report` artifact gets uploaded — students can download `test/test.json` from the run page.

You can also trigger this without editing code: run the workflow via **Actions → Run workflow** with **force_fail = true**.

### Skip the **deploy** job
Push from a non-`main` branch. Lint + test + build run, deploy is **skipped** (visible as a gray "Skipped" badge on the run page).

### Trigger the **report** job
Anything that fails will do it — most cleanly, the `force_fail` workflow_dispatch input.

---

## Cache behavior — what to look for

- **First run on a fresh `package-lock.json`:** the cache step prints `Cache MISS` and runs `npm ci`.
- **Second run with no lockfile change:** prints `Cache HIT` and skips `npm ci`. The cache step at the top still takes a couple of seconds — that's the *restore*, not an install.
- **Invalidate the cache:** bump a dependency or delete `package-lock.json` and reinstall. The next run will miss again.

The conditional is the key teaching point:

```yaml
- name: Install dependencies (only on cache miss)
  if: steps.npm-cache.outputs.cache-hit != 'true'
  run: npm ci
```

`cache-hit` is `'true'` (a string!), `'false'`, or empty. Always compare against the string.

> **Cache strategy note.** This workflow caches `node_modules` keyed on the lockfile, so on a hit the install is genuinely skipped. The other common pattern is caching `~/.npm` (the npm tarball cache) and always running `npm ci` — that speeds up downloads but doesn't skip the install. For production, the one-line shortcut is `cache: 'npm'` on `actions/setup-node`. We use the explicit `actions/cache` here to keep the `cache-hit` mechanic visible.

---

## Artifact behavior

| Artifact | Job | Condition |
|----------|-----|-----------|
| `test-report` (`test/test.json`) | `test` | **Only if** the `vitest` step failed (`if: failure() && steps.vitest.outcome == 'failure'`) |
| `dist`                           | `build` | Always, when build succeeds |

Why `if: failure()` is required on the artifact upload: once a step in a job fails, GitHub Actions short-circuits the rest of the job — all following steps are skipped by default. `if: failure()` overrides that and says "run this step *because* something failed."

---

## `outcome` vs `conclusion` — the critical distinction

Every step records two results:

- **`outcome`** — what the step actually did (`success` / `failure` / `cancelled` / `skipped`)
- **`conclusion`** — what GitHub uses for `failure()` / `success()` decisions, *after* `continue-on-error` is applied

The workflow's `flaky` step runs `exit 1` with `continue-on-error: true`:

```
flaky.outcome    = failure
flaky.conclusion = success   ← because continue-on-error masked it
```

That mismatch is what `continue-on-error` actually does — and it's what trips students up in interviews.

---

## Why does the `report` job need `if: failure()`?

By default, a job with `needs:` is **skipped** when its upstream fails (because the dependency wasn't successful). That's the opposite of what a failure-report job needs.

```yaml
report:
  needs: [lint, test, build, deploy]
  if: failure()       # ← without this, the job is skipped on upstream failure
```

`failure()` returns true if *any* job in the dependency chain failed. There's also `always()` (run no matter what), `success()` (default), and `cancelled()`.

---

## File layout

```
.github/workflows/ci.yml      ← the workflow (the centerpiece)
src/
  main.jsx                    ← React entry
  App.jsx                     ← composes Header + StatusCard
  components/
    Header.jsx
    StatusCard.jsx
  utils/
    status.js                 ← pure logic — break this to fail tests
tests/
  setup.js                    ← jest-dom matchers
  status.test.js              ← 6 unit tests on pure logic
  statusCard.test.jsx         ← component test (fragile by design)
test/                         ← Vitest JSON report lands here
vite.config.js
vitest.config.js              ← wires the JSON reporter to test/test.json
eslint.config.js              ← flat config with "trap" rules (no-unused-vars, eqeqeq)
```

---

## Suggested classroom demo sequence

1. **Push clean code to `main`.** Watch all jobs go green; deploy runs; report is **skipped** (not run — because nothing failed).
2. **Push the same code to a feature branch.** Lint/test/build run; **deploy is skipped** (branch gating); report still skipped.
3. **Break a test (`'OK'` → `'OKAY'`)** and push. Test job fails → `test-report` artifact appears → build/deploy **skipped** → `report` runs and prints the failure summary.
4. **Run the workflow manually with `force_fail = true`** to reproduce the failure path on demand.
5. **Inspect the `flaky` step logs** to see `outcome=failure, conclusion=success` — the continue-on-error mechanic in action.
6. **Bump `package-lock.json`** and push: notice the next lint job prints `Cache MISS` and reinstalls; the run after that prints `Cache HIT`.

---

## What this project deliberately does NOT have

- TypeScript — JS only, by design
- Docker / containers
- Any backend, database, or auth
- Real cloud deployment — the "deploy" job only echoes
- Storybook, Playwright, Cypress, Redux

The goal is a pipeline students can read top-to-bottom, break on purpose, and discuss in class.

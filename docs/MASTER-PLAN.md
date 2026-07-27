# Master Plan — Open Currency Converter

> **Status: placeholder.** This document is a skeleton. Only the sections marked
> *Settled* below reflect real decisions; everything else is an open question to be
> worked through before the corresponding milestone starts.

## 1. Purpose

A React Native currency-exchange app. Beyond that one line, the product scope is
not yet defined — see [Open questions](#8-open-questions).

## 2. How these documents work

| Document | Contains |
| --- | --- |
| `MASTER-PLAN.md` (this file) | Architecture decisions, system structure, milestone index. The stable "what and why". |
| `M<NN>-<name>.md` | One per milestone: the step-by-step implementation plan, live progress tracking, and a record of what was implemented vs. deferred. The "how and when". |

Conventions:

- Milestone files are numbered with a **unique incremental prefix** (`M01`, `M02`, …).
  Numbers are never reused or reordered, even if a milestone is abandoned.
- Each milestone file carries a **Status** (`Planned` / `In progress` / `Complete` /
  `Abandoned`) and is updated *as work happens*, not retroactively.
- Anything consciously **not** done is recorded under *Deferred*, with the reason —
  so a later reader can tell a deliberate omission from an oversight.
- Decisions that outlive their milestone get promoted into this file; the milestone
  file keeps the detailed rationale.

## 3. Milestones

| # | Milestone | Status | Document |
| --- | --- | --- | --- |
| M01 | Development environment | ✅ Complete (pending device verification) | [M01-development-environment.md](./M01-development-environment.md) |
| M02 | Quality tooling and agent conventions | ✅ Complete | [M02-quality-tooling.md](./M02-quality-tooling.md) |
| M03 | *TBD* | — | — |

Milestones beyond M01 are undecided. Candidate themes, in no committed order:
core conversion UI, exchange-rate data source and caching, offline behaviour,
currency selection/search, state management, persistence, testing strategy,
CI, release pipeline.

## 4. Architecture decisions — settled

These are locked in by M01 and are unlikely to change without a strong reason.
Full rationale lives in [M01](./M01-development-environment.md).

| Area | Decision |
| --- | --- |
| Framework | Expo (managed workflow), SDK 57 |
| Language | TypeScript, `strict: true` |
| Runtime | React Native 0.86, React 19.2 |
| Dev environment | Fully containerised; host needs only docker, docker-compose, git |
| Device testing | Expo Go over LAN, via `network_mode: host` |
| Local preview | React Native Web at `localhost:8081` |
| Repo layout | App at repo root; a backend, if ever needed, becomes a sibling directory |
| Task runner | `Makefile` wrapping docker-compose |
| Web release build | `expo export --platform web` → static `dist/` |
| Native release build | EAS Build (cloud) — configured but unexercised |
| Testing | Jest + `jest-expo` + React Native Testing Library |
| Lint / format | ESLint (`eslint-config-expo`) + Prettier + knip |
| Quality gate | `make check` — lint, format, typecheck, knip, tests |

## 5. Architecture decisions — open

Nothing here has been decided. Each needs its own discussion before the milestone
that depends on it.

### 5.1 Application structure
- [ ] Navigation: single screen, or `expo-router` / React Navigation?
- [ ] Directory convention for screens, components, hooks, domain logic
- [ ] Component/styling approach: plain `StyleSheet`, or a UI/styling library?

### 5.2 Exchange-rate data
- [ ] Which rate provider, and on what terms (cost, rate limits, attribution, licence)?
- [ ] Does an API key exist? If so, it cannot ship in a client bundle — does that
      force a small backend proxy, and does that change the repo layout?
- [ ] Refresh cadence, and how stale is too stale
- [ ] Historical rates in scope, or live only?

### 5.3 State and persistence
- [ ] State management approach
- [ ] Server-state/caching layer
- [ ] What persists across launches (last-used currencies, cached rates, preferences),
      and in what storage

### 5.4 Offline and failure behaviour
- [ ] Must conversion work offline from cached rates?
- [ ] How are staleness, network failure and provider errors surfaced to the user?

### 5.5 Correctness
- [ ] Numeric representation for money — floating point is a known hazard here;
      decide before any conversion logic is written
- [ ] Rounding and display precision rules
- [ ] Currency metadata source (codes, symbols, minor units)

### 5.6 Quality
Linting, formatting and the testing stack were settled in
[M02](./M02-quality-tooling.md) and are listed in §4. Still open:

- [ ] CI — blocked on there being a remote
- [ ] Whether `make check` should be enforced by a pre-commit hook
- [ ] Coverage thresholds

### 5.7 Release
- [ ] Target platforms: Android only, or iOS and web too?
- [ ] Android application ID, signing, distribution channel
- [ ] Over-the-air updates?

## 6. System structure

*To be written.* Should cover the module boundaries, the data flow from rate
provider through cache to UI, and where domain logic (conversion, formatting)
lives independently of React.

## 7. Non-functional requirements

*To be written.* Candidates: cold-start time, offline tolerance, accessibility,
supported Android versions, bundle size, localisation.

## 8. Open questions

Product-level, blocking meaningful planning past M01:

- [ ] Who is this for, and what is the single most important thing it does well?
- [ ] Scope: pure converter, or also rate tracking/history/alerts?
- [ ] Online-first or offline-first?
- [ ] Target platforms
- [ ] Is this intended for public release, or a personal/prototype project?

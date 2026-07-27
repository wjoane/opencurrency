# M02 — Quality Tooling and Agent Conventions

| | |
| --- | --- |
| **Status** | ✅ Complete |
| **Started** | 2026-07-27 |
| **Completed** | 2026-07-27 |

## 1. Goal

`AGENTS.md` had been seeded from an unrelated project and contradicted reality: its
Definition of Done demanded that linting and tests pass, while neither a linter nor a
test runner existed. Two sections were empty.

Rewrite `AGENTS.md` to describe this project truthfully, and install the tooling it
mandates so the Definition of Done is enforceable rather than aspirational.

## 2. Decisions

| # | Decision | Choice | Why |
| --- | --- | --- | --- |
| 1 | Test stack | Jest + `jest-expo` + React Native Testing Library | The standard Expo stack; runs in the container. Covers both pure domain logic and component rendering. |
| 2 | Lint / format | ESLint (`eslint-config-expo`) + Prettier + **knip** | Adopted now, before app code exists, so there is no backlog of violations. `eslint-config-expo` brings the React Hooks rules — `exhaustive-deps` catches stale-closure bugs TypeScript cannot see. knip additionally reports unused files, exports and dependencies. |
| 3 | Data-fetching library | **Removed from AGENTS.md** | It mandated TanStack Query, but `MASTER-PLAN` §5.3 lists the data layer as open, and the mandate arrived alongside an obviously-copied TanStack Table line. AGENTS.md now states the durable rule (isolate remote access in API client modules) and defers the library choice. |
| 4 | Branch naming | `feature/M<NN>-…` uses the **milestone number**; `bugfix/<description>` carries none | Makes feature branches traceable to their milestone document. Bugs frequently belong to no milestone, so forcing one would be arbitrary. **Assumed, not confirmed** — see [Follow-ups](#7-follow-ups). |
| 5 | Prettier scope | Code only; Markdown excluded | Prettier pads Markdown table cells to equal width, which pushed doc lines past 400 characters and would make every future doc edit a churn diff. Prose stays hand-formatted. |

## 3. Removed from AGENTS.md

Content carried over from the project these instructions were copied from:

| Removed | Why |
| --- | --- |
| "Use TanStack Table for **job browsing and ranking tables**" | A jobs/listings app. No such concept here. |
| "Use TanStack Query for remote data" | A real architecture decision that `MASTER-PLAN` §5.3 has not made. See decision #3. |
| "…change public APIs, **database schema, prompt contracts**, or environment variables" | No database and no LLM prompts in this project. Kept the parts that do apply. |
| "Update **the component README**" | Assumes per-component READMEs from a multi-package repo. There is one README, at the root. |
| "merge … into the **master** branch" | This repo's branch is `main`. |
| "Tests pass **locally** or in Docker" | There is no Node on the host; there is no "locally". |
| Documentation list numbered `1. 2. 5.` | Broken numbering. |

## 4. What was implemented

### AGENTS.md

Rewritten. Sections added or substantially filled:

- **Environment** — nothing runs on the host; use `make` and hyphenated
  `docker-compose`. Previously absent, and the single most common way an agent breaks
  this project.
- **Project conventions** — expanded from one line to the `docs/` milestone workflow.
- **Expo and React Native conventions** — new. Managed workflow, `expo install` over
  `npm install`, stay Expo Go-compatible, keep web working.
- **Testing conventions** — was empty.
- **Security conventions** — was empty.
- **TypeScript conventions** — added the rule that domain logic stays React-free, and
  a hard prohibition on floating-point money arithmetic pending `MASTER-PLAN` §5.5.

### Tooling

| File | Purpose |
| --- | --- |
| `eslint.config.js` | Flat config: `eslint-config-expo/flat` + `eslint-config-prettier` last |
| `.prettierrc`, `.prettierignore` | Single quotes, trailing commas, width 100; Markdown excluded |
| `jest.config.js` | `jest-expo` preset |
| `knip.json` | Entry points and dependency exceptions |
| `App.test.tsx` | Smoke test proving the stack runs |

New dev dependencies: `eslint`, `eslint-config-expo`, `eslint-config-prettier`,
`prettier`, `knip`, `jest`, `jest-expo`, `@types/jest`,
`@testing-library/react-native`.

New Make targets: `check` (all gates), `test`, `test-watch`, `lint`, `lint-fix`,
`format`, `format-check`, `knip`.

`tsconfig.json` gained `types: ["jest", "@testing-library/react-native"]` — without it
`tsc` cannot see `describe`/`it`/`expect` or the RNTL matchers.

## 5. Problems found and fixed

Running the tooling surfaced three real defects that static review had missed.

### 5.1 Named volumes were root-owned (M01 bug)

`docker-compose run --rm app npx expo install` failed with
`EACCES: permission denied, mkdir '/home/node/.expo/native-modules-cache'`.

`/home/node/.expo` does not exist in `node:24-alpine`. Docker only inherits ownership
from the image when the mount point already exists; otherwise it creates it
`root:root`, and the `node` user cannot write. `/home/node/.npm` had the same latent
problem.

Fixed in the `Dockerfile` by creating both directories owned by `node` before
`USER node`. **This was a live bug in M01's setup**, not a new-tooling problem — any
`expo install` would have hit it.

### 5.2 RNTL v14's `render` is async

The obvious test failed with `render function has not been called`, then
`getByText is not a function`. `@testing-library/react-native` v14 returns a
**Promise** from `render`, because React 19 made `act` async.

Every pre-v14 example online — and any agent's default instinct — writes
`const { getByText } = render(<App />)`, which silently produces undefined queries.
This is documented explicitly in AGENTS.md's testing section, since it will otherwise
be rediscovered painfully.

### 5.3 knip's own configuration hints

knip flagged three of the four `ignoreDependencies` entries as unnecessary (its Expo
plugin already understands `react-dom`, `react-native-web` and `@expo/metro-runtime`)
and one entry pattern as redundant. Config simplified accordingly.

## 6. Deferred

| Item | Why |
| --- | --- |
| **CI** | No remote and no CI provider. `make check` is the gate for now; wiring it to CI is trivial once a remote exists. |
| **Pre-commit hooks** | `make check` is not enforced automatically. Deliberate — hooks are friction for a solo prototype, and the option remains open. |
| **`expo-updates`, `expo-system-ui`** | knip infers these from `app.json` keys. Neither is needed under Expo Go, and installing a dependency purely to satisfy a linter is backwards. Both are in `ignoreDependencies`; revisit if a native build is ever configured. |
| **Coverage thresholds** | `collectCoverageFrom` is configured but no minimum is enforced. Thresholds on a codebase with one test would be theatre. |
| **npm audit findings** | 36 advisories (26 high) reported, essentially all in transitive dev dependencies of the Jest tree. Not triaged. No runtime dependency is implicated. |
| **`unrs-resolver` postinstall** | npm 11 blocked its install script. ESLint's import resolution works regardless, so it was left blocked rather than approved. |

## 7. Follow-ups

- [ ] **Confirm the branch-naming reading** (decision #4). `M<NN>` was interpreted as
      the milestone number; the alternative is a plain per-type counter. One-line
      change to AGENTS.md if the other reading was intended.
- [ ] Decide whether `make check` should be enforced by a pre-commit hook.
- [ ] Triage `npm audit` once the dependency set stabilises.

## 8. Verification

All gates were executed in the container and pass:

```
make lint          exit 0
make format-check  exit 0     All matched files use Prettier code style
make typecheck     exit 0
make knip          exit 0
make test          exit 0     1 passed, 1 total
```

`docker-compose build` also succeeded, which **closes M01's largest open risk** — the
Alpine/musl concern. The image builds and the full JavaScript toolchain runs on musl.

Still unverified from M01: the dev server itself (`make up`), browser preview, hot
reload, and Expo Go on a device.

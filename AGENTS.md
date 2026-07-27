# AGENTS.md

This file defines implementation guidance for the React Native app `opencurrencyconverter`.

Read [`docs/MASTER-PLAN.md`](docs/MASTER-PLAN.md) before starting work. It holds the
architecture decisions and, just as importantly, records which decisions are still
**open**. Do not silently resolve an open decision by writing code that assumes an
answer — raise it.

## Core behavior

- You are a principal software engineer with extensive experience in software development, architecture, and design patterns.
- If you are uncertain, say so explicitly, do not speculate as fact.
- If you cannot assess something without more information, ask for it rather than guessing.
- If you need more information from me, ask me 1-2 key questions right away.
- Call out inconsistencies.
- Challenge my instructions if you don't agree or have doubts.
- Don't brush off issues as "pre-existing." Pick them up and fix them immediately.
- Keep your code DRY. Extract repeated code sections to shared functions or shared utility classes between components.
- Keep your code KISS, reduce cyclomatic complexity and cognitive complexity.
- Follow the SOLID design principles.
- Don't cut corners in the code quality just so that we have to write less code or tests.
- Don't blindly fix tests when they fail but reflect on WHY they fail and also correctly fix the root cause.
- Think step by step before giving any verdict.
- Prefer small, reviewable commits.
- Do not silently change public interfaces, environment variables, or the Expo/Docker configuration.
- When changing behavior, update tests and documentation in the same change.
- Do not introduce new dependencies without a reason and without updating the relevant documentation.

## Environment

**Nothing runs on the host.** There is no Node.js, npm, or Expo CLI installed
outside Docker, and there must not be. Every command runs in the container.

- Use the `Makefile` targets. Run `make` for the list.
- Use `docker-compose` if the `docker compose` plugin subcommand is **not installed** on this machine.
- Never instruct anyone to `npm install` on the host, or to install Node.
- The one-off form is `docker-compose run --rm app <command>`.

| Task | Command |
| --- | --- |
| Start the dev server | `make up` |
| Run all quality gates | `make check` |
| Tests | `make test` |
| Add a runtime dependency | `make add PKG=<name>` |
| Add a dev dependency | `make add-dev PKG=<name>` |

## Project conventions

- Long-form documentation lives in `docs/`.
- `docs/MASTER-PLAN.md` holds architecture decisions and the milestone index.
- Each milestone has `docs/M<NN>-<name>.md` with its implementation plan and live
  progress. Numbers are incremental and never reused.
- **Update the milestone document as work happens, not at the end.** Record what was
  implemented and what was deferred, with the reason. A later reader must be able to
  tell a deliberate omission from an oversight.
- When a decision outlives its milestone, promote it into `MASTER-PLAN.md` §4 and
  leave the detailed rationale in the milestone file.

## Expo and React Native conventions

- This is the **managed** Expo workflow. `ios/` and `android/` directories are not
  checked in and must not be committed; they are generated output.
- Add React Native / Expo packages with `make add PKG=<name>` (`expo install`), which
  picks the version matching the installed SDK. A bare `npm install` will pull the
  newest release and can silently break the SDK alignment.
- Prefer packages supported by **Expo Go**. Anything requiring custom native code
  breaks the current device-testing setup, which relies on Expo Go — if it is
  genuinely needed, say so explicitly rather than adding it quietly.
- Keep the app working on **both** native and web. Web is the local preview and the
  only thing that runs on this machine; do not use APIs that break it without
  isolating them behind a platform check.
- Do not edit `app.json` version or SDK fields as a side effect of another change.

## TypeScript conventions

- Use TypeScript strict mode.
- Use small React components with clear props.
- Keep remote data access in dedicated API client modules, isolated from components.
  The data-fetching/caching library is **not yet chosen** — see `MASTER-PLAN.md` §5.3.
- Keep reusable UI primitives separate from feature components.
- Keep domain logic (conversion, rounding, formatting) in plain TypeScript modules
  with no React imports, so it can be tested without rendering.
- **Never use raw JavaScript floating-point arithmetic for monetary values.** The
  numeric representation is an open decision (`MASTER-PLAN.md` §5.5); until it is
  made, do not write conversion logic.

## Testing conventions

Stack: **Jest** with the `jest-expo` preset, and **React Native Testing Library**.

- Run with `make test`, or `make test-watch` while developing.
- Place tests next to the code they cover, named `<name>.test.ts` / `<name>.test.tsx`.
- **`render` from `@testing-library/react-native` is async and must be awaited.**
  v14 made the whole API async because React 19's `act` is async. Writing
  `const { getByText } = render(<App />)` — the pattern from older versions and most
  online examples — silently yields undefined queries.

  ```tsx
  await render(<App />);
  expect(screen.getByText(/…/)).toBeOnTheScreen();
  ```

- Test behaviour through the public surface: query by text, role and accessibility
  label rather than by test ID or internal component structure.
- Cover domain logic (conversion, rounding, formatting, parsing of API responses)
  with plain unit tests. This is where currency bugs actually live.
- Do not weaken an assertion to make a test pass. Fix the cause.

## Comments

- Avoid using inline comments if not absolutely necessary.
- Write code that documents itself. Method and variable namings should be meaningful and self-explanatory.
- Prefer writing comments as summarized class or method docs instead of inline comments.
- Explain non-obvious architectural choices in code comments or docs.

## Version control conventions

- Use Git for version control.
- Use a feature branch named for the milestone it implements:
  `feature/M<NN>-short-description` (e.g. `feature/M02-rate-provider`), matching the
  milestone document in `docs/`.
- Use a bugfix branch named for the defect: `bugfix/short-description`. Bugfixes are
  not tied to a milestone.
- After the feature development or bugfix is complete and the changes approved, merge
  squash commits into the `main` branch, keep the feature/bugfix branches unchanged.
- Use descriptive commit messages: what changed and why, not just what.

## Security conventions

- **Anything in the app bundle is public.** React Native ships your JavaScript to the
  device; there is no server side to hide behind. Assume any value compiled into the
  app can be extracted.
- Environment variables prefixed `EXPO_PUBLIC_` are **inlined into the bundle at build
  time**. They are configuration, not secrets. Never put a credential behind that
  prefix because the name looks harmless.
- A rate-provider API key that must stay secret therefore cannot live in the app. It
  requires a server-side proxy — an architectural consequence, not an implementation
  detail. See `MASTER-PLAN.md` §5.2 before assuming either way.
- Never commit secrets. `.env` and `.env.*` are gitignored; keep it that way.
- Use HTTPS for every network call. Do not disable certificate validation.
- Do not log sensitive values, including full API responses that may contain keys.
- Treat all API responses as untrusted input: validate shape and types before use
  rather than trusting the provider's documentation.
- Keep dependencies pinned via `package-lock.json`, and commit lockfile changes
  alongside `package.json`.

## Documentation requirements

When adding or changing a major component, update:

1. `README.md`, if setup, commands, prerequisites or dependencies changed.
2. The relevant milestone document under `docs/`, including anything deferred.
3. `docs/MASTER-PLAN.md`, if the change settles or reopens an architecture decision.
4. Tests covering the new or changed behaviour.

## Definition of done

A change is ready when:

- `make check` passes — this runs lint, format check, typecheck, knip and tests.
- Tests cover the new or changed behaviour.
- Public interfaces are documented.
- Documentation is updated per the section above.
- No unused files, exports or dependencies were introduced (`make knip`).

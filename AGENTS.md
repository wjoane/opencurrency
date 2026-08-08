# AGENTS.md

Implementation guidance for the React Native app `opencurrency`.

Read `docs/MASTER-PLAN.md` before starting. It contains architecture decisions, milestone references, and unresolved decisions. **Never implement an assumption that silently resolves an open decision. Raise it instead.**

## Engineering principles

Act as a principal software engineer experienced in architecture, design patterns, and software development.

* Be explicit when uncertain. Never present speculation as fact.
* Ask for missing information instead of guessing. If needed, ask 1–2 key questions immediately.
* Always flag inconsistencies, ambiguities, and contradictions.
* Challenge instructions when you disagree or have doubts.
* Never dismiss problems as "pre-existing". Ask whether they should be fixed immediately.
* Think step by step before reaching a verdict.
* Follow **DRY, KISS, SOLID, and YAGNI**.
* Extract genuinely repeated code into shared functions/utilities.
* Minimize cyclomatic and cognitive complexity.
* Prefer simple, maintainable code over abstractions or defensive code without demonstrated need.
* Do not sacrifice code or test quality to reduce implementation effort.
* When tests fail, identify and fix the root cause. Never weaken assertions just to pass.
* Prefer small, reviewable commits.
* Keep small fixes narrowly scoped.
* Limit each step to do just one specific thing, touching as few files or systems as possible, without touching unrelated code at the same time.
* When behavior changes, update tests and documentation in the same change.
* Do not add dependencies without justification and relevant documentation updates.
* Never silently change public interfaces, environment variables, or Docker configuration.

## Environment

**Nothing runs on the host.** Node.js, npm, and Expo CLI must only run in Docker.

* Use `Makefile` targets. Run `make` to list them.
* Use `docker-compose` when the `docker compose` plugin is unavailable.
* Never instruct anyone to install Node or run `npm install` on the host.
* One-off commands: `docker-compose run --rm app <command>`.

| Task                   | Command                   |
| ---------------------- | ------------------------- |
| Start dev server       | `make up`                 |
| All quality gates      | `make check`              |
| Tests                  | `make test`               |
| Add runtime dependency | `make add PKG=<name>`     |
| Add dev dependency     | `make add-dev PKG=<name>` |

## Documentation and milestones

* Long-form documentation belongs in `docs/`.
* `docs/MASTER-PLAN.md` contains architecture decisions and the milestone index.
* Each milestone uses `docs/M<NN>-<name>.md`. Numbers increase and are never reused.
* Update milestone documents **while work happens**, recording implemented and deferred work with reasons so deliberate omissions are distinguishable from oversights.
* If a decision outlives its milestone, promote it to `MASTER-PLAN.md` §4 while keeping detailed rationale in the milestone document.

For major component additions or changes, update as applicable:

1. `README.md` when setup, commands, prerequisites, or dependencies change.
2. The relevant milestone document, including deferred work.
3. `docs/MASTER-PLAN.md` when an architecture decision is settled or reopened.
4. Tests for new or changed behavior.

## Expo and React Native

* Use the **managed Expo workflow**.
* `ios/` and `android/` are generated output. Do not check them in or commit them.
* Add React Native/Expo packages with `make add PKG=<name>` using `expo install`, which preserves SDK compatibility. Do not use bare `npm install`.
* Prefer **Expo Go** compatible packages. If custom native code is genuinely required, explicitly call out that it breaks the current Expo Go device-testing setup.
* Keep both native and web working. Web is the local preview and the only platform runnable on this machine.
* Isolate native-only APIs behind platform checks.
* Do not modify `app.json` version or SDK fields as an unrelated side effect.

## TypeScript and architecture

* Use TypeScript strict mode.
* Use small React components with clear props.
* Keep reusable UI primitives separate from feature components.
* Put remote data access in dedicated API client modules, not components.
* The data-fetching/caching library remains undecided. See `MASTER-PLAN.md` §5.3.
* Keep domain logic such as conversion, rounding, and formatting in plain TypeScript modules without React imports.
* **Never use JavaScript floating-point arithmetic for monetary values.**
* Numeric representation remains undecided. See `MASTER-PLAN.md` §5.5. Do not implement conversion logic until that decision is made.

## Testing

Stack: **Jest** with `jest-expo` and **React Native Testing Library**.

* Use `make test`, or `make test-watch` during development.
* Co-locate tests as `<name>.test.ts` or `<name>.test.tsx`.
* In React Native Testing Library v14, `render` and `fireEvent` are async because React 19 `act` is async. **Always await them.**

```tsx
await render(<App />);
expect(screen.getByText(/…/)).toBeOnTheScreen();

await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
```

Un-awaited calls may query stale or undefined state and produce misleading failures.

* Test behavior through public surfaces using text, role, and accessibility labels rather than test IDs or internal structure.
* Unit-test domain logic including conversion, rounding, formatting, and API-response parsing.
* Fix causes of failures, not assertions.

## Comments

* Avoid inline comments unless necessary.
* Prefer self-documenting names and code.
* Prefer concise class/method documentation over inline commentary.
* Document non-obvious architectural decisions in code comments or documentation.

## Version control

* Use Git.
* Feature branches: `feature/M<NN>-short-description`, matching the milestone document, e.g. `feature/M02-rate-provider`.
* Bugfix branches: `bugfix/short-description`. Bugfixes are not milestone-bound.
* After approved feature/bugfix completion, squash-merge into `main` and leave the source branch unchanged.
* Commit messages must describe what changed and why.

## Security

* Assume **everything bundled with the app is public** because React Native ships JavaScript to devices.
* `EXPO_PUBLIC_` environment variables are build-time configuration exposed in the bundle, **not secrets**.
* Secrets such as rate-provider API keys cannot live in the app and require a server-side proxy. See `MASTER-PLAN.md` §5.2 before making assumptions.
* Never commit secrets. Keep `.env` and `.env.*` gitignored.
* Use HTTPS for every network request and never disable certificate validation.
* Never log sensitive values, including full API responses that might contain credentials.
* Treat API responses as untrusted. Validate their shape and types before use.
* Pin dependencies with `package-lock.json` and commit lockfile changes together with `package.json`.

## Code review

Evaluate:

* Compliance with documented specifications and requirements.
* Code quality and best practices.
* DRY, KISS, SOLID, and YAGNI.
* Redundancy, complexity, coupling, naming, and consistency.
* Bugs, unhandled edge cases, and silent failures. Prefer failing loudly over hiding bugs.
* Performance.
* Readability and maintainability.
* Security vulnerabilities.
* Test coverage.

Actively look for code or tests that should be removed or simplified:

* **Over-engineering:** abstractions, options, or indirection with one caller and no realistic second use.
* **Over-defensive code:** unnecessary `try`/`catch`, null/undefined guards, or fallbacks for states already excluded by types/callers. Identify which caller could produce the state. If none can, treat it as dead code.
* **Paranoid validation:** excessive validation, normalization, casting, or formatting of predictable inputs, especially configuration/admin inputs.
* **Small single-use functions:** inline helpers used once when their name adds no meaning beyond the implementation, especially predicates that only restate an operator.
* **Extreme edge cases:** remove code/tests for highly speculative, very low-value situations.
* **Tests preserving dead code:** if a test must bypass the type system to reach a branch, treat that as evidence the branch is unreachable and recommend deleting both.

Review output requirements:

* Start with a brief overall code-quality summary.
* Line numbers start at 1 and refer to the code exactly as presented.
* Give clear improvement suggestions for every finding.
* If no issues exist, briefly state that the code follows best practices.

## Definition of done

A change is ready only when:

* `make check` passes, including lint, formatting, typecheck, knip, and tests.
* Tests cover new or changed behavior.
* Public interfaces are documented.
* Required README, milestone, and `MASTER-PLAN.md` documentation is updated.
* `make knip` confirms no unused files, exports, or dependencies.
# M03 — Foundations and Domain Core

| | |
| --- | --- |
| **Status** | 📋 Planned |
| **Branch** | `feature/M03-foundations` |
| **Started** | — |
| **Completed** | — |

## 1. Goal

Build everything the converter screen will stand on, without building the screen.

By the end of this milestone the app still shows a placeholder, but the money
arithmetic, the formatting rules, the currency metadata, the theme and the i18n
plumbing all exist and are covered by tests.

Success criteria:

1. A verified answer on what Hermes's `Intl` actually supports on a device.
2. Money arithmetic that never touches a raw JavaScript float, closing the
   `AGENTS.md` prohibition and `MASTER-PLAN` §4.4.
3. Conversion, formatting and parsing unit-tested with no renderer involved.
4. Light/dark/system theming working on device and web.
5. `make check` passes.

## 2. Why this ordering

The `Intl` spike comes first because two settled decisions depend on a runtime
capability that cannot be confirmed from a documentation page:

- §4.4 #17 uses `Intl.NumberFormat().formatToParts()` to read locale separators.
- §4.7 #38 uses `Intl.DisplayNames` for localised currency names.

Hermes implements `Intl` partially and differently per platform. If either is missing,
the fallback is already designed — a hardcoded separator table, and the provider's
English names — but it needs to be *known* before code is written against it, not
discovered in M06.

The rest is ordered so each commit is independently reviewable and nothing depends on
code that does not yet exist.

## 3. Commit plan

| # | Commit | Contents |
| --- | --- | --- |
| 1 | `spike: probe Hermes Intl support on device` | A temporary screen rendering the results of `Intl.NumberFormat('de-DE').formatToParts(1234.5)`, `Intl.DisplayNames(['de'],{type:'currency'}).of('USD')`, and the same in `ar` and `ja`. Run on Android, iOS and web. Record the outcome in §5 and **remove the screen in the same branch**. |
| 2 | `build: add big.js and expo-localization` | `make add PKG=big.js`, `make add PKG=expo-localization`, `make add-dev PKG=@types/big.js`. Lockfile committed alongside. |
| 3 | `feat(domain): money type` | `domain/money.ts`. Configures `Big.DP = 30` and `Big.RM = Big.roundHalfUp`. Exposes construction from the provider's `number` via `String()`, and a rounding helper that takes the target decimal places. |
| 4 | `feat(domain): currency metadata tables` | `domain/currencyMetadata.ts` plus generated data: ISO-4217 minor units, a code→symbol map, and a currency→ISO-3166 map with the X-family (`xaf`, `xof`, `xcd`, `xpf`, `xau`, `xdr`) and pegged/legacy codes handled explicitly rather than by prefix guessing. |
| 5 | `feat(domain): amount parsing` | `domain/parsing.ts`. Digits and at most one separator; `.` and `,` both accepted, first one wins, second rejected. Returns `Big \| null` — never throws, never returns `NaN`. |
| 6 | `feat(domain): amount formatting` | `domain/formatting.ts`. Grouping applied to the decimal **string**; symbol placement; minor units from commit 4; adaptive significant digits for codes with no ISO definition; Latin digits always. |
| 7 | `feat(domain): conversion` | `domain/conversion.ts`. `amount ÷ rate[from] × rate[to]`, operating on `Big` throughout. |
| 8 | `feat(theme): design tokens and ThemeContext` | `theme/tokens.ts` (colour, spacing, radii, type scale; light and dark variants) and `ThemeContext` resolving `system \| light \| dark` against `useColorScheme()`. **Changes `app.json` `userInterfaceStyle` to `"automatic"`** — the only Expo config change in this milestone, and it is required, not incidental. |
| 9 | `feat(i18n): typed t() and locale resolution` | `i18n/index.ts` with an `en` catalogue only. Locale detected via `expo-localization`, overridable later. Catalogue keys typed so a missing string is a compile error rather than a runtime `undefined`. |
| 10 | `refactor: app shell and provider composition` | `App.tsx` becomes provider composition over a single screen, plus a reusable modal/sheet primitive in `ui/`. Still no converter. |

## 4. Tests

Written with each commit, not after.

| Area | Cases |
| --- | --- |
| `money` | `String(number)` round-trip preserves the provider's digits for a table of real rates including `13.49480249` and `0.0052988758`; half-up rounding at the boundary (`2.005` → `2.01`) |
| `parsing` | `"1.5"`, `"1,5"`, `"1.5,5"` rejected, `""` → null, `"abc"` → null, leading zeros, separator-only input |
| `formatting` | JPY 0 dp, KWD 3 dp, USD 2 dp, BTC adaptive, unknown code falls back to uppercase symbol, grouping in `de` (`1.234,56`) and `en` (`1,234.56`), a value large enough that a `Number` round-trip would lose digits |
| `conversion` | EUR as input, EUR as target, neither; identity when from == to; a rate of exactly `1` |
| `theme` | Resolution of `system` against both `useColorScheme()` values |

## 5. Spike results

> To be filled in by commit 1 before any dependent code is written.

| Capability | Android | iOS | Web | Consequence |
| --- | --- | --- | --- | --- |
| `Intl.NumberFormat().formatToParts()` | — | — | — | — |
| `Intl.DisplayNames` (`type: 'currency'`) | — | — | — | — |
| Non-Latin locale separators (`ar`, `ja`) | — | — | — | — |

## 6. Deferred

| Item | Why |
| --- | --- |
| Any network access | M04. This milestone is deliberately offline. |
| The other 24 locale catalogues | M06. The mechanism is what matters here; catalogues are additive and would only churn while the UI is still being written. |
| Flag assets | M04, where they are first rendered. Only the *mapping* (currency → country) lands here, since it belongs with the rest of the metadata. |
| RTL mirroring | M06. The `start`/`end` layout convention is adopted from the first component, but there is nothing to mirror yet. |

## 7. Risks

| Risk | Mitigation |
| --- | --- |
| `Intl.DisplayNames` missing on Hermes | Fallback to provider English names is already designed. Cost is confined to the add-currency picker. |
| `formatToParts` missing on Hermes | Ship a separator table for the 25 supported locales. Small, static, and testable — arguably more predictable than ICU anyway. |
| Currency→country mapping is not mechanical | The first two letters of an ISO-4217 code usually are the ISO-3166 country, but EUR, the X-family and several pegged codes are not. Handled by an explicit override table, not a heuristic. |
| `Big.DP = 30` is global mutable state | Set once in `money.ts`, which is the only module allowed to import `big.js` directly. Enforced by review. |

## 8. Verification

- [ ] `make check` exits clean
- [ ] Spike results recorded in §5 and the spike screen removed
- [ ] Light, dark and system themes verified on device and at `localhost:8081`
- [ ] `make knip` reports no unused generated tables

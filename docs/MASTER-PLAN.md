# Master Plan — Open Currency Converter

> **Status: active.** The product scope and every architecture decision that blocks it
> were settled on 2026-07-27. §4 is authoritative; §5 now lists only what genuinely
> remains open.

## 1. Purpose

A minimalistic multi-currency exchange-rate overview for Android and iOS.

The user sees a vertical list of currencies, one per row. Tapping any row's amount
makes it the input; every other row converts live from it. Rows can be reordered by
dragging and removed by swiping, and currencies can be added from the full provider
list. A header shows the date the rates come from and allows picking a date in the
past. Rates are cached permanently per date, so the app works offline against whatever
it has already seen.

**Non-goals.** No accounts, no rate alerts, no charts or historical trend views, no
portfolio tracking. Conversion is the product.

### Target user

Someone comparing several currencies at once — a traveller, or anyone pricing the same
thing in more than two currencies. The multi-row simultaneous view is the differentiator
against the two-field converter every phone already has.

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
| M03 | Foundations and domain core | 📋 Planned | [M03-foundations.md](./M03-foundations.md) |
| M04 | Rates and the converter screen | 📋 Planned | [M04-converter.md](./M04-converter.md) |
| M05 | Currency management and historical dates | 📋 Planned | [M05-list-and-dates.md](./M05-list-and-dates.md) |
| M06 | Localisation, settings, polish and release | 📋 Planned | [M06-localisation-and-release.md](./M06-localisation-and-release.md) |

The four remaining milestones are deliberately coarse. Each is delivered as a series
of small, individually reviewable commits listed in its own document, rather than as
one large change.

**Ordering rationale.** M03 front-loads the pure domain layer and a runtime capability
spike, because the money representation constrains every screen and because Hermes's
partial `Intl` support can invalidate two formatting decisions. M04 then proves the
network → cache → conversion → screen path end to end. M05 and M06 broaden it.

## 4. Architecture decisions — settled

### 4.1 From M01 and M02

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

### 4.2 Product and platform

| # | Decision | Choice | Why |
| --- | --- | --- | --- |
| 1 | Shipping platforms | **Android + iOS**. Web must keep running as the local preview but may degrade | Web is the only surface that runs on the development machine, so it cannot be allowed to break — but it is not a product target, which frees the choice of native-first libraries. |
| 2 | Currency universe | **All ~430 codes the provider returns**, including crypto, metals and defunct currencies | User's explicit call. Filtering to ISO-4217 fiat was offered and declined. The cost is that precision, symbols and icons all need a fallback path for codes with no country and no minor-unit definition — which the decisions below supply. |
| 3 | Removing a currency | **Swipe-to-delete**, minimum two rows | The expected mobile idiom. No gesture conflict: vertical drag is confined to the row's drag handle, so a horizontal swipe on the rest of the row is unambiguous. Degrades on web — accepted, see §5. |

### 4.3 Exchange-rate data

Provider: **`@fawazahmed0/currency-api`** via jsDelivr, documented in [API.md](./API.md).
Free, no API key, no rate limits, no attribution requirement.

| # | Decision | Choice | Why |
| --- | --- | --- | --- |
| 4 | API key | **None exists** | The provider is a static CDN-hosted dataset. This closes the old §5.2 question about a backend proxy: **no backend is needed**, and the repo layout stays single-app. |
| 5 | Reference currency | **EUR**. Only `…/currencies/eur.json` is ever fetched | One request serves every currency pair. `eur.eur` is `1` by definition. |
| 6 | Conversion | `amount ÷ rate[from] × rate[to]` | Follows directly from decision #5. Computed on device; the provider is never asked to convert. |
| 7 | Today's rates | Request `latest`, store under the **`date` the response itself reports** | A device ahead of UTC has a local date that does not exist upstream yet, so requesting it returns 404 and the app would retry on every launch. `latest` cannot 404, and keying by the response date means the header never claims a date we did not actually receive. |
| 8 | Historical rates | Request the explicit `YYYY-MM-DD`. **In scope** | Required by the date-picker feature. |
| 9 | Refresh rule | **Each date is fetched at most once, then cached permanently.** Only "today" is refetchable, and only while no cached snapshot carries the current UTC date. Retries are unconstrained | Past dates are immutable, so revalidating one can only waste a request. This replaces the original "max one call per day" framing: a daily budget becomes an *emergent property* rather than a throttle that has to be defended, and a failed request never locks the user out for the rest of the day. |
| 10 | Fallback host | jsDelivr → `currency-api.pages.dev` → fail | Required by the provider's own documentation. |
| 11 | Earliest selectable date | **2024-03-02** | Measured, not assumed: `2024-03-01` and earlier return HTTP 404. Enforced as the picker's `minimumDate`, so it is a bound rather than an error message. |
| 12 | Response validation | Shape and types validated before use; the 404 body is **plain text, not JSON** | `AGENTS.md` requires treating provider responses as untrusted. The 404 case is concrete: blindly parsing it throws. |

### 4.4 Correctness

| # | Decision | Choice | Why |
| --- | --- | --- | --- |
| 13 | Money type | **`big.js`**, constructed from `String(rate)`. Rounds half-up, and only at the display boundary | Closes the `AGENTS.md` prohibition on floating-point money arithmetic. ~6 KB, and `toPrecision` covers the non-fiat case. Chosen over `decimal.js` (5× the size for unused features) and a hand-rolled `BigInt` layer (more code, more places for a currency bug). |
| 14 | Parse-boundary integrity | `JSON.parse` yields a double, but JS `Number→String` is **shortest-round-trip**, so `String(13.49480249) === "13.49480249"` | The provider's decimal digits therefore survive intact into `big.js`, and no custom JSON parser is needed. Pinned by a unit test rather than left as folklore. |
| 15 | Display precision | **ISO-4217 minor units** — JPY/KRW 0, KWD/BHD/OMR 3, most others 2. Codes with no ISO-4217 definition use adaptive significant digits with trailing zeros trimmed | A flat two decimals renders BTC and gold as `0.00`, i.e. an unusable row. Minor units also match how each country actually writes its money. |
| 16 | Currency metadata | **Shipped tables**: minor units, symbols, and currency→ISO-3166 country | The provider supplies none of it — `currencies.json` is code→name and nothing else. |
| 17 | Formatting | Grouping is applied to the **decimal string**, never via `Number`. `Intl` is used *only* to read the locale's group and decimal separators | Converting a `big.js` value to `Number` to format it discards the precision the type exists to protect. Separately, `Intl.NumberFormat(…, {currency:'1INCH'})` throws `RangeError` — a currency code must be exactly three ASCII letters, and the provider returns codes that are not. `style:'currency'` is therefore unusable for this dataset. |
| 18 | Digits | **Latin digits in all locales** | CLDR's default numbering system for `ar` is Arabic-Indic (`١٢٣`). Since amounts are rendered from our own decimal string, Latin digits are what we emit unless we deliberately transliterate. Matches the convention of most Arabic-locale finance apps. |
| 19 | Symbols | Shipped code→symbol map, falling back to the **uppercase code** | Never wrong, and the row already carries a short-identifier column, so the fallback is not a visible failure. |

### 4.5 State, storage and offline

| # | Decision | Choice | Why |
| --- | --- | --- | --- |
| 20 | Data layer | **Hand-rolled `RateRepository`** over `@react-native-async-storage/async-storage` | Cache-first with in-flight dedup is a small amount of code, and it maps directly onto decision #9. TanStack Query was considered and rejected: its stale-while-revalidate and focus-refetch machinery is dead weight for immutable daily data. |
| 21 | Storage engine | AsyncStorage | Effectively forced — MMKV requires custom native code, which would break the Expo Go device-testing setup from M01. Backed by `localStorage` on web. |
| 22 | Storage layout | **One key per date** (`rates:v1:YYYY-MM-DD`) plus an index key. LRU cap of **180 snapshots** (~1 MB), newest always pinned | A single blob would be rewritten in full on every fetch, and would eventually exceed the web `localStorage` quota. |
| 23 | State management | **React Context + `useReducer`**; domain logic in plain TS with no React imports | Two providers (preferences, rates). The load-bearing case is amount editing, which re-renders ~10 memoised rows per keystroke — not a real cost at this scale. Keeps the conversion rules unit-testable without rendering, as `AGENTS.md` requires. |
| 24 | Persisted across launches | Theme, language, currency list and order, last amount and active currency. **Not** the selected date | A past date silently surviving a cold start would show old rates without the user having asked for them. |
| 25 | Offline / stale | The newest cached snapshot stays on screen with an explicit stale indicator | Conversion must work offline. Staleness is surfaced, never hidden. |
| 26 | Failed historical fetch | Keeps the current snapshot and the current header date, and surfaces an explicit error. **Never substitutes another date's rates** | Silently showing a different day's rates is a correctness bug dressed up as resilience. |
| 27 | Cold start | Ship a generated `currencies.seed.json` (code→name). **Never ship seeded rates** | Makes the picker and metadata work offline from first launch, for ~7 KB. Seeded rates would age with the release and display as real. |

### 4.6 Application structure and presentation

| # | Decision | Choice | Why |
| --- | --- | --- | --- |
| 28 | Navigation | **Single screen + modals, no router** | There is one screen; add-currency, settings and the date picker are transient surfaces. `expo-router` and React Navigation both restructure the repo to serve a single screen. |
| 29 | Styling | **`StyleSheet` + `ThemeContext`** design tokens | Zero dependencies, identical on web, and does not impose a Material look on a minimalistic brief. |
| 30 | Themes | Light / dark / **system (default)** | Requires `app.json` `userInterfaceStyle` to change from `"light"` to `"automatic"`; otherwise iOS is pinned to light and `useColorScheme()` never reports dark. |
| 31 | Rate sub-line | The rate **against the active input currency** — `1 USD = 152.31 JPY`. The active row shows its EUR reference rate instead | It is the rate that produced the number directly above it, which is what "the used exchange rate" means. Always showing the EUR rate would display a rate that was not used whenever the input is not EUR. |
| 32 | Amount input | **Raw text while active** — no live grouping — formatted when inactive. Both `.` and `,` accepted as the decimal separator; the first one typed wins | Live reformatting rewrites the string on every keystroke, and React Native offers no reliable cross-platform cursor control, which is a known source of jumping-cursor bugs. Accepting both separators matters because a German keyboard offers `,` while an iOS numeric keypad may offer `.`. |
| 33 | Reordering | **`react-native-reorderable-list`** (Reanimated 4) | `react-native-draggable-flatlist` is the better-known library but was last published 2025-05-06 and predates Reanimated 4, which SDK 57 ships. Chosen over hand-rolling because it also supplies auto-scroll. |
| 34 | Date picker | `@react-native-community/datetimepicker` + a `.web.tsx` sibling rendering `<input type="date">` | Native feel on both shipping platforms. The package has no web implementation, and Metro's platform-extension resolution keeps the fallback out of the native bundle. |

### 4.7 Localisation

| # | Decision | Choice | Why |
| --- | --- | --- | --- |
| 35 | Scope | **Full UI translation, 25 locales**, defaulting to the system locale | User's explicit call, chosen over a formatting-only setting. |
| 36 | i18n mechanism | Hand-rolled typed `t()` over JSON catalogues | The string set is small. A library adds a dependency and a dependence on `Intl.PluralRules`, whose Hermes support is exactly what decision #38 flags as uncertain. |
| 37 | RTL (`ar`, `he`, `fa`) | **Full mirroring** via `I18nManager` and logical `start`/`end` layout props, with `expo-updates` `reloadAsync()` behind a confirmation when the direction changes | React Native cannot flip layout direction without restarting. An Arabic UI in a left-to-right layout reads as broken to a native speaker, so direction has to actually change. `knip.json` already anticipates `expo-updates`. |
| 38 | Currency names | `Intl.DisplayNames`, guarded, falling back to the provider's English name | Localised names for every ISO code in all 25 locales with no shipped strings. Hermes's `Intl` implementation is partial, and `DisplayNames` throws for non-three-letter codes such as `1inch` — hence the guard, and hence the spike that opens M03. |

## 5. Architecture decisions — open

| Area | Question |
| --- | --- |
| Release | Android `applicationId` and iOS bundle identifier — needed before the first EAS build |
| Release | Signing, distribution channel, and whether over-the-air updates are used beyond the RTL reload |
| Quality | CI — still blocked on there being a git remote |
| Quality | Whether `make check` is enforced by a pre-commit hook |
| Quality | Coverage thresholds |
| Web | `Swipeable` degrades on web, so currency removal is weak in the preview. Acceptable while web is preview-only; revisit if web ever ships |

## 6. System structure

```
src/
  domain/            pure TypeScript, no React imports — unit-tested directly
    money.ts             big.js configuration and construction
    conversion.ts        amount ÷ rate[from] × rate[to]
    formatting.ts        decimal string → grouped, symbolised display string
    parsing.ts           user input string → Big | null
    currencyMetadata.ts  minor units, symbols, country lookup
  data/
    rateSchema.ts        validation of untrusted provider responses
    ratesApi.ts          jsDelivr → Cloudflare fallback, HTTPS only
    storage.ts           AsyncStorage keys, index, LRU eviction
    rateRepository.ts    cache-first orchestration, in-flight dedup
  state/
    PreferencesContext.tsx
    RatesContext.tsx
  i18n/
    index.ts, catalogues/<locale>.json
  theme/
    tokens.ts, ThemeContext.tsx
  ui/                  reusable primitives, no feature knowledge
  features/converter/  screen-level components
assets/
  flags/<cc>.webp      generated, committed
  currencies.seed.json generated, committed
```

**Data flow.** `RatesContext` asks `RateRepository` for a date. The repository consults
`storage`; on a miss it calls `ratesApi`, which tries jsDelivr then the Cloudflare
fallback, and hands the body to `rateSchema` before anything else sees it. A validated
snapshot is persisted and returned. Components never touch `fetch` or AsyncStorage.

**Dependency direction.** `features` → `state` → `data` → `domain`. `domain` depends on
nothing but `big.js`, which is what makes it testable without a renderer.

## 7. Non-functional requirements

| Requirement | Target |
| --- | --- |
| Offline | Full conversion from cached rates, with the staleness visible |
| Network use | One request per date, ever. Typically one per day |
| Cold start | Usable without network from first launch (seeded currency list, empty-rate state) |
| Storage footprint | ≤ ~1 MB of cached rates (180 snapshots), bounded by LRU |
| Bundle | Flag assets under ~500 KB total; measured in M04 |
| Accessibility | Every control labelled; the active row distinguishable by more than colour |
| Localisation | 25 locales, three of them RTL |
| Platforms | Android and iOS; web renders and converts without crashing |

## 8. Open questions

None blocking. The product questions that previously sat here — audience, scope,
offline posture, target platforms — are answered in §1 and §4.

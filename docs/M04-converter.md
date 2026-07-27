# M04 — Rates and the Converter Screen

| | |
| --- | --- |
| **Status** | 📋 Planned |
| **Branch** | `feature/M04-converter` |
| **Started** | — |
| **Completed** | — |

## 1. Goal

Make the app do its job: fetch real rates, cache them permanently per date, and show a
list of currencies converting live from one editable row.

Scope is deliberately bounded to a **fixed** currency list — EUR and USD by default,
with whatever the user has persisted. Adding, removing and reordering are M05.

Success criteria:

1. Rates load from the provider, are validated, and are cached per date.
2. A date is never fetched twice.
3. Editing one row's amount converts every other row.
4. Airplane mode still converts, from the newest cached snapshot, with the staleness
   visible.
5. `make check` passes.

## 2. Commit plan

### Data layer

| # | Commit | Contents |
| --- | --- | --- |
| 1 | `feat(data): rate response validation` | `data/rateSchema.ts`. Asserts an object with a `date` matching `YYYY-MM-DD` and a rate map whose values are finite numbers. **Explicitly rejects a non-JSON body** — the provider's 404 is plain text, so parsing it throws, and that must be a typed failure rather than an exception escaping the repository. |
| 2 | `feat(data): rates API client` | `data/ratesApi.ts`. `https://cdn.jsdelivr.net/...` then `https://{date}.currency-api.pages.dev/...`, HTTPS only, `.min.json` endpoints. Returns a discriminated result (`ok` / `notFound` / `networkError` / `invalid`) rather than throwing. Does not log response bodies. |
| 3 | `feat(data): snapshot storage` | `data/storage.ts`. One AsyncStorage key per date (`rates:v1:YYYY-MM-DD`), plus `rates:v1:index`. LRU eviction at 180 snapshots, newest always pinned. |
| 4 | `feat(data): rate repository` | `data/rateRepository.ts`. Cache-first; in-flight request dedup so two rows mounting at once cause one fetch; the "fetch each date once" rule; `latest` stored under the date the response reports. |

### Assets

| # | Commit | Contents |
| --- | --- | --- |
| 5 | `build: flag asset pipeline` | A one-off script, run in the container, converting `flag-icons` (MIT) SVGs to WebP at a single 2× size. Committed output under `assets/flags/`, plus a **generated** `require()` map — React Native cannot build an asset path at runtime. Provenance and licence recorded in this document and in `LICENSE.md`. Total size measured and recorded in §4. |
| 6 | `build: seed currency list` | Generate and commit `assets/currencies.seed.json` from `…/v1/currencies.min.json`. Never seeded rates — see `MASTER-PLAN` §4.5 #27. |

### State and screen

| # | Commit | Contents |
| --- | --- | --- |
| 7 | `feat(state): preferences and rates contexts` | `PreferencesContext` (theme, language, currency codes and order — persisted) and `RatesContext` (snapshots, selected date, active code, draft amount). Persisted per `MASTER-PLAN` §4.5 #24; the selected date deliberately is not. |
| 8 | `feat(converter): currency row` | `CurrencyRow` — flag, short code, amount, gray rate sub-line, drag handle (inert until M05). Memoised. Uses `start`/`end` layout props from the outset so M06's RTL work is not a rewrite. |
| 9 | `feat(converter): currency list` | `CurrencyList` defaulting to EUR + USD, EUR active at `1`. |
| 10 | `feat(converter): amount editing` | `AmountField`. Active row holds raw text; every other row recomputes through `domain/conversion`. Tapping a row's amount makes it active; the active row is visually highlighted **and** carries an accessibility state, not colour alone. |
| 11 | `feat(converter): rate header` | Rate date, stale/offline chip, loading and error states. The date shown is always the snapshot's own `date`, never an assumed one. |

## 3. Tests

| Area | Cases |
| --- | --- |
| `rateSchema` | Valid body; the literal 404 text body; missing `date`; a rate value that is a string; a rate value that is `null` |
| `ratesApi` | Primary succeeds; primary fails and the fallback succeeds; both fail; 404 surfaces as `notFound`, not `networkError` |
| `storage` | Round-trip; index maintained; LRU evicts the oldest at the cap; the newest snapshot survives eviction pressure |
| `rateRepository` | Cache hit performs **zero** fetches; two concurrent requests for one date cause one fetch; `latest` is stored under the response's date, not the requested one; a cached snapshot for today suppresses the `latest` request; offline returns the newest cached snapshot |
| Screen (RNTL, `await render`) | Editing EUR updates USD; making USD active and editing it updates EUR; the rate sub-line follows the active currency; the header shows the snapshot date |

## 4. Measurements

> To be filled in as the work happens.

| Metric | Target | Actual |
| --- | --- | --- |
| Flag assets, total | < 500 KB | — |
| Cached snapshot size | ~6 KB | — |
| 180-snapshot cache ceiling | ~1 MB | — |

## 5. Deferred

| Item | Why |
| --- | --- |
| Adding, removing, reordering | M05. Keeping the list fixed here means the data path can be proven without gesture handling in the way. |
| Historical dates | M05. The repository supports them from commit 4; only the picker is missing. |
| Localised UI strings | M06. Strings go through `t()` from the first component, so this is catalogue work, not refactoring. |
| RTL mirroring | M06. |

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| Flag bundle size | Measured in §4 before the milestone closes. WebP at a single 2× size; drop to 1× if the budget is exceeded. |
| Flag licence provenance | `flag-icons` is MIT. Recorded in `LICENSE.md` in the same commit that adds the assets, not afterwards. |
| Per-keystroke re-render cost | Rows are memoised and conversion is O(rows). If a device shows lag with many rows, the fallback is to debounce the derived values — not to abandon `Big`. |
| AsyncStorage quota on web | 180 × 6 KB ≈ 1 MB against a 5 MB `localStorage` budget. Comfortable, and the LRU cap is the guarantee. |

## 7. Verification

- [ ] `make check` exits clean
- [ ] Rates load on device and at `localhost:8081`
- [ ] Second launch on the same day performs **no** network request (verified by log)
- [ ] Airplane mode converts from cache and shows the stale indicator
- [ ] Flag asset total recorded in §4

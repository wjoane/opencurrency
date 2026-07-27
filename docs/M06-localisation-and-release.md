# M06 — Localisation, Settings, Polish and Release

| | |
| --- | --- |
| **Status** | 📋 Planned |
| **Branch** | `feature/M06-localisation-and-release` |
| **Started** | — |
| **Completed** | — |

## 1. Goal

Make the app shippable: 25 languages including right-to-left, a settings surface, the
states that only appear when something goes wrong, and a real build.

Success criteria:

1. Every user-visible string comes from a catalogue. No literals in components.
2. Arabic renders in a genuinely mirrored layout.
3. Theme and language are user-controllable and persist.
4. An installable Android build exists.
5. `make check` passes.

## 2. Locales

25, chosen for reach and to cover the three script families in scope:

`en` `de` `fr` `es` `pt-BR` `it` `nl` `pl` `ru` `tr` `uk` `cs` `sv` `da` `fi` `el`
`hi` `id` `th` `vi` `ja` `ko` `zh-Hans` `zh-Hant` — plus the RTL set `ar` `he` `fa`.

> **Translation provenance.** Catalogues are model-generated, not professionally
> translated. This is recorded here so a later reader does not mistake them for
> reviewed copy. UI chrome is short and low-risk, but anything user-facing and
> financial should be reviewed before a public release.

## 3. Commit plan

| # | Commit | Contents |
| --- | --- | --- |
| 1 | `feat(i18n): extract remaining strings` | Audit every component for literals and move them into the `en` catalogue. Done before translation so the key set is stable and the other 24 files are written once. |
| 2 | `feat(i18n): locale catalogues` | The 24 non-`en` catalogues, plus a generated index importing all of them — which is also what keeps `knip` from reporting them as unused files. |
| 3 | `feat(i18n): RTL mirroring` | Audit for `left`/`right` and replace with `start`/`end` throughout. Row order, sheet layouts, the drag handle position and the swipe direction all mirror. |
| 4 | `feat(i18n): direction change and reload` | `I18nManager.allowRTL` / `forceRTL`. When the chosen language crosses the LTR/RTL boundary: persist the pending direction **first**, then confirm with the user, then `Updates.reloadAsync()`. Persisting before reloading is what prevents a half-applied state if the reload fails. Adds `expo-updates`, already anticipated in `knip.json`. |
| 5 | `feat(settings): settings sheet` | The hamburger menu: theme (system/light/dark), language, and provider attribution. |
| 6 | `feat(a11y): labels and states` | Accessibility labels on the drag handle, swipe action, date button and add button. The active row exposes an accessibility state — colour alone is not sufficient. Verified with TalkBack. |
| 7 | `feat(ux): empty, loading and error states` | First-launch-offline (seeded currency list, no rates, explicit message), fetch failure, historical-date failure, and the two-row minimum. |
| 8 | `build: release configuration` | `eas.json` profiles, icons, splash, Android `applicationId`, iOS bundle identifier. **Both identifiers are open decisions — see `MASTER-PLAN` §5; this commit is blocked until they are chosen.** |
| 9 | `docs: finalise documentation` | `README.md` updated for the dependency set and asset-generation scripts; `MASTER-PLAN` §6 and §7 confirmed against what was actually built. |

## 4. Tests

| Area | Cases |
| --- | --- |
| `t()` | Every key in `en` exists in all 24 other catalogues (a test over the catalogue index, so a missed translation fails CI rather than shipping) |
| Formatting under locale | Grouping in `de`, `fr`, `hi`; Latin digits confirmed in `ar` |
| Currency names | `Intl.DisplayNames` result in `ja` and `de`; the guarded fallback for `1inch` and for a runtime without `DisplayNames` |
| Direction | Language change across the LTR/RTL boundary persists the pending direction before requesting a reload |
| Error states | First-launch-offline renders the seeded list and an explicit no-rates message |

## 5. Deferred

| Item | Why |
| --- | --- |
| Professional translation review | §2. Recorded, not hidden. |
| iOS release build | Needs an Apple Developer account, which M01 already deferred. The Android build is the gate for this milestone. |
| Over-the-air updates as a delivery channel | `expo-updates` is added for the RTL reload only. Using it to ship updates is a separate decision — see `MASTER-PLAN` §5. |
| Translated currency names for non-ISO codes | `Intl.DisplayNames` covers ISO-4217. Crypto keeps its English name; translating ~200 crypto names across 25 locales is not worth it. |
| CI | Still blocked on a git remote. |

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| RTL reload loop | Direction is persisted before the reload, and the reload is confirmed by the user rather than automatic. If `reloadAsync` fails, the app is merely un-mirrored until next launch — never stuck. |
| `expo-updates` behaviour under Expo Go | `reloadAsync` works in Expo Go, but this must be verified on a device rather than assumed. If it does not, fall back to a persisted "restart to apply" notice. |
| 25 catalogues drifting out of sync | The key-parity test in §4 makes drift a build failure. |
| Model-generated translations being wrong | Scoped to short UI chrome; amounts, codes and dates are never translated. Flagged in §2 for review. |
| CJK and Arabic glyph coverage | System fonts cover all three families on Android and iOS. No custom font is shipped, which is also why this is low risk. |

## 7. Verification

- [ ] `make check` exits clean
- [ ] Catalogue key-parity test passes for all 25 locales
- [ ] Arabic verified on a physical device: mirrored rows, mirrored swipe, Latin digits
- [ ] Japanese and Hindi render without missing glyphs
- [ ] Theme switching works and persists across a cold start
- [ ] TalkBack can reach and identify every control
- [ ] `make build-android-preview` produces an installable APK
- [ ] Web preview still renders and converts

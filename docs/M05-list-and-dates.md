# M05 — Currency Management and Historical Dates

| | |
| --- | --- |
| **Status** | 📋 Planned |
| **Branch** | `feature/M05-list-and-dates` |
| **Started** | — |
| **Completed** | — |

## 1. Goal

Turn the fixed list from M04 into one the user controls, and let them look backwards.

Success criteria:

1. Any of the provider's ~430 currencies can be added, searched by code or name.
2. Rows can be removed by swiping and reordered by dragging.
3. A past date can be selected; its rates load once and are then permanent.
4. Dates outside `2024-03-02 … today` cannot be selected at all.
5. `make check` passes.

## 2. Gesture design

The three gestures coexist because they are on different axes and different targets:

| Gesture | Target | Axis |
| --- | --- | --- |
| Drag to reorder | The row's **drag handle only** | Vertical |
| Swipe to delete | The rest of the row | Horizontal |
| Tap to activate | The amount | — |

Confining the drag to a dedicated handle is what makes horizontal swipe unambiguous on
the rest of the row. This is the reason the brief's per-row reorder button is kept
rather than adopting whole-row long-press dragging.

## 3. Commit plan

| # | Commit | Contents |
| --- | --- | --- |
| 1 | `build: add gesture, animation and picker dependencies` | `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`, `react-native-reorderable-list`, `@react-native-community/datetimepicker`. All via `make add` so SDK alignment is preserved. `GestureHandlerRootView` wired into the app shell. Verify Expo Go still loads before proceeding. |
| 2 | `feat(currencies): add-currency sheet` | Searchable list over the full provider list (seeded offline, refreshed when fetched). Search matches **both** the code and the localised name. Already-added codes are shown disabled rather than hidden, so the list does not shift under the user. Flag or 💰 per entry. |
| 3 | `feat(currencies): swipe to delete` | `Swipeable` on the row body. Minimum of two rows enforced — the last two rows do not offer the action, rather than offering it and then refusing. Removing the active currency moves activation to the first remaining row. |
| 4 | `feat(currencies): drag to reorder` | `react-native-reorderable-list` driven from the handle. New order persisted immediately. |
| 5 | `feat(dates): date picker` | `DatePicker.tsx` (native) and `DatePicker.web.tsx` (`<input type="date" min max>`), resolved by Metro's platform extensions. `minimumDate = 2024-03-02`, `maximumDate = today`. |
| 6 | `feat(dates): wire date selection` | Selecting a date requests that snapshot through the repository. Cache hits are instant and silent. A failed fetch leaves the current snapshot and header date untouched and shows an explicit error — `MASTER-PLAN` §4.5 #26. |

## 4. Tests

| Area | Cases |
| --- | --- |
| Add sheet | Search by code (`jp` → JPY); search by localised name; already-added entries are non-interactive; a code with no flag renders the fallback |
| Removal | Removing a row updates conversion; the action is unavailable at two rows; removing the active row reassigns activation |
| Reorder | Order persists across a remount |
| Date bounds | The picker cannot produce a date before 2024-03-02 or after today |
| Date selection | A cached past date performs zero fetches; a failed fetch leaves the header date unchanged and surfaces an error |

## 5. Deferred

| Item | Why |
| --- | --- |
| Swipe-to-delete on web | `Swipeable` degrades under `react-native-web`. Web is preview-only per `MASTER-PLAN` §4.2 #1, so this is accepted and recorded rather than worked around. Revisit only if web becomes a product surface. |
| Drag auto-scroll verification | Provided by the library. Only matters past ~12 rows; confirmed during manual verification, not designed for separately. |
| Favourites, grouping, or a recently-used section in the picker | Not in scope. A flat searchable list over 430 entries is adequate and keeps the sheet minimal. |

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| `react-native-reorderable-list` is 0.x | Pinned via `package-lock.json`. The integration surface is one component and one handle, so a breaking change is contained. |
| Reanimated 4 / Expo Go mismatch | Commit 1 verifies Expo Go loads before any feature work depends on it. Reanimated 4.5.3 declares `react-native: 0.83 - 0.86`, and the project is on 0.86. |
| Swipe and drag fighting each other | Structurally avoided by the handle (§2). Verified manually on a device, since gesture conflicts do not reproduce in tests. |
| 430-row list performance in the picker | Virtualised list plus memoised rows. Search filters before render. |

## 7. Verification

- [ ] `make check` exits clean
- [ ] Expo Go still loads the app after the native dependencies are added
- [ ] Swipe-delete and drag-reorder both work on a physical device without interfering
- [ ] The date picker refuses 2024-03-01 and refuses tomorrow
- [ ] Selecting a previously viewed past date performs no network request
- [ ] Web preview renders and converts; swipe-delete degradation confirmed as the only loss

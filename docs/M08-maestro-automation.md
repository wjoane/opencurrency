# M08 — Maestro mobile automation

> **Status:** In progress — EAS/GitHub connection and first cloud run pending

## Goal

Protect the essential Android converter journey with one maintainable Maestro smoke
flow. The flow must run locally against an installable APK and, after the project owner
connects GitHub to EAS, run in managed CI on every push to `main`.

The approved scope is deliberately one smoke test. Broader end-to-end coverage and the
existing Jest suite are not part of this CI workflow.

## Decisions

1. **Application identity:** Automation targets the package currently declared by the
   app, `me.wjoane.opencurrency`. Whether that identifier is the permanent release
   identity remains a release-owner decision; M08 does not change it.
2. **Test signing:** The `e2e-test` EAS profile builds an Android APK with
   `withoutCredentials: true`. Automation neither reads nor changes production signing
   credentials.
3. **Local runner:** Android Studio's emulator, ADB, Java, and Maestro CLI run on the
   host as a narrow exception to the Docker-only application-development policy. Node,
   npm, Expo CLI, and application development continue to run only in Docker.
4. **Cloud runner:** EAS Workflows builds the APK and runs its pre-packaged Maestro job
   on a managed Android emulator. This avoids maintaining an Android emulator inside a
   GitHub Actions runner.
5. **Trigger:** `.eas/workflows/android-smoke.yml` runs only for pushes to `main`.
   Pull-request execution is deferred.
6. **Selectors:** Flows prefer visible text and existing accessibility labels. A
   dedicated identifier should be added only when a demonstrated selector problem
   cannot be addressed through an existing public accessibility surface.
7. **Assertions:** The flow may assert stable currency precision and row identity but
   never an exact live exchange-rate result or provider date.
8. **Initial matrix:** Local verification uses a Pixel 3a Android API 30 emulator in
   English. Cloud verification uses the EAS Maestro job's managed Android environment.

## Implemented

- `.maestro/smoke.yaml` launches from cleared application state and waits for the
  converter header.
- The flow verifies the default EUR and USD rows and the Settings control.
- It enters `100` into the EUR amount field and verifies that the US Dollar row shows
  a numeric value with two decimal places, without coupling the assertion to a daily
  exchange rate.
- `.artifacts/` is ignored so locally downloaded APKs cannot be committed.
- `eas.json` contains a credential-free `e2e-test` profile that produces an APK.
- `.eas/workflows/android-smoke.yml` builds from the pushed `main` commit and passes
  that exact build to the Maestro smoke job.
- The smoke flow was reported passing locally on the Pixel 3a API 30 emulator on
  2026-08-13.

## Project-owner actions pending

These steps require the project owner's Expo and GitHub access and are intentionally
not performed from the repository configuration:

1. Confirm that the existing EAS project belongs to the intended Expo account.
2. Install/authorize the Expo GitHub App for `wjoane/opencurrency`.
3. Connect that repository to EAS project
   `caa442bb-3c13-480c-a76f-4e6f93e22f98` with `/` as the project root.
4. Confirm that the account's EAS plan and usage allowance can run the Android build
   and Maestro jobs.
5. After the workflow is present on `main`, trigger its first run with a new push or
   run it manually against `main`. GitHub events that occurred before the connection
   are not replayed.

No password, access token, API key, keystore, or signing material belongs in Git.

## Local workflow

Local runs require a booted Android emulator, the installed standalone APK, Java 17 or
newer, ADB, and Maestro CLI:

```sh
adb devices
adb shell pm path me.wjoane.opencurrency
maestro test .maestro/smoke.yaml
```

The local APK belongs under `.artifacts/android/` or outside the repository. Its EAS
build URL or build ID should be retained separately for provenance.

## Verification and acceptance criteria

Verification performed on 2026-08-13:

- The Maestro smoke flow passed locally on the Pixel 3a API 30 emulator.
- Lint, formatting, type checking, and knip passed in Docker.
- The full `make check` did not pass because three Jest tests outside M08's modified
  files failed: two coverage runs timed out on the local machine, and the XAU
  formatting fixture expected `oz` while the bundled application data contains `oz `.
  M08 does not change those product tests or data; their owner will resolve them
  separately.

Acceptance criteria for completing the milestone:

- `make check` passes.
- The checked-in flow passes locally from cleared application state.
- The `e2e-test` profile produces an installable APK without production credentials.
- A push to connected `main` builds that commit and runs `.maestro/smoke.yaml` in EAS.
- A smoke failure makes the EAS workflow fail and exposes useful logs/artifacts.
- No secrets, signing materials, APKs, emulator data, or generated reports are
  committed.

The milestone remains in progress until the first connected cloud run passes.

## Deferred

- **Jest and repository quality gates in CI:** deliberately excluded at the automation
  owner's request. They remain manual through `make check`.
- **Pull-request trigger:** begin with the requested push-to-`main` behavior; consider
  adding PR protection after the first cloud run is stable.
- **Additional Maestro journeys:** currency management, settings, gestures, historical
  dates, offline behavior, and broader locale/theme coverage are outside the approved
  smoke scope.
- **iOS Maestro execution:** Android is the only M08 automation target.
- **Production signing and store distribution:** the credential-free test build does
  not settle either release decision.

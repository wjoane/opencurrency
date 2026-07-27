# M01 — Development Environment

| | |
| --- | --- |
| **Status** | ✅ Complete — pending local verification (see [Verification](#7-verification)) |
| **Started** | 2026-07-27 |
| **Completed** | 2026-07-27 |
| **Commits** | `19b8803` initial setup · `44c1d5a` Makefile |

## 1. Goal

Stand up a fully containerised development environment for the Expo app, plus a
blank placeholder screen. **No application features.**

Success criteria:

1. A fresh clone runs with nothing installed but **docker, docker-compose and git**.
2. The app can be previewed on this machine.
3. The app runs on a physical Android device.
4. Hot reload works in both.
5. Image versions are pinned, not floating on `latest`.
6. `README.md` documents the setup.

## 2. Environment facts

Established by inspection before any decisions were made:

| Fact | Value | Consequence |
| --- | --- | --- |
| Docker | 29.1.3 | — |
| Compose | standalone `docker-compose` v2.29.7 | The `docker compose` **plugin is not installed**. All docs and tooling must use the hyphenated form. |
| Host user | `uid=1000(wjoane) gid=1000(wjoane)`, in `docker` group | Matches the `node` user in official Node images exactly — no uid remapping needed. |
| Host `make` | GNU Make 4.3 | Makefile shortcuts are viable. |
| Node Active LTS | 24.18.0 "Krypton" (until Oct 2026) | Node 26 is *Current*, not LTS. |
| Expo current SDK | 57 (RN 0.86, React 19.2) | Expo Go on the Play Store supports only the newest SDK, so device testing effectively requires staying current. |
| Repo | git repo on `main`, zero commits, no remote | Nothing to preserve. |

## 3. Decisions

Each was put to the user explicitly. Rationale is recorded because several of these
will look arbitrary in six months.

| # | Decision | Choice | Why |
| --- | --- | --- | --- |
| 1 | Device networking | `network_mode: host` | Metro must advertise an address the phone can route to. By default it advertises the container IP (`172.x.x.x`), which is unreachable. Host networking makes LAN mode behave exactly as if Node were installed natively — no port mapping, no `REACT_NATIVE_PACKAGER_HOSTNAME`, no breakage when the DHCP lease changes. **Cost: Linux-only**; degrades silently under Docker Desktop (macOS/Windows workaround documented in the README). |
| 2 | Expo CLI | Local `npx expo`, no global CLI | The globally installed `expo-cli` package the brief originally asked for is **deprecated and incompatible with SDK 50+**. The modern CLI ships inside the `expo` package, so its version is pinned by the lockfile and can never drift from the SDK. |
| 3 | Base image | `node:24-alpine` | User's call, overriding an initial `-bookworm-slim` recommendation. Pinned to the **Node 24 major line**: patch and security updates arrive on rebuild, but it will never jump to Node 26 when that becomes LTS in Oct 2026. A fully floating `lts-alpine` was rejected as being the same hazard as `latest`. **Cost: musl** — see [Risks](#8-known-risks). |
| 4 | `node_modules` location | Host filesystem, via the bind mount | On native Linux, bind-mount I/O is near-native, so the usual macOS performance argument doesn't apply. The decisive factor is that host-side editor tooling (TypeScript language server, go-to-definition) needs the type declarations to physically exist. |
| 5 | Container user | `user: "node"` (uid/gid 1000) | Exactly matches the host account, so everything written into the bind mount stays owned by the user. No `.env`, no build args, no `sudo rm -rf node_modules`. |
| 6 | Repo layout | App at repo root | Matches `create-expo-app` output verbatim, so every Expo doc and error message applies unmodified. A backend, if ever needed, can be added as a `server/` sibling without moving the app. |
| 7 | Local testing | React Native Web preview at `localhost:8081` | The only way to see a running app on this machine without an Android toolchain, preserving the docker-only prerequisite. Costs three dependencies. The phone remains the source of truth for anything platform-sensitive. |
| 8 | Template | `blank-typescript` | Matches "blank placeholder"; TypeScript from commit one, because retrofitting it later is a manual migration — and a converter juggling currency codes, rates and amounts is exactly where types pay off. |
| 9 | Dependency install | Entrypoint runs `npm ci` when `node_modules/expo` is absent | Delivers the literal promise: clone → `docker-compose up` → running. Uses `npm ci` strictly, so the lockfile stays authoritative. |
| 10 | Run mode | `docker-compose up` with `stdin_open` + `tty` | Expo's interactive terminal UI (`r` reload, `w` web, `j` debugger) requires a TTY on stdin. Without these flags the QR still prints and hot reload still works, but every keyboard shortcut is dead. |
| 11 | Verification scope | Author the files; user verifies by running | User's explicit call. Consequence in [§5](#5-execution-log). |
| 12 | Task runner | `Makefile` wrapping docker-compose | Requested after the initial setup. Makes `make` a *fourth* prerequisite, so it is documented as optional and every target's raw `docker-compose` equivalent is published in the README. |
| 13 | EAS CLI delivery | `npx --yes eas-cli@21.3.0`, on demand | Keeps decision #2 intact (nothing global in the image) while still pinning the version. Only release builds need it, so baking it in would be dead weight. |

## 4. What was implemented

```
.
├── Makefile                # grouped, self-documenting task shortcuts
├── Dockerfile              # node:24-alpine + libc6-compat + git, runs as node
├── docker-compose.yml      # host networking, bind mount, TTY, named volumes
├── docker/entrypoint.sh    # POSIX sh; npm ci on first start
├── .dockerignore
├── .gitignore              # Expo's, plus .env*, docker-compose.override.yml
├── README.md
├── App.tsx  index.ts  app.json  tsconfig.json  assets/
├── package.json  package-lock.json
└── docs/                   # this documentation
```

Scaffolded dependency versions:

| Package | Version |
| --- | --- |
| `expo` | ~57.0.8 |
| `react-native` | 0.86.0 |
| `react` / `react-dom` | 19.2.3 |
| `expo-status-bar` | ~57.0.1 |
| `react-native-web` | ^0.21.2 |
| `@expo/metro-runtime` | ~57.0.7 |
| `typescript` | ~6.0.3 |
| `@types/react` | ~19.2.2 |

Notable implementation details:

- **`entrypoint.sh` probes `node_modules/expo`, not `node_modules`** — a partially
  populated directory should still trigger a reinstall.
- **The entrypoint is POSIX `sh`** — Alpine ships busybox, not bash.
- **Dependencies are not baked into the image.** They can't be: the bind mount at
  `/workspace` would shadow anything installed there at build time.
- **Two named volumes** — `npm-cache` (`/home/node/.npm`) so reinstalls aren't
  redownloads, and `expo-state` (`/home/node/.expo`) so an `eas login` survives
  `docker-compose run --rm`.
- **`git` is installed in the image** because EAS Build archives the project via git.
- **`make clean` deliberately keeps the volumes**; only `make reset` discards the npm
  cache and EAS credentials. Losing a login as a side effect of "clean build output"
  would be a nasty surprise.

## 5. Execution log

1. Scaffolded via a single throwaway container:
   `docker run --rm --user node -v "$PWD":/workspace -w /workspace node:24-alpine npx create-expo-app@latest . --template blank-typescript`.
   - **`--user node`, not `-u 1000`**: with a bare numeric uid, Docker leaves `HOME=/`,
     which npm cannot write to.
2. Added web-preview dependencies with `npx expo install react-dom react-native-web @expo/metro-runtime`.
3. Renamed the project. `create-expo-app` derives the name from the working
   directory, so it produced **`workspace`** in both `package.json` and `app.json`.
   Corrected to `opencurrencyconverter` / "Open Currency Converter", then regenerated
   the lockfile with `npm install --package-lock-only`.
4. Set `web.bundler: "metro"` explicitly in `app.json` (it is the default, but being
   explicit costs nothing).
5. Wrote the Docker files, merged the Docker entries into Expo's generated
   `.gitignore` rather than overwriting it, and wrote the README.
6. Committed as `19b8803`.
7. Added the `Makefile`, the `git` package, and the `expo-state` volume; expanded the
   README. Committed as `44c1d5a`.

### Scaffold artefacts kept

`create-expo-app` also emitted `AGENTS.md`, `CLAUDE.md`, `LICENSE` (MIT) and
`.claude/settings.json`. These were left in place — flagged here rather than silently
kept, since none were requested.

## 6. Deferred

| Item | Why |
| --- | --- |
| **Any application feature** | Explicitly out of scope. `App.tsx` remains the untouched placeholder. |
| **Android emulator in Docker** | Considered and rejected: multi-GB image, `/dev/kvm` passthrough, brittle GPU/VNC setup, adb bridging. A project in its own right. Physical device + web preview cover the need. |
| **`eas.json` and a real EAS build** | Targets exist but have never been run. No Expo account is linked and **no Android application ID has been chosen**. `make eas-configure` will prompt for these on first use. |
| **iOS** | Needs an Apple Developer account. Not wired up. |
| **Linting / formatting** | No ESLint or Prettier. Deferred to a quality milestone. |
| **Testing** | No test runner, no tests. Deferred. |
| **CI** | Nothing. Deferred. |
| **`network_mode: host` portability** | macOS/Windows are unsupported by the default config. A `docker-compose.override.yml` recipe is documented in the README instead of being shipped. |
| **Digest-pinned base image** | Rejected as overkill for a dev image; it would also freeze out Alpine security patches. |

## 7. Verification

Per decision #11, nothing was executed beyond authoring the project.

**Verified statically:**

- `docker-compose config` parses.
- `make help` renders; the `PKG` guard errors correctly on `make add` with no argument.
- Every asset referenced by `app.json` exists on disk.
- `node_modules` is git-ignored.
- All scaffolded files are owned by `wjoane:wjoane`, not `root` — confirming
  decision #5 works.
- `npm install` and `npx expo install` both completed cleanly inside
  `node:24-alpine`, so the dependency tree at least *resolves* under musl.

**Not verified — outstanding for the user:**

```bash
make image      # build the image
make up         # first start runs npm ci (~1-2 min)
```

- [x] Image builds without musl errors — **confirmed 2026-07-27** during M02; the
      full JS toolchain (npm, Expo CLI, ESLint, Jest) also runs on musl
- [ ] Metro starts and prints a QR with the host's LAN IP
- [ ] `http://localhost:8081` renders the placeholder screen
- [ ] Editing the `<Text>` in `App.tsx` updates the browser with **no manual refresh**
- [ ] Expo Go on Android (same Wi-Fi) loads the app from the QR code
- [ ] The same edit propagates to the device
- [ ] `make typecheck` exits clean

## 8. Known risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| ~~**Alpine/musl breakage**~~ | **Closed 2026-07-27.** The image builds and npm, the Expo CLI, ESLint, Prettier, knip and Jest all run under musl. `libc6-compat` remains installed. Metro itself is still unexercised, but the risk is now small. | — |
| **Phone cannot reach Metro** | Moderate — firewalls, AP isolation and VPNs all cause it | README troubleshooting covers ufw, AP isolation and VPNs; `make tunnel` is the universal fallback. |
| **Fast Refresh silently not firing** | Low | Usually the host's `fs.inotify.max_user_watches` limit — a *host* sysctl, so it can't be fixed from inside the container. Documented in the README. |
| **Expo Go tracks only the newest SDK** | Certain, eventually | Device testing will force SDK upgrades on Expo's cadence. Budget for periodic `expo install --fix` work. |

## 8a. Defects found after completion

| Date | Defect | Fix |
| --- | --- | --- |
| 2026-07-27 | The `expo-state` and `npm-cache` named volumes mounted onto `/home/node/.expo` and `/home/node/.npm`, **neither of which exists in `node:24-alpine`**. Docker only inherits ownership from the image when the mount point already exists; otherwise it creates it `root:root`. The `node` user could not write, and every `expo install` failed with `EACCES`. | `Dockerfile` now creates both directories owned by `node` before `USER node`. Found in [M02](./M02-quality-tooling.md) §5.1 — static review had missed it because the volumes were never exercised. |

## 9. Follow-ups

- [ ] Run the verification checklist in [§7](#7-verification) and record the outcome here.
- [ ] Decide whether the scaffold's `LICENSE`, `AGENTS.md`, `CLAUDE.md` and
      `.claude/settings.json` should stay.
- [ ] Fill in [`MASTER-PLAN.md`](./MASTER-PLAN.md) before starting M02 — in particular
      the exchange-rate provider and the money-representation decision, both of which
      constrain everything downstream.

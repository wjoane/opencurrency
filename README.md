# Open Currency Converter

A React Native currency-exchange app built with [Expo](https://expo.dev).

Right now this repository contains **only the development environment plus a blank
placeholder screen** — no app features yet. The point of this stage is that a fresh
clone runs, hot-reloads, and works on a real Android phone without installing a
JavaScript toolchain on your machine.

---

## Prerequisites

You need exactly three things:

| Tool | Notes |
| --- | --- |
| **Docker** | Tested with 29.1.3 |
| **docker-compose** | Standalone v2 binary (`docker-compose`, with a hyphen) |
| **git** | Any recent version |
| **make** | *Optional.* Only for the `make` shortcuts; every one has a plain `docker-compose` equivalent |

Everything else — Node.js, npm, the Expo CLI, Metro — runs inside the container.
There is **no** need to install Node on your machine, and no `nvm`, no global
`expo-cli`.

> **Linux only.** The dev server uses `network_mode: host` so that Expo advertises
> your machine's real LAN IP to your phone. This mode is a no-op on Docker Desktop
> for macOS and Windows; see [Running on macOS or Windows](#running-on-macos-or-windows).

Your user should be in the `docker` group so you can run Docker without `sudo`:

```bash
groups | grep -q docker || sudo usermod -aG docker "$USER"   # then log out and back in
```

---

## Quick start

```bash
git clone <repo-url> opencurrencyconverter
cd opencurrencyconverter
make up          # or: docker-compose up
```

The **first run** does two extra things, so give it a few minutes:

1. Builds the image (downloads `node:24-alpine`).
2. Runs `npm ci` inside the container to populate `node_modules/`. You'll see
   `[setup] node_modules is missing - running 'npm ci'...` — this is expected and
   happens only once.

When it's ready you'll see a QR code and a line like:

```
› Metro waiting on exp://192.168.1.42:8081
```

Stop the server with `Ctrl-C`, or `make down` from another terminal.

> Don't use `docker-compose up -d`. The service is configured with a TTY so that
> Expo's interactive keyboard shortcuts work; detaching throws that away.

---

## Testing in your browser

With the server running, open:

```
http://localhost:8081
```

You should see the placeholder screen. You can also press **`w`** in the Expo
terminal to trigger the web build.

This renders the app through
[React Native Web](https://necolas.github.io/react-native-web/). It's the fastest
feedback loop and needs no Android tooling, but it is not a perfect substitute for
native — **the phone is the source of truth** for anything layout- or
platform-sensitive.

---

## Testing on an Android device

1. Install **[Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)**
   from the Play Store.
2. Connect the phone to the **same Wi-Fi network** as this machine.
3. Run `docker-compose up`.
4. Scan the QR code from the terminal with Expo Go (or the Android camera app).

The phone connects to `exp://<your-LAN-IP>:8081`. Because the container shares the
host network stack, this is the same address it would use if Node were installed
natively.

If the phone can't connect, see [Troubleshooting](#troubleshooting).

---

## Hot reload

Fast Refresh is on by default. Save any file under the project — `App.tsx`, for
example — and the change appears in the browser and on the phone within a second,
without losing component state.

Useful keys in the Expo terminal:

| Key | Action |
| --- | --- |
| `r` | Force a full reload |
| `w` | Open/build the web version |
| `j` | Open the JS debugger |
| `m` | Toggle the dev menu on connected clients |
| `?` | Show all commands |

---

## Common commands

Everything runs inside the container. The `Makefile` is a thin convenience layer —
run `make` with no arguments for the full list:

```bash
make            # or: make help
```

The Makefile is entirely optional; each target is one `docker-compose` line, shown
below so you can type it directly if you'd rather not install `make`. Note the
hyphen throughout: `docker-compose`, not `docker compose`.

### Development

| Command | Equivalent | Does |
| --- | --- | --- |
| `make up` | `docker-compose up` | Start the dev server (browser + phone) |
| `make down` | `docker-compose down` | Stop and remove containers |
| `make restart` | *(down, then up)* | Restart the dev server |
| `make logs` | `docker-compose logs -f app` | Tail the dev server logs |
| `make image` | `docker-compose build` | Rebuild the image after editing the Dockerfile |
| `make install` | `docker-compose run --rm app npm ci` | Install deps from the lockfile |
| `make shell` | `docker-compose run --rm app sh` | Shell into the container |
| `make clear` | `… npx expo start --clear` | Start with a cleared Metro cache |
| `make tunnel` | `… npx expo start --tunnel` | Start over Expo's tunnel (works off-LAN) |

### Dependencies

| Command | Equivalent | Does |
| --- | --- | --- |
| `make add PKG=axios` | `… npx expo install axios` | Add a runtime dep at the SDK-compatible version |
| `make add-dev PKG=eslint` | `… npm install --save-dev eslint` | Add a dev dependency |
| `make check-deps` | `… npx expo install --check` | Report packages that don't match the SDK |
| `make fix-deps` | `… npx expo install --fix` | Realign packages with the SDK |

Always prefer `make add` over a bare `npm install` — `expo install` picks the
version that matches the current SDK instead of the newest one on npm.

After anything that changes `package.json`, commit the updated
`package-lock.json` too — the container's startup `npm ci` depends on it.

### Quality

`make check` runs every gate below and is the Definition of Done for a change.

| Command | Equivalent | Does |
| --- | --- | --- |
| `make check` | *(all of the below)* | **Run every quality gate** |
| `make test` | `… npm test` | Run the Jest test suite |
| `make test-watch` | `… npm run test:watch` | Tests in watch mode |
| `make typecheck` | `… npm run typecheck` | Run the TypeScript compiler |
| `make lint` | `… npm run lint` | Run ESLint |
| `make lint-fix` | `… npm run lint:fix` | ESLint with auto-fix |
| `make format` | `… npm run format` | Rewrite files with Prettier |
| `make format-check` | `… npm run format:check` | Fail if anything is unformatted |
| `make knip` | `… npm run knip` | Report unused files, exports and dependencies |
| `make doctor` | `… npx expo-doctor` | Diagnose common project problems |

Tests use Jest with the `jest-expo` preset and React Native Testing Library, and
live next to the code they cover as `<name>.test.ts` / `<name>.test.tsx`.

> **`render` is async.** React Native Testing Library v14 returns a Promise from
> `render`, because React 19 made `act` async. `await render(<App />)` — the
> older synchronous pattern silently yields undefined queries.

Prettier formats code but **not Markdown**: it pads table cells to equal width,
which pushes doc lines past 400 characters.

### Housekeeping

| Command | Does |
| --- | --- |
| `make clean` | Remove containers and build output (`dist/`, `.expo/`). Keeps the npm cache and your EAS login |
| `make reset` | Full wipe — also removes the Docker volumes (npm cache, **EAS login**) and `node_modules`. The next `make up` reinstalls from the lockfile |

---

## Production builds

### Web

The web target builds entirely in Docker and needs no account or extra tooling:

```bash
make export-web    # static bundle -> dist/
make serve-web     # preview it at http://localhost:3000
```

`dist/` is a plain static site — deploy it to any static host.

### Android

Native binaries can't be produced by this image; a real Android build needs the
Android SDK and Gradle. The supported route is **[EAS Build](https://docs.expo.dev/build/introduction/)**,
Expo's cloud build service, driven from the container via a pinned `eas-cli`.

Requires a free [Expo account](https://expo.dev/signup). One-time setup:

```bash
make eas-login       # credentials persist in the expo-state Docker volume
make eas-configure   # creates eas.json and links the project to EAS
```

Then:

| Command | Produces |
| --- | --- |
| `make build-android-preview` | An installable **APK** — sideload it onto a device for testing |
| `make build-android` | A **AAB** for Play Store submission |

Builds run on Expo's servers; the CLI prints a URL to watch progress and download
the artifact. Free-tier builds queue and can take a while.

> **Not yet exercised.** No EAS build has been run from this repo, so `eas.json`
> doesn't exist yet and no Android application ID has been chosen. Expect
> `make eas-configure` to ask a few first-time questions. iOS builds additionally
> require an Apple Developer account and are not wired up.

---

## Troubleshooting

### The phone can't connect / the QR code times out

Work through these in order:

1. **Same network?** Phone and machine must be on the same Wi-Fi subnet. Phone on
   cellular data will never work in LAN mode.
2. **Firewall.** Port 8081 must be reachable from the LAN:
   ```bash
   sudo ufw allow 8081/tcp     # if you use ufw
   ```
3. **AP isolation.** Many guest and hotel networks block device-to-device traffic
   entirely. There is no fix from this side — use the tunnel fallback below.
4. **VPN.** An active VPN on either device can black-hole LAN traffic.

**Tunnel fallback** — routes through Expo's relay, works from any network
including cellular, at the cost of noticeably slower reloads:

```bash
docker-compose run --rm app npx expo start --tunnel
```

### Changes aren't hot-reloading

The file watcher may be hitting the host's inotify limit (this is a kernel
setting, so it must be raised on the host, not in the container):

```bash
cat /proc/sys/fs/inotify/max_user_watches      # often 8192, too low for node_modules

echo 'fs.inotify.max_user_watches=524288' | sudo tee /etc/sysctl.d/60-inotify.conf
sudo sysctl --system
```

Then restart the dev server.

### Weird bundling errors, or a stale-looking app

```bash
docker-compose run --rm app npx expo start --clear
```

If that doesn't help, nuke and reinstall dependencies:

```bash
make reset      # removes node_modules and build output
make up         # the entrypoint reinstalls automatically
```

### Files are owned by `root`

The container runs as uid/gid **1000**. If your host account isn't 1000
(check with `id -u`), override it:

```yaml
# docker-compose.override.yml  (git-ignored, local to your machine)
services:
  app:
    user: "1001:1001"     # your own id -u : id -g
```

### `docker compose` says "unknown command"

This project uses the **standalone** Compose binary. Use `docker-compose` (hyphen)
everywhere, not the `docker compose` plugin subcommand.

### Running on macOS or Windows

`network_mode: host` doesn't work under Docker Desktop's VM. Add a
`docker-compose.override.yml` that maps the port and tells Expo which address to
advertise:

```yaml
services:
  app:
    network_mode: bridge
    ports:
      - "8081:8081"
    environment:
      REACT_NATIVE_PACKAGER_HOSTNAME: "192.168.1.42"   # your machine's LAN IP
```

---

## Version pinning

Versions are pinned deliberately rather than floating on `latest`:

| What | Pinned where | Current |
| --- | --- | --- |
| Node.js | `Dockerfile` → `FROM node:24-alpine` | 24.x (Active LTS until Oct 2026) |
| Expo SDK | `package.json` → `expo` | 57.x |
| React Native | `package.json` → `react-native` | 0.86.x |
| Everything else | `package-lock.json` (committed) | exact |

The Node tag tracks the **24 major line only**: you get security patches on
rebuild, but it will never jump to Node 26 on its own.

The Expo CLI is deliberately *not* installed globally. It comes from the local
`expo` package, so the CLI version always matches the SDK version in the lockfile.
Invoke it with `npx expo`. (The old global `expo-cli` package is deprecated and
does not work with modern SDKs.)

`eas-cli` is pinned in the `Makefile` (`EAS := npx --yes eas-cli@21.3.0`) and
fetched on demand rather than baked into the image, since it's only needed for
release builds.

To upgrade the SDK:

```bash
make add PKG=expo@latest
make fix-deps
```

Note that **Expo Go on the Play Store only supports the newest SDK**, so testing on
a device effectively requires staying current.

---

## Project structure

```
.
├── Makefile                # shortcuts for everything below
├── Dockerfile              # Node 24 Alpine dev image
├── docker-compose.yml      # dev server service (host networking, TTY)
├── docker/
│   └── entrypoint.sh       # auto-installs deps on first start
├── docs/                   # plans and milestone records (see below)
├── App.tsx                 # the placeholder screen
├── index.ts                # registers the root component
├── app.json                # Expo app config
├── tsconfig.json           # TypeScript (strict)
├── assets/                 # icons and splash images
└── package.json
```

---

## Documentation

Planning and progress live in [`docs/`](./docs):

| File | Contains |
| --- | --- |
| [`docs/MASTER-PLAN.md`](./docs/MASTER-PLAN.md) | Architecture decisions, system structure, milestone index |
| `docs/M<NN>-<name>.md` | One per milestone: implementation steps, live progress, what was implemented vs. deferred |
| [`AGENTS.md`](./AGENTS.md) | Conventions for anyone — human or agent — writing code here |

Start with the master plan. Milestone files are numbered incrementally and are
never renumbered.

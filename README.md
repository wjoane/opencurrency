<p align="center">
  <img src="./assets/icon.png" alt="Open Currency logo" width="128" />
</p>

<h1 align="center">Open Currency</h1>

<p align="center">
  A calm, open-source multi-currency converter for Android and iOS.
</p>

<p align="center">
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white" alt="Expo SDK 57" /></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black" alt="React Native 0.86" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript strict mode" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-required-2496ED?logo=docker&logoColor=white" alt="Docker required" /></a>
  <a href="./LICENSE.md"><img src="https://img.shields.io/badge/License-GPL--3.0--or--later-3DA639" alt="GPL-3.0-or-later license" /></a>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#contributing">Contributing</a> ·
  <a href="#documentation">Documentation</a>
</p>

---

Open Currency makes it easy to compare several currencies at once. Enter an amount
in any row and every other row updates from it. The app uses transparent daily
reference rates, clearly shows their date, and continues to work from cached data
when you are offline.

It is a calculator, not a bank, exchange, wallet, or trading platform. Rates are
for reference and can differ from the rates offered by banks, card issuers, and
exchange services.

## Features

| ✨ | What it means |
| --- | --- |
| **Multi-currency input** | Type into any currency row and compare every selected currency at once. |
| **Historical and offline rates** | Choose a supported past date; snapshots are cached per date and remain usable offline. |
| **Money you can trust** | Conversion and formatting use exact decimal arithmetic, ISO minor units, and validated provider responses. |
| **Made for everyday use** | Add, remove, and reorder currencies; choose light, dark, or system theme. |
| **Global by design** | Full UI translation for 27 locales, including live right-to-left layout mirroring. |
| **Open and private** | No account, API key, or proprietary backend is needed. |

## Quick start

The development environment is fully containerised. You need Docker, Docker Compose
(plugin or standalone binary), Git, and optionally `make`. Do not install Node.js,
npm, or the Expo CLI on the host.

```bash
git clone <repository-url> opencurrency
cd opencurrency
make up
```

On the first run, Docker builds the image and installs dependencies inside the
container. When Expo prints its QR code, open `http://localhost:8081` for the web
preview or scan the code with [Expo Go](https://expo.dev/go) on a phone connected to
the same Wi-Fi network.

If `make` is unavailable, run `docker-compose up` instead. The Makefile automatically
uses `docker compose` when that plugin is installed.

## Daily development

| Command | Purpose |
| --- | --- |
| `make up` | Start the Expo development server for browser and device testing. |
| `make down` | Stop the development containers. |
| `make test` | Run the Jest test suite. |
| `make check` | Run linting, formatting, type checks, unused-code checks, and coverage. |
| `make export-web` | Export a static web preview to `dist/`. |

`make check` is the required quality gate for every change. It runs entirely in
Docker and is the fastest way to verify a contribution before opening a pull request.

## How it works

```text
currency provider → response validation → persistent rate cache → exact conversion → converter screen
                         └─ jsDelivr fallback: currency-api.pages.dev
```

- Rates are fetched over HTTPS from
  [`@fawazahmed0/currency-api`](https://github.com/fawazahmed0/currency-api), with a
  fallback host and shape validation before data enters the app.
- Rates use EUR as their reference. A conversion is calculated on-device as
  `amount ÷ rate[from] × rate[to]`.
- Monetary values use [`big.js`](https://mikemcl.github.io/big.js/) rather than
  JavaScript floating-point arithmetic.
- A dated seed snapshot makes first launch usable even without a network connection.

## Contributing

Contributions that improve correctness, accessibility, localisation, resilience, and
the focused conversion experience are welcome. Before starting a larger change, read
the [master plan](./docs/MASTER-PLAN.md) and check its open decisions; please do not
silently make an architectural choice that remains deliberately open.

1. Create a branch with a focused, descriptive name.
2. Keep domain logic in plain TypeScript and test it next to the code it covers.
3. Update the relevant documentation when behaviour or an architectural decision changes.
4. Run `make check`.
5. Open a pull request explaining the user-facing outcome and how you verified it.

The project uses strict TypeScript, Jest, React Native Testing Library, ESLint,
Prettier, and knip. See [AGENTS.md](./AGENTS.md) for the complete engineering,
testing, security, and documentation conventions.

## Project map

```text
src/
  domain/      pure money, conversion, parsing, and formatting rules
  data/        provider client, response validation, cache, and repository
  state/       preferences and rates contexts
  i18n/        typed translation layer and locale catalogues
  theme/       design tokens and theme provider
  ui/          reusable primitives
  features/    converter and settings screens
```

The dependency direction is `features → state → data → domain`. This keeps UI,
networking, storage, and monetary rules independently understandable and testable.

## Documentation

| Document | Start here when you want to… |
| --- | --- |
| [Master plan](./docs/MASTER-PLAN.md) | Understand product scope, architecture, and outstanding decisions. |
| [Brand guidelines](./docs/BRANDING.md) | Use the product voice and visual identity consistently. |
| [API notes](./docs/API.md) | Understand the exchange-rate provider and fallback requirements. |
| [Milestone records](./docs/) | See implementation progress, rationale, and deferrals. |

## Release status

The first-version app is feature-complete. Android and iOS release builds still need
operational verification; this repository does not yet publish a store build. The web
target is a local development preview, not a supported production surface.

## License

Open Currency is licensed under the [GNU General Public License v3.0 or later](./LICENSE.md).

---

<p align="center">Simple converter, nothing more. 💱</p>

# Thin wrappers around docker-compose. Every target is optional sugar - the
# equivalent docker-compose command is documented in the README.
#
# Requires: docker, docker-compose, make.

DC   := docker-compose
RUN  := $(DC) run --rm app

# Pinned so builds are reproducible. The CLI is fetched on demand rather than
# baked into the image, since it is only needed for release builds.
EAS  := npx --yes eas-cli@21.3.0

.DEFAULT_GOAL := help

##@ General

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} \
		/^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5); next } \
		/^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)
	@printf "\n"

##@ Development

.PHONY: up
up: ## Start the Expo dev server (browser + phone, interactive)
	$(DC) up

.PHONY: down
down: ## Stop and remove containers
	$(DC) down

.PHONY: restart
restart: down up ## Restart the dev server

.PHONY: logs
logs: ## Tail dev server logs
	$(DC) logs -f app

.PHONY: image
image: ## Rebuild the Docker image (after editing the Dockerfile)
	$(DC) build

.PHONY: install
install: ## Install dependencies from the lockfile (npm ci)
	$(RUN) npm ci

.PHONY: shell
shell: ## Open a shell inside the container
	$(RUN) sh

.PHONY: clear
clear: ## Start the dev server with a cleared Metro cache
	$(RUN) npx expo start --clear

.PHONY: tunnel
tunnel: ## Start the dev server over Expo's tunnel (works off-LAN, slower)
	$(RUN) npx expo start --tunnel

##@ Dependencies

.PHONY: add
add: ## Add a runtime dependency at the SDK-compatible version: make add PKG=axios
ifndef PKG
	$(error PKG is required, e.g. make add PKG=axios)
endif
	$(RUN) npx expo install $(PKG)

.PHONY: add-dev
add-dev: ## Add a dev dependency: make add-dev PKG=eslint
ifndef PKG
	$(error PKG is required, e.g. make add-dev PKG=eslint)
endif
	$(RUN) npm install --save-dev $(PKG)

.PHONY: check-deps
check-deps: ## Check installed packages against the Expo SDK
	$(RUN) npx expo install --check

.PHONY: fix-deps
fix-deps: ## Realign packages with the Expo SDK
	$(RUN) npx expo install --fix

##@ Quality

.PHONY: check
check: lint format-check typecheck knip test ## Run every quality gate (the Definition of Done)

.PHONY: test
test: ## Run the test suite
	$(RUN) sh -c 'CI=1 npm test'

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	$(RUN) npm run test:watch

.PHONY: typecheck
typecheck: ## Run the TypeScript compiler (no emit)
	$(RUN) npm run typecheck

.PHONY: lint
lint: ## Run ESLint
	$(RUN) npm run lint

.PHONY: lint-fix
lint-fix: ## Run ESLint and auto-fix what it can
	$(RUN) npm run lint:fix

.PHONY: format
format: ## Rewrite files with Prettier
	$(RUN) npm run format

.PHONY: format-check
format-check: ## Fail if any file is not Prettier-formatted
	$(RUN) npm run format:check

.PHONY: knip
knip: ## Report unused files, exports and dependencies
	$(RUN) npm run knip

.PHONY: doctor
doctor: ## Diagnose common project/dependency problems
	$(RUN) npx expo-doctor

##@ Production builds

.PHONY: export-web
export-web: ## Build the static web bundle into dist/
	$(RUN) npx expo export --platform web

.PHONY: serve-web
serve-web: ## Serve the exported dist/ at http://localhost:3000 to sanity-check it
	$(RUN) npx --yes serve dist --listen 3000

.PHONY: eas-login
eas-login: ## Log in to your Expo account (persisted in the expo-state volume)
	$(RUN) $(EAS) login

.PHONY: eas-whoami
eas-whoami: ## Show the logged-in Expo account
	$(RUN) $(EAS) whoami

.PHONY: eas-configure
eas-configure: ## One-time: create eas.json and link the project to EAS
	$(RUN) $(EAS) build:configure

.PHONY: build-android-preview
build-android-preview: ## Cloud-build an installable Android APK (preview profile)
	$(RUN) $(EAS) build --platform android --profile preview

.PHONY: build-android
build-android: ## Cloud-build a Play Store Android AAB (production profile)
	$(RUN) $(EAS) build --platform android --profile production

##@ Housekeeping

.PHONY: clean
clean: ## Remove containers and build output (keeps caches and EAS login)
	$(DC) down --remove-orphans
	rm -rf dist web-build .expo

.PHONY: reset
reset: ## Full wipe: containers, volumes, caches, EAS login and node_modules
	$(DC) down --volumes --remove-orphans
	rm -rf dist web-build .expo node_modules

DC := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")
RUN := $(DC) run --rm app
HOUSEKEEP := $(DC) run --rm --entrypoint sh app -c

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

.PHONY: clear
clear: ## Start the dev server with a cleared Metro cache
	$(RUN) npx expo start --clear

.PHONY: tunnel
tunnel: ## Start the dev server over Expo's tunnel (works off-LAN, slower)
	$(RUN) npx expo start --tunnel

##@ Quality

.PHONY: check
check: lint format-check typecheck knip coverage ## Run every quality gate (the Definition of Done)

.PHONY: test
test: ## Run the test suite
	$(RUN) sh -c 'CI=1 npm test'

.PHONY: coverage
coverage: ## Run the test suite and enforce the coverage thresholds
	$(RUN) sh -c 'CI=1 npm run test:coverage'

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	$(RUN) npm run test:watch

.PHONY: typecheck
typecheck: ## Run the TypeScript compiler (no emit)
	$(RUN) npm run typecheck

.PHONY: lint
lint: ## Run ESLint
	$(RUN) npm run lint

.PHONY: format-check
format-check: ## Fail if any file is not Prettier-formatted
	$(RUN) npm run format:check

.PHONY: knip
knip: ## Report unused files, exports and dependencies
	$(RUN) npm run knip:check

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
	$(HOUSEKEEP) 'rm -rf /workspace/dist /workspace/web-build /workspace/.expo'
	$(DC) down --remove-orphans

.PHONY: reset
reset: ## Full wipe: containers, volumes, caches, EAS login and node_modules
	$(HOUSEKEEP) 'rm -rf /workspace/dist /workspace/web-build /workspace/.expo /workspace/node_modules'
	$(DC) down --volumes --remove-orphans

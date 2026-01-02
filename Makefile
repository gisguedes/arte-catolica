DC = docker compose

.PHONY: help up down logs build
.PHONY: backend-install backend-migrate backend-key backend-test
.PHONY: frontend-install frontend-serve frontend-test
.PHONY: test

help:
	@echo "Makefile targets:"
	@echo "  up                 - docker compose up -d --build"
	@echo "  down               - docker compose down"
	@echo "  logs               - docker compose logs -f"
	@echo "  backend-install    - install PHP deps (composer)"
	@echo "  backend-migrate    - run artisan migrate --seed"
	@echo "  backend-key        - generate Laravel APP_KEY"
	@echo "  backend-test       - run backend tests (php artisan test)"
	@echo "  frontend-install   - install frontend deps (npm/pnpm)"
	@echo "  frontend-serve     - run frontend dev server (ng serve)"
	@echo "  frontend-test      - run frontend tests (ng test)
	@echo "  test               - run backend and frontend tests"

up:
	$(DC) up -d --build

down:
	$(DC) down

logs:
	$(DC) logs -f

build:
	$(DC) build --no-cache

## Backend targets
backend-install:
	@echo "Installing backend PHP dependencies..."
	cd backend && composer install

backend-key:
	@echo "Generating Laravel APP_KEY (run in backend)..."
	cd backend && php artisan key:generate

backend-migrate:
	@echo "Running migrations and seeders..."
	cd backend && php artisan migrate --seed

backend-test:
	@echo "Running backend tests..."
	cd backend && php artisan test

## Frontend targets
frontend-install:
	@echo "Installing frontend dependencies (npm)..."
	cd frontend && npm install

frontend-serve:
	@echo "Starting frontend dev server..."
	cd frontend && ng serve

frontend-test:
	@echo "Running frontend tests..."
	cd frontend && npm test

test: backend-test frontend-test

.PHONY: help api-install api-dev api-start api-test
.PHONY: frontend-install frontend-serve frontend-test
.PHONY: test

help:
	@echo "Makefile targets:"
	@echo "  api-install       - install API deps (npm)"
	@echo "  api-dev           - run API with nodemon"
	@echo "  api-start         - run API in production mode"
	@echo "  api-test          - run API tests if present"
	@echo "  frontend-install  - install frontend deps (npm/pnpm)"
	@echo "  frontend-serve    - run frontend dev server (ng serve)"
	@echo "  frontend-test     - run frontend tests (ng test)"
	@echo "  test              - run API and frontend tests"

## API targets
api-install:
	@echo "Installing API dependencies..."
	cd api && npm install

api-dev:
	@echo "Starting API dev server..."
	cd api && npm run dev

api-start:
	@echo "Starting API server..."
	cd api && npm run start

api-test:
	@echo "Running API tests (if present)..."
	cd api && npm run test --if-present

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

test: api-test frontend-test

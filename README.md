# arte-catolica (monorepo)

<!-- Badges: GitHub Actions (Jira workflow) + placeholders for CI/coverage -->
[![Jira PR Comment - GitHub Actions](https://github.com/gisguedes/arte-catolica/actions/workflows/jira.yml/badge.svg)](https://github.com/gisguedes/arte-catolica/actions/workflows/jira.yml)
[![CI Status](https://img.shields.io/badge/CI-unknown-lightgrey.svg)](https://github.com/gisguedes/arte-catolica/actions)
[![Coverage](https://img.shields.io/badge/coverage-unknown-lightgrey.svg)](#)

Repositorio monorepo para el proyecto Arte Católica.

Estructura:
- **backend/** — PHP (Laravel)
- **frontend/** — Angular
- **infra/** — Docker, Nginx, scripts
- **.github/** — Workflows y plantillas de PR/Issues
- **docs/** — Guías y documentación del monorepo

Convenciones:
- Ramas: `feature/GG-123-descripcion`, `fix/GG-456-bug`
- Commits: `feat|fix|chore|test|docs`
- PRs: deben referenciar ticket de JIRA

---

## 📦 Requisitos (local / macOS)

- Git
- Docker & Docker Compose (opcional para entornos aislados)
- PHP 8.x y Composer (si se desarrolla sin contenedores)
- Node.js >= 16, npm / pnpm, Angular CLI (si se desarrolla sin contenedores)
- Make (opcional)

---

## 🚀 Quick start

Opciones recomendadas:

1) Desarrollar usando Docker (recomendado)

- Copiar variables: `cp .env.example .env` (si aplica)
- Levantar servicios: `docker compose up -d --build`
- Ver logs: `docker compose logs -f`
- Parar: `docker compose down`

2) Desarrollar local (sin Docker)

Backend:

- `cd backend`
- `composer install`
- `cp .env.example .env`
- `php artisan key:generate`
- `php artisan migrate --seed`
- `php artisan serve --host=127.0.0.1 --port=8000`

Frontend:

- `cd frontend`
- `npm install` (o `pnpm install`)
- `ng serve` — abre en `http://localhost:4200`

Nota: ajustar variables de entorno para que el frontend apunte al backend correcto.

---

## 🧪 Tests

Backend:

- `cd backend && php artisan test`

Frontend:

- `cd frontend && npm test` (o `ng test`)

Integración / E2E:

- Revisar `infra/` o la carpeta de tests para orquestar ambientes de pruebas.

---

## 🛠️ Scripts útiles

- `infra/scripts/*` — scripts de mantenimiento y despliegue (revisar y ejecutar con `sh`)
- `Makefile` (si existe) — atajos comunes (`make build`, `make test`, etc.)

---

## 📚 Documentación & CI

- CI/CD: `./docs/CI.md`
- PRs: `./docs/PR_GUIDE.md`
- Branch protection: `./docs/GITHUB_BRANCH_PROTECTION.md`
- Consola / operaciones: `./docs/CONSOLE_GUIDE.md`
- Scripts: `./docs/README.md#⚙️-scripts-de-mantenimiento`

---

## 🤝 Contribuir

- Crear rama siguiendo la convención (`feature/..`, `fix/..`)
- Commits con tipo (`feat:`, `fix:`, `chore:`, ...)
- PR debe incluir referencia a ticket de JIRA y descripción de cambios
- Ejecutar tests y linters antes de abrir PR

---

## 🧾 Troubleshooting

- Problemas de dependencias PHP: `composer clear-cache && composer install`
- Problemas Node: borrar `node_modules` y lockfile, luego `npm install`
- Docker: `docker compose down --volumes --remove-orphans` y volver a levantar

---

## Contacto

Equipo de dev interno — revisar `.github/CONTRIBUTING` o JIRA para canales y owners.

---

> Las guías del directorio `/docs` agrupan todas las configuraciones del monorepo (CI, Jira, workflows, scripts, etc.).


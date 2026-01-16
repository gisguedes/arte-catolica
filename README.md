# arte-catolica (monorepo)

<!-- Badges: GitHub Actions (Jira workflow) + placeholders for CI/coverage -->
[![Jira PR Comment - GitHub Actions](https://github.com/gisguedes/arte-catolica/actions/workflows/jira.yml/badge.svg)](https://github.com/gisguedes/arte-catolica/actions/workflows/jira.yml)
[![CI Status](https://img.shields.io/badge/CI-unknown-lightgrey.svg)](https://github.com/gisguedes/arte-catolica/actions)
[![Coverage](https://img.shields.io/badge/coverage-unknown-lightgrey.svg)](#)

Repositorio monorepo para el proyecto Arte Católica.

Estructura:
- **frontend/** — Angular
- **api/** — Backend local (Node/Express)
- **.github/** — Workflows y plantillas de PR/Issues
- **docs/** — Guías y documentación del monorepo

Convenciones:
- Ramas: `feature/GG-123-descripcion`, `fix/GG-456-bug`
- Commits: `feat|fix|chore|test|docs`
- PRs: deben referenciar ticket de JIRA

---

## 📦 Requisitos (local / macOS)

- Git
- Node.js >= 16, npm / pnpm, Angular CLI (si se desarrolla sin contenedores)
- Make (opcional)

---

## 🚀 Quick start

Opciones recomendadas:

1) Desarrollar local (frontend)

- `cd frontend`
- `npm install` (o `pnpm install`)
- `ng serve` — abre en `http://localhost:4200`

2) Backend local (Node/Express)

- `cd api`
- `npm install`
- crear `.env` (ver `docs/API_ENV.md`)
- `npm run dev` — API en `http://localhost:8000`

---

## 🧪 Tests

Frontend:

- `cd frontend && npm test` (o `ng test`)

Integración / E2E:

- Revisar `docs/` para notas de despliegue y pruebas.

---

## 🛠️ Scripts útiles

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

- Problemas Node: borrar `node_modules` y lockfile, luego `npm install`

---

## Contacto

Equipo de dev interno — revisar `.github/CONTRIBUTING` o JIRA para canales y owners.

---

> Las guías del directorio `/docs` agrupan todas las configuraciones del monorepo (CI, Jira, workflows, scripts, etc.).


cat > README.md <<'EOF'
# arte-catolica (monorepo)

Estructura:
- **backend/** PHP (Laravel)
- **frontend/** Angular
- **infra/** Docker, Nginx, scripts
- **.github/** Workflows, plantillas de PR/Issues

Convenciones:
- Ramas: feature/GG-123-descripcion, fix/GG-456-bug
- Commits: feat|fix|chore|test|docs
- PRs: deben referenciar ticket de JIRA


---

## 🧩 Project Management & CI/CD

- [📘 Guía de CI/CD](./docs/CI.md)
- [🧩 Guía de Pull Requests](./docs/PR_GUIDE.md)
- [🛡️ Branch Protection (bypass de review)](./docs/GITHUB_BRANCH_PROTECTION.md)
- [💻 Guía de Consola](./docs/CONSOLE_GUIDE.md)
- [⚙️ Scripts de mantenimiento](./docs/README.md#⚙️-scripts-de-mantenimiento)

> Las guías del directorio `/docs` agrupan todas las configuraciones del monorepo (CI, Jira, workflows, scripts, etc.).


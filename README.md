cat > README.md <<'EOF'
# arte-catolica (monorepo)

Estructura:
- **backend/** PHP (Laravel)
- **frontend/** Angular
- **infra/** Docker, Nginx, scripts
- **.github/** Workflows, plantillas de PR/Issues

Convenciones:
- Ramas: feature/PROJ-123-descripcion, fix/PROJ-456-bug
- Commits: feat|fix|chore|test|docs
- PRs: deben referenciar ticket de JIRA
EOF

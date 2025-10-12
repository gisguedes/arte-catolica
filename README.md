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
EOF

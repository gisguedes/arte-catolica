cat > backend/README.md <<'EOF'
# Backend (PHP/Laravel)
Aquí irá la API. Próximo paso: bootstrap de Laravel, conexión a PostgreSQL y endpoints base.
EOF

cat > frontend/README.md <<'EOF'
# Frontend (Angular)
Aquí irá la SPA. Próximo paso: bootstrap de Angular, environments y layout base.
EOF

cat > infra/README.md <<'EOF'
# Infra
Aquí vivirá Docker (docker-compose.yml), Nginx y configuración de servicios.
Objetivo: levantar entorno reproducible (PHP-FPM, Nginx, PostgreSQL, pgAdmin).
EOF

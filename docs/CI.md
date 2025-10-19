# 🔄 CI — Integración Continua (GitHub Actions)

## 🎯 Objetivo
Garantizar la calidad del código del **frontend (Angular)** y del **backend (Laravel)** antes de cualquier merge.

---

## ⚙️ Workflow principal

Archivo: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

Ejecuta dos jobs en paralelo:

| Job | Descripción |
|-----|--------------|
| **Backend (Laravel)** | Verifica formato, estática y tests Pest contra PostgreSQL 16. |
| **Frontend (Angular)** | Ejecuta lint, tests y build en Node 22. |

---

## 🧩 Backend (Laravel)

### 🧱 Stack
- PHP 8.3  
- PostgreSQL 16  
- Extensiones: `mbstring`, `pdo_pgsql`, `zip`  
- Composer con caché  

### 🧭 Flujo de ejecución
1. **Checkout** del código.  
2. **Instalación de dependencias** con Composer.  
3. **Creación automática de `.env`** en CI:  
   - Base: `.env.example`  
   - Sobrescribe claves DB para Postgres local.  
4. **Espera de base de datos** (`pg_isready`).  
5. **Migraciones** (`php artisan migrate`).  
6. **Calidad y tests**:  
   - `vendor/bin/phpcs` (PSR-12)  
   - `vendor/bin/phpstan analyse`  
   - `vendor/bin/pest --colors=always`

### 🧠 Nota
El orden recomendado localmente es:
format → phpcbf → phpcs → phpstan → pest

yaml
Copiar código

---

## 💻 Frontend (Angular)

### 🧱 Stack
- Node.js 22  
- npm (con cache de dependencias)  
- Angular CLI  

### 🧭 Flujo de ejecución
1. **Checkout** del código.  
2. **Instalación** con `npm ci`.  
3. **Lint** (`npm run lint`).  
4. **Tests** (`npm run test --if-present`).  
5. **Build** (`npm run build`).

---

## ⚡ Optimizaciones de CI

- **Caches**
  - Composer: `backend/vendor`  
  - npm: `frontend/node_modules`  
- **Servicios**
  - PostgreSQL 16 disponible en `127.0.0.1:5432`.  
- **Generación dinámica de `.env`**
  - Permite correr tests y migraciones sin subir archivos sensibles.

---

## 🛡️ Branch Protection

- Merge permitido solo con **checks verdes**:  
  - `CI / Backend (Laravel)`  
  - `CI / Frontend (Angular)`  
- Revisión obligatoria (CODEOWNERS).  
- Historia lineal (`Require linear history`).  

> 💡 En repos públicos o con GitHub Pro/Team, esta regla se aplica desde  
> _Settings → Branches → Branch protection rules_.

---

## 🧰 Troubleshooting

| Problema | Causa | Solución |
|-----------|--------|-----------|
| `DB connection refused` | Postgres aún no está listo | Incrementa `--health-retries` o el bucle `Wait for Postgres`. |
| `PHPStan too strict` | Nivel muy alto | Baja `level` en `phpstan.neon` a 5 y súbelo progresivamente. |
| `Health check timeout` | DB lenta o carga alta | Aumenta `sleep` en el bucle o el número de intentos. |
| `Angular test runner fails` | Configuración de Jest/Karma | Verifica `@angular-devkit/build-angular` instalado. |

---

## 🔐 Secretos y Variables

Para entornos `staging` o `production`, usa:
- **GitHub → Settings → Secrets and variables → Actions**
  - `APP_KEY`, `JWT_SECRET`, `PROD_DB_URL`, etc.
- Se referencian con `${{ secrets.APP_KEY }}` en workflows futuros.

---

## 🧾 Resumen

✅ 2 jobs paralelos (FE + BE)  
✅ PostgreSQL 16 en CI  
✅ .env generado automáticamente  
✅ Caches Composer + npm  
✅ Lint, análisis y tests antes de merge  
✅ Protección de rama con checks verdes  

---

© 2025 — Pipeline CI estándar del monorepo **arte-catolica**.
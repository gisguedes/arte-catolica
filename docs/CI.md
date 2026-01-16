# 🔄 CI — Integración Continua (GitHub Actions)

## 🎯 Objetivo
Garantizar la calidad del código del **frontend (Angular)** y de las **Netlify Functions** antes de cualquier merge.

---

## ⚙️ Workflow principal

Archivo: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

Ejecuta jobs de validación:

| Job | Descripción |
|-----|--------------|
| **Functions** | Lint/formato y build TS/JS para Netlify Functions. |
| **Frontend (Angular)** | Ejecuta lint, tests y build en Node 22. |

---

## 🧩 Functions (Netlify)

### 🧱 Stack
- Node.js  
- npm  
- TypeScript/JavaScript  

### 🧭 Flujo de ejecución
1. **Checkout** del código.  
2. **Instalación** con `npm ci`.  
3. **Lint/format** (si aplica).  
4. **Build** (si aplica).  

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
  - npm: `frontend/node_modules`  

---

## 🛡️ Branch Protection

- Merge permitido solo con **checks verdes**:  
  - `CI / Functions`  
  - `CI / Frontend (Angular)`  
- Revisión obligatoria (CODEOWNERS).  
- Historia lineal (`Require linear history`).  

> 💡 En repos públicos o con GitHub Pro/Team, esta regla se aplica desde  
> _Settings → Branches → Branch protection rules_.

---

## 🧰 Troubleshooting

| Problema | Causa | Solución |
|-----------|--------|-----------|
| `Angular test runner fails` | Configuración de Jest/Karma | Verifica `@angular-devkit/build-angular` instalado. |

---

## 🔐 Secretos y Variables

Para entornos `staging` o `production`, usa:
- **GitHub → Settings → Secrets and variables → Actions**
  - `APP_KEY`, `JWT_SECRET`, `PROD_DB_URL`, etc.
- Se referencian con `${{ secrets.APP_KEY }}` en workflows futuros.

---

## 🧾 Resumen

✅ Jobs para FE + Functions  
✅ Caches npm  
✅ Lint, análisis y tests antes de merge  
✅ Protección de rama con checks verdes  

---

© 2025 — Pipeline CI estándar del monorepo **arte-catolica**.
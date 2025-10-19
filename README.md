
## 📄 **Contenido completo del nuevo `README.md`**

````markdown
# 🎨 Arte Católica — Monorepo (Frontend + Backend)

> Proyecto personal con estructura profesional: **Angular (frontend)** + **Laravel (backend)** + **CI/CD** en **GitHub Actions** y trazabilidad con **JIRA**.

---

## 🧭 Índice

| Sección | Descripción |
|----------|-------------|
| [📘 1. Introducción](#-1-introducción) | Qué es este monorepo y cómo está organizado. |
| [⚙️ 2. Stack técnico](#️-2-stack-técnico) | Tecnologías principales y scripts útiles. |
| [🚀 3. Cómo ejecutar el proyecto](#-3-cómo-ejecutar-el-proyecto) | Pasos para levantar el backend y frontend en local. |
| [🔄 4. CI/CD y calidad de código](#-4-cicd-y-calidad-de-código) | Cómo funcionan los pipelines y validaciones. |
| [🧩 5. Flujo de trabajo y PRs](#-5-flujo-de-trabajo-y-prs) | Convenciones, PR template y trazabilidad con JIRA. |
| [📚 6. Documentación técnica](#-6-documentación-técnica) | Índice de guías detalladas en `/docs`. |
| [🧠 7. Enlaces útiles](#-7-enlaces-útiles) | Comandos, referencias y atajos rápidos. |

---

## 📘 1. Introducción

El monorepo **Arte Católica** agrupa el código fuente del **frontend Angular** y el **backend Laravel**, compartiendo un flujo común de desarrollo, calidad y despliegue.

Estructura principal:

```plaintext
arte-catolica/
├── backend/          → API Laravel (PHP 8.3, PostgreSQL 16)
├── frontend/         → Angular (Node 22)
├── .github/          → Workflows CI, templates, CODEOWNERS, convenciones
└── docs/             → Documentación técnica y guías personales
````

---

## ⚙️ 2. Stack técnico

### 🖥️ Frontend

* Node 22 + Angular CLI
* Scripts npm:

  * `npm run lint`
  * `npm run test`
  * `npm run build`

### ⚙️ Backend

* PHP 8.3 + Laravel 11 + PostgreSQL 16
* Scripts Composer:

  * `composer lint` → PHPCS (PSR-12)
  * `composer stan` → PHPStan (Larastan)
  * `composer test` → Pest
  * `composer qa` → pipeline completo de calidad

> Orden local recomendado:
> `format → phpcbf → phpcs → phpstan → pest`

---

## 🚀 3. Cómo ejecutar el proyecto

### 🖥️ Frontend

```bash
cd frontend
npm ci
npm run start
```

Accede en 👉 [http://localhost:4200](http://localhost:4200)

### ⚙️ Backend

```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Accede en 👉 [http://localhost:8000](http://localhost:8000)

---

## 🔄 4. CI/CD y calidad de código

Workflow principal:
[`.github/workflows/ci.yml`](.github/workflows/ci.yml)

| Job                    | Descripción                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Backend (Laravel)**  | Instala dependencias, genera `.env`, migra DB, ejecuta `phpcs`, `phpstan`, `pest`. |
| **Frontend (Angular)** | Ejecuta `lint`, `test`, `build` en Node 22.                                        |

🔒 **Protección de rama**

* Merge solo vía PR.
* Checks obligatorios:

  * `CI / Backend (Laravel)`
  * `CI / Frontend (Angular)`
* Historia lineal y revisión CODEOWNERS.

📘 Más detalles:
→ [🔄 CI — Integración Continua](docs/CI.md)

---

## 🧩 5. Flujo de trabajo y PRs

### 💬 Convenciones

* Commits → [Conventional Commits + JIRA key](.github/COMMIT_CONVENTIONS.md)
* PRs → [Plantilla oficial](.github/PULL_REQUEST_TEMPLATE.md)
* Revisores → [CODEOWNERS](.github/CODEOWNERS)

### 🔗 Ejemplo de flujo completo

```bash
git switch -c feat/FRP-123-nueva-funcionalidad
git commit -m "feat: FRP-123 añade WarLog tab"
gh pr create --title "FRP-123: añade WarLog tab" --body "Implementa componente WarLog con tests y CI verde."
```

📘 Guía ampliada:
→ [🧩 Guía de Pull Requests](docs/PR_GUIDE.md)

---

## 📚 6. Documentación técnica

> Documentación modular dentro de `/docs` para profundizar en temas específicos.

| Guía                                                        | Descripción                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [🔄 CI — Integración Continua](docs/CI.md)                  | Configuración del pipeline, caches y DB en CI.                                |
| [🧩 Guía de Pull Requests](docs/PR_GUIDE.md)                | Cómo crear, nombrar y validar PRs correctamente.                              |
| [🧾 Convenciones de Commits](.github/COMMIT_CONVENTIONS.md) | Estructura de commits con JIRA key y ejemplos.                                |
| [💻 Guía de Consola](docs/CONSOLE_GUIDE.md)                 | Comandos útiles, creación de archivos, atajos y ejecución local del monorepo. |

---

## 🧠 7. Enlaces útiles

| Tema                         | Comando / Enlace                           |
| ---------------------------- | ------------------------------------------ |
| Ver versión de Node          | `node -v`                                  |
| Ver versión de PHP           | `php -v`                                   |
| Ver versión de Composer      | `composer -V`                              |
| Ver versión de Angular       | `ng version`                               |
| Consultar ramas Git          | `git branch`                               |
| Cambiar de rama              | `git switch nombre_rama`                   |
| Crear nueva rama             | `git switch -c nueva_rama`                 |
| Ver logs compactos           | `git log --oneline --graph --decorate -10` |
| Limpiar consola              | `clear` o `Cmd + K`                        |
| Salir de heredoc / bloqueado | `Ctrl + C`                                 |

---

© 2025 — Monorepo **Arte Católica**
Documentación técnica y flujos de desarrollo mantenidos por **Gislaine Guedes**.

````

---

## 📦 Crear el archivo desde consola

```bash
nano README.md
````

(pastea todo el contenido, guarda con `Ctrl + O`, Enter, y sal con `Ctrl + X`)


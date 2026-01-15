# 🧩 Branching & Release Strategy – arte-catolica

> Guía oficial del flujo de ramas, versionado y releases del monorepo **arte-catolica**  
> (Basado en GitFlow + Semantic Versioning)

---

## 📚 Índice

1. [Objetivo](#-objetivo)
2. [Estructura de ramas](#-estructura-de-ramas)
3. [Convenciones de commits y PRs](#-convenciones-de-commits-y-prs)
4. [Versionado Semántico (SemVer)](#-versionado-semántico-semver)
5. [Flujo diario de trabajo](#-flujo-diario-de-trabajo)
6. [Release candidates](#-release-candidates)
7. [Publicación en producción](#-publicación-en-producción)
8. [Hotfixes](#-hotfixes)
9. [Protección de ramas](#-protección-de-ramas)
10. [Changelog y tags](#-changelog-y-tags)
11. [Criterios de versionado](#-criterios-de-versionado)
12. [Tips de productividad](#-tips-de-productividad)

---

## 🎯 Objetivo

Estandarizar el ciclo de desarrollo del proyecto **arte-catolica**, asegurando un flujo coherente entre:
- Desarrollo diario (`dev`)
- Estabilización (`release/x.y.z-rc`)
- Producción (`main`)
- Versionado semántico (`vMAJOR.MINOR.PATCH`)

Este documento define **qué rama usar, cuándo crear una release y cómo versionar correctamente**.

---

## 🌿 Estructura de ramas

| Tipo | Ejemplo | Propósito |
|------|----------|-----------|
| **main** | `main` | Producción estable |
| **dev** | `dev` | Integración continua |
| **release** | `release/1.4.0-rc` | Candidata a producción |
| **feature** | `feature/AC-123-titulo-corto` | Nueva funcionalidad |
| **bugfix** | `bugfix/AC-456-descripcion` | Corrección de bug |
| **hotfix** | `hotfix/1.4.1-fix-critico` | Parche urgente en prod |

---

## 🧱 Convenciones de commits y PRs

- **Mensaje de commit:**
  ```bash
  AC-123: feat(front) crear componente Home
Título del PR:

scss
Copiar código
AC-123 feat(front): crear componente Home
Etiquetas recomendadas: feature, bug, release, hotfix

Regla: todo commit debe incluir el identificador Jira AC-XXX

🔢 Versionado Semántico (SemVer)
Formato: MAJOR.MINOR.PATCH

Tipo	Ejemplo	Cuándo usar
MAJOR	2.0.0	Cambios incompatibles
MINOR	1.4.0	Nuevas features sin romper compatibilidad
PATCH	1.4.1	Fixes y mejoras menores

💻 Flujo diario de trabajo
bash
Copiar código
# Desde la rama dev actualizada
git checkout dev && git pull origin dev

# Crear nueva rama de feature o bugfix
git checkout -b feature/AC-123-titulo-corto

# Desarrollo...
git add .
git commit -m "AC-123: feat(front) crear componente Home"
git push -u origin feature/AC-123-titulo-corto

# Abrir PR → base: dev
Merge mediante PR con revisión obligatoria.

Squash & merge recomendado.

Borrar rama después del merge.

🚀 Release Candidates
Congelan el alcance para QA/UAT sin bloquear desarrollo en dev.

bash
Copiar código
git checkout dev && git pull
git checkout -b release/1.4.0-rc
git push -u origin release/1.4.0-rc
Solo se aceptan fixes en esta fase.

Actualizar CHANGELOG.md con los cambios incluidos.

🏁 Publicación en producción
bash
Copiar código
# Merge a main desde release
git checkout main && git pull
git merge --no-ff release/1.4.0-rc
git push origin main

# Crear tag y release
git tag -a v1.4.0 -m "Release 1.4.0"
git push origin v1.4.0
Crear GitHub Release con notas del changelog.

Back-merge a dev para mantener sincronización:

bash
Copiar código
git checkout dev
git merge --no-ff main
git push
🩹 Hotfixes
bash
Copiar código
git checkout main && git pull
git checkout -b hotfix/1.4.1-fix-critico
# Aplicar corrección...
git add .
git commit -m "AC-789: fix(api) null on auth"
git push -u origin hotfix/1.4.1-fix-critico

# PR → base: main
# Tag y release: v1.4.1
# Back-merge a dev
git checkout dev
git merge --no-ff main
git push
🔒 Protección de ramas
Configurar en
🔗 https://github.com/gisguedes/arte-catolica/settings/branches

Reglas recomendadas:

Bloquear push directo a main, dev, release/*

Requerir PR y revisión

Requerir status checks (lint/test/build)

Forzar sincronización con base actualizada

(Opcional) Commits firmados

🧾 Changelog y tags
Estructura estándar en CHANGELOG.md:

markdown
Copiar código
## [1.4.0] - 2025-10-19
### Added
- AC-123 Home component (front)

### Fixed
- AC-456 Validación de fechas (back)
Tags:

Copiar código
v1.4.0
v1.4.1
⚙️ Criterios de versionado
Cambio	Tipo	Ejemplo
Nueva feature compatible	MINOR	1.3.0 → 1.4.0
Corrección menor o fix	PATCH	1.4.0 → 1.4.1
Cambio incompatible	MAJOR	1.4.0 → 2.0.0

💡 Tips de productividad
Usa GitLens en VS Code para ver historial y PRs por línea.

Usa workspace .code-workspace para abrir FE + Functions juntos.

Crea tareas automatizadas (tasks.json) para ng serve o netlify dev.

Modo concentración: Zen Mode (⌘K Z).

Cada release → generar GitHub Release y actualizar changelog.

📄 Última actualización: 2025-10-19
Autor: @gisguedes
Documento oficial de flujo Git + release strategy para el monorepo arte-catolica.
# 📚 Documentación del Monorepo — Arte Católica

Bienvenido a la documentación técnica del proyecto **Arte Católica**, un monorepo que integra:

- 🖥️ **Frontend (Angular)**
- ⚙️ **Backend externo**
- 🔄 **CI/CD automatizado con GitHub Actions**
- 🔗 **Integración con Jira Cloud**

---

## 🧭 Índice general

| Sección | Descripción |
|----------|-------------|
| [🔄 CI — Integración Continua](./CI.md) | Configuración del pipeline CI/CD con jobs FE/BE. |
| [🧩 Guía de Pull Requests](./PR_GUIDE.md) | Cómo crear y documentar PRs correctamente. |
| [💻 Guía de Consola](./CONSOLE_GUIDE.md) | Comandos útiles, creación de archivos, atajos y ejecución local. |
| [🛡️ Branch Protection](./GITHUB_BRANCH_PROTECTION.md) | Cómo mergear PRs protegidos cuando trabajas sola. |

---

## ⚙️ Scripts de mantenimiento
Script	Propósito
scripts/toggle-branch-protection.sh
	Bajar temporalmente el requisito de review a 0, mergear el PR y restaurar a 1.

💡 Los scripts están pensados para tareas de mantenimiento, automatización de merges, validaciones o flujos CI/CD internos.

🧪 Ejemplo de uso
# Sintaxis
./scripts/toggle-branch-protection.sh <PR_NUMBER>

# Ejemplo real
./scripts/toggle-branch-protection.sh 4


📜 Qué hace paso a paso:

Detecta el repositorio y la rama protegida (master o main).

Baja temporalmente el requisito de revisión a 0.

Fusiona el Pull Request indicado.

Restaura la protección de rama con 1 review requerido.

✅ Resultado esperado
🔐 Repo: gisguedes/arte-catolica | Branch: master | PR: #4
1️⃣ Lowering protection temporarily (0 approvals)...
2️⃣ Merging PR #4 ...
3️⃣ Restoring protection (1 approval required)...
✅ Done! Branch protection restored and PR merged.

🧰 Consejos útiles

Usa este script solo en repos personales o de setup donde no haya revisores externos.

Si ves errores 403 o 404 al ejecutar, asegúrate de que:

Estás autenticada en GitHub CLI (gh auth status).

Tienes permisos de admin en el repositorio.

Puedes listar todos los PR abiertos con:

gh pr list


Y ver el estado de cada uno con:

gh pr view <PR_NUMBER>

---

## 🧱 Estructura general del repo

```plaintext
arte-catolica/
├── frontend/                    → Angular (Node 22)
├── (backend externo)            → API fuera del repo
├── .github/workflows/           → Workflows CI/CD (ci.yml, jira.yml, etc.)
├── docs/                        → Documentación técnica
└── scripts/                     → Scripts utilitarios (CLI y DevOps)


🧠 Recomendación

Mantén este README como índice de navegación y usa las guías específicas para temas concretos:

CI.md → workflows de GitHub Actions

PR_GUIDE.md → formato y QA de Pull Requests

CONSOLE_GUIDE.md → trucos y comandos de terminal

GITHUB_BRANCH_PROTECTION.md → flujos de merge con ramas protegidas

© 2025 — Documentación técnica del monorepo Arte Católica
# 🛡️ Guía de Branch Protection y Merge en Repos Privados

## 🎯 Objetivo
Recordar cómo manejar Pull Requests protegidos cuando trabajas sola (sin revisores externos) y GitHub no permite aprobar tus propios PRs.

---

## 🧩 Contexto
Este repo tiene activa la **Branch Protection** en `master` para:
- Requerir PR antes de hacer merge
- Exigir 1 review aprobado
- Asegurar historia lineal
- Checks verdes obligatorios (CI / Backend, CI / Frontend, etc.)

---

## 🧠 Problema
GitHub no permite aprobar tu **propio PR**, así que el merge queda bloqueado:

```bash
gh pr review 4 --approve
# → Review Can not approve your own pull request
🪜 Solución temporal (sin romper la protección)
Puedes bajar el requisito de reviews a 0, mergear, y restaurarlo a 1, con estos comandos:

bash
Copiar código
# 0️⃣ Detecta repo y rama protegida
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"
echo "Repo: $REPO | Branch: $BRANCH"

# 1️⃣ (Temporal) establece 0 reviews requeridos
gh api -X PUT "/repos/${REPO}/branches/${BRANCH}/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "enforce_admins": true,
  "required_linear_history": true,
  "restrictions": null,
  "required_status_checks": null
}
JSON

# 2️⃣ Mergea el PR (ejemplo #4)
gh pr merge 4 --squash

# 3️⃣ Restaura a 1 review requerido
gh api -X PUT "/repos/${REPO}/branches/${BRANCH}/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "enforce_admins": true,
  "required_linear_history": true,
  "restrictions": null,
  "required_status_checks": null
}
JSON
💡 Alternativas rápidas
Opción	Descripción
--auto	Activa auto-merge (si GitHub lo permite en Settings → Pull Requests → Allow auto-merge)
--admin	Merge inmediato con privilegios de admin (salta protección, úsalo solo en setup)
Agregar colaborador	Permite que otra persona apruebe PRs para cumplir el requisito

🧰 Troubleshooting
Error: “Auto merge is not allowed” → activa Allow auto-merge en Settings → General → Pull Requests.

Error: “Protected branch hook declined” → significa que la política sigue pidiendo review o check.

Error: “Cannot approve your own PR” → baja temporalmente el review a 0 con los comandos anteriores.

📘 Recomendación
Guarda esto como docs/GITHUB_BRANCH_PROTECTION.md
y enlázalo desde el README principal:

markdown
Copiar código
| 🛡️ Branch Protection |
| --- |
| [Cómo mergear PRs con protección activa cuando trabajas sola](docs/GITHUB_BRANCH_PROTECTION.md) |
© 2025 — Guía interna de mantenimiento para el monorepo arte-catolica.
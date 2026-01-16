# 🧩 Guía de Pull Requests

## 🎯 Objetivo
Asegurar PRs claros, trazables (JIRA) y con calidad (CI verde).

---

## 🔖 Título del PR
**Formato obligatorio:**
FRP-123: descripción corta en presente

yaml
Copiar código

- Incluye la **clave JIRA** al inicio.
- Usa verbo en presente e imperativo (ej. “añade”, “corrige”).
- Evita puntos finales o frases largas.

---

## 📄 Cuerpo del PR
Sigue la plantilla oficial:  
[.github/PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md)

Debe incluir:
- **JIRA** → enlace a la issue (`https://tu-jira.com/browse/FRP-123`)
- **Goal** → propósito del cambio
- **Context** → información relevante para entenderlo
- **Cambios realizados**
- **QA / Cómo probar**
- **Checklist** de verificación

---

## 🔗 Smart Commits (JIRA)
Puedes automatizar comentarios o transiciones desde tus commits o mensajes de PR:

FRP-123 #comment Ajuste validaciones modelo flexible
FRP-123 #time 1h 30m
FRP-123 #transition Done

yaml
Copiar código

> 💡 Con solo incluir la clave (`FRP-123`), JIRA enlaza automáticamente el commit o PR.

---

## ✅ CI y Branch Protection
- El PR **solo puede mergearse con checks verdes**:
  - `CI / Frontend (Angular)`
- Se requiere **revisión** (CODEOWNERS asigna automáticamente a los revisores).

---

## 🧪 Testing mínimo requerido
- **Frontend**: tests unitarios de componentes o servicios afectados.  
- Evita mocks de integraciones externas salvo que sean imprescindibles.

---

## 🛡️ Estándares de código
- **TS/JS** → eslint + formateo consistente  
- **Commits** → ver [.github/COMMIT_CONVENTIONS.md](../.github/COMMIT_CONVENTIONS.md)

---

## 🔐 Secretos
- Nunca subas `.env` ni credenciales sensibles.  
- Usa **GitHub Actions Secrets** para variables del entorno de CI/deploy.  
- En local, mantén los `.env` en `.gitignore`.

---

## 💬 Flujo recomendado
1. Crea una rama desde `main`.  
2. Realiza **commits pequeños y claros** (un cambio = un commit).  
3. Abre un **PR temprano** como *draft* para recibir feedback.  
4. Espera **CI verde** + revisión de al menos un CODEOWNER.  
5. Mergea solo cuando todo esté aprobado y limpio (historia lineal).

---

## 🤝 Buenas prácticas extra
- Usa commits con mensajes claros y convenciones estandarizadas.  
- Adjunta capturas o logs si el cambio afecta interfaz o comportamiento visible.  
- Si el PR soluciona una issue, referencia con:  
Closes FRP-123

yaml
Copiar código
para que se cierre automáticamente en JIRA cuando se mergee.

---

© 2025 — Guía oficial de contribución y flujo de PRs para el monorepo 
# 🚀 Guía rápida de entornos – *Arte Católica*

## 🧩 1) Variables de entorno (Frontend)

🎯 **Objetivo:** que el frontend (Angular) sepa a qué backend (API local) debe conectarse según el entorno.

📂 **Ubicación:**
`frontend/src/environments/`

---

### 🧩 Archivos principales

| Archivo                  | Entorno    | Descripción                                |
| ------------------------ | ---------- | ------------------------------------------ |
| `environment.ts`         | Local      | Configuración de desarrollo (tu ordenador) |
| `environment.staging.ts` | Staging    | Entorno de pruebas en Render               |
| `environment.prod.ts`    | Producción | Web real con usuarios                      |

---

### 🛠️ Cómo usarlo

1️⃣ Abre `frontend/src/environments/environment.ts`
2️⃣ Usa `apiUrl: '/api'` para el backend local.
3️⃣ Guarda y **reinicia** el servidor con `npm start`.

> 💡 En desarrollo se recomienda usar el preset `/api` (proxy) para evitar errores CORS.

---

### 🌐 Proxy (solo si usas `/api`)

📁 Archivo: `frontend/proxy.conf.json`

Sirve para redirigir automáticamente todas las peticiones `/api/...` al backend real sin problemas de CORS.

---

## 🧭 2) Iniciar y trabajar con los entornos (Local / Staging / Producción)

🎯 **Objetivo:** saber cómo levantar, revisar y usar el proyecto en los tres entornos (local, staging y producción), de forma rápida y clara.

---

### 🧩 Entorno LOCAL (día a día)

👩‍💻 **Para desarrollo en tu ordenador**

---

#### 💻 Levantar el frontend (Angular)

```bash
cd frontend
npm start
```

> 💡 Usa `apiUrl: '/api'` y el proxy si necesitas evitar CORS.
> Frontend disponible en: **[http://localhost:4200](http://localhost:4200)** *(puede variar si el puerto está ocupado).*

---

#### 🔍 Verificación rápida

1️⃣ Abre Angular → carga sin errores.
2️⃣ En pestaña *Network*, las llamadas a `/api/*` responden desde tu backend local.
3️⃣ Si todo va bien, el entorno local está listo para desarrollo.

---

### 🚀 Entorno STAGING/PROD

🌍 **Frontend + Backend externos**

#### 🔗 Accesos
* **Frontend:** URL del hosting
* **Backend:** URL del API

#### 🔍 Verificación rápida tras un deploy
1️⃣ `GET /api/products` responde `200`.
2️⃣ La web carga y muestra datos.
3️⃣ Las peticiones del frontend van al backend de producción.
4️⃣ Revisa logs en Render si algo falla.

---

#### 🧰 Operaciones de mantenimiento

* **Revertir versión:** selecciona el tag anterior en GitHub → Render redeploy.
* **Backups DB:** automáticos en Render (revisa arte-db-prod).
* **Rollbacks:** restaurar snapshot o ejecutar manual deploy del build previo.

---

#### 🔒 Recomendaciones finales

* **Nunca modificar datos reales** desde local.
* **Prueba primero en Staging** cualquier cambio de estructura o diseño.
* **Solo merges con release-please** deben llegar a producción.

---

## ⚡️ 3) Comandos y atajos útiles

*(...mantienes el bloque que ya tienes completo aquí...)*

---

## 🧹 4) Mantenimiento y buenas prácticas

*(...mantienes el bloque que ya tienes completo aquí...)*

---

## 📚 5) Recursos útiles

*(...mantienes el bloque que ya tienes completo aquí...)*

---

## 📘 FIN — Guía rápida de entornos *Arte Católica*

Has completado la configuración y documentación base de tu entorno 👏
Esta guía te permite levantar, mantener y desplegar el proyecto en cualquiera de los tres entornos:

* 🧭 **Local:** para desarrollar y probar cambios
* 🚀 **Staging:** para validar antes del despliegue real
* 🌐 **Producción:** para servir a los usuarios finales

> 💡 Si en el futuro cambias el flujo de trabajo (Docker, Render, ramas o CI/CD), actualiza este documento para mantenerlo alineado con la realidad del proyecto.

**Siguiente paso natural:**
👉 Documentar cada nueva automatización o ajuste dentro de `docs/` (por ejemplo, `setup_ci.md`, `setup_tests.md`, `deploy_notes.md`)
Así mantendrás un *knowledge base* siempre actualizado dentro del propio monorepo.

---

¿Quieres que te lo formatee también con un **índice clicable al inicio (estilo VS Code)** para navegación rápida entre los 6 puntos?

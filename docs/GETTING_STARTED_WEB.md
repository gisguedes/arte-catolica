# 🚀 Guía rápida de entornos – *Arte Católica*

## 🧩 1) Variables de entorno (Frontend)

🎯 **Objetivo:** que el frontend (Angular) sepa a qué backend debe conectarse según el entorno.

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
2️⃣ **Descomenta** uno de los presets (Docker / Artisan / Proxy) según cómo trabajes.
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

#### 🐳 Levantar los contenedores (DB + Nginx + PHP)

```bash
docker ps
```

Si no están activos (`arte_pg`, `arte_php`, `arte_nginx`):

```bash
docker start arte_pg arte_php arte_nginx
```

> 💡 También puedes usar `docker compose up -d` si tienes `infra/docker-compose.yml`.
    **Cuando usar esa opción:**
    La primera vez que montas el entorno.
    O cuando modificas algo en la configuración (p. ej. puertos, variables, imágenes).
    También útil si borraste los contenedores o hiciste limpieza (docker system prune -a).

---

#### ⚙️ Revisar el backend (Laravel)

```bash
docker exec -it arte_php bash
php artisan migrate
php artisan config:cache
php artisan route:cache
exit
```
  - php artisan migrate       # por si hay migraciones nuevas

📍 Acceso backend:
👉 **[http://localhost:8080/api/health](http://localhost:8080/api/health)**

✅ Respuesta esperada:

```json
{ "checks": { "app": true, "db": true } }
```

---

#### 💻 Levantar el frontend (Angular)

```bash
cd frontend
npm start
```

> 💡 Usa el preset `/api` con proxy (ver punto 1).
> Frontend disponible en: **[http://localhost:4200](http://localhost:4200)** *(puede variar si el puerto está ocupado).*

---

#### 🔍 Verificación rápida

1️⃣ Abre Angular → carga sin errores.
2️⃣ En pestaña *Network*, la llamada `/api/health` responde con `{ "db": true }`.
3️⃣ Si todo va bien, el entorno local está listo para desarrollo.

---

#### 🧰 Al finalizar el día

Para liberar recursos:

```bash
docker stop arte_pg arte_php arte_nginx
```

---

### 🚀 Entorno STAGING (Render)

🌍 **Entorno remoto de pruebas y validación**
Usado para QA, revisiones de diseño y test antes de pasar a producción.

---

#### 🔗 Accesos

* **Backend:**
  `https://arte-backend-staging.onrender.com/api/health`
* **Frontend:**
  URL pública Render (ej. `https://arte-frontend-staging.onrender.com`)

---

#### ⚙️ Operaciones comunes

* Se actualiza automáticamente con **push a `main`** o **tag `v*`** (según lo configurado en `render.yaml`).
* Para verificar un deploy:
  1️⃣ En Render → pestaña *Deploys* → debe marcarse como *Live*.
  2️⃣ Visita `/api/health` → respuesta con `"db": true`.
  3️⃣ Comprueba el frontend → se carga y consume la API de staging.

---

#### 🧾 Variables importantes

* APP_ENV = staging
* APP_DEBUG = false
* APP_URL = `https://arte-backend-staging.onrender.com`
* DB_HOST / DB_PASSWORD gestionados por Render
* APP_KEY creada como secret en Render

---

#### 🧰 Si algo falla

1️⃣ Revisa logs en Render → pestaña *Logs*.
2️⃣ Verifica que `postDeployCommand` ejecutó migraciones correctamente.
3️⃣ Si hay cambios de estructura, vuelve a desplegar con *Redeploy* o nuevo push.

---

### 🌐 Entorno PRODUCCIÓN

💼 **Web pública de Arte Católica**
Sirve tráfico real y contiene datos de usuarios.

---

#### 🔗 Accesos

* **Backend:**
  `https://api.arte-catolica.com/api/health`
* **Frontend:**
  `https://app.arte-catolica.com/`

---

#### ⚙️ Despliegue

* **Automático** al crear un nuevo tag de versión (`vX.Y.Z`).
* Render detecta el tag y ejecuta:
  1️⃣ Build del backend
  2️⃣ Migraciones
  3️⃣ Build del frontend
  4️⃣ Activación TLS (HTTPS)

> 💡 Solo deploys controlados desde tags, nunca manuales.

---

#### 🔍 Verificación rápida tras un deploy

1️⃣ `/api/health` responde `200` y `"db": true`.
2️⃣ La web (`app.arte-catolica.com`) carga correctamente.
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

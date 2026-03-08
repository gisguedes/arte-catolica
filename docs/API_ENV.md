# Variables para API local

Crea un archivo `.env` dentro de `api/` con:

```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require
JWT_SECRET=pon_un_secret_largo_aqui

# OAuth (opcional)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
APPLE_CLIENT_ID=com.tudominio.servicio
```

Notas:
- `DATABASE_URL` puede ser Neon o Postgres local. Si usas Neon, agrega `sslmode=require`.
- `GOOGLE_CLIENT_ID`: OAuth 2.0 Client ID (Web application) de [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- `APPLE_CLIENT_ID`: Services ID de Sign in with Apple en [Apple Developer](https://developer.apple.com/account/resources/identifiers/list/serviceId).







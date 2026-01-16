# Variables para API local

Crea un archivo `.env` dentro de `api/` con:

```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require
JWT_SECRET=pon_un_secret_largo_aqui
```

Notas:
- `DATABASE_URL` puede ser Neon o Postgres local.
- Si usas Neon, agrega `sslmode=require`.


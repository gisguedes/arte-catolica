## GG-26: Netlify Functions para Products

### Objetivo
Reemplazar los endpoints de productos del backend Laravel por Netlify Functions con PostgreSQL (Netlify DB/Neon).

### Requisitos
- Crear una base de datos en Netlify DB (Neon).
- Definir la variable de entorno `NETLIFY_DATABASE_URL` en Netlify.
- Definir la variable de entorno `JWT_SECRET` en Netlify.

### Esquema
Ejecuta el SQL en `netlify/db/schema.sql` en tu instancia de Neon.

### Endpoints (Netlify Functions)
Se exponen vía `/api` usando el redirect:
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/vendors`
- `GET /api/vendors/:id`
- `GET /api/vendors/:id/products`
- `GET /api/categories`
- `GET /api/categories/:id`
- `GET /api/materials`
- `GET /api/materials/:id`
- `GET /api/colors`
- `GET /api/colors/:id`
- `GET /api/artist-types`
- `GET /api/artist-types/:id`
- `POST /api/register`
- `POST /api/login`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PUT /api/orders/:id`
- `PATCH /api/orders/:id`
- `DELETE /api/orders/:id`

### Payload de ejemplo (POST/PUT)
```json
{
  "vendor_id": "uuid",
  "price": 120.50,
  "stock": 5,
  "availability": "in_stock",
  "height_cm": 12.5,
  "width_cm": 8.0,
  "depth_cm": 3.0,
  "sku": "SKU-123",
  "is_active": true,
  "is_featured": false,
  "name": "Producto demo",
  "description": "Descripción demo",
  "locale": "es",
  "category_ids": ["uuid"],
  "material_ids": ["uuid"],
  "color_ids": ["uuid"],
  "images": [
    { "image_path": "https://...", "order": 0, "is_primary": true }
  ]
}
```

### Notas
- El frontend sigue usando `environment.apiUrl = '/api'`.
- En Netlify, `/api/*` redirige a `/.netlify/functions/:splat`.
- Para locale, se usa `Accept-Language` (por defecto `es`).


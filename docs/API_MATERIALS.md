# API de materiales (edición y datos en base de datos)

Los materiales tienen en base de datos: **foto** (`image_path`), **descripción** (en `material_translations`) y **características** en una tabla aparte (`material_characteristics`), una fila por punto. Así se edita fácil (una línea = un bullet) y en la web se muestran como lista.

## 1. Esquema en base de datos

Ejecuta los scripts en este orden:

```bash
# 1) Foto y descripción (material_detail_schema.sql)
psql "$DATABASE_URL" -f api/sql/material_detail_schema.sql

# 2) Tabla de características y migración (material_characteristics_table.sql)
psql "$DATABASE_URL" -f api/sql/material_characteristics_table.sql
```

- **material_detail_schema.sql**: añade `image_path` en `materials` y `description` en `material_translations`.
- **material_characteristics_table.sql**: crea la tabla `material_characteristics` (id, material_id, characteristic_text, sort_order), migra los datos que había en `material_translations.characteristics` (una línea → una fila) y elimina esa columna.

## 2. Endpoints

Base URL: `GET/POST /api/materials`, `GET/PATCH /api/materials/:id`.

El idioma se toma del header `Accept-Language` (por defecto `es`).

### GET /api/materials

Lista todos los materiales activos (con `image_path`, `description`, `characteristics` para el locale).

- Query: `include_inactive=true` para incluir inactivos.

### GET /api/materials/:id

Devuelve un material por id (con foto, descripción y características para el locale).

### PATCH /api/materials/:id

Actualiza un material. Body (todos opcionales):

| Campo           | Tipo     | Descripción                                                                 |
|-----------------|----------|-----------------------------------------------------------------------------|
| `name`          | string   | Nombre del material (para el locale actual).                               |
| `image_path`    | string   | Ruta o URL de la foto. Envía `""` para borrarla.                           |
| `description`   | string   | Descripción breve para el usuario (locale actual). `""` para borrar.       |
| `characteristics` | string[] | Lista de características (cada elemento = un bullet). `[]` para borrar todas. |

Ejemplo:

```json
{
  "name": "Madera de olivo",
  "image_path": "/images/materials/olivo.jpg",
  "description": "Madera noble de tonos cálidos, ideal para tallas.",
  "characteristics": ["Resistente", "Acabado natural", "Peso medio"]
}
```

### POST /api/materials

Crea un material. Body:

| Campo           | Tipo   | Obligatorio | Descripción                                                                 |
|-----------------|--------|-------------|-----------------------------------------------------------------------------|
| `name`          | string | Sí          | Nombre del material.                                                       |
| `slug`          | string | No          | Si no se envía, se genera a partir del nombre (minúsculas, sin espacios).  |
| `image_path`    | string | No          | Ruta o URL de la foto.                                                     |
| `description`   | string | No          | Descripción para el locale actual.                                         |
| `characteristics` | string[] | No       | Lista de características (cada elemento = un bullet).                      |

Respuesta: `201` con el material creado (mismo formato que GET por id).

## 3. Foto del material

- `image_path` puede ser una **ruta relativa** (por ejemplo `/images/materials/olivo.jpg`) que tu servidor o front sirva como estático, o una **URL absoluta**.
- Para “subir” la foto: hoy la API solo guarda la ruta/URL. Puedes tener un endpoint de upload aparte que guarde el fichero y devuelva la ruta, y luego llamar a `PATCH /api/materials/:id` con ese `image_path`.

## 4. Uso en el frontend

En el detalle de producto, los materiales del producto ya vienen con `image_path`, `description` y `characteristics` (desde el listado de productos). Al hacer clic en un material se abre el modal con foto (si existe), descripción y lista de características. Esos datos son los guardados en base de datos vía esta API.

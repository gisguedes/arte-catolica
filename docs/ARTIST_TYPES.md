# Tipos de artista (Artist Types)

Documento que describe el modelo de **tipos de artista**, su esquema, API, frontend y uso en la aplicación.

---

## 1. Resumen

- Cada **vendor** (artista) puede tener uno o varios **tipos** (Escultor, Pintor, Iconógrafo, etc.).
- Los tipos son multidioma: `name`, `slug` y `description` se guardan en `artist_type_translations`.
- En la página de artistas el usuario filtra por un solo tipo (selección exclusiva) y puede acceder por URL directa.
- Un artista puede ser, por ejemplo, Escultor y Pintor a la vez.

---

## 2. Esquema de base de datos

### Tablas

| Tabla | Uso |
|-------|-----|
| `artist_types` | Tipo base: `id`, `alias` (identificador interno, ej. `sculptor`), `created_at`, `updated_at` |
| `artist_type_translations` | Traducciones por locale: `name`, `slug`, `description` |
| `artist_type_vendor` | Relación N:M entre `vendor_id` y `artist_type_id` |

### Estructura

```
artist_types
├── id (uuid)
├── alias (text) — identificador fijo: sculptor, painter, iconographer, etc.
├── created_at
└── updated_at

artist_type_translations
├── id (uuid)
├── artist_type_id → artist_types(id)
├── locale (text) — es, en, ...
├── name (text) — nombre visible: "Escultor", "Sculptor"
├── slug (text) — para URLs: "escultor", "sculptor"
├── description (text) — descripción breve del tipo
└── UNIQUE(artist_type_id, locale)

artist_type_vendor
├── vendor_id → vendors(id)
└── artist_type_id → artist_types(id)
```

---

## 3. Tipos actuales (seed)

| Alias | Nombre (ES) | Slug (ES) |
|-------|-------------|-----------|
| sculptor | Escultor | escultor |
| painter | Pintor | pintor |
| iconographer | Iconógrafo | iconografo |
| goldsmith | Orfebre | orfebre |
| illustrator | Ilustrador | ilustrador |
| textile-artisan | Artesano textil | artesano-textil |

---

## 4. Scripts SQL

| Archivo | Uso |
|---------|-----|
| `api/sql/artist_types_schema.sql` | Migración: añade `alias`, crea `artist_type_translations`, migra datos, elimina `slug` y `name` de `artist_types` |
| `api/sql/artist_types_seed.sql` | Seed: borra datos existentes e inserta los 6 tipos con traducciones ES/EN |

**Orden de ejecución:**

```bash
psql "$DATABASE_URL" -f api/sql/artist_types_schema.sql
psql "$DATABASE_URL" -f api/sql/artist_types_seed.sql
```

> **Nota:** El seed borra `artist_type_vendor`. Tras ejecutarlo hay que volver a asignar tipos a los vendors (por admin o script).

---

## 5. API

### `GET /api/artist-types`

Lista todos los tipos de artista. Usa el header `Accept-Language` para devolver `name`, `slug` y `description` en el locale correspondiente.

**Respuesta:** `{ data: ArtistType[] }`

### `GET /api/artist-types/:id`

Detalle de un tipo por ID.

### Vendors (`GET /api/vendors`, `GET /api/vendors/:id`)

Cada vendor incluye `artist_types` como array de objetos con `id`, `alias`, `slug`, `name` (traducidos según locale).

---

## 6. Frontend: página de artistas

### URLs

| Ruta | Contenido |
|------|-----------|
| `/es/artists` | Todos los artistas |
| `/es/artists/escultor` | Artistas del tipo Escultor |
| `/es/artists/pintor` | Artistas del tipo Pintor |
| … | … |

El `slug` viene de `artist_type_translations` según el locale. No hay conflicto con `/es/artist/:id` porque los IDs de artista son UUID.

### Comportamiento

- **Chips de tipo:** Cada chip es un enlace (`routerLink`) a `/es/artists` o `/es/artists/:slug`.
- **Iconos:** SVG inline por `alias` (sculptor, painter, iconographer, goldsmith, illustrator, textile).
- **Descripción:** Cuando hay un tipo seleccionado, se muestra debajo de los chips.
- **Breadcrumb:** "Artistas › [Nombre del tipo]" cuando se filtra por tipo.
- **Selección única:** Solo puede estar activo un tipo a la vez.

### Asignación de iconos

En `ArtistsComponent` se usa `getTypeIcon(alias)` para elegir el SVG:

| alias | Icono |
|-------|-------|
| sculptor | Busto/estatua |
| painter | Pincel/trazos |
| iconographer | Marco tipo icono |
| goldsmith | Cruz/compás |
| illustrator | Lápiz |
| textile-artisan | Patrón de tejido |

---

## 7. Asociar tipos a un vendor

Para que un artista aparezca al filtrar por tipo, debe tener filas en `artist_type_vendor`:

```sql
INSERT INTO artist_type_vendor (vendor_id, artist_type_id)
SELECT v.id, at.id
FROM vendors v, artist_types at
WHERE v.id = '...' AND at.alias = 'sculptor';
```

---

## 8. Ampliar o modificar tipos

1. Añadir fila en `artist_types` con nuevo `alias`.
2. Añadir filas en `artist_type_translations` por cada locale.
3. Si se usa un nuevo alias en el frontend, añadir el caso en `getTypeIcon()` y el SVG correspondiente en el template.

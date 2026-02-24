# Técnicas de producto

Listado de técnicas organizado por categoría. Esta agrupación es **solo de referencia**; en la base de datos y la API no existe la restricción de categoría: cada técnica es independiente y un producto puede tener técnicas de distintas categorías.

---

## Escultura

| Técnica | Alias | Descripción breve (ES) |
|---------|-------|------------------------|
| Tallado a mano | tallado-mano | Escultura mediante talla directa en el material. |
| Modelado | modelado | Técnica de modelado en barro, cera o materiales moldeables. |
| Fundición | fundicion | Proceso de fundición en bronce u otros metales. |
| Relieve | relieve | Escultura en relieve, tallada en un plano. |
| Policromado | policromado | Pintura policromada sobre escultura. |
| Dorado con pan de oro | dorado-pan-oro | Aplicación de láminas de oro sobre la superficie. |
| Ensamblado artesanal | ensamblado-artesanal | Ensamblaje manual de piezas. |
| Escultura en piedra | escultura-piedra | Tallado directo en piedra. |

---

## Pintura e iconografía

| Técnica | Alias | Descripción breve (ES) |
|---------|-------|------------------------|
| Óleo sobre lienzo | oleo-lienzo | Pintura al óleo sobre lienzo. |
| Acrílico | acrilico | Pintura acrílica. |
| Temple al huevo | temple-huevo | Técnica tradicional de pintura al temple con huevo. |
| Técnica mixta | tecnica-mixta | Combinación de varias técnicas pictóricas. |
| Iconografía tradicional | iconografia-tradicional | Pintura de iconos según tradición bizantina u oriental. |
| Dorado al agua | dorado-agua | Técnica de dorado con cola de conejo. |
| Dorado al mixtión | dorado-mixion | Dorado con base oleosa (mixtión). |
| Grabado manual | grabado-manual | Grabado a mano sobre plancha. |
| Serigrafía | serigrafia | Impresión por serigrafía. |
| Impresión Giclée | impresion-giclee | Impresión de alta calidad con tintas pigmentadas. |
| Pintura digital | pintura-digital | Obra creada o reproducida digitalmente. |

---

## Joyería

| Técnica | Alias | Descripción breve (ES) |
|---------|-------|------------------------|
| Orfebrería artesanal | orfebreria-artesanal | Trabajo manual en metal precioso. |
| Fundición en metal | fundicion-metal | Fundición artesanal en metal. |
| Grabado a mano | grabado-mano | Grabado manual sobre metal u otro soporte. |
| Engaste manual | engaste-manual | Engaste de piedras a mano. |
| Ensamblado artesanal | ensamblado-artesanal | Ensamblaje manual de piezas. |
| Macramé | macrame | Técnica de anudado manual. |
| Filigrana | filigrana | Trabajo en hilos finos de metal. |

---

## Arte litúrgico / textil

| Técnica | Alias | Descripción breve (ES) |
|---------|-------|------------------------|
| Bordado a mano | bordado-mano | Bordado realizado a mano. |
| Bordado en hilo dorado | bordado-hilo-dorado | Bordado con hilos metálicos dorados. |
| Tejido artesanal | tejido-artesanal | Tejido realizado a mano. |
| Aplicación textil | aplicacion-textil | Aplicación de telas o piezas sobre soporte textil. |
| Restauración tradicional | restauracion-tradicional | Restauración con técnicas tradicionales. |

---

## Arte impreso

| Técnica | Alias | Descripción breve (ES) |
|---------|-------|------------------------|
| Grabado | grabado | Técnica de grabado sobre plancha. |
| Litografía | litografia | Impresión litográfica. |
| Impresión artística | impresion-artistica | Impresión de obra de arte. |
| Edición limitada | edicion-limitada | Tirada limitada y numerada. |
| Numerado y firmado | numerado-firmado | Ejemplar numerado y firmado por el artista. |

---

## Scripts SQL

| Archivo | Uso |
|---------|-----|
| `api/sql/techniques_schema.sql` | Crea tablas: `techniques`, `technique_translations`, `product_technique` |
| `api/sql/techniques_seed.sql` | Inserta las 35 técnicas con traducciones ES y EN |

**Orden de ejecución:**

```bash
psql "$DATABASE_URL" -f api/sql/techniques_schema.sql
psql "$DATABASE_URL" -f api/sql/techniques_seed.sql
```

---

## Notas

- **Alias:** identificador interno en la base de datos (`techniques.alias`).
- **Slug:** para URLs, por idioma (`technique_translations.slug`).
- **Relación con productos:** N:M a través de `product_technique` (product_id, technique_id).

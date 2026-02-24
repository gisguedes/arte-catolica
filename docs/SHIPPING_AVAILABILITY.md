# Lógica de disponibilidad de envío por producto y por vendor

Este documento describe cómo se calcula la **primera fecha de entrega** y el **calendario de fechas posibles** para cada producto, tanto en la API como en el frontend.

---

## 1. Resumen

- La disponibilidad de fechas de envío se define por **política de envío**: primero por **vendor** (`vendor_shipping_policy`) y opcionalmente por **producto** (`product_shipping_policy`).
- Si un producto o su vendor **no tienen política configurada**, la API devuelve **sin fechas** (`ship_dates: []`, `default_ship_date: null`). En la web no se muestra “Entrega desde…” en la card ni en el detalle.
- Solo los productos (o vendors) con política de envío y, si aplica, capacidad no agotada, muestran una primera fecha de entrega.

---

## 2. Fuentes de la política de envío

| Origen | Tabla | Alcance |
|--------|--------|--------|
| **Vendor** | `vendor_shipping_policy` | Afecta a todos los productos del vendor salvo que el producto tenga política propia con `override_vendor_policy = true`. |
| **Producto** | `product_shipping_policy` | Opcional. Si existe y `override_vendor_policy = true`, sustituye (o complementa) la del vendor para ese producto. |

**Regla de resolución:**

- Si existe **product_shipping_policy** con `override_vendor_policy = true` → la política efectiva es la del **producto** (con fallbacks a la del vendor donde el producto no defina valor).
- En caso contrario → se usa la política del **vendor** (o vacía si el vendor no tiene política).

Si **no hay** ni `vendor_shipping_policy` ni `product_shipping_policy` para ese producto/vendor, la API **no devuelve fechas** (ver apartado 4).

---

## 3. Campos relevantes de la política

(En `vendor_shipping_policy` y/o `product_shipping_policy`.)

| Campo | Uso |
|-------|-----|
| `preparation_days` | Días desde hoy hasta el primer día en que se puede enviar. |
| `extra_preparation_days` | (Solo producto.) Días extra de preparación. |
| `shipping_days` | Array de días de la semana en que se envía (ej. `['mon','tue','wed','thu','fri']`). Si está vacío y no hay `shipping_dates`, en la implementación actual se consideran todos los días (solo dentro del rango de fechas). |
| `shipping_dates` | Array de fechas concretas de envío. Si está definido y no vacío, prima sobre `shipping_days`. |
| `hour_sales_close` | Hora límite para considerar “disponible” el envío del día D (ej. pedidos hasta las 23:59 del día D-1). |
| `daily_ship_capacity` | Capacidad máxima de envíos por día (opcional). Si se usa, se cruza con `shipping_capacity_date`. |

Origen del envío (para zonas/transit):

- `origin_country`, `origin_postal_code`, `origin_region` (en policy o en datos del vendor).

---

## 4. Flujo en la API: `GET /api/products/:id/shipping-calendar`

1. **Producto y vendor**  
   Se obtiene el producto y su `vendor_id`, y los datos de origen del vendor (`country`, `postal_code`, etc.).

2. **Políticas**  
   Se cargan:
   - `vendor_shipping_policy` para ese `vendor_id`
   - `product_shipping_policy` para ese `product_id`

3. **Sin ninguna política**  
   Si **no hay** fila en `vendor_shipping_policy` **ni** en `product_shipping_policy`:
   - Se responde con `ship_dates: []` y `default_ship_date: null`.
   - No se calculan fechas. En la web no debe mostrarse primera fecha de entrega para ese producto.

4. **Con política (vendor y/o producto)**  
   - Se construye la política efectiva (producto con override, o vendor).
   - **Primera fecha posible de envío:**  
     `earliestDate = hoy + preparation_days + extra_preparation_days` (inicio del día).
   - **Rango:** desde `earliestDate` hasta `earliestDate + 60` días.

5. **Candidatos de fecha**  
   - Si la política tiene `shipping_dates` (array de fechas) → se usan solo esas fechas en el rango.
   - Si no, se usa `shipping_days` (días de la semana) para generar fechas en el rango (`buildShipDatesFromDays`).
   - Se filtran por `hour_sales_close`: para cada fecha D, se exigen pedidos antes del cierre del día anterior.

6. **Capacidad**  
   Se consulta `shipping_capacity_date` (por `product_id` y/o `vendor_id`) para el rango de fechas:
   - Si para una fecha hay `max_capacity` y `current_booked >= max_capacity`, esa fecha se considera bloqueada y no se incluye en `ship_dates`.
   - Las fechas que pasan el filtro forman `ship_dates`; la primera es la que se usa como “primera fecha de entrega”.

7. **Destino**  
   Los query params opcionales `destination_country`, `destination_postal_code`, `destination_region` se usan para:
   - Resolver zona de envío y `transit_days_min` / `transit_days_max`.
   - Si no se envían, se usa el origen (vendor) como destino, lo que da una “primera fecha de envío” genérica (por ejemplo para cards en listado).

8. **Respuesta**  
   - `ship_dates`: array de fechas (YYYY-MM-DD) en las que se puede enviar.
   - `default_ship_date`: primera de `ship_dates` (o `null` si no hay).
   - `transit_days_min` / `transit_days_max`: para el mensaje de “entrega estimada” en el detalle.

---

## 5. Uso en el frontend

### 5.1 Detalle del producto

- Se llama a `getShippingCalendar(productId, destination)` con el destino (p. ej. país/código postal del vendor o del usuario).
- Se muestra la “Previsión de entrega” en **dd/mm/yyyy** con icono de calendario.
- Si `default_ship_date` (o primera de `ship_dates`) existe, se usa esa fecha; si no, no se muestra previsión o se muestra “Sin fechas disponibles”.
- El calendario modal muestra solo las fechas de `ship_dates`; la seleccionada se marca en dorado; el resto disponibles en negro.

### 5.2 Cards de producto (listado)

- Cada card llama a `getShippingCalendar(product.id, destination)` con `destination` opcional (p. ej. `vendor.country` y `vendor.postal_code` si existen).
- Si la API devuelve `default_ship_date` o al menos un elemento en `ship_dates`, se muestra “Entrega desde dd/mm/yyyy” con icono de calendario.
- Si la API devuelve `ship_dates: []` (por ejemplo porque no hay política o todo está bloqueado por capacidad), la card **no** muestra la línea de entrega.

---

## 6. Por qué antes todos los productos mostraban la misma fecha

- Antes, si **no** existía `vendor_shipping_policy` ni `product_shipping_policy`, la API igualmente construía una política vacía y generaba fechas con `buildShipDatesFromDays(..., [])`.
- Con `shipping_days` vacío se consideraban **todos los días** en el rango, y al no haber capacidad configurada, todas esas fechas se marcaban como disponibles.
- La primera fecha resultaba ser siempre la misma (p. ej. “hoy” o “hoy + 0”), por eso en la web parecía que todos los productos tenían la misma primera fecha.

**Corrección aplicada:** si no hay política ni de vendor ni de producto, la API responde con `ship_dates: []` y `default_ship_date: null`, de modo que solo los productos (o vendors) con política configurada muestran fecha de entrega.

---

## 7. Cómo tener “pocos productos con fechas” en la web de forma coherente con BD

- En base de datos, solo los vendors con fila en `vendor_shipping_policy` (o productos con fila en `product_shipping_policy`) tienen política.
- Tras la corrección anterior, **solo esos** devolverán fechas en `shipping-calendar`.
- Por tanto, en la web verás “Entrega desde dd/mm/yyyy” solo en:
  - Productos cuyo **vendor** tiene `vendor_shipping_policy`, o
  - Productos con `product_shipping_policy` (y opcionalmente `override_vendor_policy = true`).
- El resto seguirá con `ship_dates: []` y en la UI no se mostrará primera fecha de entrega (coherente con “pocos productos con posibilidad de fechas” en BD).

---

## 8. Resumen de tablas y endpoints

| Recurso | Descripción |
|--------|-------------|
| `vendor_shipping_policy` | Política por vendor (días, fechas, capacidad, cierre de venta, origen). |
| `product_shipping_policy` | Política por producto (opcional; puede anular la del vendor). |
| `shipping_capacity_date` | Capacidad por fecha (y opcionalmente por producto/vendor). |
| `shipping_zone` + `carrier_zone_transit` | Zonas y tiempos de tránsito para el mensaje de “entrega estimada”. |
| `GET /api/products/:id/shipping-calendar` | Devuelve `ship_dates`, `default_ship_date` y transit para un producto (y destino opcional). |

Si quieres, en otro documento podemos bajar al detalle de `buildShipDatesFromDays`, formato de `shipping_days`/`shipping_dates` o al seed de políticas para pruebas.

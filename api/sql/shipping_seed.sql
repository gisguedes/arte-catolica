-- Seed básico para pruebas

-- Transportistas
INSERT INTO carrier (name, service_level)
SELECT 'Correos', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM carrier WHERE name = 'Correos');

INSERT INTO carrier (name, service_level)
SELECT 'SEUR', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM carrier WHERE name = 'SEUR');

INSERT INTO carrier (name, service_level)
SELECT 'MRW', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM carrier WHERE name = 'MRW');

-- Zonas ES -> ES por comunidad autónoma (todas las combinaciones)
WITH regions AS (
  SELECT UNNEST(ARRAY[
    'Andalucía','Aragón','Asturias','Islas Baleares','Canarias','Cantabria',
    'Castilla-La Mancha','Castilla y León','Cataluña','Comunidad Valenciana',
    'Extremadura','Galicia','Comunidad de Madrid','Región de Murcia',
    'Comunidad Foral de Navarra','País Vasco','La Rioja'
  ]) AS region
),
zone_pairs AS (
  SELECT 'ES'::text AS origin_country,
         r1.region AS origin_region,
         'ES'::text AS destination_country,
         r2.region AS destination_region
  FROM regions r1
  CROSS JOIN regions r2
)
INSERT INTO shipping_zone (origin_country, origin_region, destination_country, destination_region)
SELECT origin_country, origin_region, destination_country, destination_region
FROM zone_pairs
WHERE NOT EXISTS (
  SELECT 1 FROM shipping_zone z
  WHERE z.origin_country = zone_pairs.origin_country
    AND COALESCE(z.origin_region, '') = COALESCE(zone_pairs.origin_region, '')
    AND z.destination_country = zone_pairs.destination_country
    AND COALESCE(z.destination_region, '') = COALESCE(zone_pairs.destination_region, '')
);

-- Zona genérica ES -> ES (sin regiones)
INSERT INTO shipping_zone (origin_country, destination_country, origin_region, destination_region)
SELECT 'ES', 'ES', NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM shipping_zone z
  WHERE z.origin_country = 'ES' AND z.destination_country = 'ES'
    AND z.origin_region IS NULL AND z.destination_region IS NULL
);

-- Tiempos por transportista y zona
INSERT INTO carrier_zone_transit (carrier_id, zone_id, transit_days_min, transit_days_max)
SELECT c.id, z.id,
  CASE c.name
    WHEN 'Correos' THEN 2
    WHEN 'SEUR' THEN 1
    WHEN 'MRW' THEN 1
    ELSE 2
  END AS transit_days_min,
  CASE c.name
    WHEN 'Correos' THEN 4
    WHEN 'SEUR' THEN 3
    WHEN 'MRW' THEN 2
    ELSE 5
  END AS transit_days_max
FROM carrier c
CROSS JOIN shipping_zone z
WHERE c.name IN ('Correos', 'SEUR', 'MRW')
  AND NOT EXISTS (
    SELECT 1 FROM carrier_zone_transit czt
    WHERE czt.carrier_id = c.id AND czt.zone_id = z.id
  );

-- Política de envío por vendedor (usa 3 primeros vendors activos)
INSERT INTO vendor_shipping_policy (
  vendor_id,
  preparation_days,
  shipping_days,
  hour_sales_close,
  daily_ship_capacity,
  origin_city,
  origin_region,
  origin_postal_code,
  origin_country,
  default_carrier_id
)
SELECT v.id,
       2,
       ARRAY['mon','tue','wed','thu','fri'],
       '23:59',
       20,
       COALESCE(v.city, 'Madrid'),
       'Comunidad de Madrid',
       COALESCE(v.postal_code, '28001'),
       COALESCE(v.country, 'ES'),
       (SELECT id FROM carrier WHERE name = 'SEUR' LIMIT 1)
FROM vendors v
WHERE v.is_active = true
  AND NOT EXISTS (SELECT 1 FROM vendor_shipping_policy p WHERE p.vendor_id = v.id)
LIMIT 5;

-- Política de envío por producto (usa 5 productos activos)
INSERT INTO product_shipping_policy (
  product_id,
  override_vendor_policy,
  preparation_days,
  shipping_days,
  hour_sales_close,
  daily_ship_capacity,
  origin_region,
  allowed_carrier_ids,
  extra_preparation_days
)
SELECT p.id,
       true,
       3,
       ARRAY['tue','thu'],
       '23:59',
       12,
       'Comunidad de Madrid',
       ARRAY[(SELECT id FROM carrier WHERE name = 'MRW' LIMIT 1)],
       1
FROM products p
WHERE p.is_active = true
  AND NOT EXISTS (SELECT 1 FROM product_shipping_policy ps WHERE ps.product_id = p.id)
LIMIT 8;


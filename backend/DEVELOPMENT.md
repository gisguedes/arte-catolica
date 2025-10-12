# Guía de Desarrollo - Arte Católica

## Herramientas de Desarrollo Configuradas

Este proyecto tiene configuradas las siguientes herramientas de desarrollo para mantener un código de alta calidad:

### 1. Análisis Estático de Código

#### PHPStan/Larastan
- **Configuración**: `phpstan.neon`
- **Nivel**: 5 (equilibrio entre detección de errores y practicidad)
- **Comando**: `composer analyse`

### 2. Linting y Formateo

#### PHP_CodeSniffer
- **Configuración**: `phpcs.xml`
- **Estándar**: PSR-12
- **Comando para verificar**: `composer lint`
- **Comando para arreglar automáticamente**: `composer lint-fix`

#### Laravel Pint
- **Formateador automático de código**
- **Comando**: `composer format`

### 3. Testing

#### PHPUnit
- **Framework de pruebas incluido con Laravel**
- **Comando**: `composer test`

### 4. Scripts Útiles

```bash
# Análisis de código estático
composer analyse

# Verificar formato de código
composer lint

# Arreglar formato automáticamente
composer lint-fix

# Formatear código con Laravel Pint
composer format

# Ejecutar pruebas
composer test

# Ejecutar todas las verificaciones de calidad
composer quality
```

## Configuración de Base de Datos

- **Motor**: PostgreSQL
- **Host**: `arte_pg` (contenedor Docker)
- **Puerto**: 5432
- **Base de datos**: `app_db`
- **Usuario**: `app_user`
- **Contraseña**: `app_pass`

## Servicios Docker

- **Aplicación web**: http://localhost:8080
- **PgAdmin**: http://localhost:5050
- **PostgreSQL**: localhost:5432

## Comandos de Desarrollo

### Configuración Inicial
```bash
# Configurar el proyecto
composer setup

# Generar clave de aplicación
php artisan key:generate

# Ejecutar migraciones
php artisan migrate
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo
php artisan serve

# Ejecutar migraciones
php artisan migrate

# Ejecutar seeders
php artisan db:seed
```

### Calidad de Código
```bash
# Ejecutar todas las verificaciones
composer quality

# Solo análisis estático
composer analyse

# Solo verificación de formato
composer lint

# Solo pruebas
composer test
```

## Estructura del Proyecto

```
backend/
├── app/                 # Lógica de la aplicación
├── config/              # Archivos de configuración
├── database/            # Migraciones, seeders, factories
├── routes/              # Definición de rutas
├── tests/               # Pruebas automatizadas
├── phpstan.neon         # Configuración de PHPStan
├── phpcs.xml            # Configuración de PHP_CodeSniffer
└── composer.json        # Dependencias y scripts
```

## Notas Importantes

1. **Laravel 12**: Este proyecto usa Laravel 12, que es muy reciente. Algunos paquetes pueden no tener soporte completo aún.

2. **PostgreSQL**: La base de datos está configurada para usar PostgreSQL en lugar de SQLite por defecto.

3. **Docker**: El proyecto está configurado para funcionar con Docker Compose.

4. **Calidad de Código**: Se recomienda ejecutar `composer quality` antes de hacer commits para asegurar que el código cumple con los estándares.

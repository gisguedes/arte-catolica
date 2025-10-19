# ---------- Etapa 1: dependencias PHP (composer) ----------
FROM composer:2 AS vendor
WORKDIR /app
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction --no-plugins

# ---------- Etapa 2: runtime con Nginx + PHP-FPM ----------
FROM webdevops/php-nginx:8.3
ENV WEB_DOCUMENT_ROOT=/app/public
WORKDIR /app

# Copia el código Laravel
COPY backend/ /app/

# Copia dependencias desde la primera etapa
COPY --from=vendor /app/vendor /app/vendor

# Permisos para cache y storage
RUN set -eux; \
    mkdir -p /app/storage /app/bootstrap/cache; \
    chown -R application:application /app/storage /app/bootstrap/cache

# Optimiza Laravel para prod
RUN set -eux; \
    php artisan storage:link || true; \
    php artisan config:cache; \
    php artisan route:cache; \
    php artisan view:cache

EXPOSE 8080

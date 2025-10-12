# Imagen base oficial de PHP con FastCGI Process Manager
FROM php:8.3-fpm

# Instala dependencias del sistema y extensiones de PHP necesarias para Laravel
RUN apt-get update && apt-get install -y \
    git unzip libpq-dev libzip-dev libonig-dev \
    && docker-php-ext-install pdo pdo_pgsql mbstring zip

# Copia el archivo de configuración php.ini (lo crearás en el siguiente paso)
COPY php.ini /usr/local/etc/php/php.ini

# Define el directorio de trabajo dentro del contenedor
WORKDIR /var/www/html

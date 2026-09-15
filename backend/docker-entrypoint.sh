#!/bin/sh
set -e

# Cache configuration and routes for production speed
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Run database migrations if database is available
php artisan migrate --force || true

# Start Laravel built-in server listening on Render's assigned port
exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"

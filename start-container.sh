#!/bin/bash
set -euo pipefail
cd "${APP_BASE_PATH:-/app}"

mkdir -p storage/app/public storage/app/private storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs storage/framework/caddy/config storage/framework/caddy/data bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

php artisan config:clear --no-interaction
php artisan storage:link --no-interaction

# Coolify runs database migrations as a deployment step.
exec supervisord -c "$PWD/supervisord.conf"

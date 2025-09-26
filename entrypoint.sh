#!/bin/bash
set -e

# Crear carpeta para certbot
mkdir -p /var/www/certbot

# Obtener certificados si no existen
if [ ! -f /etc/letsencrypt/live/backend.hopta.hn/fullchain.pem ]; then
  certbot certonly --webroot -w /var/www/certbot \
    --agree-tos --no-eff-email --email asponceg@gmail.com \
    -d backend.hopta.hn --non-interactive
fi

# Lanzar backend + Nginx
node dist/src/index.js &

# Renovar certificados en background cada 12h
while :; do
  certbot renew --quiet
  sleep 12h
done &

# Arrancar nginx en foreground
nginx -g "daemon off;"
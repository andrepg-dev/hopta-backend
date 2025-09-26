#!/bin/bash
set -e

# Crear carpeta para certbot
mkdir -p /var/www/certbot

# Obtener certificados si no existen
if [ ! -f /etc/letsencrypt/live/backend.hopta.hn/fullchain.pem ]; then
  echo ">>> No hay certificados, arrancando Nginx temporal en HTTP"
  nginx &                # levantar nginx en background
  sleep 10               # esperar a que abra el puerto 80

  certbot certonly --webroot -w /var/www/certbot \
    --agree-tos --no-eff-email --email asponceg@gmail.com \
    -d backend.hopta.hn --non-interactive

  echo ">>> Certificados generados, apagando Nginx temporal"
  nginx -s stop
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
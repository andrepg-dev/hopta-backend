#!/bin/bash
set -e

mkdir -p /var/www/certbot

if [ ! -f /etc/letsencrypt/live/backend.hopta.hn/fullchain.pem ]; then
  echo ">>> No hay certificados, usando bootstrap.conf (solo HTTP)"
  cp /app/nginx/bootstrap.conf /etc/nginx/conf.d/default.conf

  nginx &
  sleep 10

  certbot certonly --webroot -w /var/www/certbot \
    --agree-tos --no-eff-email --email asponceg@gmail.com \
    -d backend.hopta.hn --non-interactive

  echo ">>> Certificados generados, apagando Nginx temporal"
  nginx -s stop

  # ⚡️ Generar configs SSL adicionales si no existen
  if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
    echo ">>> Creando options-ssl-nginx.conf"
    wget https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
         -O /etc/letsencrypt/ssl-dhparams.pem
    wget https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/options-ssl-nginx.conf \
         -O /etc/letsencrypt/options-ssl-nginx.conf
  fi

  # Reemplazar config por la definitiva con SSL
  cp /app/nginx/backend.conf /etc/nginx/conf.d/default.conf
fi

node dist/src/index.js &

while :; do
  certbot renew --quiet
  sleep 12h
done &

nginx -g "daemon off;"

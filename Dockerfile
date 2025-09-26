FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./ 
RUN npm install
COPY . .
RUN npm run build

# production
FROM node:20

WORKDIR /app

# Instalar Nginx + Certbot (sin python3-certbot-nginx)
RUN apt-get update && apt-get install -y nginx certbot && \
    rm -rf /var/lib/apt/lists/*

# Copiar el package lock para instalar dependencias
COPY package*.json .
RUN npm install --production

# Copiamos el dist del run anterior
COPY --from=builder /app/dist ./dist

# Copiar configs de nginx
COPY nginx/bootstrap.conf /app/nginx/bootstrap.conf
COPY nginx/backend.conf   /app/nginx/backend.conf
COPY nginx/options-ssl-nginx.conf /etc/letsencrypt/options-ssl-nginx.conf

# Copiar script de entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 80 443

ENTRYPOINT [ "/app/entrypoint.sh" ]

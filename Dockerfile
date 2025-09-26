FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./ 
RUN npm install
COPY . .
RUN npm run build

# production
FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y nginx certbot python3-certbot-nginx && \
    rm -rf /var/lib/apt/lists/*

# Copiar el package lock para instalar dependencias
COPY package*.json .
RUN npm install --production

# Copiamos el dist del run anterior
COPY --from=builder /app/dist ./dist

# Copiar configs de nginx
COPY nginx/bootstrap.conf /app/nginx/bootstrap.conf
COPY nginx/backend.conf   /app/nginx/backend.conf

# Copiar script de entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 80 443

ENTRYPOINT [ "/app/entrypoint.sh" ]
